import express from 'express';

import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { Client, Environment } from 'square';
import nodemailer from 'nodemailer';
import { supabase } from './supabase.js';
import cron from 'node-cron';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [
    'https://www.legendspilotpoint.com',
    'https://legendspilotpoint.vercel.app',
    /^https:\/\/legendspilotpoint-.*\.vercel\.app$/
  ]
}));
app.use(express.json());

const client = new Client({
  environment: process.env.ENVIRONMENT === 'production' ? Environment.Production : Environment.Sandbox,
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Step 1: Map Supabase room_number to Square key
const ROOM_NUMBER_TO_SQUARE_KEY = {
  'K101': '102',
  'K102': '109',
  'Q201': '106',
  'Q202': '108',
  'Q203': '113'
};

// Step 2: Map Square key to catalog ID
const SQUARE_KEY_TO_CATALOG_ID = {
  '102': 'T7YM7YWFQNVE5UC6UQB6Q2WR',
  '109': 'QFTVFSDI45AETRSG3BR3Z4TL',
  '106': 'IMTX5BV4GFESVG4HYNPCMXYC',
  '108': 'T2NB4OBAVUTQRLBSLKUXDH5F',
  '113': 'OC3VQPJVFYHA4AR7AZAE4HQG'
};

// Step 3: Map Square key to variation IDs (with correct prices)
const SQUARE_KEY_TO_VARIATION_ID = {
  '102': { regular: 'OWUPYXWBP25ZPBXYIXOGIAVH', weekend: 'YDS4ZJLVB2AKGBRE3H4QMLQW' }, // K101 $110/$125
  '109': { regular: 'ABW2CMSCMUCCNIJQBCMUWI3E', weekend: 'PAA4MXTABGT44BSKTPC76TSK' }, // K102 $110/$125
  '106': { regular: '3YBKN7AUQYDYBVLPGUPN5F3Q', weekend: 'YCGJGEHXRTRY477624AXNUNS' }, // Q201 $120/$135
  '108': { regular: 'QPZUUFYXJLDFE2TNJKVQML7S', weekend: 'D52V6ZL5M33J5JCOF7STEA24' }, // Q202 $120/$135
  '113': { regular: 'W4LUBHNAR5YD2KYL33LIOSDQ', weekend: 'QYWXQVU335GM52QESP7AEBNH' }  // Q203 $120/$135
};

// Helper function to calculate number of nights between two dates
function calculateNights(checkIn, checkOut) {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  const diffTime = Math.abs(end - start);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// Helper to get all dates between two dates (exclusive of end date)
function getDatesBetween(start, end) {
  const dates = [];
  let current = new Date(start);
  const endDate = new Date(end);
  while (current < endDate) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// Helper to check if a date is a weekend
function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

app.post('/api/create-payment', async (req, res) => {
  const { amount, email, guestName, roomType, checkInDate, checkOutDate, room_number, adults, children, special_requests } = req.body;

  try {
    const bookingDetails = {
      room_number,
      guest_name: guestName,
      email,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      adults,
      children,
      special_requests,
      room_type: roomType
    };

    // Step 1: Map room_number to Square key
    const squareKey = ROOM_NUMBER_TO_SQUARE_KEY[room_number];
    // Step 2: Get variation IDs
    const variationIds = SQUARE_KEY_TO_VARIATION_ID[squareKey];
    if (!variationIds) {
      return res.status(400).json({ error: 'Invalid room selected.' });
    }

    // Count regular and weekend nights
    const nights = getDatesBetween(checkInDate, checkOutDate);
    let regularCount = 0, weekendCount = 0;
    nights.forEach(date => {
      if (isWeekend(date)) weekendCount++;
      else regularCount++;
    });

    // Build line items
    const lineItems = [];
    if (regularCount > 0) {
      lineItems.push({
        catalogObjectId: variationIds.regular,
        quantity: regularCount.toString()
      });
    }
    if (weekendCount > 0) {
      lineItems.push({
        catalogObjectId: variationIds.weekend,
        quantity: weekendCount.toString()
      });
    }

    if (lineItems.length === 0) {
      return res.status(400).json({ error: 'No nights selected.' });
    }

    const response = await client.checkoutApi.createPaymentLink({
      idempotencyKey: crypto.randomUUID(),
      order: {
        locationId: process.env.SQUARE_LOCATION_ID,
        lineItems
      },
      checkoutOptions: {
        redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/confirmation`,
        askForShippingAddress: false,
        email,
      },
      note: JSON.stringify(bookingDetails)
    });

    res.json({ url: response.result.paymentLink.url });
  } catch (error) {
    console.error('Error creating payment link:', error);
    res.status(500).json({ error: 'Failed to generate payment link' });
  }
});

// Helper to check payment status with Square
async function checkSquarePaymentStatus(transactionId) {
  try {
    if (!transactionId) return null;
    // Try to fetch payment by ID
    const { result } = await client.paymentsApi.getPayment(transactionId);
    return result.payment?.status || null;
  } catch (err) {
    // If not found as payment, try as order (optional, depending on Square setup)
    return null;
  }
}

// Endpoint to confirm booking after successful payment
app.post('/api/confirm-booking', async (req, res) => {
  const bookingDetails = req.body;

  try {
    // Insert booking
    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        room_id: bookingDetails.room_id,
        guest_name: bookingDetails.guestName,
        email: bookingDetails.email,
        phone: bookingDetails.phone,
        check_in_date: bookingDetails.checkInDate,
        check_out_date: bookingDetails.checkOutDate,
        adults: bookingDetails.adults,
        children: bookingDetails.children,
        special_requests: bookingDetails.special_requests,
        room_type: bookingDetails.roomType,
        status: 'confirmed'
      }]);

    if (error) return res.status(500).json({ error: error.message });

    // Send confirmation email
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: bookingDetails.email,
        subject: 'Booking Confirmation - Legends Pilot Point',
        html: `
          <p>Thank you for your booking, <b>${bookingDetails.guestName}</b>!</p>
          <p>Your check-in date: <b>${bookingDetails.checkInDate}</b></p>
          <p>Your check-out date: <b>${bookingDetails.checkOutDate}</b></p>
          <p>Your room has been reserved and we look forward to hosting you.</p>
          <p>Best regards,<br/>Legends Pilot Point Team</p>
        `,
      });
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError);
      // Optionally, you can still return success, or return a warning to the frontend
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/available-rooms?room_type=king&check_in=2025-05-21&check_out=2025-05-22
app.get('/api/available-rooms', async (req, res) => {
  const { room_type, check_in, check_out } = req.query;
  if (!room_type || !check_in || !check_out) {
    return res.status(400).json({ error: 'Missing required parameters.' });
  }

  try {
    // 1. Get all rooms of the requested type
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, room_type, max_occupancy, price_per_night')
      .ilike('room_type', room_type);

    if (roomsError) throw roomsError;

    // 2. Get all bookings that overlap with the requested range
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('room_id')
      .lt('check_in_date', check_out)
      .gt('check_out_date', check_in)
      .eq('status', 'confirmed');

    if (bookingsError) throw bookingsError;

    // 3. Create a set of booked room IDs for efficient lookup
    const bookedRoomIds = new Set(bookings.map(b => b.room_id));

    // 4. Filter available rooms and add availability count
    const availableRooms = rooms
      .filter(room => !bookedRoomIds.has(room.id))
      .map(room => ({
        ...room,
        available_count: 1
      }));

    // 5. Return the total count and available rooms
    res.json({
      total_rooms: rooms.length,
      available_count: availableRooms.length,
      availableRooms
    });
  } catch (err) {
    console.error('Error fetching available rooms:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/book-room
app.post('/api/book-room', async (req, res) => {
  const { room_id, guest_name, email, phone, check_in_date, check_out_date, adults, children, special_requests, room_type } = req.body;
  if (!room_id || !guest_name || !email || !check_in_date || !check_out_date) {
    return res.status(400).json({ error: 'Missing required parameters.' });
  }

  try {
    // Double-check for overlap before booking
    const { data: overlapping, error: overlapError } = await supabase
      .from('bookings')
      .select('id')
      .eq('room_id', room_id)
      .lt('check_in_date', check_out_date)
      .gt('check_out_date', check_in_date);

    if (overlapError) throw overlapError;
    if (overlapping.length > 0) {
      return res.status(409).json({ error: 'Room is already booked for these dates.' });
    }

    // Insert booking
    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        room_id,
        guest_name,
        email,
        phone,
        check_in_date,
        check_out_date,
        adults,
        children,
        special_requests,
        room_type,
        status: 'confirmed'
      }]);

    if (error) throw error;

    res.json({ success: true, booking: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Scheduled cleanup: run every day at 2:00 AM
cron.schedule('0 2 * * *', async () => {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase
      .from('bookings')
      .delete()
      .lt('check_out_date', today);
    if (error) {
      console.error('Cleanup error:', error);
    } else {
      console.log('Old bookings cleaned up successfully');
    }
  } catch (err) {
    console.error('Unexpected cleanup error:', err);
  }
});

// Endpoint to fetch all Square tax catalog objects (for admin use)
app.get('/api/square-taxes', async (req, res) => {
  try {
    const { result } = await client.catalogApi.listCatalog(undefined, 'TAX');
    const taxes = (result.objects || []).map(obj => ({
      id: obj.id,
      name: obj.taxData?.name,
      percentage: obj.taxData?.percentage
    }));
    res.json({ taxes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to fetch all Square catalog items (for admin use)
app.get('/api/square-items', async (req, res) => {
  try {
    const { result } = await client.catalogApi.listCatalog(undefined, 'ITEM');
    const items = (result.objects || []).map(obj => ({
      id: obj.id,
      name: obj.itemData?.name
    }));
    res.json({ items });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to fetch the price of a catalog item variation by ID
app.get('/api/square-item-price/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { result } = await client.catalogApi.retrieveCatalogObject(id, true);
    const variation = result.object && result.object.itemVariationData;
    const price = variation && variation.priceMoney ? variation.priceMoney.amount : null;
    res.json({ price });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to fetch all variations and their prices for a given item ID
app.get('/api/square-item-variations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { result } = await client.catalogApi.retrieveCatalogObject(id, true);
    const variations = result.object && result.object.itemData && result.object.itemData.variations
      ? result.object.itemData.variations.map(v => ({
          id: v.id,
          name: v.itemVariationData?.name,
          price: v.itemVariationData?.priceMoney?.amount
            ? v.itemVariationData.priceMoney.amount.toString()
            : null
        }))
      : [];
    res.json({ variations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT} (environment: ${process.env.NODE_ENV || 'unknown'})`);
});
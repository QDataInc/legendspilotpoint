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

app.post('/api/create-payment', async (req, res) => {
  const { amount, email, guestName, roomType, checkInDate, checkOutDate, room_id, adults, children, special_requests } = req.body;

  try {
    const bookingDetails = {
      room_id,
      guest_name: guestName,
      email,
      check_in_date: checkInDate,
      check_out_date: checkOutDate,
      adults,
      children,
      special_requests,
      room_type: roomType
    };

    const response = await client.checkoutApi.createPaymentLink({
      idempotencyKey: crypto.randomUUID(),
      quickPay: {
        name: 'Room Booking Payment',
        priceMoney: {
          amount: Math.round(amount * 100),
          currency: 'USD',
        },
        locationId: process.env.SQUARE_LOCATION_ID,
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
    res.status(500).json({ error: 'Failed to generate payment link' });
  }
});

// Square webhook endpoint for payment confirmation and booking
app.post('/api/square-webhook', express.json(), async (req, res) => {
  const event = req.body;
  const signature = req.headers['x-square-hmacsha256-signature'];

  // 1. Verify webhook signature for security
  try {
    const isValid = await client.webhooks.verifyWebhookSignature({
      webhookSignature: signature,
      webhookSignatureKey: process.env.SQUARE_WEBHOOK_SIGNATURE_KEY,
      webhookEventPayload: JSON.stringify(event)
    });
    
    if (!isValid) {
      console.error('Invalid webhook signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }
  } catch (err) {
    console.error('Error verifying webhook signature:', err);
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // 2. Check for payment completion
  if (
    event.type === 'payment.updated' &&
    event.data?.object?.payment?.status === 'COMPLETED'
  ) {
    const payment = event.data.object.payment;
    console.log('Processing completed payment:', payment.id);

    // 3. Extract booking details from payment note
    let bookingDetails;
    try {
      bookingDetails = JSON.parse(payment.note || '{}');
      console.log('Booking details:', bookingDetails);
    } catch (e) {
      console.error('Invalid booking details in payment note:', e);
      return res.status(400).json({ error: 'Invalid booking details in payment note.' });
    }

    if (!bookingDetails.room_id || !bookingDetails.check_in_date) {
      console.error('Missing required booking details');
      return res.status(400).json({ error: 'Missing required booking details' });
    }

    // 4. Check for overlap (safety)
    const { data: overlapping, error: overlapError } = await supabase
      .from('bookings')
      .select('id')
      .eq('room_id', bookingDetails.room_id)
      .lt('check_in_date', bookingDetails.check_out_date)
      .gt('check_out_date', bookingDetails.check_in_date);

    if (overlapError) {
      console.error('Error checking for overlapping bookings:', overlapError);
      return res.status(500).json({ error: overlapError.message });
    }
    
    if (overlapping?.length > 0) {
      console.error('Room already booked for these dates');
      return res.status(409).json({ error: 'Room is already booked for these dates.' });
    }

    // 5. Insert booking
    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        room_id: bookingDetails.room_id,
        guest_name: bookingDetails.guest_name,
        email: bookingDetails.email,
        check_in_date: bookingDetails.check_in_date,
        check_out_date: bookingDetails.check_out_date,
        adults: bookingDetails.adults,
        children: bookingDetails.children,
        special_requests: bookingDetails.special_requests,
        room_type: bookingDetails.room_type,
        status: 'confirmed',
        payment_id: payment.id,
        amount_paid: payment.amountMoney.amount / 100 // Convert from cents to dollars
      }])
      .select();

    if (error) {
      console.error('Error inserting booking:', error);
      return res.status(500).json({ error: error.message });
    }

    console.log('Booking created successfully:', data[0].id);

    // 6. Send confirmation email
    try {
      await transporter.sendMail({
        from: `Your Hotel <${process.env.EMAIL_USER}>`,
        to: bookingDetails.email,
        subject: 'Your Booking is Confirmed!',
        html: `
          <p>Thank you for booking with us, <strong>${bookingDetails.guest_name}</strong>!</p>
          <p>Your <strong>${bookingDetails.room_type}</strong> room from <strong>${bookingDetails.check_in_date}</strong> to <strong>${bookingDetails.check_out_date}</strong> has been confirmed.</p>
          <p>Payment ID: ${payment.id}</p>
          <p>Amount Paid: $${payment.amountMoney.amount / 100}</p>
          <p>We look forward to hosting you!</p>
        `
      });
      console.log('Confirmation email sent to:', bookingDetails.email);
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Don't return error response here, booking is still successful
    }

    return res.status(200).json({ success: true });
  }

  // Return 200 for other event types we don't handle
  res.status(200).json({ received: true });
});

// Endpoint to confirm booking after successful payment
app.post('/api/confirm-booking', async (req, res) => {
  const bookingDetails = req.body;

  try {
    // Check for overlap (safety)
    const { data: overlapping, error: overlapError } = await supabase
      .from('bookings')
      .select('id')
      .eq('room_id', bookingDetails.room_id)
      .lt('check_in_date', bookingDetails.checkOutDate)
      .gt('check_out_date', bookingDetails.checkInDate);

    if (overlapError) return res.status(500).json({ error: overlapError.message });
    if (overlapping.length > 0) {
      return res.status(409).json({ error: 'Room is already booked for these dates.' });
    }

    // Insert booking
    const { data, error } = await supabase
      .from('bookings')
      .insert([{
        room_id: bookingDetails.room_id,
        guest_name: bookingDetails.guestName,
        email: bookingDetails.email,
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
    await transporter.sendMail({
      from: `Your Hotel <${process.env.EMAIL_USER}>`,
      to: bookingDetails.email,
      subject: 'Your Booking is Confirmed!',
      html: `
        <p>Thank you for booking with us, <strong>${bookingDetails.guestName}</strong>!</p>
        <p>Your <strong>${bookingDetails.roomType}</strong> room from <strong>${bookingDetails.checkInDate}</strong> to <strong>${bookingDetails.checkOutDate}</strong> has been confirmed.</p>
        <p>We look forward to hosting you!</p>
      `
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Error confirming booking:', err);
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

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT} (environment: ${process.env.NODE_ENV || 'unknown'})`);
});

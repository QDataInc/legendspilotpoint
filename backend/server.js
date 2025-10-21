import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { Client, Environment } from 'square';
import nodemailer from 'nodemailer';
import { supabase } from './supabase.js';
import multer from 'multer';

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
  environment: process.env.ENVIRONMENT === 'production'
    ? Environment.Production
    : Environment.Sandbox,
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ----------------- Room Mapping -----------------
const ROOM_ID_TO_SQUARE = {
  1: { // K101
    catalogObjectId: 'DAQLQRW3N6GXHNRBPIM7GICE',
    variation: {
      regular: 'PGQ4QS54IO446Q5VG5JVEDFU',
      weekend: '57J4YVAXWLPPMUFQEGSXDU6V'
    }
  },
  2: { // K102
    catalogObjectId: 'YKX5TUKCBCWTOD4IN4RVCQYY',
    variation: {
      regular: 'W7YPBOHAURT3B4GPLNOFH3VO',
      weekend: 'AMYAFBPJBNJQ5WGYDFOG7D45'
    }
  },
  3: { // Q201
    catalogObjectId: 'ON2XD7OHTW2BYCMMEP4A5HTU',
    variation: {
      regular: 'IFF676IGM2YS2A2SPWJU223M',
      weekend: 'HQS5AVTPT3GZODY2LMPK3BHX'
    }
  },
  4: { // Q202
    catalogObjectId: 'HFUELTYFWK7UHHBONN2ICCCP',
    variation: {
      regular: 'Z4M76HDEUXZPJ73OWGN23VK4',
      weekend: '2Z3VBY6RGTEPULUR2XVO7F7W'
    }
  },
  5: { // Q203
    catalogObjectId: 'QSRPWPMJZPGREKU6HKDOZ7MQ',
    variation: {
      regular: '3MSZ45OB3HXISSSOH6OYWWOZ',
      weekend: 'W7XV2HW3BDDK6PNKWUVSRXJX'
    }
  }
};

// ----------------- Helpers -----------------
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

function isWeekend(date) {
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday or Saturday
}

// ----------------- Routes -----------------

// Create Square payment link
app.post('/api/create-payment', async (req, res) => {
  const { room_id, email, guestName, checkInDate, checkOutDate, adults, children, special_requests, roomType, hasPets, numPets } = req.body;

  try {
    const squareInfo = ROOM_ID_TO_SQUARE[room_id];
    if (!squareInfo) {
      return res.status(400).json({ error: 'Invalid room selected.' });
    }

    const nights = getDatesBetween(checkInDate, checkOutDate);
    let regularCount = 0, weekendCount = 0;
    nights.forEach(date => {
      if (isWeekend(date)) weekendCount++;
      else regularCount++;
    });

    const lineItems = [];
    if (regularCount > 0) {
      lineItems.push({
        catalogObjectId: squareInfo.variation.regular,
        quantity: regularCount.toString()
      });
    }
    if (weekendCount > 0) {
      lineItems.push({
        catalogObjectId: squareInfo.variation.weekend,
        quantity: weekendCount.toString()
      });
    }

    if (hasPets && numPets > 0) {
      const petNights = nights.length;
      const petQuantity = petNights * numPets;
      lineItems.push({
        catalogObjectId: 'LZW2KLBNPHZDVLTYN2UHXCD4', // Pet Fee variation ID
        quantity: petQuantity.toString()
      });
    }

    if (lineItems.length === 0) {
      return res.status(400).json({ error: 'No nights selected.' });
    }

    const taxes = [
      { uid: 'state-tax', catalogObjectId: '36IIU7DDUY3NUUA7O3CSWD6L' },
      { uid: 'occupancy-tax', catalogObjectId: '3OEAVFNFCSQEKCNHJ7LYTBAS' },
      { uid: 'county-tax', catalogObjectId: 'KLGAEFMWEP5SVN7SJDGOBEWL' }
    ];

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
      order: {
        locationId: process.env.SQUARE_LOCATION_ID,
        lineItems,
        taxes
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

// Confirm booking (after payment)
app.post('/api/confirm-booking', async (req, res) => {
  const bookingDetails = req.body;

  try {
    const { error } = await supabase
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
        has_pets: bookingDetails.hasPets || false,
        num_pets: bookingDetails.numPets || 0,
        status: 'confirmed'
      }]);

    if (error) return res.status(500).json({ error: error.message });

    // Guest confirmation
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: bookingDetails.email,
      subject: 'Booking Confirmation - Legends Pilot Point',
      html: `
    <p>Dear ${bookingDetails.guestName},</p>

    <p>We are pleased to confirm your reservation for a <b>${bookingDetails.roomType}</b> at <b>Four Horsemen Hotel</b>.</p>
    <p>Your check-in date is <b>${bookingDetails.checkInDate}</b> and your check-out date is <b>${bookingDetails.checkOutDate}</b>. We hope that your stay with us will be comfortable and enjoyable.</p>

    <p>Please remember to bring a valid photo ID with you when you check in. If you have any additional requests or questions, please do not hesitate to contact us.</p>

    <br/>

    <p><b>Cancellation Policy:</b><br/>
    If you cancel your reservation 48 hours before the check-in time, there will be no cancellation fee.<br/>
    However, if you cancel within 48 hours of the check-in time, a cancellation fee will be charged.</p>

    <br/>

    <p>Thank you for choosing our hotel for your stay. We look forward to welcoming you soon!</p>

    <p>Best regards,<br/>
    <b>Management – Four Horsemen Hotel</b></p>
  `
});

    // Admin alert
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: 'New Booking Received - Four Horsemen Hotel',
      html: `
        <p>A new booking has been received:</p>

        <ul>
          <li><b>Name:</b> ${bookingDetails.guestName}</li>
          <li><b>Email:</b> ${bookingDetails.email}</li>
          <li><b>Phone:</b> ${bookingDetails.phone}</li>
          <li><b>Room Type:</b> ${bookingDetails.roomType}</li>
          <li><b>Check-in:</b> ${bookingDetails.checkInDate}</li>
          <li><b>Check-out:</b> ${bookingDetails.checkOutDate}</li>
          <li><b>Adults:</b> ${bookingDetails.adults}</li>
          <li><b>Children:</b> ${bookingDetails.children}</li>
          <li><b>Special Requests:</b> ${bookingDetails.special_requests || 'None'}</li>
        </ul>

        <p>Please check Supabase or your admin dashboard for full details.</p>
      `
    });

    res.json({ success: true });
  } catch (err) {
    console.error('Error in confirm-booking:', err);
    res.status(500).json({ error: err.message });
  }
});

// Check available rooms
app.get('/api/available-rooms', async (req, res) => {
  const { room_type, check_in, check_out } = req.query;
  if (!room_type || !check_in || !check_out) {
    return res.status(400).json({ error: 'Missing required parameters.' });
  }

  try {
    // All rooms of this type
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, room_type, max_occupancy, price_per_night')
      .ilike('room_type', room_type);

    if (roomsError) throw roomsError;
    const totalRooms = rooms.length;

    // All bookings of this type that overlap
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select('room_id, room_type')
      .ilike('room_type', room_type)
      .lt('check_in_date', check_out)
      .gt('check_out_date', check_in)
      .in('status', ['confirmed', 'pending']);

    if (bookingsError) throw bookingsError;

    const bookedCount = bookings.length;
    const availableCount = Math.max(totalRooms - bookedCount, 0);

    // Unique free rooms trimmed to available_count
    const bookedIds = new Set(bookings.map(b => b.room_id));
    const uniqueFreeRooms = rooms.filter(r => !bookedIds.has(r.id));
    const availableRooms = uniqueFreeRooms.slice(0, availableCount);

    res.json({
      total_rooms: totalRooms,
      available_count: availableCount,
      availableRooms
    });
  } catch (err) {
    console.error('Error fetching available rooms:', err);
    res.status(500).json({ error: err.message });
  }
});

// Book room (admin/manual booking)
app.post('/api/book-room', async (req, res) => {
  const { room_id, guest_name, email, phone, check_in_date, check_out_date, adults, children, special_requests, room_type } = req.body;
  if (!room_id || !guest_name || !email || !check_in_date || !check_out_date) {
    return res.status(400).json({ error: 'Missing required parameters.' });
  }

  try {
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

// app.listen(PORT, () => {
//   console.log(`✅ Server running on port ${PORT}`);
// });

// Endpoint to fetch the price of a catalog item variation by ID

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

// List all taxes
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

// Get price of a variation by ID
app.get('/api/square-item-price/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { result } = await client.catalogApi.retrieveCatalogObject(id, true);
    const variation = result.object && result.object.itemVariationData;
    const price = variation?.priceMoney ? variation.priceMoney.amount : null;
    res.json({ price });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all variations for an item
app.get('/api/square-item-variations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { result } = await client.catalogApi.retrieveCatalogObject(id, true);
    const variations = result.object?.itemData?.variations?.map(v => ({
      id: v.id,
      name: v.itemVariationData?.name,
      price: v.itemVariationData?.priceMoney?.amount
        ? v.itemVariationData.priceMoney.amount.toString()
        : null
    })) || [];
    res.json({ variations });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------- Careers Form Route -----------------
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF/DOC/DOCX files are allowed.'));
  }
});

app.post('/api/careers/apply', upload.single('resume'), async (req, res) => {
  try {
    const { name, email, phone, age, experienceYears, legalStatus, position } = req.body;

    if (!name || !email || !phone || !age || !experienceYears || !legalStatus || !position) {
      return res.status(400).send('Missing required fields.');
    }
    if (!req.file) return res.status(400).send('Resume file is required.');

    // 1️⃣ Email to Admin
    const adminHtml = `
      <h2>New Job Application — ${position}</h2>
      <p><b>Name:</b> ${name}</p>
      <p><b>Email:</b> ${email}</p>
      <p><b>Phone:</b> ${phone}</p>
      <p><b>Age:</b> ${age}</p>
      <p><b>Years of Experience:</b> ${experienceYears}</p>
      <p><b>Legal Status:</b> ${legalStatus}</p>
      <p><b>Position:</b> ${position}</p>
      <p><b>Submitted:</b> ${new Date().toLocaleString()}</p>
    `;

    await transporter.sendMail({
      from: `"Legends Careers" <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `New Application: ${position} — ${name}`,
      html: adminHtml,
      attachments: [
        {
          filename: req.file.originalname,
          content: req.file.buffer,
          contentType: req.file.mimetype
        }
      ]
    });

    // 2️⃣ Confirmation email to applicant
    const applicantHtml = `
      <div style="font-family:Arial,Helvetica,sans-serif">
        <h2>Thank You for Applying</h2>
        <p>Hi ${name},</p>
        <p>We received your application for <b>${position}</b> at Legends Pilot Point.</p>
        <p>Our hiring team will review your application and contact you soon.</p>
        <p>— Legends Pilot Point Management</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Legends Careers" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'We received your application!',
      html: applicantHtml
    });

    res.status(200).send('Application submitted successfully.');
  } catch (err) {
    console.error('Error in careers form:', err);
    res.status(500).send('Failed to submit application.');
  }
});

// ----------------- Start Server -----------------
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

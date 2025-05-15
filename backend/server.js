import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { Client, Environment } from 'square';
import nodemailer from 'nodemailer';
import { supabase } from './supabase.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: [
    'https://www.legendspilotpoint.com',
    'https://legendspilotpoint.vercel.app'
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
  const { amount, email, guestName, roomType, checkInDate, checkOutDate } = req.body;

  try {
    console.log('📧 Sending email to admin...');
    await transporter.sendMail({
      from: `Four Horsemen Motel <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: 'New Room Booking',
      html: `
        <p><strong>${guestName}</strong> has booked a room.</p>
        <p><strong>Room:</strong> ${roomType}</p>
        <p><strong>Check-in:</strong> ${checkInDate}</p>
        <p><strong>Check-out:</strong> ${checkOutDate}</p>
      `
    });
    console.log(`✅ Admin email sent to ${process.env.ADMIN_EMAIL}`);

    console.log(`📧 Sending confirmation to guest (${email})`);
    await transporter.sendMail({
      from: `Four Horsemen Motel <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Booking is Confirmed!',
      html: `
        <p>Thank you for booking with us, <strong>${guestName}</strong>!</p>
        <p>Your <strong>${roomType}</strong> room from <strong>${checkInDate}</strong> to <strong>${checkOutDate}</strong> has been confirmed.</p>
        <p>We look forward to hosting you!</p>
      `
    });
    console.log(`✅ Guest email sent to ${email}`);

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
    });

    console.log('✅ Payment link:', response.result.paymentLink.url);
    res.json({ url: response.result.paymentLink.url });

  } catch (error) {
    console.error('❌ Email or Payment Error:', error);
    res.status(500).json({ error: 'Failed to send email or generate payment link' });
  }
});

app.post('/api/confirm-booking', async (req, res) => {
  const bookingData = req.body;
  try {
    // Save booking to database (Supabase)
    const { guest_name, email, phone, check_in_date, check_out_date, adults, children, special_requests, room_type, room_id } = bookingData;
    // Insert booking
    const { data, error: bookingError } = await supabase.from('bookings').insert({
      guest_name,
      email,
      phone,
      check_in_date,
      check_out_date,
      adults,
      children,
      special_requests,
      room_type,
      room_id,
      status: 'confirmed',
      booking_status: 'confirmed'
    });
    if (bookingError) throw bookingError;
    // Update room status
    await supabase.from('rooms').update({ status: 'booked' }).eq('id', room_id);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Booking Error:', err);
    res.status(500).json({ error: 'Failed to save booking after payment' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});

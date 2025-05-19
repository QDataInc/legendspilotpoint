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
  const { amount, email, guestName, roomType, checkInDate, checkOutDate } = req.body;

  try {
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
    console.error('❌ Payment Link Error:', error);
    res.status(500).json({ error: 'Failed to generate payment link' });
  }
});

app.post('/api/confirm-booking', async (req, res) => {
  const bookingData = req.body;
  try {
    console.log('Booking data received:', bookingData);
    const { guest_name, email, phone, check_in_date, check_out_date, adults, children, special_requests, room_type } = bookingData;

    // Log the requested booking dates for debugging
    console.log('Requested booking:', { check_in_date, check_out_date });

    // 1. Find all available rooms of the requested type
    const { data: rooms, error: roomsError } = await supabase
      .from('rooms')
      .select('id, status')
      .eq('room_type', room_type)
      .eq('status', 'available');
    
    if (roomsError) {
      console.error('Error fetching available rooms:', roomsError);
      throw roomsError;
    }
    
    console.log('Available rooms found:', rooms);
    
    if (!rooms || rooms.length === 0) {
      console.error('No rooms of type', room_type, 'available');
      throw new Error('No rooms of this type available');
    }

    // 2. For each room, check for overlapping bookings
    let assignedRoomId = null;
    for (const room of rooms) {
      console.log('Checking room', room.id, 'for overlapping bookings');
      const { data: overlappingBookings, error: overlapError } = await supabase
        .from('bookings')
        .select('*')
        .eq('room_id', room.id)
        .neq('status', 'cancelled')
        .or(`and(check_in_date.lt.${check_out_date},check_out_date.gt.${check_in_date})`);
      
      if (overlapError) {
        console.error('Error checking overlapping bookings:', overlapError);
        throw overlapError;
      }
      
      console.log(`Overlap query for room ${room.id} with requested [${check_in_date} to ${check_out_date}]:`, overlappingBookings);
      
      if (!overlappingBookings || overlappingBookings.length === 0) {
        assignedRoomId = room.id;
        console.log('Room', room.id, 'is available for booking');
        break;
      }
    }
    
    if (!assignedRoomId) {
      console.error('No rooms available for the selected dates');
      throw new Error('No rooms available for the selected dates');
    }

    // 3. Insert booking
    console.log('Creating booking for room', assignedRoomId);
    const { data: booking, error: bookingError } = await supabase.from('bookings').insert({
      guest_name,
      email,
      phone,
      check_in_date,
      check_out_date,
      adults,
      children,
      special_requests,
      room_type,
      room_id: assignedRoomId,
      status: 'confirmed',
      booking_status: 'confirmed'
    }).select();
    
    if (bookingError) {
      console.error('Error creating booking:', bookingError);
      throw bookingError;
    }
    
    console.log('Booking created successfully:', booking);

    // 4. Update room status
    console.log('Updating room status for room', assignedRoomId);
    const { error: roomUpdateError, data: roomUpdateData } = await supabase
      .from('rooms')
      .update({ status: 'booked' })
      .eq('id', assignedRoomId)
      .select();
      
    if (roomUpdateError) {
      console.error('Error updating room status:', roomUpdateError);
      throw roomUpdateError;
    }
    
    console.log('Room status updated successfully:', roomUpdateData);

    // Send emails after successful booking
    console.log('📧 Sending email to admin...');
    await transporter.sendMail({
      from: `Four Horsemen Motel <${process.env.EMAIL_USER}>`,
      to: process.env.ADMIN_EMAIL,
      subject: 'New Room Booking',
      html: `
        <p><strong>${guest_name}</strong> has booked a room.</p>
        <p><strong>Room:</strong> ${room_type}</p>
        <p><strong>Check-in:</strong> ${check_in_date}</p>
        <p><strong>Check-out:</strong> ${check_out_date}</p>
      `
    });
    console.log(`✅ Admin email sent to ${process.env.ADMIN_EMAIL}`);

    console.log(`📧 Sending confirmation to guest (${email})`);
    await transporter.sendMail({
      from: `Four Horsemen Motel <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your Booking is Confirmed!',
      html: `
        <p>Thank you for booking with us, <strong>${guest_name}</strong>!</p>
        <p>Your <strong>${room_type}</strong> room from <strong>${check_in_date}</strong> to <strong>${check_out_date}</strong> has been confirmed.</p>
        <p>We look forward to hosting you!</p>
      `
    });
    console.log(`✅ Guest email sent to ${email}`);

    res.json({ success: true, assignedRoomId, booking });
  } catch (err) {
    console.error('Booking Error:', err);
    res.status(500).json({ error: err.message || 'Failed to save booking after payment' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT} (environment: ${process.env.NODE_ENV || 'unknown'})`);
});

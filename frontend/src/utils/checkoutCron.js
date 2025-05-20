import { supabase } from '../lib/supabaseClient';

/**
 * Process checkouts for bookings where checkout_time has passed
 * This function should be called by a cron job every minute
 */
export const processCheckouts = async () => {
  try {
    // Get all bookings where checkout_time has passed
    const { data: expiredBookings, error: fetchError } = await supabase
      .from('bookings')
      .select('id')
      .lte('check_out_date', new Date().toISOString())
      .eq('status', 'confirmed');

    if (fetchError) {
      console.error('Error fetching expired bookings:', fetchError);
      return;
    }

    if (!expiredBookings || expiredBookings.length === 0) {
      console.log('No expired bookings found');
      return;
    }

    console.log(`Found ${expiredBookings.length} expired bookings to process`);

    // Process each expired booking
    for (const booking of expiredBookings) {
      // Delete the booking
      const { error: deleteError } = await supabase
        .from('bookings')
        .delete()
        .eq('id', booking.id);

      if (deleteError) {
        console.error(`Error deleting booking ${booking.id}:`, deleteError);
      } else {
        console.log(`Successfully processed checkout for booking ${booking.id}`);
      }
    }
  } catch (error) {
    console.error('Unexpected error in processCheckouts:', error);
  }
};

// For testing purposes, we can export a function to create a test booking
export const createTestBooking = async () => {
  try {
    // Get a random room
    const { data: rooms, error: roomError } = await supabase
      .from('rooms')
      .select('id, room_type')
      .limit(1);

    if (roomError || !rooms || rooms.length === 0) {
      throw new Error('No rooms found');
    }

    const room = rooms[0];
    const now = new Date();
    const checkoutTime = new Date(now.getTime() + 2 * 60000); // 2 minutes from now

    // Create a test booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert([
        {
          guest_name: 'Test Guest',
          email: 'test@example.com',
          phone: '1234567890',
          check_in_date: now.toISOString(),
          check_out_date: checkoutTime.toISOString(),
          adults: 1,
          children: 0,
          room_type: room.room_type,
          room_id: room.id,
          status: 'confirmed'
        }
      ])
      .select();

    if (bookingError) {
      throw bookingError;
    }

    console.log('Test booking created successfully:', booking);
    return booking;
  } catch (error) {
    console.error('Error creating test booking:', error);
    throw error;
  }
}; 
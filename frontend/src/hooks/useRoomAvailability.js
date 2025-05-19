import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export const useRoomAvailability = () => {
  const [availability, setAvailability] = useState({
    king: { total: 0, available: 0 },
    queen: { total: 0, available: 0 }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to fetch room availability
  const fetchAvailability = async (checkInDate = null, checkOutDate = null) => {
    try {
      setLoading(true);
      console.log('Fetching availability for dates:', { checkInDate, checkOutDate });
      
      // Initialize counts with default values
      const counts = {
        king: { total: 0, available: 0 },
        queen: { total: 0, available: 0 }
      };

      // Get all rooms with their current status
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('id, room_type, status');

      if (roomsError) {
        console.error('Error fetching rooms:', roomsError);
        throw roomsError;
      }

      // Count total rooms by type and available rooms (corrected logic)
      if (rooms) {
        // If dates are provided, fetch bookings first
        let bookedRoomIds = new Set();
        if (checkInDate && checkOutDate) {
          const { data: bookings, error: bookingsError } = await supabase
            .from('bookings')
            .select('room_id, room_type, status')
            .neq('status', 'cancelled')
            .or(`and(check_in_date.lt.${checkOutDate},check_out_date.gt.${checkInDate})`);

          if (bookingsError) {
            console.error('Error fetching bookings:', bookingsError);
            throw bookingsError;
          }
          bookedRoomIds = new Set(bookings.map(booking => booking.room_id));
        }

        rooms.forEach(room => {
          const type = room.room_type.toLowerCase();
          if (counts[type]) {
            counts[type].total++;
            // Only count as available if status is 'available' AND not booked for the date range
            if (room.status === 'available' && (!checkInDate || !checkOutDate || !bookedRoomIds.has(room.id))) {
              counts[type].available++;
            }
          }
        });
      }

      console.log('Initial room counts:', counts);

      setAvailability(counts);
      setError(null);
    } catch (err) {
      console.error('Error fetching room availability:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Function to mark a room as booked
  const markRoomAsBooked = async (roomType, checkInDate, checkOutDate) => {
    try {
      console.log('Finding available room for:', { roomType, checkInDate, checkOutDate });

      // Get all room IDs that are already booked for these dates (using correct overlap logic)
      const { data: bookedRooms, error: bookingsError } = await supabase
        .from('bookings')
        .select('room_id')
        .eq('room_type', roomType)
        .neq('status', 'cancelled')
        .or(`and(check_in_date.lt.${checkOutDate},check_out_date.gt.${checkInDate})`);

      if (bookingsError) throw bookingsError;

      const bookedRoomIds = bookedRooms?.map(b => b.room_id) || [];
      console.log('Booked room IDs:', bookedRoomIds);

      // Find an available room
      let availableRoomsQuery = supabase
        .from('rooms')
        .select('id')
        .eq('room_type', roomType)
        .eq('status', 'available');

      if (bookedRoomIds.length > 0) {
        availableRoomsQuery = availableRoomsQuery.not('id', 'in', `(${bookedRoomIds.join(',')})`);
      }

      const { data: availableRooms, error: roomError } = await availableRoomsQuery.limit(1);

      if (roomError) throw roomError;
      console.log('Available rooms found:', availableRooms);

      if (!availableRooms?.length) {
        throw new Error('No rooms available for the selected dates');
      }

      return availableRooms[0].id;
    } catch (err) {
      console.error('Error finding available room:', err);
      throw err;
    }
  };

  // Function to reset room status
  const resetRoomStatus = async (roomId) => {
    try {
      const { error } = await supabase
        .from('rooms')
        .update({ status: 'available' })
        .eq('id', roomId);

      if (error) throw error;
      console.log('Reset room status for room:', roomId);
    } catch (err) {
      console.error('Error resetting room status:', err);
    }
  };

  // Set up real-time subscription for room status changes
  useEffect(() => {
    fetchAvailability();

    const roomsSubscription = supabase
      .channel('room_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'rooms' 
        }, 
        (payload) => {
          console.log('Room change detected:', payload);
          fetchAvailability();
        }
      )
      .subscribe();

    const bookingsSubscription = supabase
      .channel('booking_changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'bookings' 
        }, 
        async (payload) => {
          console.log('Booking change detected:', payload);
          // If a booking is deleted or cancelled, reset the room's status
          if ((payload.eventType === 'DELETE' || 
              (payload.eventType === 'UPDATE' && payload.new.status === 'cancelled')) && 
              payload.old?.room_id) {
            await resetRoomStatus(payload.old.room_id);
          }
          fetchAvailability();
        }
      )
      .subscribe();

    return () => {
      roomsSubscription.unsubscribe();
      bookingsSubscription.unsubscribe();
    };
  }, []);

  return {
    availability,
    loading,
    error,
    markRoomAsBooked,
    refreshAvailability: fetchAvailability,
    resetRoomStatus
  };
}; 
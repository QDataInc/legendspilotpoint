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

      // Get all rooms
      const { data: rooms, error: roomsError } = await supabase
        .from('rooms')
        .select('id, room_type');

      if (roomsError) throw roomsError;

      // Count total rooms by type
      if (rooms) {
        rooms.forEach(room => {
          const type = room.room_type.toLowerCase();
          if (counts[type]) {
            counts[type].total++;
            counts[type].available++; // Initially assume all rooms are available
          }
        });
      }

      console.log('Total rooms by type:', counts);

      // If dates are provided, check for bookings in that period
      if (checkInDate && checkOutDate) {
        const { data: bookings, error: bookingsError } = await supabase
          .from('bookings')
          .select('room_id, room_type')
          .neq('status', 'cancelled')
          .or(`and(check_in_date.lt.${checkOutDate},check_out_date.gt.${checkInDate})`);

        if (bookingsError) throw bookingsError;

        console.log('Existing bookings for date range:', bookings);

        // Subtract only the rooms that have actual bookings
        if (bookings && bookings.length > 0) {
          // Create a map of booked room IDs
          const bookedRoomIds = new Set(bookings.map(booking => booking.room_id));
          
          // For each room, check if it's booked
          rooms.forEach(room => {
            const type = room.room_type.toLowerCase();
            if (counts[type] && bookedRoomIds.has(room.id)) {
              counts[type].available--;
            }
          });
        }

        console.log('Final availability after checking bookings:', counts);
      }

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
          // If a booking is deleted, reset the room's status
          if (payload.eventType === 'DELETE' && payload.old?.room_id) {
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
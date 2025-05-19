import { useState } from 'react';

export const useRoomAvailability = () => {
  const [availableRooms, setAvailableRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch available rooms from the backend
  const fetchAvailableRooms = async (roomType, checkInDate, checkOutDate) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/available-rooms?room_type=${encodeURIComponent(roomType)}&check_in=${checkInDate}&check_out=${checkOutDate}`
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch available rooms');
      setAvailableRooms(data.availableRooms);
      return data.availableRooms;
    } catch (err) {
      setError(err.message);
      setAvailableRooms([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Book a room using the backend
  const bookRoom = async (bookingDetails) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/book-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingDetails)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');
      return data.booking;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    availableRooms,
    loading,
    error,
    fetchAvailableRooms,
    bookRoom
  };
}; 
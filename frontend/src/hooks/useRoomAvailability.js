import { useState, useCallback } from 'react';

const API_BASE = process.env.REACT_APP_API_BASE || '';

export const useRoomAvailability = () => {
  const [availableRooms, setAvailableRooms] = useState([]);
  const [totalRooms, setTotalRooms] = useState(0);
  const [availableCount, setAvailableCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch available rooms from the backend
  const fetchAvailableRooms = useCallback(async (roomType, checkInDate, checkOutDate) => {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE}/api/available-rooms?room_type=${encodeURIComponent(roomType)}&check_in=${checkInDate}&check_out=${checkOutDate}`;
      console.log('Fetching:', url);
      const res = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch available rooms');
      setAvailableRooms(data.availableRooms);
      setTotalRooms(data.total_rooms);
      setAvailableCount(data.available_count);
      return data.availableRooms;
    } catch (err) {
      setError(err.message);
      setAvailableRooms([]);
      setTotalRooms(0);
      setAvailableCount(0);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  // Book a room using the backend
  const bookRoom = async (bookingDetails) => {
    setLoading(true);
    setError(null);
    try {
      const url = `${API_BASE}/api/book-room`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingDetails)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Booking failed');
      // Refresh availability after successful booking
      if (bookingDetails.check_in_date && bookingDetails.check_out_date) {
        await fetchAvailableRooms(bookingDetails.room_type, bookingDetails.check_in_date, bookingDetails.check_out_date);
      }
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
    totalRooms,
    availableCount,
    loading,
    error,
    fetchAvailableRooms,
    bookRoom
  };
}; 
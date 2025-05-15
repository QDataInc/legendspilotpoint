import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { FaCalendarAlt, FaUsers, FaWifi, FaSnowflake, FaUtensils, FaBed } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useRoomAvailability } from '../hooks/useRoomAvailability';

const RoomDetails = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [room, setRoom] = useState(null);
  const { availability, loading: availabilityLoading, markRoomAsBooked, refreshAvailability } = useRoomAvailability();

  const searchParams = new URLSearchParams(location.search);
  const checkInDate = searchParams.get('checkIn') || '';
  const checkOutDate = searchParams.get('checkOut') || '';
  const adults = parseInt(searchParams.get('adults')) || 1;
  const children = parseInt(searchParams.get('children')) || 0;

  const [bookingInfo, setBookingInfo] = useState({
    fullName: '',
    email: '',
    phone: '',
    specialRequests: '',
    checkInDate,
    checkOutDate,
    adults,
    children
  });

  const [error, setError] = useState('');
  const [isRoomAvailable, setIsRoomAvailable] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Set up an interval to run the checkout process every minute
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        // Get all bookings where checkout_time has passed
        const { data: expiredBookings, error: fetchError } = await supabase
          .from('bookings')
          .select('id, room_id')
          .lte('check_out_date', new Date().toISOString())
          .eq('status', 'confirmed');

        if (fetchError) {
          console.error('Error fetching expired bookings:', fetchError);
          return;
        }

        if (!expiredBookings || expiredBookings.length === 0) {
          return;
        }

        // Process each expired booking
        for (const booking of expiredBookings) {
          // Delete the booking
          const { error: deleteError } = await supabase
            .from('bookings')
            .delete()
            .eq('id', booking.id);

          if (deleteError) {
            console.error(`Error deleting booking ${booking.id}:`, deleteError);
            continue;
          }

          // Update the room status to available
          const { error: updateError } = await supabase
            .from('rooms')
            .update({ status: 'available' })
            .eq('id', booking.room_id);

          if (updateError) {
            console.error(`Error updating room ${booking.room_id}:`, updateError);
          } else {
            console.log(`Successfully processed checkout for booking ${booking.id} and room ${booking.room_id}`);
          }
        }

        // Refresh availability after processing checkouts
        if (checkInDate && checkOutDate) {
          refreshAvailability(checkInDate, checkOutDate);
        }
      } catch (error) {
        console.error('Error in checkout process:', error);
      }
    }, 60000); // Run every minute

    return () => clearInterval(interval);
  }, [checkInDate, checkOutDate, refreshAvailability]);

  useEffect(() => {
    if (room && checkInDate && checkOutDate) {
      refreshAvailability(checkInDate, checkOutDate);
    }
  }, [room, checkInDate, checkOutDate]);

  useEffect(() => {
    if (room && availability) {
      const roomType = room.type.toLowerCase().includes('king') ? 'king' : 'queen';
      const availableCount = availability[roomType]?.available || 0;
      setIsRoomAvailable(availableCount > 0);
    }
  }, [room, availability]);

  useEffect(() => {
    setBookingInfo(prev => ({
      ...prev,
      checkInDate,
      checkOutDate,
      adults,
      children
    }));
  }, [checkInDate, checkOutDate, adults, children]);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone) => /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(phone);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setError('');
    setBookingInfo(prev => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    if (!bookingInfo.fullName.trim()) return setError('Please enter your full name'), false;
    if (!bookingInfo.email.trim()) return setError('Please enter your email'), false;
    if (!validateEmail(bookingInfo.email)) return setError('Please enter a valid email'), false;
    if (!bookingInfo.phone.trim()) return setError('Please enter your phone number'), false;
    if (!validatePhone(bookingInfo.phone)) return setError('Invalid phone number'), false;
    return true;
  };

  const handleBooking = async () => {
    if (!validateForm()) return;
    setIsProcessing(true);

    try {
      if (!bookingInfo.checkInDate || !bookingInfo.checkOutDate) {
        setError('Check-in and check-out dates are required');
        return;
      }

      const roomType = room.type.toLowerCase().includes('king') ? 'king' : 'queen';
      const assignedRoomId = await markRoomAsBooked(roomType, bookingInfo.checkInDate, bookingInfo.checkOutDate);

      const bookingData = {
        guest_name: bookingInfo.fullName,
        email: bookingInfo.email,
        phone: bookingInfo.phone,
        check_in_date: bookingInfo.checkInDate,
        check_out_date: bookingInfo.checkOutDate,
        adults: bookingInfo.adults,
        children: bookingInfo.children,
        special_requests: bookingInfo.specialRequests || '',
        room_type: roomType,
        room_id: assignedRoomId,
        status: 'confirmed',
        booking_status: 'confirmed'
      };

      const { error: bookingError } = await supabase.from('bookings').insert(bookingData);
      if (bookingError) return setError(`Failed to save booking: ${bookingError.message}`);

      await supabase.from('rooms').update({ status: 'booked' }).eq('id', assignedRoomId);
      await refreshAvailability(checkInDate, checkOutDate);

      // 👉 Trigger Square payment
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/create-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: (checkInDate && checkOutDate) ? getTotalPrice(room.type, checkInDate, checkOutDate) : 0,
          email: bookingInfo.email,
          guestName: bookingInfo.fullName,
          roomType: room.type,
          checkInDate: bookingInfo.checkInDate,
          checkOutDate: bookingInfo.checkOutDate,
        }),
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError('Failed to generate payment link.');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setError(err.message || 'Something went wrong. Try again.');
      refreshAvailability(checkInDate, checkOutDate);
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    const allRooms =  [
      {
        id: 'king1',
        type: 'Single King Bed',
        maxOccupancy: '2 Adults, 1 Child',
        price: 110,
        amenities: ['Free Wi-Fi', 'City View', 'Mini Bar'],
        images: [
          '/img-vid/king-bedroom.jpg',
          '/img-vid/king-bathroom.jpg',
          '/img-vid/king-lounge.jpg'
        ],
        description: 'Luxurious king room with city views and modern amenities.',
        size: '400 sq ft',
        bed: '1 King Bed'
      },
      {
        id: 'king2',
        type: 'Single King Bed',
        maxOccupancy: '2 Adults, 1 Child',
        price: 110,
        amenities: ['Free Wi-Fi', 'Pool View', 'Mini Bar'],
        images: [
          '/img-vid/king-bedroom.jpg',
          '/img-vid/king-bathroom.jpg',
          '/img-vid/king-lounge.jpg'
        ],
        description: 'Elegant king room overlooking the pool area.',
        size: '400 sq ft',
        bed: '1 King Bed'
      },
      {
        id: 'queen1',
        type: 'Double Queen Bed',
        maxOccupancy: '4 Adults, 2 Children',
        price: 110,
        amenities: ['Free Wi-Fi', 'City View', 'Mini Bar', 'Extra Space'],
        images: [
          '/img-vid/queen-bedroom.jpg',
          '/img-vid/queen-bathroom.jpg',
          '/img-vid/queen-lounge.jpg'
        ],
        description: 'Spacious room with two queen beds and city views.',
        size: '500 sq ft',
        bed: '2 Queen Beds'
      },
      {
        id: 'queen2',
        type: 'Double Queen Bed',
        maxOccupancy: '4 Adults, 2 Children',
        price: 110,
        amenities: ['Free Wi-Fi', 'Pool View', 'Mini Bar', 'Extra Space'],
        images: [
          '/img-vid/queen-bedroom.jpg',
          '/img-vid/queen-bathroom.jpg',
          '/img-vid/queen-lounge.jpg'
        ],
        description: 'Family-friendly room with pool views.',
        size: '500 sq ft',
        bed: '2 Queen Beds'
      },
      {
        id: 'queen3',
        type: 'Double Queen Bed',
        maxOccupancy: '4 Adults, 2 Children',
        price: 110,
        amenities: ['Free Wi-Fi', 'Garden View', 'Mini Bar', 'Extra Space'],
        images: [
          '/img-vid/queen-bedroom.jpg',
          '/img-vid/queen-bathroom.jpg',
          '/img-vid/queen-lounge.jpg'
        ],
        description: 'Perfect for families with garden views.',
        size: '500 sq ft',
        bed: '2 Queen Beds'
      }
    ];

    const foundRoom = allRooms.find(r => r.id === roomId);
    setRoom(foundRoom);
  }, [roomId]);

  if (!room) return <div className="pt-20">Loading...</div>;

  const carouselSettings = {
    dots: true, infinite: true, speed: 500,
    slidesToShow: 1, slidesToScroll: 1, autoplay: true,
    autoplaySpeed: 3000, arrows: true, pauseOnHover: true
  };

  // Price calculation helpers
  function isWeekend(dateString) {
    if (!dateString) return false;
    // Parse YYYY-MM-DD as local date (not UTC)
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  function getRoomPrice(roomType, dateString) {
    const weekend = isWeekend(dateString);
    if (roomType.toLowerCase().includes('king')) {
      return 0.01; // Test price for King bed
    } else if (roomType.toLowerCase().includes('queen')) {
      return weekend ? 135 : 120;
    }
    return 0;
  }

  // Helper to get all dates between two dates (exclusive of end date)
  function getDatesBetween(start, end) {
    if (!start || !end) return [];
    const dates = [];
    let current = new Date(start);
    const endDate = new Date(end);
    while (current < endDate) {
      dates.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return dates;
  }

  // Calculate total price for the stay
  function getTotalPrice(roomType, checkIn, checkOut) {
    const nights = getDatesBetween(checkIn, checkOut);
    return nights.reduce((sum, date) => sum + getRoomPrice(roomType, date.toISOString().slice(0, 10)), 0);
  }

  console.log('Room type:', room.type, 'Check-in:', bookingInfo.checkInDate, 'Calculated price:', getRoomPrice(room.type, bookingInfo.checkInDate));

  return (
    <div className="min-h-screen bg-[#FAF3E0] pt-20 font-['Open_Sans']">
      <div className="max-w-5xl mx-auto px-4 py-12">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white rounded-xl shadow-lg overflow-hidden border border-[#D8CFC4]"
        >
          <div className="md:flex">
            <div className="md:w-1/2">
              <div className="relative">
                <Slider {...carouselSettings}>
                  {room.images.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`${room.type} - View ${index + 1}`}
                        className="w-full h-[400px] object-cover"
                      />
                    </div>
                  ))}
                </Slider>
              </div>
            </div>
            <div className="md:w-1/2 p-8 bg-[#FFF8F0]">
              <h1 className="text-3xl font-['Cinzel'] font-bold text-[#8B2500] mb-4">{room.type}</h1>
              <p className="text-gray-700 mb-6">{room.description}</p>
              
              <div className="mb-8">
                <h2 className="text-xl font-['Cinzel'] font-semibold text-[#8B2500] mb-4">Room Details</h2>
                <ul className="space-y-3">
                  <li className="text-gray-700 flex items-center">
                    <span className="w-2 h-2 bg-[#F56A00] rounded-full mr-3"></span>
                    Size: {room.size}
                  </li>
                  <li className="text-gray-700 flex items-center">
                    <span className="w-2 h-2 bg-[#F56A00] rounded-full mr-3"></span>
                    Bed: {room.bed}
                  </li>
                  <li className="text-gray-700 flex items-center">
                    <span className="w-2 h-2 bg-[#F56A00] rounded-full mr-3"></span>
                    Max Occupancy: {room.maxOccupancy}
                  </li>
                  <li className="text-gray-700 flex items-center">
                    <span className="w-2 h-2 bg-[#F56A00] rounded-full mr-3"></span>
                    Check-in: 3:00 PM
                  </li>
                  <li className="text-gray-700 flex items-center">
                    <span className="w-2 h-2 bg-[#F56A00] rounded-full mr-3"></span>
                    Check-out: 11:00 AM
                  </li>
                  {/* Price for selected night */}
                  <li className="text-[#F56A00] font-bold text-2xl mt-4">
                    {(checkInDate && checkOutDate) ? `Total for stay: $${getTotalPrice(room.type, checkInDate, checkOutDate)}+tax` : 'Select dates'}
                  </li>
                  <div className="flex items-center mt-2 text-green-700 font-medium text-base">
                    <svg className="mr-1" width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M7.629 14.29a1 1 0 0 1-1.415 0l-3.5-3.5a1 1 0 1 1 1.415-1.415l2.793 2.793 6.793-6.793a1 1 0 1 1 1.415 1.415l-7.5 7.5z" fill="#388e3c"/>
                    </svg>
                    Total includes taxes and fees
                  </div>
                </ul>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-['Cinzel'] font-semibold text-[#8B2500] mb-4">Amenities</h2>
                <ul className="grid grid-cols-2 gap-3">
                  {room.amenities.map((amenity, index) => (
                    <li key={index} className="text-gray-700 flex items-center">
                      <span className="w-2 h-2 bg-[#F56A00] rounded-full mr-3"></span>
                      {amenity}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          <div className="p-8 bg-[#FAF3E0] border-t border-[#D8CFC4]">
            <h2 className="text-2xl font-['Cinzel'] font-bold text-[#8B2500] mb-6">Complete Your Booking</h2>
            
            {/* Availability Status */}
            {!availabilityLoading && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`mb-6 text-lg font-semibold ${isRoomAvailable ? 'text-green-700' : 'text-red-700'}`}
              >
                {isRoomAvailable ? (
                  `${availability[room.type.toLowerCase().includes('king') ? 'king' : 'queen']?.available} rooms available`
                ) : (
                  'No rooms available for these dates'
                )}
              </motion.div>
            )}

            {isRoomAvailable ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white/90 backdrop-blur-sm rounded-xl p-8 border border-[#D8CFC4] shadow-lg"
              >
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg"
                  >
                    {error}
                  </motion.div>
                )}

                <div className="mb-8">
                  <h3 className="text-lg font-['Cinzel'] font-semibold text-[#8B2500] mb-4">Selected Dates</h3>
                  <div className="grid grid-cols-2 gap-4 p-4 bg-[#FAF3E0] rounded-lg border border-[#D8CFC4]">
                    <div className="flex items-center">
                      <FaCalendarAlt className="text-[#F56A00] mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Check-in</p>
                        <p className="font-semibold text-[#2E2E2E]">{bookingInfo.checkInDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <FaCalendarAlt className="text-[#F56A00] mr-2" />
                      <div>
                        <p className="text-sm text-gray-600">Check-out</p>
                        <p className="font-semibold text-[#2E2E2E]">{bookingInfo.checkOutDate}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mb-8">
                  <h3 className="text-lg font-['Cinzel'] font-semibold text-[#8B2500] mb-4">Guest Details</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[#2E2E2E] font-semibold mb-2">Full Name *</label>
                      <input
                        type="text"
                        name="fullName"
                        value={bookingInfo.fullName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 text-lg border border-[#D8CFC4] rounded-lg focus:ring-2 focus:ring-[#F56A00] focus:border-[#F56A00] bg-white/90 backdrop-blur-sm transition-all duration-300"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[#2E2E2E] font-semibold mb-2">Email *</label>
                      <input
                        type="email"
                        name="email"
                        value={bookingInfo.email}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 text-lg border border-[#D8CFC4] rounded-lg focus:ring-2 focus:ring-[#F56A00] focus:border-[#F56A00] bg-white/90 backdrop-blur-sm transition-all duration-300"
                        required
                        placeholder="example@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-[#2E2E2E] font-semibold mb-2">Phone Number *</label>
                      <input
                        type="tel"
                        name="phone"
                        value={bookingInfo.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 text-lg border border-[#D8CFC4] rounded-lg focus:ring-2 focus:ring-[#F56A00] focus:border-[#F56A00] bg-white/90 backdrop-blur-sm transition-all duration-300"
                        required
                        placeholder="123-456-7890"
                      />
                    </div>
                    <div>
                      <label className="block text-[#2E2E2E] font-semibold mb-2">Special Requests</label>
                      <textarea
                        name="specialRequests"
                        value={bookingInfo.specialRequests}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-4 py-3 text-lg border border-[#D8CFC4] rounded-lg focus:ring-2 focus:ring-[#F56A00] focus:border-[#F56A00] bg-white/90 backdrop-blur-sm transition-all duration-300"
                        placeholder="Any special requests or preferences?"
                      />
                    </div>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleBooking}
                  disabled={isProcessing}
                  className={`w-full ${
                    isProcessing 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-[#F56A00] hover:bg-[#E05F00]'
                  } text-white px-8 py-4 rounded-lg transition duration-300 text-lg font-semibold shadow-lg hover:shadow-xl`}
                >
                  {isProcessing ? 'Processing...' : 'Confirm Booking'}
                </motion.button>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-red-50 border border-red-200 rounded-xl p-8 text-center"
              >
                <p className="text-red-700 text-lg font-semibold">
                  Sorry, this room type is currently fully booked.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => navigate('/reservation')}
                  className="mt-4 bg-[#F56A00] text-white px-8 py-4 rounded-lg hover:bg-[#E05F00] transition duration-300 text-lg font-semibold shadow-lg hover:shadow-xl"
                >
                  Check Other Room Types
                </motion.button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RoomDetails; 
    

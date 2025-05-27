import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { FaCalendarAlt, FaUsers, FaWifi, FaSnowflake, FaUtensils, FaBed } from 'react-icons/fa';
import { motion } from 'framer-motion';
import Slider from 'react-slick';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useRoomAvailability } from '../hooks/useRoomAvailability';

const API_BASE = import.meta.env.VITE_API_URL || '';

const RoomDetails = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [room, setRoom] = useState(null);
  const { 
    availableRooms, 
    totalRooms, 
    availableCount,
    loading: availabilityLoading, 
    error: availabilityError,
    fetchAvailableRooms, 
    bookRoom 
  } = useRoomAvailability();

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
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch room details and availability on mount and when dates change
  useEffect(() => {
    const fetchRoomAndAvailability = async () => {
      try {
        // Fetch room details
        const { data: roomData, error: roomError } = await supabase
          .from('rooms')
          .select('*')
          .eq('id', roomId)
          .single();

        if (roomError) throw roomError;
        setRoom(roomData);

        // Fetch availability if dates are selected
        if (checkInDate && checkOutDate) {
          await fetchAvailableRooms(roomData.room_type, checkInDate, checkOutDate);
        }
      } catch (err) {
        setError(err.message);
      }
    };

    fetchRoomAndAvailability();
  }, [roomId, checkInDate, checkOutDate, fetchAvailableRooms]);

  useEffect(() => {
    if (room && checkInDate && checkOutDate) {
      fetchAvailableRooms(room.room_type, checkInDate, checkOutDate);
    }
  }, [room, checkInDate, checkOutDate]);

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
    setError('');

    try {
      if (!bookingInfo.checkInDate || !bookingInfo.checkOutDate) {
        setError('Check-in and check-out dates are required');
        return;
      }

      const bookingData = {
        amount: getTotalPrice(room.room_type, bookingInfo.checkInDate, bookingInfo.checkOutDate),
        email: bookingInfo.email,
        guestName: bookingInfo.fullName,
        phone: bookingInfo.phone,
        roomType: room.room_type,
        checkInDate: bookingInfo.checkInDate,
        checkOutDate: bookingInfo.checkOutDate,
        room_id: room.id,
        adults: bookingInfo.adults,
        children: bookingInfo.children,
        special_requests: bookingInfo.specialRequests
      };

      // Store booking data in localStorage
      localStorage.setItem('pendingBooking', JSON.stringify(bookingData));

      // Call backend to create Square payment link
      const res = await fetch(`${API_BASE}/api/create-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bookingData),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; // Redirect to Square payment page
      } else {
        setError('Failed to generate payment link.');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!room) return (
    <div className="pt-20 text-center">
      <div className="text-red-700 text-2xl font-bold mb-4">Room not found or unavailable.</div>
      <button
        className="mt-4 px-6 py-2 bg-[#F56A00] text-white rounded-lg"
        onClick={() => navigate('/')}
      >
        Go to Home
      </button>
      <button
        className="mt-4 ml-4 px-6 py-2 bg-gray-600 text-white rounded-lg"
        onClick={() => navigate('/reservation')}
      >
        Back to Reservation
      </button>
    </div>
  );

  const carouselSettings = {
    dots: true, infinite: true, speed: 500,
    slidesToShow: 1, slidesToScroll: 1, autoplay: true,
    autoplaySpeed: 3000, arrows: true, pauseOnHover: true
  };

  // Price calculation helpers
  function isWeekend(dateString) {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 6 = Saturday
    return dayOfWeek === 0 || dayOfWeek === 6;
  }

  function getRoomPrice(roomType, dateString) {
    const weekend = isWeekend(dateString);
    if (roomType.toLowerCase().includes('king')) {
      return weekend ? 125 : 110;
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

  console.log('Room type:', room.room_type, 'Check-in:', bookingInfo.checkInDate, 'Calculated price:', getRoomPrice(room.room_type, bookingInfo.checkInDate));

  // Image gallery for King Room
  const kingRoomImages = [
    '/img-vid/rooms/king-bedroom.png',
    '/img-vid/rooms/king-corner-area.png',
    '/img-vid/rooms/king-bathroom.png',
  ];
  // Image gallery for Queen Room
  const queenRoomImages = [
    '/img-vid/rooms/queen-bedroom.png',
    '/img-vid/rooms/queen-corner-area.png',
    '/img-vid/rooms/queen-bathroom.png',
  ];

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
                  {room.room_type && room.room_type.toLowerCase() === 'king' ? (
                    kingRoomImages.map((img, idx) => (
                      <div className="relative" key={img}>
                        <img
                          src={img}
                          alt={`King room photo ${idx + 1}`}
                          className="w-full h-[400px] object-cover"
                        />
                      </div>
                    ))
                  ) : room.room_type && room.room_type.toLowerCase() === 'queen' ? (
                    queenRoomImages.map((img, idx) => (
                      <div className="relative" key={img}>
                        <img
                          src={img}
                          alt={`Queen room photo ${idx + 1}`}
                          className="w-full h-[400px] object-cover"
                        />
                      </div>
                    ))
                  ) : null}
                </Slider>
              </div>
            </div>
            <div className="md:w-1/2 p-8 bg-[#FFF8F0]">
              <h1 className="text-3xl font-['Cinzel'] font-bold text-[#8B2500] mb-4">{room.room_type}</h1>
              <p className="text-gray-700 mb-6">{room.description}</p>
              
              <div className="mb-8">
                <h2 className="text-xl font-['Cinzel'] font-semibold text-[#8B2500] mb-4">Room Details</h2>
                <ul className="space-y-3">
                  <li className="text-gray-700 flex items-center">
                    <span className="w-2 h-2 bg-[#F56A00] rounded-full mr-3"></span>
                    Max Occupancy: {room.max_occupancy}
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
                    {(checkInDate)
                      ? `$${getRoomPrice(room.room_type, checkInDate)}/night`
                      : (room.room_type.toLowerCase().includes('king') ? '$110–$125/night' : '$120–$135/night')}
                  </li>
                  <li className="text-[#F56A00] font-bold text-2xl mt-4">
                    {(checkInDate && checkOutDate) ? `Total for stay: $${getTotalPrice(room.room_type, checkInDate, checkOutDate)}+tax` : 'Select dates'}
                  </li>
                </ul>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-['Cinzel'] font-semibold text-[#8B2500] mb-4">Amenities</h2>
                <ul className="space-y-2 text-lg">
                  <li>🚗 Secured on-site parking</li>
                  <li>📶 Complimentary Wi-Fi</li>
                  <li>🐾 Pet-friendly ($20/day, service animals stay free)</li>
                  <li>🛒 Convenience store available</li>
                  <li>🧼 Housekeeping upon request</li>
                  <li>♿ Wheelchair-accessible areas*</li>
                  <li>🚭 All rooms non-smoking</li>
                  <li>🏊‍♂️ Outdoor swimming pool coming soon</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="p-8 bg-[#FAF3E0] border-t border-[#D8CFC4]">
            <h2 className="text-2xl font-['Cinzel'] font-bold text-[#8B2500] mb-6">Complete Your Booking</h2>
            
            {isProcessing ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gray-400 cursor-not-allowed rounded-xl p-8 text-center"
              >
                <p className="text-gray-700 text-lg font-semibold">
                  Processing...
                </p>
              </motion.div>
            ) : (
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
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default RoomDetails; 
    

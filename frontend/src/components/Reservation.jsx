import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaUsers, FaSearch } from 'react-icons/fa';
import { useRoomAvailability } from '../hooks/useRoomAvailability';

// Add a static mapping for room amenities and images
const ROOM_DETAILS = {
  king: {
    amenities: [
      'Free Wi-Fi',
      'Air Conditioning',
      'Flat-screen TV',
      'Mini Fridge',
      'Private Bathroom',
      'Room Service',
      'King Size Bed',
    ],
    image: '/img-vid/rooms/king-bedroom.png', // Updated image path for King Room
  },
  queen: {
    amenities: [
      'Free Wi-Fi',
      'Air Conditioning',
      'Flat-screen TV',
      'Mini Fridge',
      'Private Bathroom',
      'Room Service',
      'Queen Size Bed',
    ],
    image: '/queen-bedroom.jpg', // Use image from public folder
  },
};

const Reservation = () => {
  const navigate = useNavigate();
  const [showGuestModal, setShowGuestModal] = useState(false);
  const [showRooms, setShowRooms] = useState(false);
  const [error, setError] = useState('');
  
  const [searchParams, setSearchParams] = useState({
    checkIn: '',
    checkOut: '',
    rooms: 1,
    adults: 1,
    children: 0
  });

  const { fetchAvailableRooms, availableRooms, loading, error: availError } = useRoomAvailability();
  const [allAvailableRooms, setAllAvailableRooms] = useState([]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSearchParams(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const adjustCount = (field, increment) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: Math.max(field === 'children' ? 0 : 1, prev[field] + increment)
    }));
  };

  const validateDates = () => {
    if (!searchParams.checkIn || !searchParams.checkOut) {
      setError('Please select both check-in and check-out dates');
      return false;
    }

    const checkIn = new Date(searchParams.checkIn + 'T00:00:00');
    const checkOut = new Date(searchParams.checkOut + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn.getTime() < today.getTime()) {
      setError('Check-in date cannot be in the past');
      return false;
    }

    if (checkIn.getTime() === checkOut.getTime()) {
      setError('Check-out date must be at least one day after check-in date');
      return false;
    }

    if (checkOut.getTime() < checkIn.getTime()) {
      setError('Check-out date must be after check-in date');
      return false;
    }

    return true;
  };

  const handleSearch = async () => {
    console.log('handleSearch called with:', searchParams);
    if (validateDates()) {
      try {
        const kingRooms = await fetchAvailableRooms('king', searchParams.checkIn, searchParams.checkOut);
        const queenRooms = await fetchAvailableRooms('queen', searchParams.checkIn, searchParams.checkOut);
        const combinedRooms = [...kingRooms, ...queenRooms];
        setAllAvailableRooms(combinedRooms);
        setShowRooms(true);
        setShowGuestModal(false);
      } catch (err) {
        console.error('Error searching rooms:', err);
        setError('Failed to search for rooms. Please try again.');
      }
    }
  };

  const handleRoomSelect = (roomId) => {
    // Create URL parameters for the booking details
    const params = new URLSearchParams({
      checkIn: searchParams.checkIn,
      checkOut: searchParams.checkOut,
      adults: searchParams.adults,
      children: searchParams.children
    }).toString();

    // Navigate with URL parameters
    navigate(`/room-details/${roomId}?${params}`);
  };

  // Get today's date in YYYY-MM-DD format for min date attribute
  const today = new Date().toISOString().split('T')[0];

  // Group available rooms by type for display
  const groupedRooms = allAvailableRooms.reduce((acc, room) => {
    const type = room.room_type.toLowerCase();
    if (!acc[type]) acc[type] = [];
    acc[type].push(room);
    return acc;
  }, {});

  // Price calculation helpers
  function isWeekend(dateString) {
    // Parse YYYY-MM-DD as local date
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

  return (
    <div className="min-h-screen bg-[#FAF3E0] pt-20 font-['Open_Sans']">
      <div className="max-w-5xl mx-auto px-4 py-12">
        {/* Heading */}
        <h1 className="text-5xl font-['Cinzel'] text-center text-[#2E2E2E] mb-8 font-bold">
          Book Your Stay
        </h1>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Experience the perfect blend of comfort and rustic charm at our restaurant. Select your dates and find your ideal room.
        </p>

        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-12 border border-[#D8CFC4]">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Check-in Date */}
            <div className="md:col-span-4">
              <label className="block text-[#2E2E2E] text-xl font-bold mb-3 flex items-center">
                <FaCalendarAlt className="mr-2 text-[#F56A00]" />
                CHECK IN <span className="text-[#F56A00] ml-1">*</span>
              </label>
              <input
                type="date"
                name="checkIn"
                value={searchParams.checkIn}
                onChange={handleInputChange}
                min={today}
                className="w-full px-4 py-3 text-lg border border-[#D8CFC4] rounded-lg focus:ring-[#F56A00] focus:border-[#F56A00] bg-white"
                required
                placeholder="mm/dd/yyyy"
              />
              <p className="text-sm text-gray-600 mt-1">Check-in time: 3:00 PM</p>
            </div>

            {/* Check-out Date */}
            <div className="md:col-span-4">
              <label className="block text-[#2E2E2E] text-xl font-bold mb-3 flex items-center">
                <FaCalendarAlt className="mr-2 text-[#F56A00]" />
                CHECK OUT <span className="text-[#F56A00] ml-1">*</span>
              </label>
              <input
                type="date"
                name="checkOut"
                value={searchParams.checkOut}
                onChange={handleInputChange}
                min={searchParams.checkIn || today}
                className="w-full px-4 py-3 text-lg border border-[#D8CFC4] rounded-lg focus:ring-[#F56A00] focus:border-[#F56A00] bg-white"
                required
                placeholder="mm/dd/yyyy"
              />
              <p className="text-sm text-gray-600 mt-1">Check-out time: 11:00 AM</p>
            </div>

            {/* Rooms & Guests */}
            <div className="md:col-span-4 relative">
              <label className="block text-[#2E2E2E] text-xl font-bold mb-3 flex items-center">
                <FaUsers className="mr-2 text-[#F56A00]" />
                ROOMS & GUESTS
              </label>
              <button
                onClick={() => setShowGuestModal(!showGuestModal)}
                className="w-full px-4 py-3 text-lg text-left border border-[#D8CFC4] rounded-lg focus:ring-[#F56A00] focus:border-[#F56A00] bg-white hover:bg-gray-50"
              >
                {searchParams.rooms} Room{searchParams.rooms !== 1 ? 's' : ''}, {searchParams.adults} Adult{searchParams.adults !== 1 ? 's' : ''}{searchParams.children > 0 ? `, ${searchParams.children} Child${searchParams.children !== 1 ? 'ren' : ''}` : ''}
              </button>

              {showGuestModal && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 p-6 border border-[#D8CFC4]">
                  {/* Rooms */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[#2E2E2E] font-semibold">Rooms</span>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => adjustCount('rooms', -1)}
                        className="w-10 h-10 rounded-full border border-[#D8CFC4] flex items-center justify-center hover:bg-gray-50"
                        disabled={searchParams.rooms <= 1}
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-lg">{searchParams.rooms}</span>
                      <button
                        onClick={() => adjustCount('rooms', 1)}
                        className="w-10 h-10 rounded-full border border-[#D8CFC4] flex items-center justify-center hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Adults */}
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-[#2E2E2E] font-semibold">Adults</span>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => adjustCount('adults', -1)}
                        className="w-10 h-10 rounded-full border border-[#D8CFC4] flex items-center justify-center hover:bg-gray-50"
                        disabled={searchParams.adults <= 1}
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-lg">{searchParams.adults}</span>
                      <button
                        onClick={() => adjustCount('adults', 1)}
                        className="w-10 h-10 rounded-full border border-[#D8CFC4] flex items-center justify-center hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Children */}
                  <div className="flex items-center justify-between">
                    <span className="text-[#2E2E2E] font-semibold">Children</span>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => adjustCount('children', -1)}
                        className="w-10 h-10 rounded-full border border-[#D8CFC4] flex items-center justify-center hover:bg-gray-50"
                        disabled={searchParams.children <= 0}
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-lg">{searchParams.children}</span>
                      <button
                        onClick={() => adjustCount('children', 1)}
                        className="w-10 h-10 rounded-full border border-[#D8CFC4] flex items-center justify-center hover:bg-gray-50"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search Button */}
          <div className="mt-8">
            <button
              onClick={handleSearch}
              className="w-full bg-[#F56A00] text-white px-8 py-4 rounded-lg hover:bg-[#E05F00] transition duration-300 text-2xl font-bold flex items-center justify-center"
            >
              <FaSearch className="mr-2" />
              Search Available Rooms
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Available Rooms */}
        {showRooms && (
          <div className="mt-8">
            <h2 className="text-3xl font-['Cinzel'] text-[#2E2E2E] mb-8 font-bold text-center">
              Available Rooms
            </h2>
            {loading ? (
              <div className="text-center text-gray-600">Loading room availability...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {["king", "queen"].map(type => {
                  const rooms = groupedRooms[type] || [];
                  const availableCount = rooms.length;
                  const firstRoom = rooms[0];
                  // Amenities with emojis
                  const amenities = [
                    "🚗 Secured on-site parking",
                    "📶 Complimentary high-speed Wi-Fi",
                    "🐾 Pet-friendly ($20/day, service animals stay free)",
                    "🛒 Convenience store available",
                    "🧼 Housekeeping upon request",
                    "♿ Wheelchair-accessible areas*",
                    "🚭 All rooms non-smoking",
                    "🏊‍♂️ Outdoor swimming pool"
                  ];
                  return (
                    <div
                      key={type}
                      className="bg-white rounded-xl shadow-lg overflow-hidden border border-[#D8CFC4] flex flex-col"
                    >
                      {/* Room Image */}
                      <img
                        src={ROOM_DETAILS[type].image}
                        alt={`${type} room`}
                        className="w-full h-56 object-cover"
                        style={{ objectPosition: 'center' }}
                      />
                      <div className="p-6 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="text-2xl font-['Cinzel'] text-[#2E2E2E] font-bold mb-2">{type.charAt(0).toUpperCase() + type.slice(1)} Room</h4>
                          <div className={`mb-2 ${availableCount === 0 ? 'text-red-600' : 'text-green-600'} font-semibold`}>
                            {availableCount === 0 ? (
                              'No rooms available'
                            ) : (
                              `${availableCount} ${availableCount === 1 ? 'room' : 'rooms'} available`
                            )}
                          </div>
                          <p className="text-2xl font-bold text-[#F56A00] mb-2">
                            ${getRoomPrice(type, searchParams.checkIn || new Date())}/night
                          </p>
                          <h5 className="text-[#2E2E2E] font-semibold mb-2">Amenities:</h5>
                          <ul className="space-y-1 text-base mb-2">
                            {amenities.map(a => <li key={a}>{a}</li>)}
                          </ul>
                        </div>
                        {availableCount > 0 ? (
                          <Link
                            to={`/room-details/${firstRoom.id}?${new URLSearchParams({
                              checkIn: searchParams.checkIn,
                              checkOut: searchParams.checkOut,
                              adults: searchParams.adults,
                              children: searchParams.children
                            }).toString()}`}
                            className="mt-4 block w-full bg-[#F56A00] text-white text-center px-6 py-3 rounded-lg hover:bg-[#E05F00] transition duration-300 font-bold"
                          >
                            Book Now
                          </Link>
                        ) : (
                          <button
                            disabled
                            className="mt-4 block w-full bg-gray-400 text-white text-center px-6 py-3 rounded-lg cursor-not-allowed font-bold"
                          >
                            Fully Booked
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Reservation; 
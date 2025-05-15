import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Confirmation = () => {
  const [status, setStatus] = useState('processing');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Retrieve booking info from localStorage
    const bookingInfo = JSON.parse(localStorage.getItem('pendingBooking'));
    if (!bookingInfo) {
      setStatus('error');
      setError('No booking information found.');
      return;
    }
    // Call backend to finalize booking
    fetch(`${import.meta.env.VITE_API_URL}/api/confirm-booking`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingInfo)
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setStatus('success');
          localStorage.removeItem('pendingBooking');
        } else {
          setStatus('error');
          setError(data.error || 'Failed to confirm booking.');
        }
      })
      .catch(err => {
        setStatus('error');
        setError('Failed to confirm booking.');
      });
  }, []);

  if (status === 'processing') return <div className="pt-20 text-center">Finalizing your booking...</div>;
  if (status === 'success') return (
    <div className="pt-20 text-center text-green-700 text-2xl font-bold">
      Booking confirmed! Thank you for your payment.
      <div>
        <button
          className="mt-6 px-6 py-2 bg-[#F56A00] text-white rounded-lg"
          onClick={() => navigate('/')}
        >
          Go to Home
        </button>
        <button
          className="mt-6 ml-4 px-6 py-2 bg-gray-600 text-white rounded-lg"
          onClick={() => navigate('/reservation')}
        >
          Make Another Reservation
        </button>
      </div>
    </div>
  );
  return (
    <div className="pt-20 text-center text-red-700 text-xl">
      {error}
      <div>
        <button
          className="mt-6 px-6 py-2 bg-[#F56A00] text-white rounded-lg"
          onClick={() => navigate('/')}
        >
          Go to Home
        </button>
      </div>
    </div>
  );
};

export default Confirmation; 
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

const TestSupabase = () => {
  const [connectionStatus, setConnectionStatus] = useState('Testing...');
  const [error, setError] = useState(null);
  const [testBookingResult, setTestBookingResult] = useState(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      
      if (error) {
        throw error;
      }
      
      setConnectionStatus('Connected successfully!');
      console.log('Supabase connection test successful');
    } catch (error) {
      setConnectionStatus('Connection failed');
      setError(error.message);
      console.error('Supabase connection test failed:', error);
    }
  };

  const createTestBooking = async () => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .insert([
          {
            name: 'Test User',
            email: 'test@example.com',
            phone: '1234567890',
            check_in: new Date().toISOString().split('T')[0],
            check_out: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            adults: 2,
            children: 0,
            special_requests: 'Test booking',
            room_type: 'standard',
            status: 'pending'
          }
        ])
        .select();

      if (error) throw error;
      
      setTestBookingResult('Test booking created successfully!');
      console.log('Test booking created:', data);
    } catch (error) {
      setTestBookingResult(`Error creating test booking: ${error.message}`);
      console.error('Error creating test booking:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Supabase Connection Test</h2>
        
        <div className="mb-4">
          <p className="text-gray-600">Status: <span className="font-semibold">{connectionStatus}</span></p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {connectionStatus === 'Connected successfully!' && (
          <div className="mt-6">
            <button
              onClick={createTestBooking}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition duration-300"
            >
              Create Test Booking
            </button>
            
            {testBookingResult && (
              <div className={`mt-4 p-4 rounded-md ${
                testBookingResult.includes('Error') 
                  ? 'bg-red-50 text-red-700' 
                  : 'bg-green-50 text-green-700'
              }`}>
                {testBookingResult}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TestSupabase; 
import React, { useState, useEffect } from 'react';
import { createTestBooking, processCheckouts } from '../utils/checkoutCron';

const TestCheckout = () => {
  const [testResult, setTestResult] = useState(null);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Set up an interval to run the checkout process every minute
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        await processCheckouts();
      } catch (error) {
        console.error('Error in checkout process:', error);
      }
    }, 60000); // Run every minute

    return () => clearInterval(interval);
  }, []);

  const handleCreateTestBooking = async () => {
    setIsProcessing(true);
    setError(null);
    setTestResult(null);

    try {
      const booking = await createTestBooking();
      setTestResult(`Test booking created successfully! Checkout will be processed in 2 minutes.\nBooking ID: ${booking[0].id}`);
    } catch (error) {
      setError(error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Test Automated Checkout</h2>
        
        <div className="mb-6">
          <p className="text-gray-600">
            This test will:
            <ol className="list-decimal list-inside mt-2">
              <li>Create a test booking with checkout time set to 2 minutes from now</li>
              <li>Automatically process the checkout after 2 minutes</li>
              <li>The checkout process runs every minute in the background</li>
            </ol>
          </p>
        </div>

        <button
          onClick={handleCreateTestBooking}
          disabled={isProcessing}
          className={`w-full ${
            isProcessing 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700'
          } text-white py-2 px-4 rounded-md transition duration-300`}
        >
          {isProcessing ? 'Creating Test Booking...' : 'Create Test Booking'}
        </button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {testResult && (
          <div className="mt-4 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md">
            <p className="font-semibold">Success:</p>
            <p className="whitespace-pre-line">{testResult}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestCheckout; 
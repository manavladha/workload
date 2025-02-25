import React, { useState } from 'react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

function OTPVerification() {
  const location = useLocation();
  const navigate = useNavigate();

  // If we passed userId from Signup via state, prefill it:
  const initialUserId = location.state?.userId || '';
  const [userId, setUserId] = useState(initialUserId);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/verify-otp/', {
        user_id: parseInt(userId),
        otp: otp,
        password: password
      });
      setMessage(response.data.message);
      // After success, go to login
      navigate('/login');
    } catch (error) {
      if (error.response && error.response.data.detail) {
        setMessage(error.response.data.detail);
      } else {
        setMessage('Error verifying OTP');
      }
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>OTP Verification & Set Password</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="number"
          placeholder="User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          required
        />
        <br /><br />
        <input
          type="text"
          placeholder="Enter OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          required
        />
        <br /><br />
        <input
          type="password"
          placeholder="Set Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <br /><br />
        <button type="submit">Verify OTP & Set Password</button>
      </form>
    </div>
  );
}

export default OTPVerification;

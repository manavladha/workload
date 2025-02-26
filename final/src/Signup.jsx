import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

function Signup() {
  const [formData, setFormData] = useState({ name: '', email: '' });
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState(null);
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/signup/', formData);
      setMessage(response.data.message);
      setUserId(response.data.user_id);
      setOtp(response.data.otp); // Display the OTP in the UI for demo
    } catch (error) {
      if (error.response && error.response.data.detail) {
        setMessage(error.response.data.detail);
      } else {
        setMessage('Error signing up');
      }
    }
  };

  const goToOTPVerification = () => {
    // Pass userId to OTPVerification page
    navigate('/otp-verify', { state: { userId } });
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Sign Up</h2>
      {message && <p>{message}</p>}
      {userId ? (
        <div>
          <p>Your user ID is <strong>{userId}</strong>.</p>
          <p>Your OTP is <strong>{otp}</strong> (shown here for demo).</p>
          <button onClick={goToOTPVerification}>Verify OTP & Set Password</button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Name"
            onChange={handleChange}
            required
          />
          <br /><br />
          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            required
          />
          <br /><br />
          <button className="primary-button" type="submit">Sign Up</button>
        </form>
      )}
      
      {/* Link to login page */}
      <p style={{ marginTop: '1rem' }}>
        Already have an account? <Link to="/login">Log in here</Link>.
      </p>
    </div>
  );
}

export default Signup;

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('http://localhost:8000/login/', formData);
      // On success, store the user info (including orgId) in localStorage
      localStorage.setItem('user', JSON.stringify(response.data));
      navigate('/');
    } catch (err) {
      if (err.response && err.response.data.detail) {
         setError(err.response.data.detail);
      } else {
         setError('Login error');
      }
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Login</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Email"
          name="email"
          onChange={handleChange}
          required
        />
        <br /><br />
        <input
          type="password"
          placeholder="Password"
          name="password"
          onChange={handleChange}
          required
        />
        <br /><br />
        <button class="primary-button" type="submit">Login</button>
      </form>
      <p>
        Don’t have an account? <Link to="/signup">Sign up here</Link>.
      </p>
    </div>
  );
}

export default Login;

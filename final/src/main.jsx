// main.jsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import App from './App.jsx';
import Login from './Login.jsx';
import Signup from './Signup.jsx';
import OTPVerification from './OTPVerification.jsx';
import ProtectedRoute from './ProtectedRoute.jsx';

import './index.css';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/otp-verify" element={<OTPVerification />} />
      {/* Any other path should be protected */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <App />
          </ProtectedRoute>
        }
      />
    </Routes>
  </BrowserRouter>
);

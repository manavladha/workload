import React from 'react';
import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
  // For simplicity, check localStorage for "user".
  const isLoggedIn = Boolean(localStorage.getItem('user'));

  if (!isLoggedIn) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default ProtectedRoute;

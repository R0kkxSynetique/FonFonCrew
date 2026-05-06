import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';

const ProtectedRoute = ({ allowedRoles }) => {
  const [authStatus, setAuthStatus] = useState('checking'); // 'checking', 'authorized', 'unauthorized', 'login'

  useEffect(() => {
    const verifyUser = async () => {
      try {
        const res = await axios.get('/auth/me');
        
        const user = res.data;
        // Keep local storage in sync with actual backend truth
        localStorage.setItem('user', JSON.stringify(user));

        if (allowedRoles && !allowedRoles.includes(user.role) && user.role !== 'SUPERADMIN') {
          setAuthStatus('unauthorized');
        } else {
          setAuthStatus('authorized');
        }
      } catch (err) {
        // Token is invalid or expired
        localStorage.removeItem('user');
        setAuthStatus('login');
      }
    };

    verifyUser();
  }, [allowedRoles]);

  if (authStatus === 'checking') {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-secondary)' }}>Loading...</div>;
  }

  if (authStatus === 'login') {
    return <Navigate to="/login" replace />;
  }

  if (authStatus === 'unauthorized') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;

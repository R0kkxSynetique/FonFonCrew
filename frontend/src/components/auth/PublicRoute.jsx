import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';

const PublicRoute = () => {
  const [authStatus, setAuthStatus] = useState('checking'); // 'checking', 'authenticated', 'unauthenticated'
  const token = localStorage.getItem('token');

  useEffect(() => {
    const verifyUser = async () => {
      if (!token) {
        setAuthStatus('unauthenticated');
        return;
      }

      try {
        await axios.get('http://localhost:3001/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAuthStatus('authenticated');
      } catch (err) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAuthStatus('unauthenticated');
      }
    };

    verifyUser();
  }, [token]);

  if (authStatus === 'checking') {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-secondary)' }}>Loading...</div>;
  }

  if (authStatus === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;

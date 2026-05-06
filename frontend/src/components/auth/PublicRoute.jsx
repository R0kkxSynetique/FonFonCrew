import { useState, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';

const PublicRoute = () => {
  const [authStatus, setAuthStatus] = useState('checking'); // 'checking', 'authenticated', 'unauthenticated'

  useEffect(() => {
    const verifyUser = async () => {
      try {
        await axios.get('http://localhost:3001/api/auth/me');
        setAuthStatus('authenticated');
      } catch (err) {
        localStorage.removeItem('user');
        setAuthStatus('unauthenticated');
      }
    };

    verifyUser();
  }, []);

  if (authStatus === 'checking') {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-secondary)' }}>Loading...</div>;
  }

  if (authStatus === 'authenticated') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default PublicRoute;

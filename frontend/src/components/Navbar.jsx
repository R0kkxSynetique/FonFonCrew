import { Link, useNavigate } from 'react-router-dom';
import { LogIn, LogOut, UserPlus, CalendarDays } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();
  // We'll mock auth state for UI first, will connect to real auth later
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '1rem 2rem', 
      borderBottom: '1px solid var(--border-color)',
      backgroundColor: 'var(--bg-surface)'
    }}>
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>
        <CalendarDays size={28} color="var(--accent-color)" />
        FonFonCrew
      </Link>
      
      <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
        {token ? (
          <>
            <span style={{ color: 'var(--text-secondary)' }}>Hello, {user?.firstname}</span>
            <Link to="/dashboard" className="btn btn-primary" style={{ padding: '0.4rem 0.8rem' }}>Dashboard</Link>
            <button onClick={handleLogout} className="btn" style={{ padding: '0.4rem 0.8rem' }}>
              <LogOut size={16} /> Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn" style={{ padding: '0.4rem 0.8rem' }}>
              <LogIn size={16} /> Login
            </Link>
            <Link to="/register" className="btn btn-primary" style={{ padding: '0.4rem 0.8rem' }}>
              <UserPlus size={16} /> Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

import { Link, useNavigate } from 'react-router-dom';
import { LogIn, LogOut, UserPlus, CalendarDays } from 'lucide-react';
import axios from 'axios';

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const handleLogout = async () => {
    try {
      await axios.post('/auth/logout');
    } catch (err) {
      console.error('Logout failed', err);
    }
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="flex justify-between items-center p-md flex-responsive" style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: 'var(--bg-surface)' }}>
      <Link to="/" className="flex items-center gap-sm text-xl font-bold text-primary mb-sm">
        <CalendarDays size={28} color="var(--accent-color)" />
        FonFonCrew
      </Link>

      <div className="flex gap-md items-center nav-menu">
        {user ? (
          <>
            <span className="text-secondary hide-on-mobile">{user?.firstname + " " + user?.lastname}</span>
            <Link to="/dashboard" className="btn btn-primary">Dashboard</Link>
            {user?.role === 'SUPERADMIN' && (
              <Link to="/users" className="btn">Users</Link>
            )}
            <button onClick={handleLogout} className="btn">
              <LogOut size={16} /> Logout
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn">
              <LogIn size={16} /> Login
            </Link>
            <Link to="/register" className="btn btn-primary">
              <UserPlus size={16} /> Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

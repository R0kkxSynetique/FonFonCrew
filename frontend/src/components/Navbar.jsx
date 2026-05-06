import { Link, useNavigate } from 'react-router-dom';
import { LogIn, LogOut, UserPlus, CalendarDays } from 'lucide-react';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

const Navbar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const { t, i18n } = useTranslation();

  const changeLanguage = (e) => {
    i18n.changeLanguage(e.target.value);
  };

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
        <select 
          value={i18n.language.split('-')[0]} 
          onChange={changeLanguage} 
          className="input-field" 
          style={{ width: 'auto', padding: '0.4rem 2rem 0.4rem 0.8rem', minHeight: 'auto' }}
        >
          <option value="fr">FR</option>
          <option value="en">EN</option>
        </select>
        {user ? (
          <>
            <span className="text-secondary hide-on-mobile">{user?.firstname + " " + user?.lastname}</span>
            <Link to="/dashboard" className="btn btn-primary">{t('navbar.dashboard')}</Link>
            {user?.role === 'SUPERADMIN' && (
              <Link to="/users" className="btn">{t('navbar.users')}</Link>
            )}
            <button onClick={handleLogout} className="btn">
              <LogOut size={16} /> {t('navbar.logout')}
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="btn">
              <LogIn size={16} /> {t('navbar.login')}
            </Link>
            <Link to="/register" className="btn btn-primary">
              <UserPlus size={16} /> {t('navbar.signup')}
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

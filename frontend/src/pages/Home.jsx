import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, Users, ShieldCheck } from 'lucide-react';

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      navigate('/dashboard');
    }
  }, [navigate]);

  return (
    <div style={{ textAlign: 'center', marginTop: '4rem' }}>
      <h1 style={{ fontSize: '3rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Manage Volunteers with <span style={{ color: 'var(--accent-color)' }}>Ease</span>
      </h1>
      <p style={{ color: 'var(--text-secondary)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 3rem auto' }}>
        The official platform for FonFonCrew aero RC models events. Sign up to help, or organize your own schedules.
      </p>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginBottom: '4rem' }}>
        <Link to="/register" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>
          Get Started
        </Link>
        <Link to="/login" className="btn" style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>
          Login to Account
        </Link>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem', textAlign: 'left' }}>
        <div className="card">
          <CalendarDays size={32} color="var(--accent-color)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Organize Events</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Create events, set requirements, and manage time slots for your volunteers effortlessly.</p>
        </div>
        <div className="card">
          <Users size={32} color="var(--success-color)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Volunteer Seamlessly</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Browse events, find suitable time slots, and register yourself with just a few clicks.</p>
        </div>
        <div className="card">
          <ShieldCheck size={32} color="var(--danger-color)" style={{ marginBottom: '1rem' }} />
          <h3 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Admin Control</h3>
          <p style={{ color: 'var(--text-secondary)' }}>Full oversight over the platform, accounts, and events for maximum security and peace of mind.</p>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Plus, Users, ShieldAlert } from 'lucide-react';
import { format } from 'date-fns';

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    
    if (!token || !storedUser) {
      navigate('/login');
      return;
    }
    setUser(storedUser);
    fetchEvents();
  }, [navigate]);

  const fetchEvents = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/events');
      setEvents(res.data);
    } catch (err) {
      console.error('Failed to fetch events', err);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToSlot = async (slotId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:3001/api/schedules/${slotId}/subscribe`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Successfully subscribed!');
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to subscribe');
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '3rem' }}>Loading Dashboard...</div>;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold' }}>Dashboard</h1>
        {['ORGANIZER', 'SUPERADMIN'].includes(user?.role) && (
          <Link to="/create-event" className="btn btn-primary">
            <Plus size={18} /> Create Event
          </Link>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '2rem' }}>
        {events.map(event => (
          <div key={event.id} className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: '600' }}>{event.name}</h3>
              <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                {format(new Date(event.start_date), 'MMM d, yyyy')}
              </span>
            </div>
            
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
              {event.description}
            </p>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <h4 style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-muted)' }}>Available Shifts ({event.schedules.length})</h4>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {event.schedules.length === 0 ? (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No shifts available yet.</span>
                ) : (
                  event.schedules.map(slot => (
                    <div key={slot.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--bg-color)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{slot.title}</div>
                        <div style={{ fontSize: '0.85rem', fontWeight: '500', color: 'var(--text-secondary)' }}>
                          {format(new Date(slot.start_time), 'HH:mm')} - {format(new Date(slot.end_time), 'HH:mm')}
                        </div>
                        {slot.description && <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{slot.description}</div>}
                        {slot.requirements && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>Req: {slot.requirements}</div>}
                      </div>
                      
                      {/* Check if user is organizer, show manage button, else show subscribe */}
                      {user.role === 'ORGANIZER' && user.id === event.organizer_id ? (
                         <Link to={`/manage-event/${event.id}`} className="btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                           Manage
                         </Link>
                      ) : (
                         <button onClick={() => subscribeToSlot(slot.id)} className="btn btn-primary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}>
                           Volunteer
                         </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ))}
        {events.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)', padding: '3rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)' }}>
            <Calendar size={48} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
            <p>No upcoming events found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

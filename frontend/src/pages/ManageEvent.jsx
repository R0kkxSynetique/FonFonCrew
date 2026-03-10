import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Users, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

export default function ManageEvent() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const res = await axios.get(`http://localhost:3001/api/events/${eventId}`);
      setEvent(res.data);
      
      // Fetch attendees for each slot
      const token = localStorage.getItem('token');
      const attendeesData = {};
      
      for (const slot of res.data.schedules) {
        const attRes = await axios.get(`http://localhost:3001/api/schedules/${slot.id}/attendees`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        attendeesData[slot.id] = attRes.data;
      }
      
      setAttendees(attendeesData);
    } catch (err) {
      console.error(err);
      alert('Failed to load event details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '3rem' }}>Loading Event...</div>;
  if (!event) return <div style={{ textAlign: 'center', marginTop: '3rem' }}>Event not found</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: 'var(--text-secondary)' }}>
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>
      
      <div className="card" style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{event.name}</h1>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{event.description}</p>
        <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          {format(new Date(event.start_date), 'MMM d, yyyy HH:mm')} - {format(new Date(event.end_date), 'MMM d, yyyy HH:mm')}
        </div>
      </div>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Users size={24} color="var(--accent-color)" /> Schedule Slots & Volunteers
      </h2>

      {event.schedules.map(slot => (
        <div key={slot.id} className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--accent-color)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{slot.title}</h3>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                {format(new Date(slot.start_time), 'HH:mm')} - {format(new Date(slot.end_time), 'HH:mm')}
              </div>
            </div>
            <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-color)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
              Capacity: {attendees[slot.id]?.length || 0} / {slot.capacity}
            </span>
          </div>
          
          {slot.description && <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>{slot.description}</p>}
          {slot.requirements && <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Requirements: {slot.requirements}</p>}

          <div style={{ backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', padding: '1rem' }}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 'bold', color: 'var(--text-secondary)', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Subscribed Volunteers
            </h4>
            
            {!attendees[slot.id] || attendees[slot.id].length === 0 ? (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No volunteers subscribed yet.</p>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {attendees[slot.id].map(user => (
                  <div key={user.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                    <div>
                      <div style={{ fontWeight: '500' }}>{user.firstname} {user.lastname}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email} {user.phone ? `• ${user.phone}` : ''}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

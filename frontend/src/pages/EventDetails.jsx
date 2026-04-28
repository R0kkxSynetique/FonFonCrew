import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, ArrowLeft, Calendar, MapPin, Clock } from 'lucide-react';
import { format } from 'date-fns';

export default function EventDetails() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [slotToUnsubscribe, setSlotToUnsubscribe] = useState(null);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    setUser(storedUser);
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const res = await axios.get(`http://localhost:3001/api/events/${eventId}?t=${new Date().getTime()}`);
      setEvent(res.data);
      
      const attendeesData = {};
      if (res.data.schedules) {
        for (const slot of res.data.schedules) {
          attendeesData[slot.id] = slot.subscriptions.map(sub => ({ id: sub.user_id }));
        }
      }
      setAttendees(attendeesData);
    } catch (err) {
      console.error(err);
      alert('Failed to load event details.');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToSlot = async (slotId) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      await axios.post(`http://localhost:3001/api/schedules/${slotId}/subscriptions`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('Successfully subscribed!', 'success');
      await fetchEventDetails();
    } catch (err) {
      showNotification(err.response?.data?.error || 'Failed to subscribe', 'error');
    }
  };

  const initiateUnsubscribe = (slotId) => {
    setSlotToUnsubscribe(slotId);
    setShowConfirmModal(true);
  };

  const confirmUnsubscribe = async () => {
    if (!slotToUnsubscribe) return;
    const slotId = slotToUnsubscribe;
    setShowConfirmModal(false);
    setSlotToUnsubscribe(null);
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      await axios.delete(`http://localhost:3001/api/schedules/${slotId}/subscriptions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHoveredSlot(null);
      await fetchEventDetails();
      showNotification('Successfully unsubscribed!', 'success');
    } catch (err) {
      showNotification(err.response?.data?.error || 'Failed to unsubscribe', 'error');
    }
  };

  const showNotification = (msg, type) => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const isUserSubscribed = (slotId) => {
    if (!user || !attendees[slotId]) return false;
    return attendees[slotId].some(att => att.id === user.id);
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '3rem' }}>Loading Event...</div>;
  if (!event) return <div style={{ textAlign: 'center', marginTop: '3rem' }}>Event not found</div>;

  const canManage = user && ['ORGANIZER', 'SUPERADMIN'].includes(user?.role) && (user.role === 'SUPERADMIN' || user.id === event.organizer_id);

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', paddingBottom: '3rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)', textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>
      
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
           <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>{event.name}</h1>
           {canManage && (
             <Link to={`/events/${event.id}/edit`} className="btn btn-primary">
               Manage Event
             </Link>
           )}
        </div>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', fontSize: '1.1rem', lineHeight: '1.6' }}>
          {event.description}
        </p>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.5rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
            <Calendar size={20} color="var(--accent-color)" />
            <span style={{ fontWeight: '500' }}>
              {format(new Date(event.start_date), 'MMMM d, yyyy HH:mm')} - {format(new Date(event.end_date), 'MMMM d, yyyy HH:mm')}
            </span>
          </div>
          {event.location_name && (
             <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--text-secondary)' }}>
               <MapPin size={20} color="var(--accent-color)" />
               <span style={{ fontWeight: '500' }}>{event.location_name}</span>
             </div>
          )}
        </div>
      </div>

      <h2 style={{ fontSize: '1.75rem', fontWeight: 'bold', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Clock size={24} color="var(--accent-color)" /> Available Volunteer Shifts
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {event.schedules.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)' }}>
            <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>No shifts are currently available for this event.</p>
          </div>
        ) : (
          event.schedules.map(slot => {
            const currentAttendeesCount = attendees[slot.id]?.length || 0;
            const isFull = currentAttendeesCount >= slot.capacity;
            const subscribed = isUserSubscribed(slot.id);

            return (
              <div key={slot.id} className="card" style={{ borderLeft: '4px solid var(--accent-color)', padding: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ flex: '1 1 300px' }}>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{slot.title}</h3>
                    <div style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Clock size={16} /> 
                      {format(new Date(slot.start_time), 'HH:mm')} - {format(new Date(slot.end_time), 'HH:mm')}
                    </div>
                    {slot.location && (
                      <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin size={16} /> {slot.location}
                      </div>
                    )}
                    {slot.description && <p style={{ color: 'var(--text-secondary)', marginBottom: '0.75rem', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{slot.description}</p>}
                    {slot.requirements && (
                      <div style={{ fontSize: '0.9rem', backgroundColor: 'var(--bg-surface)', padding: '0.5rem 0.75rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'inline-block', marginTop: '0.5rem' }}>
                        <span style={{ fontWeight: 'bold', color: 'var(--text-muted)' }}>Requirements:</span> {slot.requirements}
                      </div>
                    )}
                  </div>

                  <div style={{ 
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem',
                    minWidth: '150px', backgroundColor: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
                      <Users size={18} />
                      <span style={{ fontWeight: '500', fontSize: '1.1rem' }}>{currentAttendeesCount} / {slot.capacity}</span>
                    </div>

                    {!canManage && (
                      subscribed ? (
                        <button 
                          key={`unsubscribe-${slot.id}`}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            initiateUnsubscribe(slot.id);
                          }} 
                          className="btn"
                          style={{ 
                            backgroundColor: hoveredSlot === slot.id ? 'var(--danger-color, #ef4444)' : 'transparent',
                            color: hoveredSlot === slot.id ? 'white' : 'var(--success-color, #10b981)',
                            border: `2px solid ${hoveredSlot === slot.id ? 'var(--danger-color, #ef4444)' : 'var(--success-color, #10b981)'}`,
                            padding: '0.5rem 1rem', 
                            fontWeight: 'bold', 
                            fontSize: '0.9rem', 
                            textAlign: 'center', 
                            width: '100%',
                            transition: 'all 0.2s ease',
                            cursor: 'pointer'
                          }}
                          title="Click to unsubscribe"
                          onMouseEnter={() => setHoveredSlot(slot.id)}
                          onMouseLeave={() => setHoveredSlot(null)}
                        >
                          {hoveredSlot === slot.id ? 'Unsubscribe' : '✓ Subscribed'}
                        </button>
                      ) : isFull ? (
                        <div style={{ backgroundColor: 'var(--text-muted)', color: 'white', padding: '0.5rem 1rem', borderRadius: 'var(--radius-md)', fontWeight: 'bold', fontSize: '0.9rem', textAlign: 'center', width: '100%', cursor: 'not-allowed' }}>
                          Shift Full
                        </div>
                      ) : (
                        <button key={`subscribe-${slot.id}`} onClick={() => subscribeToSlot(slot.id)} className="btn btn-primary" style={{ width: '100%', padding: '0.6rem 1rem' }}>
                          Volunteer
                        </button>
                      )
                    )}
                    {canManage && (
                      <Link to={`/events/${event.id}/edit`} className="btn" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
                         Manage Shift
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '400px', maxWidth: '90%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--text-primary)' }}>Confirm Unsubscription</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Are you sure you want to unsubscribe from this shift?</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn" onClick={() => setShowConfirmModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmUnsubscribe}>Unsubscribe</button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div style={{ 
          position: 'fixed', bottom: '2rem', right: '2rem', padding: '1rem 1.5rem', 
          backgroundColor: notification.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)', 
          color: 'white', borderRadius: 'var(--radius-md)', fontWeight: 'bold', zIndex: 1100, 
          boxShadow: 'var(--shadow-lg)', animation: 'fadeIn 0.3s ease-out'
        }}>
          {notification.msg}
        </div>
      )}
    </div>
  );
}

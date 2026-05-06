import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, ArrowLeft, Calendar, MapPin, Clock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format, differenceInMinutes } from 'date-fns';

const formatDuration = (start, end) => {
  const mins = differenceInMinutes(new Date(end), new Date(start));
  if (mins <= 0) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `(${h} ${h === 1 ? 'hour' : 'hours'} ${m} minutes)`;
  if (h > 0) return `(${h} ${h === 1 ? 'hour' : 'hours'})`;
  return `(${m} minutes)`;
};

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
  const [showVolunteers, setShowVolunteers] = useState(false);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    setUser(storedUser);
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const res = await axios.get(`/events/${eventId}?t=${new Date().getTime()}`);
      setEvent(res.data);
      
      const attendeesData = {};
      if (res.data.schedules) {
        for (const slot of res.data.schedules) {
          attendeesData[slot.id] = slot.subscriptions.map(sub => ({ id: sub.user_id, ...sub.user }));
        }
      }
      setAttendees(attendeesData);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load event details.');
    } finally {
      setLoading(false);
    }
  };

  const subscribeToSlot = async (slotId) => {
    try {
      if (!user) {
        navigate('/login');
        return;
      }
      await axios.post(`/schedules/${slotId}/subscriptions`, {});
      toast.success('Successfully subscribed!');
      await fetchEventDetails();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to subscribe');
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
      if (!user) {
        navigate('/login');
        return;
      }
      await axios.delete(`/schedules/${slotId}/subscriptions`);
      setHoveredSlot(null);
      await fetchEventDetails();
      toast.success('Successfully unsubscribed!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to unsubscribe');
    }
  };

  const isUserSubscribed = (slotId) => {
    if (!user || !attendees[slotId]) return false;
    return attendees[slotId].some(att => att.id === user.id);
  };

  if (loading) return <div className="text-center mt-xl">Loading Event...</div>;
  if (!event) return <div className="text-center mt-xl">Event not found</div>;

  const canManage = user && ['ORGANIZER', 'SUPERADMIN'].includes(user?.role) && (user.role === 'SUPERADMIN' || user.id === event.organizer_id);

  return (
    <div className="page-container-sm" style={{ paddingBottom: '3rem' }}>
      <div className="mb-xl">
        <Link to="/dashboard" className="flex items-center gap-sm text-secondary" style={{ textDecoration: 'none', display: 'inline-flex' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
      </div>
      
      <div className="card mb-xl">
        <div className="flex justify-between items-start">
           <h1 className="text-4xl font-bold mb-md">{event.name}</h1>
           {canManage && (
             <Link to={`/events/${event.id}/edit`} className="btn btn-primary">
               Manage Event
             </Link>
           )}
        </div>
        <p className="text-secondary mb-lg text-lg" style={{ lineHeight: '1.6' }}>
          {event.description}
        </p>
        
        <div className="flex flex-col gap-sm p-lg" style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center gap-sm text-secondary">
            <Calendar size={20} color="var(--accent-color)" />
            <span className="font-medium">
              {format(new Date(event.start_date), 'MMMM d, yyyy HH:mm')} - {format(new Date(event.end_date), 'MMMM d, yyyy HH:mm')}
            </span>
          </div>
          {event.location_name && (
             <div className="flex items-center gap-sm text-secondary">
               <MapPin size={20} color="var(--accent-color)" />
               <span className="font-medium">{event.location_name}</span>
             </div>
          )}
        </div>
      </div>

      <div className="flex justify-between items-center mb-lg flex-wrap gap-md">
        <h2 className="text-2xl font-bold flex items-center gap-sm" style={{ margin: 0 }}>
          <Clock size={24} color="var(--accent-color)" /> Available Volunteer Shifts
        </h2>
        {(event.show_volunteers || canManage) && (
          <button 
            onClick={() => setShowVolunteers(!showVolunteers)}
            className="btn flex items-center gap-sm p-sm"
          >
            {showVolunteers ? <><EyeOff size={18} /> Hide Volunteers</> : <><Eye size={18} /> Show Volunteers</>}
          </button>
        )}
      </div>

      <div className="flex flex-col gap-lg">
        {event.schedules.length === 0 ? (
          <div className="text-center p-xl" style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)' }}>
            <p className="text-secondary text-lg">No shifts are currently available for this event.</p>
          </div>
        ) : (
          event.schedules.map(slot => {
            const currentAttendeesCount = attendees[slot.id]?.length || 0;
            const isFull = currentAttendeesCount >= slot.capacity;
            const subscribed = isUserSubscribed(slot.id);

            return (
              <div key={slot.id} className="card p-lg" style={{ borderLeft: '4px solid var(--accent-color)' }}>
                <div className="flex justify-between items-start flex-wrap gap-md">
                  <div style={{ flex: '1 1 300px' }}>
                    <h3 className="text-2xl font-bold mb-sm">{slot.title}</h3>
                    <div className="text-md text-secondary mb-md flex items-center gap-sm">
                      <Clock size={16} /> 
                      {format(new Date(slot.start_time), 'HH:mm')} - {format(new Date(slot.end_time), 'HH:mm')} {formatDuration(slot.start_time, slot.end_time)}
                    </div>
                    {slot.location && (
                      <div className="text-sm text-secondary mb-sm flex items-center gap-sm">
                        <MapPin size={16} /> {slot.location}
                      </div>
                    )}
                    {slot.description && <p className="text-secondary mb-sm" style={{ lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>{slot.description}</p>}
                    {slot.requirements && (
                      <div className="text-sm p-sm mt-sm" style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', display: 'inline-block' }}>
                        <span className="font-bold text-muted">Requirements:</span> {slot.requirements}
                      </div>
                    )}
                    {showVolunteers && (event.show_volunteers || canManage) && attendees[slot.id]?.length > 0 && (
                      <div className="mt-md pt-md" style={{ borderTop: '1px solid var(--border-color)' }}>
                        <h4 className="text-md font-bold mb-sm text-primary">Volunteers ({attendees[slot.id].length}):</h4>
                        <ul className="flex flex-col gap-sm" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                          {attendees[slot.id].map(att => (
                            <li key={att.id} className="flex items-center gap-sm text-secondary text-sm">
                              <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: 'var(--accent-color)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 'bold' }}>
                                {(att.firstname?.[0] || '').toUpperCase()}{(att.lastname?.[0] || '').toUpperCase()}
                              </div>
                              {att.firstname} {att.lastname}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col items-center gap-md p-md" style={{ 
                    minWidth: '150px', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)'
                  }}>
                    <div className="flex items-center gap-sm text-secondary">
                      <Users size={18} />
                      <span className="font-medium text-lg">{currentAttendeesCount} / {slot.capacity}</span>
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
        <div className="modal-overlay">
          <div className="modal-content modal-content-sm text-center">
            <h3 className="text-xl font-bold mb-md text-primary">Confirm Unsubscription</h3>
            <p className="text-secondary mb-lg">Are you sure you want to unsubscribe from this shift?</p>
            <div className="flex justify-end gap-md">
              <button className="btn" onClick={() => setShowConfirmModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmUnsubscribe}>Unsubscribe</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

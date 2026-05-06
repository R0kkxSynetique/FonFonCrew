import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, ArrowLeft, Trash2, Edit2, Plus, X, Save, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';

const toLocalDatetimeLocal = (isoString) => {
  if (!isoString) return '';
  const dateObj = new Date(isoString);
  const tzOffset = dateObj.getTimezoneOffset() * 60000;
  return new Date(dateObj - tzOffset).toISOString().slice(0, 16);
};

export default function ManageEvent() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState({});
  const [loading, setLoading] = useState(true);

  // Edit Event State
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [editEventData, setEditEventData] = useState({});

  // Add/Edit Slot State
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState(null);
  const [slotFormData, setSlotFormData] = useState({ title: '', description: '', location: '', start_time: '', end_time: '', capacity: 5, requirements: '' });

  // Confirmation Modal State
  const [confirmDelete, setConfirmDelete] = useState({ show: false, type: null, id: null, title: '' });

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const res = await axios.get(`http://localhost:3001/api/events/${eventId}`);
      
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      if (res.data.organizer_id !== user.id && user.role !== 'SUPERADMIN') {
         alert('You do not have permission to manage this event.');
         navigate(`/events/${eventId}`);
         return;
      }

      setEvent(res.data);
      setEditEventData({
        name: res.data.name,
        description: res.data.description || '',
        start_date: toLocalDatetimeLocal(res.data.start_date),
        end_date: toLocalDatetimeLocal(res.data.end_date),
        location_name: res.data.location_name || '',
        show_volunteers: res.data.show_volunteers ?? false,
      });
      
      const attendeesData = {};
      for (const slot of res.data.schedules) {
        const attRes = await axios.get(`http://localhost:3001/api/schedules/${slot.id}/attendees`);
        attendeesData[slot.id] = attRes.data;
      }
      setAttendees(attendeesData);
    } catch (err) {
      console.error(err);
      if (err.response && (err.response.status === 403 || err.response.status === 401)) {
        alert('You do not have permission to manage this event.');
        navigate(`/events/${eventId}`);
        return;
      }
      alert('Failed to load event details.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    try {
      await axios.delete(`http://localhost:3001/api/events/${eventId}`);
      navigate('/dashboard');
    } catch (err) {
      alert('Failed to delete event');
    }
  };

  const handleEventStartDateChange = (e) => {
    const newStartDate = e.target.value;
    setEditEventData(prev => {
      const newData = { ...prev, start_date: newStartDate };
      if (newStartDate) {
        const startDateObj = new Date(newStartDate);
        const endDateObj = prev.end_date ? new Date(prev.end_date) : null;
        
        if (!prev.end_date || (endDateObj && endDateObj < startDateObj)) {
          startDateObj.setHours(startDateObj.getHours() + 1);
          const tzOffset = startDateObj.getTimezoneOffset() * 60000;
          newData.end_date = new Date(startDateObj - tzOffset).toISOString().slice(0, 16);
        }
      }
      return newData;
    });
  };

  const handleUpdateEvent = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:3001/api/events/${eventId}`, editEventData);
      setIsEditingEvent(false);
      fetchEventDetails();
    } catch (err) {
      alert('Failed to update event details');
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3001/api/schedules', { ...slotFormData, event_id: eventId });
      setIsAddingSlot(false);
      fetchEventDetails();
    } catch (err) {
      alert('Failed to create slot');
    }
  };

  const handleUpdateSlot = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:3001/api/schedules/${editingSlotId}`, slotFormData);
      setEditingSlotId(null);
      fetchEventDetails();
    } catch (err) {
      alert('Failed to update slot');
    }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      await axios.delete(`http://localhost:3001/api/schedules/${slotId}`);
      fetchEventDetails();
    } catch (err) {
      console.error('Delete failed:', err.response?.data || err.message);
      alert('Failed to delete slot');
    }
  };

  const triggerDeleteConfirm = (type, id, title) => {
    setConfirmDelete({ show: true, type, id, title });
  };

  const handleConfirmDelete = () => {
    if (confirmDelete.type === 'event') {
      handleDeleteEvent();
    } else if (confirmDelete.type === 'slot') {
      handleDeleteSlot(confirmDelete.id);
    }
    setConfirmDelete({ show: false, type: null, id: null, title: '' });
  };

  const openEditSlot = (slot) => {
    setSlotFormData({
      title: slot.title,
      description: slot.description || '',
      location: slot.location || '',
      start_time: toLocalDatetimeLocal(slot.start_time),
      end_time: toLocalDatetimeLocal(slot.end_time),
      capacity: slot.capacity,
      requirements: slot.requirements || ''
    });
    setEditingSlotId(slot.id);
    setIsAddingSlot(false);
  };

  const openAddSlot = () => {
    setSlotFormData({ 
      title: '', 
      description: '', 
      location: '',
      start_time: event ? toLocalDatetimeLocal(event.start_date) : '', 
      end_time: event ? toLocalDatetimeLocal(event.end_date) : '', 
      capacity: 5, 
      requirements: '' 
    });
    setIsAddingSlot(true);
    setEditingSlotId(null);
  };

  if (loading) return <div style={{ textAlign: 'center', marginTop: '3rem' }}>Loading Event...</div>;
  if (!event) return <div style={{ textAlign: 'center', marginTop: '3rem' }}>Event not found</div>;


  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <Link to="/dashboard" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-secondary)' }}>
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {!isEditingEvent && (
            <button onClick={() => setIsEditingEvent(true)} className="btn">
              <Edit2 size={16} /> Edit Event
            </button>
          )}
          <button onClick={() => triggerDeleteConfirm('event', eventId, event.name)} className="btn btn-danger">
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </div>
      
      {isEditingEvent ? (
        <form onSubmit={handleUpdateEvent} className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Edit Event Details</h2>
          <div className="form-group">
            <label className="form-label">Event Name</label>
            <input type="text" className="input-field" required value={editEventData.name} onChange={e => setEditEventData({...editEventData, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea className="input-field" rows="3" value={editEventData.description} onChange={e => setEditEventData({...editEventData, description: e.target.value})}></textarea>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">Start Date</label>
              <input type="datetime-local" className="input-field" required value={editEventData.start_date} onChange={handleEventStartDateChange} />
            </div>
            <div className="form-group">
              <label className="form-label">End Date</label>
              <input type="datetime-local" className="input-field" required value={editEventData.end_date} onChange={e => setEditEventData({...editEventData, end_date: e.target.value})} />
            </div>
          </div>
          <div className="form-group mb-4">
            <label className="form-label">Location</label>
            <input type="text" className="input-field" value={editEventData.location_name} onChange={e => setEditEventData({...editEventData, location_name: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label" style={{ marginBottom: '0.75rem' }}>Volunteer Visibility</label>
            <button
              type="button"
              onClick={() => setEditEventData({...editEventData, show_volunteers: !editEventData.show_volunteers})}
              style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem',
                backgroundColor: editEventData.show_volunteers ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-surface)',
                border: `1px solid ${editEventData.show_volunteers ? 'var(--success-color, #10b981)' : 'var(--border-color)'}`,
                borderRadius: 'var(--radius-md)', cursor: 'pointer', width: '100%',
                transition: 'all 0.2s ease'
              }}
            >
              {editEventData.show_volunteers ? <Eye size={20} color="var(--success-color, #10b981)" /> : <EyeOff size={20} color="var(--text-muted)" />}
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: '500', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                  {editEventData.show_volunteers ? 'Volunteers are visible' : 'Volunteers are hidden'}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                  {editEventData.show_volunteers ? 'Anyone can see who signed up for each shift' : 'Only organizers can see the volunteer list'}
                </div>
              </div>
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="button" onClick={() => setIsEditingEvent(false)} className="btn"><X size={16} /> Cancel</button>
            <button type="submit" className="btn btn-primary"><Save size={16} /> Save Changes</button>
          </div>
        </form>
      ) : (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>{event.name}</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>{event.description}</p>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {format(new Date(event.start_date), 'MMM d, yyyy HH:mm')} - {format(new Date(event.end_date), 'MMM d, yyyy HH:mm')}
            {event.location_name && ` • ${event.location_name}`}
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.75rem', padding: '0.35rem 0.75rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', fontWeight: '500', backgroundColor: event.show_volunteers ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-surface)', color: event.show_volunteers ? 'var(--success-color, #10b981)' : 'var(--text-muted)', border: `1px solid ${event.show_volunteers ? 'var(--success-color, #10b981)' : 'var(--border-color)'}` }}>
            {event.show_volunteers ? <><Eye size={14} /> Volunteers visible to everyone</> : <><EyeOff size={14} /> Volunteers hidden from users</>}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={24} color="var(--accent-color)" /> Schedule Slots & Volunteers
        </h2>
        {!isAddingSlot && (
          <button onClick={openAddSlot} className="btn btn-primary" style={{ padding: '0.4rem 0.8rem' }}>
            <Plus size={16} /> Add Slot
          </button>
        )}
      </div>

      {isAddingSlot && (
        <SlotForm 
          onSubmit={handleCreateSlot} 
          onCancel={() => setIsAddingSlot(false)} 
          submitText="Create Slot" 
          formData={slotFormData}
          setFormData={setSlotFormData}
        />
      )}

      {event.schedules.map(slot => (
        <div key={slot.id}>
          {editingSlotId === slot.id ? (
            <SlotForm 
              onSubmit={handleUpdateSlot} 
              onCancel={() => setEditingSlotId(null)} 
              submitText="Save Slot" 
              formData={slotFormData}
              setFormData={setSlotFormData}
            />
          ) : (
            <div className="card" style={{ marginBottom: '1.5rem', borderLeft: '4px solid var(--accent-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>{slot.title}</h3>
                  <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                    {format(new Date(slot.start_time), 'HH:mm')} - {format(new Date(slot.end_time), 'HH:mm')}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', backgroundColor: 'var(--bg-color)', padding: '0.25rem 0.5rem', borderRadius: 'var(--radius-sm)' }}>
                    Capacity: {attendees[slot.id]?.length || 0} / {slot.capacity}
                  </span>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => openEditSlot(slot)} className="btn" style={{ padding: '0.3rem', border: 'none' }} title="Edit Slot"><Edit2 size={16} /></button>
                    <button onClick={() => triggerDeleteConfirm('slot', slot.id, slot.title)} className="btn btn-danger" style={{ padding: '0.3rem', border: 'none' }} title="Delete Slot"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
              
              {slot.description && <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem', whiteSpace: 'pre-wrap' }}>{slot.description}</p>}
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
          )}
        </div>
      ))}
      <ConfirmModal 
        show={confirmDelete.show} 
        onClose={() => setConfirmDelete({ show: false, type: null, id: null, title: '' })} 
        onConfirm={handleConfirmDelete}
        title={confirmDelete.type === 'event' ? 'Delete Event' : 'Delete Slot'}
        message={`Are you sure you want to delete "${confirmDelete.title}"? This action cannot be undone.`}
      />
    </div>
  );
}

const SlotForm = ({ onSubmit, onCancel, submitText, formData, setFormData }) => {
  const handleStartTimeChange = (e) => {
    const newStartTime = e.target.value;
    setFormData(prev => {
      const newData = { ...prev, start_time: newStartTime };
      if (newStartTime) {
        const startDateObj = new Date(newStartTime);
        const endDateObj = prev.end_time ? new Date(prev.end_time) : null;
        
        if (!prev.end_time || (endDateObj && endDateObj < startDateObj)) {
          startDateObj.setHours(startDateObj.getHours() + 1);
          const tzOffset = startDateObj.getTimezoneOffset() * 60000;
          newData.end_time = new Date(startDateObj - tzOffset).toISOString().slice(0, 16);
        }
      }
      return newData;
    });
  };

  return (
    <form onSubmit={onSubmit} style={{ backgroundColor: 'var(--bg-surface)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', marginBottom: '1.5rem' }}>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
      <div>
        <label className="form-label">Slot Title</label>
        <input 
          type="text" 
          className="input-field" 
          required 
          value={formData.title} 
          onChange={e => setFormData({...formData, title: e.target.value})} 
          placeholder="E.g., Setup Team" 
        />
      </div>
      <div>
        <label className="form-label">Description (Optional)</label>
        <textarea 
          className="input-field" 
          rows="2" 
          value={formData.description} 
          onChange={e => setFormData({...formData, description: e.target.value})} 
          placeholder="Duties" 
        ></textarea>
      </div>
    </div>

    <div style={{ marginBottom: '1rem' }}>
      <label className="form-label">On-site Location (Optional)</label>
      <input 
        type="text" 
        className="input-field" 
        value={formData.location || ''} 
        onChange={e => setFormData({...formData, location: e.target.value})} 
        placeholder="E.g., Front Gate, Registration Desk" 
      />
    </div>
    
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: '1rem', marginBottom: '0.5rem' }}>
      <div>
        <label className="form-label">Start Time</label>
        <input 
          type="datetime-local" 
          className="input-field" 
          required 
          value={formData.start_time} 
          onChange={handleStartTimeChange} 
        />
      </div>
      <div>
        <label className="form-label">End Time</label>
        <input 
          type="datetime-local" 
          className="input-field" 
          required 
          value={formData.end_time} 
          onChange={e => setFormData({...formData, end_time: e.target.value})} 
        />
      </div>
      <div>
        <label className="form-label">Capacity</label>
        <input 
          type="number" 
          className="input-field" 
          required 
          min="1" 
          value={formData.capacity} 
          onChange={e => setFormData({...formData, capacity: parseInt(e.target.value) || 0})} 
        />
      </div>
    </div>
    <div style={{ marginBottom: '1rem' }}>
      <label className="form-label">Requirements (Optional)</label>
      <input 
        type="text" 
        className="input-field" 
        value={formData.requirements} 
        onChange={e => setFormData({...formData, requirements: e.target.value})} 
        placeholder="Skills needed" 
      />
    </div>
    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
      <button type="button" onClick={onCancel} className="btn"><X size={16} /> Cancel</button>
      <button type="submit" className="btn btn-primary"><Save size={16} /> {submitText}</button>
    </div>
  </form>
  );
};

const ConfirmModal = ({ show, onClose, onConfirm, title, message }) => {
  if (!show) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div className="card" style={{ maxWidth: '400px', width: '90%', padding: '2rem', textAlign: 'center' }}>
        <div style={{ 
          width: '64px', 
          height: '64px', 
          backgroundColor: 'rgba(239, 68, 68, 0.1)', 
          borderRadius: '50%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          margin: '0 auto 1.5rem' 
        }}>
          <Trash2 size={32} color="var(--danger-color)" />
        </div>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>{title}</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>{message}</p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <button onClick={onClose} className="btn" style={{ flex: 1 }}>Cancel</button>
          <button onClick={onConfirm} className="btn btn-danger" style={{ flex: 1 }}>Delete</button>
        </div>
      </div>
    </div>
  );
};

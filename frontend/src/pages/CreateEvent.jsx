import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CalendarDays, MapPin, AlignLeft } from 'lucide-react';

export default function CreateEvent() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    location_name: ''
  });
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAddSlot = () => {
    setSlots([...slots, { title: '', description: '', start_time: '', end_time: '', capacity: 5, requirements: '' }]);
  };

  const handleRemoveSlot = (indexToRemove) => {
    setSlots(slots.filter((_, index) => index !== indexToRemove));
  };

  const handleSlotChange = (index, field, value) => {
    const newSlots = [...slots];
    newSlots[index][field] = value;
    setSlots(newSlots);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      // 1. Create Event
      const res = await axios.post('http://localhost:3001/api/events', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const eventId = res.data.id;

      // 2. Create Slots
      await Promise.all(slots.map(slot => 
        axios.post('http://localhost:3001/api/schedules', { ...slot, event_id: eventId }, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ));

      alert('Event created successfully!');
      navigate('/dashboard');
    } catch (err) {
      alert('Failed to create event or slots.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem' }}>Create New Event</h1>
      
      <form onSubmit={handleSubmit} className="card">
        <h3 style={{ fontSize: '1.25rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Event Details</h3>
        
        <div className="form-group">
          <label className="form-label">Event Name</label>
          <input type="text" className="input-field" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>

        <div className="form-group">
          <label className="form-label">Description</label>
          <textarea className="input-field" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input type="datetime-local" className="input-field" required value={formData.start_date} onChange={e => setFormData({...formData, start_date: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">End Date</label>
            <input type="datetime-local" className="input-field" required value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Location</label>
          <input type="text" className="input-field" value={formData.location_name} onChange={e => setFormData({...formData, location_name: e.target.value})} placeholder="E.g., Flying Field A" />
        </div>

        <h3 style={{ fontSize: '1.25rem', marginTop: '2rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
          Volunteer Time Slots
          <button type="button" onClick={handleAddSlot} className="btn" style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}>+ Add Slot</button>
        </h3>

        {slots.map((slot, index) => (
          <div key={index} style={{ backgroundColor: 'var(--bg-color)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem', border: '1px solid var(--border-color)', position: 'relative' }}>
            <button type="button" onClick={() => handleRemoveSlot(index)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }} aria-label="Remove Slot">✖</button>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem', marginTop: '1rem' }}>
              <div>
                <label className="form-label">Slot Title</label>
                <input type="text" className="input-field" required value={slot.title} onChange={e => handleSlotChange(index, 'title', e.target.value)} placeholder="E.g., Morning Shift Setup" />
              </div>
              <div>
                <label className="form-label">Slot Description (Optional)</label>
                <input type="text" className="input-field" value={slot.description} onChange={e => handleSlotChange(index, 'description', e.target.value)} placeholder="Brief explanation of duties" />
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px', gap: '1rem', marginBottom: '0.5rem' }}>
              <div>
                <label className="form-label">Start Time</label>
                <input type="datetime-local" className="input-field" required value={slot.start_time} onChange={e => handleSlotChange(index, 'start_time', e.target.value)} />
              </div>
              <div>
                <label className="form-label">End Time</label>
                <input type="datetime-local" className="input-field" required value={slot.end_time} onChange={e => handleSlotChange(index, 'end_time', e.target.value)} />
              </div>
              <div>
                <label className="form-label">Capacity</label>
                <input type="number" className="input-field" required min="1" value={slot.capacity} onChange={e => handleSlotChange(index, 'capacity', e.target.value)} />
              </div>
            </div>
            <div>
              <label className="form-label">Requirements (Optional)</label>
              <input type="text" className="input-field" value={slot.requirements} onChange={e => handleSlotChange(index, 'requirements', e.target.value)} placeholder="E.g. Heavy lifting, cooking skills" />
            </div>
          </div>
        ))}

        <div style={{ marginTop: '2rem', textAlign: 'right' }}>
          <button type="button" onClick={() => navigate('/dashboard')} className="btn" style={{ marginRight: '1rem' }}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? 'Saving...' : 'Create Event'}</button>
        </div>
      </form>
    </div>
  );
}

import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Users, ArrowLeft, Trash2, Edit2, Plus, X, Save, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format, differenceInMinutes } from 'date-fns';
import { useTranslation } from 'react-i18next';

const formatDuration = (start, end, t) => {
  const mins = differenceInMinutes(new Date(end), new Date(start));
  if (mins <= 0) return '';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0 && m > 0) return `(${h} ${h === 1 ? t('time.hour') : t('time.hours')} ${m} ${t('time.minutes')})`;
  if (h > 0) return `(${h} ${h === 1 ? t('time.hour') : t('time.hours')})`;
  return `(${m} ${t('time.minutes')})`;
};

const toLocalDatetimeLocal = (isoString) => {
  if (!isoString) return '';
  const dateObj = new Date(isoString);
  const tzOffset = dateObj.getTimezoneOffset() * 60000;
  return new Date(dateObj - tzOffset).toISOString().slice(0, 16);
};

export default function ManageEvent() {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [event, setEvent] = useState(null);
  const [attendees, setAttendees] = useState({});
  const [loading, setLoading] = useState(true);

  // Edit Event State
  const [isEditingEvent, setIsEditingEvent] = useState(false);
  const [editEventData, setEditEventData] = useState({});

  // Add/Edit Slot State
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [editingSlotId, setEditingSlotId] = useState(null);
  const [slotFormData, setSlotFormData] = useState({ title: '', description: '', location: '', start_time: '', end_time: '', capacity: 5, requirements: '', buffer_before: 0, buffer_after: 0, show_buffer: false });

  // Confirmation Modal State
  const [confirmDelete, setConfirmDelete] = useState({ show: false, type: null, id: null, title: '' });

  useEffect(() => {
    fetchEventDetails();
  }, [eventId]);

  const fetchEventDetails = async () => {
    try {
      const res = await axios.get(`/events/${eventId}`);
      
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      if (res.data.organizer_id !== user.id && user.role !== 'SUPERADMIN') {
         toast.error(t('manage_event.error_permission'));
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
      if (Array.isArray(res.data.schedules)) {
        for (const slot of res.data.schedules) {
          try {
            const attRes = await axios.get(`/schedules/${slot.id}/attendees`);
            attendeesData[slot.id] = Array.isArray(attRes.data) ? attRes.data : [];
          } catch (err) {
            console.error(`Failed to fetch attendees for slot ${slot.id}`, err);
            attendeesData[slot.id] = [];
          }
        }
      }
      setAttendees(attendeesData);
    } catch (err) {
      console.error(err);
      if (err.response && (err.response.status === 403 || err.response.status === 401)) {
        toast.error(t('manage_event.error_permission'));
        navigate(`/events/${eventId}`);
        return;
      }
      toast.error(t('manage_event.error_load'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEvent = async () => {
    try {
      await axios.delete(`/events/${eventId}`);
      toast.success(t('manage_event.success_delete_event'));
      navigate('/dashboard');
    } catch (err) {
      toast.error(t('manage_event.error_delete_event'));
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
      await axios.put(`/events/${eventId}`, editEventData);
      setIsEditingEvent(false);
      toast.success(t('manage_event.success_update_event'));
      fetchEventDetails();
    } catch (err) {
      toast.error(t('manage_event.error_update_event'));
    }
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/schedules', { ...slotFormData, event_id: eventId });
      setIsAddingSlot(false);
      toast.success(t('manage_event.success_create_slot'));
      fetchEventDetails();
    } catch (err) {
      toast.error(t('manage_event.error_create_slot'));
    }
  };

  const handleUpdateSlot = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/schedules/${editingSlotId}`, slotFormData);
      setEditingSlotId(null);
      toast.success(t('manage_event.success_update_slot'));
      fetchEventDetails();
    } catch (err) {
      toast.error(t('manage_event.error_update_slot'));
    }
  };

  const handleDeleteSlot = async (slotId) => {
    try {
      await axios.delete(`/schedules/${slotId}`);
      toast.success(t('manage_event.success_delete_slot'));
      fetchEventDetails();
    } catch (err) {
      console.error('Delete failed:', err.response?.data || err.message);
      toast.error(t('manage_event.error_delete_slot'));
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
      requirements: slot.requirements || '',
      buffer_before: slot.buffer_before || 0,
      buffer_after: slot.buffer_after || 0,
      show_buffer: slot.show_buffer || false
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
      requirements: '',
      buffer_before: 0,
      buffer_after: 0,
      show_buffer: false
    });
    setIsAddingSlot(true);
    setEditingSlotId(null);
  };

  if (loading) return <div className="text-center mt-xl">{t('manage_event.loading')}</div>;
  if (!event) return <div className="text-center mt-xl">{t('manage_event.not_found')}</div>;


  return (
    <div className="page-container-sm">
      <div className="flex justify-between items-center mb-xl">
        <Link to="/dashboard" className="flex items-center gap-sm text-secondary" style={{ textDecoration: 'none' }}>
          <ArrowLeft size={16} /> {t('manage_event.back')}
        </Link>
        <div className="flex gap-sm">
          {!isEditingEvent && (
            <button onClick={() => setIsEditingEvent(true)} className="btn">
              <Edit2 size={16} /> {t('manage_event.edit_event')}
            </button>
          )}
          <button onClick={() => triggerDeleteConfirm('event', eventId, event.name)} className="btn btn-danger">
            <Trash2 size={16} /> {t('manage_event.delete')}
          </button>
        </div>
      </div>
      
      {isEditingEvent ? (
        <form onSubmit={handleUpdateEvent} className="card mb-xl">
          <h2 className="text-2xl font-bold mb-md">{t('manage_event.edit_details')}</h2>
          <div className="form-group">
            <label className="form-label">{t('event_form.name_label')}</label>
            <input type="text" className="input-field" required value={editEventData.name} onChange={e => setEditEventData({...editEventData, name: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('event_form.desc_label')}</label>
            <textarea className="input-field" rows="3" value={editEventData.description} onChange={e => setEditEventData({...editEventData, description: e.target.value})}></textarea>
          </div>
          <div className="grid grid-cols-2 gap-md flex-responsive">
            <div className="form-group">
              <label className="form-label">{t('event_form.start_date')}</label>
              <input type="datetime-local" className="input-field" required value={editEventData.start_date} onChange={handleEventStartDateChange} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('event_form.end_date')}</label>
              <input type="datetime-local" className="input-field" required value={editEventData.end_date} onChange={e => setEditEventData({...editEventData, end_date: e.target.value})} />
            </div>
          </div>
          <div className="form-group mb-4">
            <label className="form-label">{t('event_form.location')}</label>
            <input type="text" className="input-field" value={editEventData.location_name} onChange={e => setEditEventData({...editEventData, location_name: e.target.value})} />
          </div>
          <div className="form-group">
            <label className="form-label mb-sm">{t('event_form.volunteer_visibility')}</label>
            <button
              type="button"
              className={`visibility-toggle ${editEventData.show_volunteers ? 'active' : ''}`}
              onClick={() => setEditEventData({...editEventData, show_volunteers: !editEventData.show_volunteers})}
            >
              {editEventData.show_volunteers ? <Eye size={20} color="var(--success-color)" /> : <EyeOff size={20} color="var(--text-muted)" />}
              <div className="text-left">
                <div className="visibility-toggle-title">
                  {editEventData.show_volunteers ? t('event_form.volunteers_visible') : t('event_form.volunteers_hidden')}
                </div>
                <div className="visibility-toggle-desc">
                  {editEventData.show_volunteers ? t('event_form.volunteers_visible_desc') : t('event_form.volunteers_hidden_desc')}
                </div>
              </div>
            </button>
          </div>
          <div className="flex gap-sm justify-end mt-md">
            <button type="button" onClick={() => setIsEditingEvent(false)} className="btn"><X size={16} /> {t('event_form.cancel')}</button>
            <button type="submit" className="btn btn-primary"><Save size={16} /> {t('manage_event.save_changes')}</button>
          </div>
        </form>
      ) : (
        <div className="card mb-xl">
          <h1 className="text-4xl font-bold mb-sm">{event.name}</h1>
          <p className="text-secondary mb-md">{event.description}</p>
          <div className="text-sm text-muted">
            {format(new Date(event.start_date), 'MMM d, yyyy HH:mm')} - {format(new Date(event.end_date), 'MMM d, yyyy HH:mm')}
            {event.location_name && ` • ${event.location_name}`}
          </div>
          <div className={`mt-sm p-xs badge ${event.show_volunteers ? 'badge-success' : ''}`}>
            {event.show_volunteers ? <><Eye size={14} className="mr-sm" /> {t('manage_event.volunteers_visible_badge')}</> : <><EyeOff size={14} className="mr-sm" /> {t('manage_event.volunteers_hidden_badge')}</>}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-lg">
        <h2 className="text-2xl font-bold flex items-center gap-sm">
          <Users size={24} color="var(--accent-color)" /> {t('manage_event.schedule_slots')}
        </h2>
        {!isAddingSlot && (
          <button onClick={openAddSlot} className="btn btn-primary p-sm">
            <Plus size={16} /> {t('manage_event.add_slot')}
          </button>
        )}
      </div>

      {isAddingSlot && (
        <SlotForm 
          onSubmit={handleCreateSlot} 
          onCancel={() => setIsAddingSlot(false)} 
          submitText={t('manage_event.create_slot')} 
          formData={slotFormData}
          setFormData={setSlotFormData}
          t={t}
        />
      )}

      {event.schedules?.map(slot => (
        <div key={slot.id}>
          {editingSlotId === slot.id ? (
            <SlotForm 
              onSubmit={handleUpdateSlot} 
              onCancel={() => setEditingSlotId(null)} 
              submitText={t('manage_event.save_slot')} 
              formData={slotFormData}
              setFormData={setSlotFormData}
              t={t}
            />
          ) : (
            <div className="card mb-lg" style={{ borderLeft: '4px solid var(--accent-color)' }}>
              <div className="flex justify-between items-start mb-md">
                <div>
                  <h3 className="text-xl font-bold">{slot.title}</h3>
                  <div className="text-sm text-secondary mt-xs">
                    {format(new Date(slot.start_time), 'HH:mm')} - {format(new Date(slot.end_time), 'HH:mm')} {formatDuration(slot.start_time, slot.end_time, t)}
                  </div>
                  { (slot.buffer_before > 0 || slot.buffer_after > 0) && (
                    <div className="text-xs text-muted mt-xs flex items-center gap-xs">
                      {t('manage_event.preparation')}:
                      {slot.buffer_before > 0 && <span>+{slot.buffer_before}m {t('manage_event.before')}</span>}
                      {slot.buffer_after > 0 && <span>+{slot.buffer_after}m {t('manage_event.after')}</span>}
                      {slot.show_buffer ? <Eye size={12} title="Visible to volunteers" /> : <EyeOff size={12} title="Hidden from volunteers" />}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-md">
                  <span className="badge">
                    {t('manage_event.capacity')}: {attendees[slot.id]?.length || 0} / {slot.capacity}
                  </span>
                  <div className="flex gap-sm">
                    <button onClick={() => openEditSlot(slot)} className="btn p-sm" style={{ border: 'none' }} title="Edit Slot"><Edit2 size={16} /></button>
                    <button onClick={() => triggerDeleteConfirm('slot', slot.id, slot.title)} className="btn btn-danger p-sm" style={{ border: 'none' }} title="Delete Slot"><Trash2 size={16} /></button>
                  </div>
                </div>
              </div>
              
              {slot.description && <p className="text-sm text-secondary mb-sm" style={{ whiteSpace: 'pre-wrap' }}>{slot.description}</p>}
              {slot.requirements && <p className="text-sm text-muted mb-md">Requirements: {slot.requirements}</p>}

              <div className="p-md" style={{ backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)' }}>
                <h4 className="text-sm font-bold text-secondary mb-sm uppercase" style={{ letterSpacing: '0.05em' }}>
                  {t('manage_event.subscribed_volunteers')}
                </h4>
                
                {!attendees[slot.id] || attendees[slot.id].length === 0 ? (
                  <p className="text-sm text-muted italic">{t('manage_event.no_volunteers')}</p>
                ) : (
                  <div className="grid gap-sm">
                    {attendees[slot.id]?.map(user => (
                      <div key={user.id} className="flex justify-between items-center p-sm" style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                        <div>
                          <div className="font-medium">{user.firstname} {user.lastname}</div>
                          <div className="text-xs text-muted">{user.email} {user.phone ? `• ${user.phone}` : ''}</div>
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
        title={confirmDelete.type === 'event' ? t('manage_event.delete_event') : t('manage_event.delete_slot')}
        message={t('manage_event.confirm_delete_msg', { title: confirmDelete.title })}
        cancelText={t('event_form.cancel')}
        deleteText={t('manage_event.delete')}
      />
    </div>
  );
}

const SlotForm = ({ onSubmit, onCancel, submitText, formData, setFormData, t }) => {
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
    <form onSubmit={onSubmit} className="p-md mb-lg" style={{ backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
    <div className="grid grid-cols-2 gap-md mb-md flex-responsive">
      <div>
        <label className="form-label">{t('event_form.slot_title')}</label>
        <input 
          type="text" 
          className="input-field" 
          required 
          value={formData.title} 
          onChange={e => setFormData({...formData, title: e.target.value})} 
          placeholder={t('event_form.slot_title_placeholder')} 
        />
      </div>
      <div>
        <label className="form-label">{t('event_form.slot_desc')}</label>
        <textarea 
          className="input-field" 
          rows="2" 
          value={formData.description} 
          onChange={e => setFormData({...formData, description: e.target.value})} 
          placeholder={t('event_form.slot_desc_placeholder')} 
        ></textarea>
      </div>
    </div>

    <div className="mb-md">
      <label className="form-label">{t('event_form.onsite_location')}</label>
      <input 
        type="text" 
        className="input-field" 
        value={formData.location || ''} 
        onChange={e => setFormData({...formData, location: e.target.value})} 
        placeholder={t('event_form.onsite_location_placeholder')} 
      />
    </div>
    
    <div className="grid gap-md mb-sm flex-responsive" style={{ gridTemplateColumns: '1fr 1fr 100px' }}>
      <div>
        <label className="form-label">{t('event_form.start_time')}</label>
        <input 
          type="datetime-local" 
          className="input-field" 
          required 
          value={formData.start_time} 
          onChange={handleStartTimeChange} 
        />
      </div>
      <div>
        <label className="form-label">{t('event_form.end_time')}</label>
        <input 
          type="datetime-local" 
          className="input-field" 
          required 
          value={formData.end_time} 
          onChange={e => setFormData({...formData, end_time: e.target.value})} 
        />
      </div>
      <div>
        <label className="form-label">{t('event_form.capacity')}</label>
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
    <div className="grid grid-cols-2 gap-md mb-md flex-responsive">
      <div>
        <label className="form-label">{t('event_form.buffer_before')}</label>
        <input 
          type="number" 
          className="input-field" 
          min="0" 
          value={formData.buffer_before} 
          onChange={e => setFormData({...formData, buffer_before: parseInt(e.target.value) || 0})} 
          placeholder="e.g. 15" 
        />
      </div>
      <div>
        <label className="form-label">{t('event_form.buffer_after')}</label>
        <input 
          type="number" 
          className="input-field" 
          min="0" 
          value={formData.buffer_after} 
          onChange={e => setFormData({...formData, buffer_after: parseInt(e.target.value) || 0})} 
          placeholder="e.g. 15" 
        />
      </div>
    </div>

    <div className="grid grid-cols-2 gap-md mb-sm flex-responsive">
      <div>
        <label className="form-label">{t('event_form.requirements')}</label>
        <input 
          type="text" 
          className="input-field" 
          value={formData.requirements} 
          onChange={e => setFormData({...formData, requirements: e.target.value})} 
          placeholder={t('event_form.requirements_placeholder')} 
        />
      </div>
      <div className="flex items-center" style={{ paddingTop: '1.5rem' }}>
        <label className="form-label flex items-center gap-sm cursor-pointer mb-0">
          <input 
            type="checkbox" 
            checked={formData.show_buffer} 
            onChange={e => setFormData({...formData, show_buffer: e.target.checked})} 
          />
          {t('event_form.show_buffer')}
        </label>
      </div>
    </div>
    <div className="flex gap-sm justify-end">
      <button type="button" onClick={onCancel} className="btn"><X size={16} /> {t('event_form.cancel')}</button>
      <button type="submit" className="btn btn-primary"><Save size={16} /> {submitText}</button>
    </div>
  </form>
  );
};

const ConfirmModal = ({ show, onClose, onConfirm, title, message, cancelText, deleteText }) => {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-content-sm text-center">
        <div className="mx-auto mb-lg flex justify-center items-center" style={{ 
          width: '64px', 
          height: '64px', 
          backgroundColor: 'rgba(239, 68, 68, 0.1)', 
          borderRadius: '50%'
        }}>
          <Trash2 size={32} color="var(--danger-color)" />
        </div>
        <h2 className="text-2xl font-bold mb-md">{title}</h2>
        <p className="text-secondary mb-xl">{message}</p>
        <div className="flex gap-md justify-center">
          <button onClick={onClose} className="btn w-full">{cancelText}</button>
          <button onClick={onConfirm} className="btn btn-danger w-full">{deleteText}</button>
        </div>
      </div>
    </div>
  );
};

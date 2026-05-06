import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { CalendarDays, MapPin, AlignLeft, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

export default function CreateEvent() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    location_name: '',
    show_volunteers: false
  });
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleAddSlot = () => {
    setSlots([...slots, { 
      title: '', 
      description: '', 
      location: '',
      start_time: formData.start_date || '', 
      end_time: formData.end_date || '', 
      capacity: 5, 
      requirements: '',
      buffer_before: 0,
      buffer_after: 0,
      show_buffer: false
    }]);
  };

  const handleRemoveSlot = (indexToRemove) => {
    setSlots(slots.filter((_, index) => index !== indexToRemove));
  };

  const handleSlotChange = (index, field, value) => {
    const newSlots = [...slots];
    newSlots[index][field] = value;
    
    if (field === 'start_time' && value) {
      const startDateObj = new Date(value);
      const endDateObj = newSlots[index].end_time ? new Date(newSlots[index].end_time) : null;
      
      if (!newSlots[index].end_time || (endDateObj && endDateObj < startDateObj)) {
        startDateObj.setHours(startDateObj.getHours() + 1);
        const tzOffset = startDateObj.getTimezoneOffset() * 60000;
        newSlots[index].end_time = new Date(startDateObj - tzOffset).toISOString().slice(0, 16);
      }
    }
    
    setSlots(newSlots);
  };

  const handleEventStartDateChange = (e) => {
    const newStartDate = e.target.value;
    setFormData(prev => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Create Event
      const res = await axios.post('/events', formData);
      const eventId = res.data.id;

      // 2. Create Slots
      await Promise.all(slots.map(slot => 
        axios.post('/schedules', { ...slot, event_id: eventId })
      ));

      toast.success(t('create_event.success'));
      navigate('/dashboard');
    } catch (err) {
      toast.error(t('create_event.error_failed'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container-sm">
      <h1 className="page-title">{t('create_event.title')}</h1>
      
      <form onSubmit={handleSubmit} className="card">
        <h3 className="section-title">{t('create_event.details_section')}</h3>
        
        <div className="form-group">
          <label className="form-label">{t('event_form.name_label')}</label>
          <input type="text" className="input-field" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
        </div>

        <div className="form-group">
          <label className="form-label">{t('event_form.desc_label')}</label>
          <textarea className="input-field" rows="3" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})}></textarea>
        </div>

        <div className="grid grid-cols-2 gap-md flex-responsive">
          <div className="form-group">
            <label className="form-label">{t('event_form.start_date')}</label>
            <input type="datetime-local" className="input-field" required value={formData.start_date} onChange={handleEventStartDateChange} />
          </div>
          <div className="form-group">
            <label className="form-label">{t('event_form.end_date')}</label>
            <input type="datetime-local" className="input-field" required value={formData.end_date} onChange={e => setFormData({...formData, end_date: e.target.value})} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">{t('event_form.location')}</label>
          <input type="text" className="input-field" value={formData.location_name} onChange={e => setFormData({...formData, location_name: e.target.value})} placeholder={t('event_form.location_placeholder')} />
        </div>

        <div className="form-group">
          <label className="form-label mb-sm">{t('event_form.volunteer_visibility')}</label>
          <button
            type="button"
            className={`visibility-toggle ${formData.show_volunteers ? 'active' : ''}`}
            onClick={() => setFormData({...formData, show_volunteers: !formData.show_volunteers})}
          >
            {formData.show_volunteers ? <Eye size={20} color="var(--success-color)" /> : <EyeOff size={20} color="var(--text-muted)" />}
            <div className="text-left">
              <div className="visibility-toggle-title">
                {formData.show_volunteers ? t('event_form.volunteers_visible') : t('event_form.volunteers_hidden')}
              </div>
              <div className="visibility-toggle-desc">
                {formData.show_volunteers ? t('event_form.volunteers_visible_desc') : t('event_form.volunteers_hidden_desc')}
              </div>
            </div>
          </button>
        </div>

        <h3 className="section-title mt-xl flex justify-between items-center">
          {t('event_form.slots_section')}
          <button type="button" onClick={handleAddSlot} className="btn text-xs p-sm">{t('event_form.add_slot')}</button>
        </h3>

        {slots.map((slot, index) => (
          <div key={index} className="p-md mb-md" style={{ backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', position: 'relative' }}>
            <button type="button" onClick={() => handleRemoveSlot(index)} style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.8rem' }} aria-label="Remove Slot">✖</button>
            <div className="grid grid-cols-2 gap-md mb-md mt-md flex-responsive">
              <div>
                <label className="form-label">{t('event_form.slot_title')}</label>
                <input type="text" className="input-field" required value={slot.title} onChange={e => handleSlotChange(index, 'title', e.target.value)} placeholder={t('event_form.slot_title_placeholder')} />
              </div>
              <div>
                <label className="form-label">{t('event_form.slot_desc')}</label>
                <textarea className="input-field" rows="2" value={slot.description} onChange={e => handleSlotChange(index, 'description', e.target.value)} placeholder={t('event_form.slot_desc_placeholder')}></textarea>
              </div>
            </div>

            <div className="mb-md">
              <label className="form-label">{t('event_form.onsite_location')}</label>
              <input type="text" className="input-field" value={slot.location || ''} onChange={e => handleSlotChange(index, 'location', e.target.value)} placeholder={t('event_form.onsite_location_placeholder')} />
            </div>
            
            <div className="grid gap-md mb-sm flex-responsive" style={{ gridTemplateColumns: '1fr 1fr 100px' }}>
              <div>
                <label className="form-label">{t('event_form.start_time')}</label>
                <input type="datetime-local" className="input-field" required value={slot.start_time} onChange={e => handleSlotChange(index, 'start_time', e.target.value)} />
              </div>
              <div>
                <label className="form-label">{t('event_form.end_time')}</label>
                <input type="datetime-local" className="input-field" required value={slot.end_time} onChange={e => handleSlotChange(index, 'end_time', e.target.value)} />
              </div>
              <div>
                <label className="form-label">{t('event_form.capacity')}</label>
                <input type="number" className="input-field" required min="1" value={slot.capacity} onChange={e => handleSlotChange(index, 'capacity', e.target.value)} />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-md mb-md flex-responsive">
              <div>
                <label className="form-label">{t('event_form.buffer_before')}</label>
                <input type="number" className="input-field" min="0" value={slot.buffer_before} onChange={e => handleSlotChange(index, 'buffer_before', parseInt(e.target.value) || 0)} placeholder="e.g. 15" />
              </div>
              <div>
                <label className="form-label">{t('event_form.buffer_after')}</label>
                <input type="number" className="input-field" min="0" value={slot.buffer_after} onChange={e => handleSlotChange(index, 'buffer_after', parseInt(e.target.value) || 0)} placeholder="e.g. 15" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-md mb-sm flex-responsive">
              <div>
                <label className="form-label">{t('event_form.requirements')}</label>
                <input type="text" className="input-field" value={slot.requirements} onChange={e => handleSlotChange(index, 'requirements', e.target.value)} placeholder={t('event_form.requirements_placeholder')} />
              </div>
              <div className="flex items-center" style={{ paddingTop: '1.5rem' }}>
                <label className="form-label flex items-center gap-sm cursor-pointer mb-0">
                  <input type="checkbox" checked={slot.show_buffer} onChange={e => handleSlotChange(index, 'show_buffer', e.target.checked)} />
                  {t('event_form.show_buffer')}
                </label>
              </div>
            </div>
          </div>
        ))}

        <div className="mt-xl text-right">
          <button type="button" onClick={() => navigate('/dashboard')} className="btn mr-md">{t('event_form.cancel')}</button>
          <button type="submit" className="btn btn-primary" disabled={loading}>{loading ? t('event_form.saving') : t('create_event.create_button')}</button>
        </div>
      </form>
    </div>
  );
}

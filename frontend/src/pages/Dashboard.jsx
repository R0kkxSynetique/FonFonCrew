import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Calendar, Plus, Users, ShieldAlert } from 'lucide-react';
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

export default function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    setUser(storedUser);
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const res = await axios.get('/events');
      setEvents(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to fetch events', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center mt-xl">{t('dashboard.loading')}</div>;

  return (
    <div className="page-container">
      <div className="flex justify-between items-center mb-xl">
        <h1 className="page-title" style={{ marginBottom: 0 }}>{t('dashboard.title')}</h1>
        {['ORGANIZER', 'SUPERADMIN'].includes(user?.role) && (
          <Link to="/events/new" className="btn btn-primary">
            <Plus size={18} /> {t('dashboard.create_event')}
          </Link>
        )}
      </div>

      <div className="grid grid-cards">
        {events?.map(event => {
          return (
            <div 
              key={event.id} 
              className="card card-hoverable" 
              onClick={() => navigate(`/events/${event.id}`)}
            >
              <div className="flex justify-between items-start mb-md">
                <h3 className="text-xl font-semibold">{event.name}</h3>
                <span className="badge">
                  {format(new Date(event.start_date), 'MMM d, yyyy')}
                </span>
              </div>
              
              <p className="text-secondary mb-lg text-sm">
                {event.description}
              </p>

              <div className="mt-md pt-md" style={{ borderTop: '1px solid var(--border-color)' }}>
                <h4 className="text-sm text-muted mb-sm">{t('dashboard.available_shifts')} ({event.schedules.length})</h4>
                
                <div className="flex flex-col gap-sm">
                  {event.schedules.length === 0 ? (
                    <span className="text-sm text-secondary">{t('dashboard.no_shifts')}</span>
                  ) : (
                    event.schedules?.map(slot => (
                      <div key={slot.id} className="flex justify-between items-center p-sm" style={{ backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                        <div>
                          <div className="font-bold text-sm">{slot.title}</div>
                          <div className="text-xs font-medium text-secondary">
                            {format(new Date(slot.start_time), 'HH:mm')} - {format(new Date(slot.end_time), 'HH:mm')} {formatDuration(slot.start_time, slot.end_time, t)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {events?.length === 0 && (
          <div className="text-center text-secondary p-xl" style={{ gridColumn: '1 / -1', backgroundColor: 'var(--bg-surface)', borderRadius: 'var(--radius-lg)', border: '1px dashed var(--border-color)' }}>
            <Calendar size={48} className="mx-auto mb-md" style={{ opacity: 0.5, margin: '0 auto' }} />
            <p>{t('dashboard.no_events')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

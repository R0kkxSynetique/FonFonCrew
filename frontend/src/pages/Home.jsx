import { Link } from 'react-router-dom';
import { CalendarDays, Users, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Home() {
  const { t } = useTranslation();
  return (
    <div className="page-container text-center mt-xl">
      <h1 className="text-5xl font-bold mb-md">
        {t('home.title_start')}<span className="text-accent">{t('home.title_accent')}</span>
      </h1>
      <p className="text-secondary text-xl mb-xl" style={{ maxWidth: '600px', margin: '0 auto 3rem auto' }}>
        {t('home.subtitle')}
      </p>

      <div className="flex justify-center gap-md mb-xl flex-responsive">
        <Link to="/register" className="btn btn-primary text-lg p-md">
          {t('home.get_started')}
        </Link>
        <Link to="/login" className="btn text-lg p-md">
          {t('home.login')}
        </Link>
      </div>

      <div className="grid grid-cards text-left">
        <div className="card">
          <CalendarDays size={32} className="text-accent mb-md" />
          <h3 className="text-xl mb-sm">{t('home.feature1_title')}</h3>
          <p className="text-secondary">{t('home.feature1_desc')}</p>
        </div>
        <div className="card">
          <Users size={32} className="text-success mb-md" />
          <h3 className="text-xl mb-sm">{t('home.feature2_title')}</h3>
          <p className="text-secondary">{t('home.feature2_desc')}</p>
        </div>
        <div className="card">
          <ShieldCheck size={32} className="text-danger mb-md" />
          <h3 className="text-xl mb-sm">{t('home.feature3_title')}</h3>
          <p className="text-secondary">{t('home.feature3_desc')}</p>
        </div>
      </div>
    </div>
  );
}

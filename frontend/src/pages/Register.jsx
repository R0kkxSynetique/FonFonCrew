import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

export default function Register() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    firstname: '',
    lastname: '',
    email: '',
    password: '',
    phone: '',
    birthday: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await axios.post('/auth/register', formData);
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || t('register.error_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mt-xl mb-xl">
      <div className="card">
        <h2 className="text-2xl font-bold mb-sm text-center">{t('register.title')}</h2>
        <p className="text-secondary text-center mb-xl">
          {t('register.subtitle')}
        </p>

        {error && (
          <div className="badge-danger p-md mb-lg text-sm w-full">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-md flex-responsive">
            <div className="form-group">
              <label className="form-label">{t('register.firstname')}</label>
              <input type="text" className="input-field" required
                value={formData.firstname} onChange={(e) => setFormData({...formData, firstname: e.target.value})} />
            </div>
            <div className="form-group">
              <label className="form-label">{t('register.lastname')}</label>
              <input type="text" className="input-field" required
                value={formData.lastname} onChange={(e) => setFormData({...formData, lastname: e.target.value})} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">{t('register.email')}</label>
            <input type="email" className="input-field" required
              value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
          </div>

          <div className="form-group">
            <label className="form-label">{t('register.password')}</label>
            <input type="password" className="input-field" required
              value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-md mb-md flex-responsive">
            <div className="form-group mb-sm">
              <label className="form-label">{t('register.phone')}</label>
              <input type="tel" className="input-field"
                value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} />
            </div>
            <div className="form-group mb-sm">
              <label className="form-label">{t('register.birthday')}</label>
              <input type="date" className="input-field"
                value={formData.birthday} onChange={(e) => setFormData({...formData, birthday: e.target.value})} />
            </div>
          </div>

          <button type="submit" className="btn btn-primary w-full p-md" disabled={loading}>
            {loading ? t('register.registering') : t('register.signup')}
          </button>
        </form>

        <p className="text-center mt-lg text-secondary text-sm">
          {t('register.already_have')} <Link to="/login">{t('register.signin_link')}</Link>
        </p>
      </div>
    </div>
  );
}

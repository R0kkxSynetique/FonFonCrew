import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await axios.post('/auth/login', formData);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || t('login.error_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mt-xl">
      <div className="card">
        <h2 className="text-2xl font-bold mb-sm text-center">{t('login.title')}</h2>
        <p className="text-secondary text-center mb-xl">
          {t('login.subtitle')}
        </p>

        {error && (
          <div className="badge-danger p-md mb-lg text-sm w-full">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">{t('login.email_label')}</label>
            <input 
              type="email" 
              className="input-field" 
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              placeholder={t('login.email_placeholder')}
            />
          </div>
          
          <div className="form-group mb-xl">
            <label className="form-label">{t('login.password_label')}</label>
            <input 
              type="password" 
              className="input-field" 
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              placeholder="••••••••"
            />
          </div>

          <button type="submit" className="btn btn-primary w-full p-md" disabled={loading}>
            {loading ? t('login.signing_in') : t('login.sign_in')}
          </button>
        </form>

        <p className="text-center mt-lg text-secondary text-sm">
          {t('login.no_account')} <Link to="/register">{t('login.signup_link')}</Link>
        </p>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';

export default function UserManagement() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ firstname: '', lastname: '', email: '', role: 'VOLUNTEER', password: '' });
  const [generatedPassword, setGeneratedPassword] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/users');
      setUsers(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        navigate('/dashboard'); // unauthorized
      } else {
        setError(err.response?.data?.error || t('user_management.error_fetch'));
      }
    } finally {
      setLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pwd = "";
    for(let i=0; i<12; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    setFormData(prev => ({ ...prev, password: pwd }));
    setGeneratedPassword(pwd);
  };
  
  const copyCredentials = async () => {
    const pwdToCopy = formData.password || (editingUser ? t('user_management.unchanged') : t('user_management.no_password'));
    const text = `Email: ${formData.email}\nPassword: ${pwdToCopy}`;
    try {
      await navigator.clipboard.writeText(text);
      toast.success(t('user_management.success_copy'));
    } catch (err) {
      toast.error(t('user_management.error_copy'));
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await axios.put(`/users/${editingUser.id}`, formData);
        toast.success(t('user_management.success_update'));
      } else {
        await axios.post('/users', formData);
        toast.success(t('user_management.success_create'));
      }
      setShowUserModal(false);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || t('user_management.error_operation'));
    }
  };
  
  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ firstname: '', lastname: '', email: '', role: 'VOLUNTEER', password: '' });
    setGeneratedPassword('');
    setShowUserModal(true);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({ firstname: user.firstname, lastname: user.lastname, email: user.email, role: user.role, password: '' });
    setGeneratedPassword('');
    setShowUserModal(true);
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axios.put(`/users/${userId}/role`, { role: newRole });
      toast.success(t('user_management.success_role'));
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || t('user_management.error_role'));
    }
  };

  const initiateDelete = (userId) => {
    setUserToDelete(userId);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    const userId = userToDelete;
    setShowConfirmModal(false);
    setUserToDelete(null);

    try {
      await axios.delete(`/users/${userId}`);
      toast.success(t('user_management.success_delete'));
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.error || t('user_management.error_delete'));
    }
  };

  if (loading) return <div className="page-container flex justify-center items-center">{t('user_management.loading')}</div>;

  return (
    <div className="page-container p-xl">
      <div className="flex justify-between items-center mb-xl">
        <h1 className="page-title text-primary" style={{ marginBottom: 0 }}>{t('user_management.title')}</h1>
        <div className="flex gap-md">
          <button onClick={openCreateModal} className="btn btn-primary">{t('user_management.add_user')}</button>
          <button onClick={() => navigate('/dashboard')} className="btn">{t('user_management.back')}</button>
        </div>
      </div>

      {error ? (
        <div className="badge-danger p-md mb-md w-full">
          {error}
        </div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('user_management.name')}</th>
                <th>{t('user_management.email')}</th>
                <th>{t('user_management.role')}</th>
                <th style={{ width: '150px' }}>{t('user_management.actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users?.map(u => (
                <tr key={u.id}>
                  <td>{u.firstname} {u.lastname}</td>
                  <td className="text-secondary">{u.email}</td>
                  <td>
                    <select 
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="input-field p-sm"
                    >
                      <option value="VOLUNTEER">VOLUNTEER</option>
                      <option value="ORGANIZER">ORGANIZER</option>
                      <option value="SUPERADMIN">SUPERADMIN</option>
                    </select>
                  </td>
                  <td>
                    <div className="flex gap-sm">
                      <button 
                        onClick={() => openEditModal(u)}
                        className="btn p-sm text-sm"
                      >
                        {t('user_management.edit')}
                      </button>
                      <button 
                        onClick={() => initiateDelete(u.id)}
                        className="btn btn-danger p-sm text-sm"
                      >
                        {t('user_management.delete')}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users?.length === 0 && <p className="p-xl text-center text-secondary">{t('user_management.no_users')}</p>}
        </div>
      )}

      {/* User Create/Edit Modal */}
      {showUserModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="text-xl font-bold mb-lg text-primary">
              {editingUser ? t('user_management.edit_user') : t('user_management.create_user')}
            </h3>
            <form onSubmit={handleUserSubmit} className="flex flex-col gap-md">
              <div className="grid grid-cols-2 gap-md flex-responsive">
                <div>
                  <label className="form-label">{t('user_management.first_name')}</label>
                  <input type="text" className="input-field" value={formData.firstname} onChange={e => setFormData({...formData, firstname: e.target.value})} required />
                </div>
                <div>
                  <label className="form-label">{t('user_management.last_name')}</label>
                  <input type="text" className="input-field" value={formData.lastname} onChange={e => setFormData({...formData, lastname: e.target.value})} required />
                </div>
              </div>
              
              <div>
                <label className="form-label">{t('user_management.email')}</label>
                <input type="email" className="input-field" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
              </div>

              <div>
                <label className="form-label">{t('user_management.role')}</label>
                <select className="input-field" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="VOLUNTEER">VOLUNTEER</option>
                  <option value="ORGANIZER">ORGANIZER</option>
                  <option value="SUPERADMIN">SUPERADMIN</option>
                </select>
              </div>

              <div>
                <label className="form-label">
                  {t('user_management.password')} {editingUser && t('user_management.password_unchanged')}
                </label>
                <div className="flex gap-sm">
                  <input type="text" className="input-field" value={formData.password} onChange={e => {
                    setFormData({...formData, password: e.target.value});
                    setGeneratedPassword('');
                  }} required={!editingUser} style={{ flex: 1 }} />
                  <button type="button" onClick={generatePassword} className="btn" style={{ whiteSpace: 'nowrap' }}>{t('user_management.generate')}</button>
                </div>
              </div>

              <div className="p-md flex justify-between items-center mt-md" style={{ backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div>
                  <div className="text-sm text-secondary">{t('user_management.credentials')}</div>
                  <div className="font-bold">{formData.email || t('user_management.no_email')}</div>
                  <div style={{ fontFamily: 'monospace' }}>{formData.password || (editingUser ? t('user_management.unchanged') : t('user_management.no_password'))}</div>
                </div>
                <button type="button" onClick={copyCredentials} className="btn text-sm">
                  {t('user_management.copy')}
                </button>
              </div>

              <div className="flex justify-end gap-md mt-md">
                <button type="button" className="btn" onClick={() => setShowUserModal(false)}>{t('user_management.cancel')}</button>
                <button type="submit" className="btn btn-primary">{editingUser ? t('user_management.save_changes') : t('user_management.create_user')}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-content-sm text-center">
            <h3 className="text-xl font-bold mb-md text-primary">{t('user_management.confirm_delete_title')}</h3>
            <p className="text-secondary mb-lg">{t('user_management.confirm_delete_desc')}</p>
            <div className="flex justify-end gap-md">
              <button className="btn" onClick={() => setShowConfirmModal(false)}>{t('user_management.cancel')}</button>
              <button className="btn btn-danger" onClick={confirmDelete}>{t('user_management.delete_user')}</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

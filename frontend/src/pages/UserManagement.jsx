import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState(null);
  
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
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const res = await axios.get('http://localhost:3001/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(res.data);
    } catch (err) {
      if (err.response?.status === 403 || err.response?.status === 401) {
        navigate('/dashboard'); // unauthorized
      } else {
        setError(err.response?.data?.error || 'Failed to fetch users');
      }
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (msg, type) => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
    let pwd = "";
    for(let i=0; i<12; i++) pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    setFormData(prev => ({ ...prev, password: pwd }));
    setGeneratedPassword(pwd);
  };
  
  const copyCredentials = async () => {
    const pwdToCopy = formData.password || (editingUser ? '(unchanged)' : 'No password entered');
    const text = `Email: ${formData.email}\nPassword: ${pwdToCopy}`;
    try {
      await navigator.clipboard.writeText(text);
      showNotification('Credentials copied to clipboard!', 'success');
    } catch (err) {
      showNotification('Failed to copy', 'error');
    }
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      if (editingUser) {
        await axios.put(`http://localhost:3001/api/users/${editingUser.id}`, formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showNotification('User updated successfully', 'success');
      } else {
        await axios.post('http://localhost:3001/api/users', formData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showNotification('User created successfully', 'success');
      }
      setShowUserModal(false);
      fetchUsers();
    } catch (err) {
      showNotification(err.response?.data?.error || 'Operation failed', 'error');
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
      const token = localStorage.getItem('token');
      await axios.put(`http://localhost:3001/api/users/${userId}/role`, { role: newRole }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('User role updated successfully', 'success');
      fetchUsers();
    } catch (err) {
      showNotification(err.response?.data?.error || 'Failed to update role', 'error');
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
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:3001/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('User deleted successfully', 'success');
      fetchUsers();
    } catch (err) {
      showNotification(err.response?.data?.error || 'Failed to delete user', 'error');
    }
  };

  if (loading) return <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Loading...</div>;

  return (
    <div className="page-container" style={{ maxWidth: '1000px', margin: '0 auto', padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--text-primary)' }}>User Management</h1>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button onClick={openCreateModal} className="btn btn-primary">Add User</button>
          <button onClick={() => navigate('/dashboard')} className="btn">Back to Dashboard</button>
        </div>
      </div>

      {error ? (
        <div style={{ color: 'var(--danger-color)', marginBottom: '1rem', padding: '1rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)' }}>
          {error}
        </div>
      ) : (
        <div style={{ overflowX: 'auto', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', padding: '1rem', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Name</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Email</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Role</th>
                <th style={{ padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600', width: '150px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '1rem', color: 'var(--text-primary)' }}>{u.firstname} {u.lastname}</td>
                  <td style={{ padding: '1rem', color: 'var(--text-secondary)' }}>{u.email}</td>
                  <td style={{ padding: '1rem' }}>
                    <select 
                      value={u.role}
                      onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      style={{ 
                        padding: '0.5rem', 
                        borderRadius: 'var(--radius-md)', 
                        border: '1px solid var(--border-color)', 
                        backgroundColor: 'var(--bg-primary)', 
                        color: 'var(--text-primary)' 
                      }}
                    >
                      <option value="VOLUNTEER">VOLUNTEER</option>
                      <option value="ORGANIZER">ORGANIZER</option>
                      <option value="SUPERADMIN">SUPERADMIN</option>
                    </select>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button 
                        onClick={() => openEditModal(u)}
                        className="btn"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                      >
                        Edit
                      </button>
                      <button 
                        onClick={() => initiateDelete(u.id)}
                        className="btn btn-danger"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && <p style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>No users found.</p>}
        </div>
      )}

      {/* User Create/Edit Modal */}
      {showUserModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '500px', maxWidth: '90%', padding: '2rem', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>
              {editingUser ? 'Edit User' : 'Create User'}
            </h3>
            <form onSubmit={handleUserSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>First Name</label>
                  <input type="text" className="input-field" value={formData.firstname} onChange={e => setFormData({...formData, firstname: e.target.value})} required />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Last Name</label>
                  <input type="text" className="input-field" value={formData.lastname} onChange={e => setFormData({...formData, lastname: e.target.value})} required />
                </div>
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Email</label>
                <input type="email" className="input-field" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>Role</label>
                <select className="input-field" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="VOLUNTEER">VOLUNTEER</option>
                  <option value="ORGANIZER">ORGANIZER</option>
                  <option value="SUPERADMIN">SUPERADMIN</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-secondary)' }}>
                  Password {editingUser && '(Leave blank to keep unchanged)'}
                </label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input type="text" className="input-field" value={formData.password} onChange={e => {
                    setFormData({...formData, password: e.target.value});
                    setGeneratedPassword('');
                  }} required={!editingUser} style={{ flex: 1 }} />
                  <button type="button" onClick={generatePassword} className="btn" style={{ whiteSpace: 'nowrap' }}>Generate</button>
                </div>
              </div>

              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid var(--border-color)' }}>
                <div>
                  <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Credentials:</div>
                  <div style={{ fontWeight: 'bold' }}>{formData.email || 'No email entered'}</div>
                  <div style={{ fontFamily: 'monospace' }}>{formData.password || (editingUser ? '(unchanged)' : 'No password entered')}</div>
                </div>
                <button type="button" onClick={copyCredentials} className="btn" style={{ fontSize: '0.875rem' }}>
                  Copy
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" className="btn" onClick={() => setShowUserModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingUser ? 'Save Changes' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '400px', maxWidth: '90%', padding: '2rem' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem', color: 'var(--text-primary)' }}>Confirm User Deletion</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>Are you sure you want to permanently delete this user? This action cannot be undone.</p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button className="btn" onClick={() => setShowConfirmModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Delete User</button>
            </div>
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div style={{ 
          position: 'fixed', bottom: '2rem', right: '2rem', padding: '1rem 1.5rem', 
          backgroundColor: notification.type === 'success' ? 'var(--success-color)' : 'var(--danger-color)', 
          color: 'white', borderRadius: 'var(--radius-md)', fontWeight: 'bold', zIndex: 1100, 
          boxShadow: 'var(--shadow-lg)', animation: 'fadeIn 0.3s ease-out'
        }}>
          {notification.msg}
        </div>
      )}
    </div>
  );
}

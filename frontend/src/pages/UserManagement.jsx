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
      const res = await axios.get('/users');
      setUsers(Array.isArray(res.data) ? res.data : []);
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
      if (editingUser) {
        await axios.put(`/users/${editingUser.id}`, formData);
        showNotification('User updated successfully', 'success');
      } else {
        await axios.post('/users', formData);
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
      await axios.put(`/users/${userId}/role`, { role: newRole });
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
      await axios.delete(`/users/${userId}`);
      showNotification('User deleted successfully', 'success');
      fetchUsers();
    } catch (err) {
      showNotification(err.response?.data?.error || 'Failed to delete user', 'error');
    }
  };

  if (loading) return <div className="page-container flex justify-center items-center">Loading...</div>;

  return (
    <div className="page-container p-xl">
      <div className="flex justify-between items-center mb-xl">
        <h1 className="page-title text-primary" style={{ marginBottom: 0 }}>User Management</h1>
        <div className="flex gap-md">
          <button onClick={openCreateModal} className="btn btn-primary">Add User</button>
          <button onClick={() => navigate('/dashboard')} className="btn">Back to Dashboard</button>
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
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th style={{ width: '150px' }}>Actions</th>
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
                        Edit
                      </button>
                      <button 
                        onClick={() => initiateDelete(u.id)}
                        className="btn btn-danger p-sm text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users?.length === 0 && <p className="p-xl text-center text-secondary">No users found.</p>}
        </div>
      )}

      {/* User Create/Edit Modal */}
      {showUserModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3 className="text-xl font-bold mb-lg text-primary">
              {editingUser ? 'Edit User' : 'Create User'}
            </h3>
            <form onSubmit={handleUserSubmit} className="flex flex-col gap-md">
              <div className="grid grid-cols-2 gap-md flex-responsive">
                <div>
                  <label className="form-label">First Name</label>
                  <input type="text" className="input-field" value={formData.firstname} onChange={e => setFormData({...formData, firstname: e.target.value})} required />
                </div>
                <div>
                  <label className="form-label">Last Name</label>
                  <input type="text" className="input-field" value={formData.lastname} onChange={e => setFormData({...formData, lastname: e.target.value})} required />
                </div>
              </div>
              
              <div>
                <label className="form-label">Email</label>
                <input type="email" className="input-field" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
              </div>

              <div>
                <label className="form-label">Role</label>
                <select className="input-field" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}>
                  <option value="VOLUNTEER">VOLUNTEER</option>
                  <option value="ORGANIZER">ORGANIZER</option>
                  <option value="SUPERADMIN">SUPERADMIN</option>
                </select>
              </div>

              <div>
                <label className="form-label">
                  Password {editingUser && '(Leave blank to keep unchanged)'}
                </label>
                <div className="flex gap-sm">
                  <input type="text" className="input-field" value={formData.password} onChange={e => {
                    setFormData({...formData, password: e.target.value});
                    setGeneratedPassword('');
                  }} required={!editingUser} style={{ flex: 1 }} />
                  <button type="button" onClick={generatePassword} className="btn" style={{ whiteSpace: 'nowrap' }}>Generate</button>
                </div>
              </div>

              <div className="p-md flex justify-between items-center mt-md" style={{ backgroundColor: 'var(--bg-color)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                <div>
                  <div className="text-sm text-secondary">Credentials:</div>
                  <div className="font-bold">{formData.email || 'No email entered'}</div>
                  <div style={{ fontFamily: 'monospace' }}>{formData.password || (editingUser ? '(unchanged)' : 'No password entered')}</div>
                </div>
                <button type="button" onClick={copyCredentials} className="btn text-sm">
                  Copy
                </button>
              </div>

              <div className="flex justify-end gap-md mt-md">
                <button type="button" className="btn" onClick={() => setShowUserModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingUser ? 'Save Changes' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="modal-overlay">
          <div className="modal-content modal-content-sm text-center">
            <h3 className="text-xl font-bold mb-md text-primary">Confirm User Deletion</h3>
            <p className="text-secondary mb-lg">Are you sure you want to permanently delete this user? This action cannot be undone.</p>
            <div className="flex justify-end gap-md">
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

import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';

// Layout & Pages
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CreateEvent from './pages/CreateEvent';
import ManageEvent from './pages/ManageEvent';
import EventDetails from './pages/EventDetails';
import UserManagement from './pages/UserManagement';

// Auth Guards
import ProtectedRoute from './components/auth/ProtectedRoute';
import PublicRoute from './components/auth/PublicRoute';

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            {/* Public Routes - Landing page redirects if logged in */}
            <Route element={<PublicRoute />}>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Public View Routes - Always accessible */}
            <Route path="/events/:eventId" element={<EventDetails />} />

            {/* Private Routes - Require Authentication */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard/*" element={<Dashboard />} />
            </Route>

            {/* Organizer/Admin Routes */}
            <Route element={<ProtectedRoute allowedRoles={['ORGANIZER']} />}>
              <Route path="/events/new" element={<CreateEvent />} />
              <Route path="/events/:eventId/edit" element={<ManageEvent />} />
            </Route>

            {/* SuperAdmin Only Routes */}
            <Route element={<ProtectedRoute allowedRoles={[]} />}> 
              {/* Note: ProtectedRoute inherently allows SUPERADMIN if allowedRoles is empty or restricted */}
              <Route path="/users" element={<UserManagement />} />
            </Route>
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

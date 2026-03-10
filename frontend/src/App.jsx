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

function App() {
  return (
    <Router>
      <div className="app-container">
        <Navbar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard/*" element={<Dashboard />} />
            <Route path="/create-event" element={<CreateEvent />} />
            <Route path="/manage-event/:eventId" element={<ManageEvent />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;

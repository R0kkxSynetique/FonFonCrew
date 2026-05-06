import { Link } from 'react-router-dom';
import { CalendarDays, Users, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <div className="page-container text-center mt-xl">
      <h1 className="text-5xl font-bold mb-md">
        Manage Volunteers with <span className="text-accent">Ease</span>
      </h1>
      <p className="text-secondary text-xl mb-xl" style={{ maxWidth: '600px', margin: '0 auto 3rem auto' }}>
        The official platform for FonFonCrew aero RC models events. Sign up to help, or organize your own schedules.
      </p>

      <div className="flex justify-center gap-md mb-xl flex-responsive">
        <Link to="/register" className="btn btn-primary text-lg p-md">
          Get Started
        </Link>
        <Link to="/login" className="btn text-lg p-md">
          Login to Account
        </Link>
      </div>

      <div className="grid grid-cards text-left">
        <div className="card">
          <CalendarDays size={32} className="text-accent mb-md" />
          <h3 className="text-xl mb-sm">Organize Events</h3>
          <p className="text-secondary">Create events, set requirements, and manage time slots for your volunteers effortlessly.</p>
        </div>
        <div className="card">
          <Users size={32} className="text-success mb-md" />
          <h3 className="text-xl mb-sm">Volunteer Seamlessly</h3>
          <p className="text-secondary">Browse events, find suitable time slots, and register yourself with just a few clicks.</p>
        </div>
        <div className="card">
          <ShieldCheck size={32} className="text-danger mb-md" />
          <h3 className="text-xl mb-sm">Admin Control</h3>
          <p className="text-secondary">Full oversight over the platform, accounts, and events for maximum security and peace of mind.</p>
        </div>
      </div>
    </div>
  );
}

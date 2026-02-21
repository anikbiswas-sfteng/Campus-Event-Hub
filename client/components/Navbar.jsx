import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navLinkClass = ({ isActive }) =>
  `text-sm font-medium px-3 py-2 rounded-lg transition ${
    isActive ? 'bg-brand-100 text-brand-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
  }`;

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-20 border-b border-slate-200/70 glass-panel">
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex flex-wrap items-center justify-between gap-3">
        <Link to="/dashboard" className="text-lg sm:text-xl font-bold text-brand-700 tracking-tight">
          Campus Event Hub
        </Link>

        {user ? (
          <>
            <div className="flex flex-wrap items-center gap-1">
              <NavLink to="/dashboard" className={navLinkClass}>
                Dashboard
              </NavLink>
              {user.role === 'student' && (
                <NavLink to="/my-events" className={navLinkClass}>
                  My Events
                </NavLink>
              )}
              {user.role === 'organizer' && (
                <>
                  <NavLink to="/create-event" className={navLinkClass}>
                    Create Event
                  </NavLink>
                  <NavLink to="/scanner" className={navLinkClass}>
                    QR Scanner
                  </NavLink>
                </>
              )}
            </div>

            <div className="flex items-center gap-3 ml-auto sm:ml-0">
              <div className="hidden sm:flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5">
                <span className="h-8 w-8 rounded-full bg-brand-600 text-white text-xs font-semibold grid place-items-center">
                  {String(user.name || 'U')
                    .split(' ')
                    .map((part) => part[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
                <p className="text-xs text-slate-700">
                  {user.name} <span className="text-slate-500">({user.role})</span>
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-700"
              >
                Logout
              </button>
            </div>
          </>
        ) : (
          <div className="flex gap-2">
            <Link to="/login" className="px-3 py-2 text-sm rounded-lg bg-brand-600 text-white">
              Login
            </Link>
            <Link to="/register" className="px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white">
              Register
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

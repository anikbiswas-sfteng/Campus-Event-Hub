import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import EventCard from '../components/EventCard';

const savedKeyForUser = (userId) => `saved-events:${userId || 'guest'}`;

const parseEventDateTime = (event) => new Date(`${event.date}T${event.time || '00:00'}:00`);

const Dashboard = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [seatFilter, setSeatFilter] = useState('all');
  const [sortBy, setSortBy] = useState('dateAsc');
  const [viewMode, setViewMode] = useState('grid');
  const [showSavedOnly, setShowSavedOnly] = useState(false);
  const [myEventsOnly, setMyEventsOnly] = useState(false);
  const [savedEventIds, setSavedEventIds] = useState([]);

  useEffect(() => {
    const savedRaw = localStorage.getItem(savedKeyForUser(user?.id));
    if (savedRaw) {
      try {
        setSavedEventIds(JSON.parse(savedRaw));
      } catch {
        setSavedEventIds([]);
      }
    } else {
      setSavedEventIds([]);
    }
  }, [user?.id]);

  const persistSavedIds = (updater) => {
    setSavedEventIds((current) => {
      const next = updater(current);
      localStorage.setItem(savedKeyForUser(user?.id), JSON.stringify(next));
      return next;
    });
  };

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/events');
      setEvents(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const register = async (eventId) => {
    try {
      await api.post(`/registrations/events/${eventId}/register`);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Registration failed');
    }
  };

  const deleteEvent = async (eventId) => {
    const ok = window.confirm('Delete this event?');
    if (!ok) return;

    try {
      await api.delete(`/events/${eventId}`);
      fetchEvents();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const filteredEvents = useMemo(() => {
    const now = new Date();
    let result = [...events];

    if (user?.role === 'organizer' && myEventsOnly) {
      result = result.filter((event) => event.createdBy?._id === user.id);
    }

    if (statusFilter !== 'all') {
      result = result.filter((event) => {
        const eventDate = parseEventDateTime(event);
        if (statusFilter === 'upcoming') return eventDate > now;
        if (statusFilter === 'today') return eventDate.toDateString() === now.toDateString();
        if (statusFilter === 'completed') return eventDate < now;
        return true;
      });
    }

    if (seatFilter !== 'all') {
      result = result.filter((event) => {
        const ratio = (Number(event.registeredCount || 0) / Number(event.maxParticipants || 1)) * 100;
        if (seatFilter === 'nearlyFull') return ratio >= 80;
        if (seatFilter === 'available') return ratio < 80;
        return true;
      });
    }

    if (search.trim()) {
      const query = search.toLowerCase();
      result = result.filter((event) =>
        [event.title, event.description, event.venue, event.createdBy?.name]
          .filter(Boolean)
          .join(' ')
          .toLowerCase()
          .includes(query)
      );
    }

    if (user?.role === 'student' && showSavedOnly) {
      result = result.filter((event) => savedEventIds.includes(event._id));
    }

    result.sort((a, b) => {
      if (sortBy === 'dateAsc') return parseEventDateTime(a) - parseEventDateTime(b);
      if (sortBy === 'dateDesc') return parseEventDateTime(b) - parseEventDateTime(a);
      if (sortBy === 'popular') return Number(b.registeredCount || 0) - Number(a.registeredCount || 0);
      return a.title.localeCompare(b.title);
    });

    return result;
  }, [events, search, statusFilter, seatFilter, sortBy, user?.role, user?.id, myEventsOnly, showSavedOnly, savedEventIds]);

  const stats = useMemo(() => {
    const now = new Date();
    const upcoming = events.filter((event) => parseEventDateTime(event) >= now);

    if (user?.role === 'organizer') {
      const myEvents = events.filter((event) => event.createdBy?._id === user.id);
      const totalSeats = myEvents.reduce((acc, event) => acc + Number(event.maxParticipants || 0), 0);
      const totalRegistrations = myEvents.reduce((acc, event) => acc + Number(event.registeredCount || 0), 0);

      return {
        card1: { label: 'My Events', value: myEvents.length },
        card2: { label: 'Total Registrations', value: totalRegistrations },
        card3: {
          label: 'Avg Occupancy',
          value: totalSeats ? `${Math.round((totalRegistrations / totalSeats) * 100)}%` : '0%'
        },
        card4: {
          label: 'Upcoming (All)',
          value: upcoming.length
        }
      };
    }

    const registered = events.filter((event) => event.isRegistered);

    return {
      card1: { label: 'Upcoming Events', value: upcoming.length },
      card2: { label: 'Registered', value: registered.length },
      card3: { label: 'Saved', value: savedEventIds.length },
      card4: {
        label: 'Open Seats',
        value: events.filter((event) => Number(event.registeredCount || 0) < Number(event.maxParticipants || 1)).length
      }
    };
  }, [events, user?.role, user?.id, savedEventIds]);

  const topUpcoming = useMemo(() => {
    const now = new Date();
    return [...events]
      .filter((event) => parseEventDateTime(event) >= now)
      .sort((a, b) => parseEventDateTime(a) - parseEventDateTime(b))
      .slice(0, 3);
  }, [events]);

  const toggleSaveEvent = (eventId) => {
    persistSavedIds((current) =>
      current.includes(eventId) ? current.filter((id) => id !== eventId) : [...current, eventId]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6">
      <section className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-brand-700 via-brand-600 to-cyan-600 text-white shadow-lg fade-in">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-brand-100 text-sm">Welcome back</p>
            <h1 className="text-3xl sm:text-4xl font-bold mt-1">{user?.name}</h1>
            <p className="mt-2 text-brand-100 max-w-2xl text-sm sm:text-base">
              {user?.role === 'organizer'
                ? 'Track engagement, manage events, and operate attendance with real-time visibility.'
                : 'Discover new campus activities, save favorites, and manage your personal participation journey.'}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button onClick={fetchEvents} className="px-4 py-2 rounded-lg bg-white text-brand-700 text-sm font-semibold">
              Refresh
            </button>
            {user?.role === 'organizer' ? (
              <>
                <Link to="/create-event" className="px-4 py-2 rounded-lg bg-slate-900/80 text-white text-sm">Create Event</Link>
                <Link to="/scanner" className="px-4 py-2 rounded-lg bg-white/20 text-white text-sm border border-white/30">Open Scanner</Link>
              </>
            ) : (
              <Link to="/my-events" className="px-4 py-2 rounded-lg bg-slate-900/80 text-white text-sm">My Registrations</Link>
            )}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 fade-in">
        {[stats.card1, stats.card2, stats.card3, stats.card4].map((stat) => (
          <article key={stat.label} className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm">
            <p className="text-xs sm:text-sm text-slate-500">{stat.label}</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
          </article>
        ))}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 sm:p-5 space-y-4 fade-in">
        <div className="grid md:grid-cols-4 gap-3">
          <input
            className="rounded-lg border border-slate-300 p-2.5 text-sm"
            placeholder="Search title, venue, organizer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <select className="rounded-lg border border-slate-300 p-2.5 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All Statuses</option>
            <option value="upcoming">Upcoming</option>
            <option value="today">Today</option>
            <option value="completed">Completed</option>
          </select>

          <select className="rounded-lg border border-slate-300 p-2.5 text-sm" value={seatFilter} onChange={(e) => setSeatFilter(e.target.value)}>
            <option value="all">All Seat Levels</option>
            <option value="available">Comfortably Available</option>
            <option value="nearlyFull">Nearly Full</option>
          </select>

          <select className="rounded-lg border border-slate-300 p-2.5 text-sm" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="dateAsc">Date: Earliest</option>
            <option value="dateDesc">Date: Latest</option>
            <option value="popular">Most Popular</option>
            <option value="title">Title A-Z</option>
          </select>
        </div>

        <div className="flex flex-wrap justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {user?.role === 'student' && (
              <button
                onClick={() => setShowSavedOnly((prev) => !prev)}
                className={`px-3 py-2 rounded-lg text-sm border ${
                  showSavedOnly ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-300 bg-white text-slate-700'
                }`}
              >
                {showSavedOnly ? 'Showing Saved Only' : 'Show Saved'}
              </button>
            )}

            {user?.role === 'organizer' && (
              <button
                onClick={() => setMyEventsOnly((prev) => !prev)}
                className={`px-3 py-2 rounded-lg text-sm border ${
                  myEventsOnly ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-300 bg-white text-slate-700'
                }`}
              >
                {myEventsOnly ? 'Showing My Events' : 'My Events Only'}
              </button>
            )}
          </div>

          <div className="flex rounded-lg border border-slate-300 overflow-hidden text-sm">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 ${viewMode === 'grid' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 ${viewMode === 'list' ? 'bg-slate-900 text-white' : 'bg-white text-slate-700'}`}
            >
              List
            </button>
          </div>
        </div>
      </section>

      {!!topUpcoming.length && (
        <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 sm:p-5 fade-in">
          <h2 className="text-lg font-semibold mb-3">Upcoming Highlights</h2>
          <div className="grid md:grid-cols-3 gap-3">
            {topUpcoming.map((event) => (
              <div key={event._id} className="rounded-xl bg-slate-50 border border-slate-200 p-3">
                <p className="font-semibold text-slate-900 line-clamp-1">{event.title}</p>
                <p className="text-xs text-slate-500 mt-1">{event.date} at {event.time}</p>
                <p className="text-sm text-slate-600 mt-1 line-clamp-2">{event.description}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-8 text-slate-500">Loading events...</div>
      ) : filteredEvents.length ? (
        <section className={viewMode === 'grid' ? 'grid lg:grid-cols-2 gap-4' : 'space-y-4'}>
          {filteredEvents.map((event) => (
            <EventCard
              key={event._id}
              event={event}
              role={user?.role}
              onRegister={register}
              onDelete={deleteEvent}
              onToggleSave={toggleSaveEvent}
              isSaved={savedEventIds.includes(event._id)}
              compact={viewMode === 'list'}
            />
          ))}
        </section>
      ) : (
        <section className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center fade-in">
          <h3 className="text-lg font-semibold text-slate-900">No matching events found</h3>
          <p className="text-sm text-slate-500 mt-2">Try adjusting filters, search, or refresh to load the latest events.</p>
        </section>
      )}
    </div>
  );
};

export default Dashboard;

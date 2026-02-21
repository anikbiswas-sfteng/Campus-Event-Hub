import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';

const parseDateTime = (event) => new Date(`${event?.date}T${event?.time || '00:00'}:00`);

const MyEvents = () => {
  const [registrations, setRegistrations] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data } = await api.get('/registrations/my');
        setRegistrations(data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch my events');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filtered = useMemo(() => {
    const now = new Date();
    return registrations.filter((reg) => {
      const event = reg.eventId;
      const eventDate = parseDateTime(event);

      if (filter === 'attended' && !reg.attendance) return false;
      if (filter === 'pending' && reg.attendance) return false;
      if (filter === 'upcoming' && eventDate < now) return false;
      if (filter === 'past' && eventDate >= now) return false;

      if (search.trim()) {
        const query = search.toLowerCase();
        const text = `${event?.title || ''} ${event?.venue || ''} ${event?.description || ''}`.toLowerCase();
        if (!text.includes(query)) return false;
      }

      return true;
    });
  }, [registrations, filter, search]);

  const stats = useMemo(() => {
    const now = new Date();
    return {
      total: registrations.length,
      attended: registrations.filter((reg) => reg.attendance).length,
      pending: registrations.filter((reg) => !reg.attendance).length,
      upcoming: registrations.filter((reg) => parseDateTime(reg.eventId) >= now).length
    };
  }, [registrations]);

  const downloadQr = (registration, fallbackName) => {
    const link = document.createElement('a');
    link.href = registration.qrCode;
    link.download = `${fallbackName || 'event'}_qr.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6">
      <section className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 text-white shadow-lg fade-in">
        <h1 className="text-3xl sm:text-4xl font-bold">My Event Portfolio</h1>
        <p className="mt-2 text-cyan-100">Track attendance, manage QR access, and keep your campus schedule in one place.</p>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 fade-in">
        <article className="rounded-2xl border border-slate-200 bg-white/90 p-4"><p className="text-sm text-slate-500">Total Registrations</p><p className="text-3xl font-bold">{stats.total}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white/90 p-4"><p className="text-sm text-slate-500">Upcoming</p><p className="text-3xl font-bold">{stats.upcoming}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white/90 p-4"><p className="text-sm text-slate-500">Attended</p><p className="text-3xl font-bold">{stats.attended}</p></article>
        <article className="rounded-2xl border border-slate-200 bg-white/90 p-4"><p className="text-sm text-slate-500">Pending</p><p className="text-3xl font-bold">{stats.pending}</p></article>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 fade-in">
        <div className="grid md:grid-cols-2 gap-3">
          <input
            className="rounded-lg border border-slate-300 p-2.5 text-sm"
            placeholder="Search your events"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select className="rounded-lg border border-slate-300 p-2.5 text-sm" value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
            <option value="attended">Attended</option>
            <option value="pending">Pending Attendance</option>
          </select>
        </div>
      </section>

      {error && <p className="text-red-600">{error}</p>}

      {loading ? (
        <div className="rounded-2xl border border-slate-200 bg-white/90 p-8 text-slate-500">Loading your registrations...</div>
      ) : filtered.length ? (
        <div className="grid lg:grid-cols-2 gap-4">
          {filtered.map((reg) => (
            <article key={reg._id} className="bg-white/90 border border-slate-200 rounded-2xl p-5 shadow-sm fade-in">
              <div className="flex justify-between items-start gap-2">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">{reg.eventId?.title}</h2>
                  <p className="text-sm text-slate-500 mt-1">{reg.eventId?.date} at {reg.eventId?.time} · {reg.eventId?.venue}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${reg.attendance ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {reg.attendance ? 'Attended' : 'Pending'}
                </span>
              </div>

              <p className="text-sm text-slate-600 mt-3 line-clamp-2">{reg.eventId?.description}</p>

              <div className="mt-4 p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-start gap-4">
                <img src={reg.qrCode} alt="Registration QR" className="w-36 h-36 border rounded-lg bg-white" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-slate-800">Entry QR</p>
                  <p className="text-xs text-slate-500 max-w-xs">Show this code at the event desk or download it for offline access.</p>
                  <button
                    onClick={() => downloadQr(reg, reg.eventId?.title)}
                    className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm"
                  >
                    Download QR
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white/70 p-8 text-center">
          <p className="text-lg font-semibold text-slate-800">No matching registrations</p>
          <p className="text-sm text-slate-500 mt-1">Try another filter or register for events from Dashboard.</p>
        </div>
      )}
    </div>
  );
};

export default MyEvents;

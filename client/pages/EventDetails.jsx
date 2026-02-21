import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const EventDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  const fetchEvent = async () => {
    try {
      const { data } = await api.get(`/events/${id}`);
      setEvent(data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load event');
    }
  };

  const fetchRegs = async () => {
    if (user?.role !== 'organizer') return;
    try {
      const { data } = await api.get(`/registrations/events/${id}`);
      setRegistrations(data);
    } catch {
      setRegistrations([]);
    }
  };

  useEffect(() => {
    fetchEvent();
    fetchRegs();
  }, [id]);

  const exportCsv = async () => {
    try {
      const response = await api.get(`/registrations/events/${id}/export-csv`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${event.title}_registrations.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert(err.response?.data?.message || 'CSV export failed');
    }
  };

  const filteredRegistrations = useMemo(() => {
    if (!search.trim()) return registrations;
    const query = search.toLowerCase();
    return registrations.filter((reg) => {
      const text = `${reg.userId?.name || ''} ${reg.userId?.email || ''} ${reg.userId?.studentId || ''}`.toLowerCase();
      return text.includes(query);
    });
  }, [registrations, search]);

  const attendanceStats = useMemo(() => {
    const total = registrations.length;
    const present = registrations.filter((reg) => reg.attendance).length;
    return {
      total,
      present,
      absent: Math.max(total - present, 0)
    };
  }, [registrations]);

  if (error) return <div className="max-w-5xl mx-auto p-6 text-red-600">{error}</div>;
  if (!event) return <div className="max-w-5xl mx-auto p-6">Loading...</div>;

  const seatRatio = Math.min(100, Math.round((Number(event.registeredCount || 0) / Number(event.maxParticipants || 1)) * 100));

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6">
      <section className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-slate-900 via-slate-800 to-brand-700 text-white shadow-lg fade-in">
        <h1 className="text-3xl sm:text-4xl font-bold">{event.title}</h1>
        <p className="mt-3 text-slate-200 max-w-3xl">{event.description}</p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-5 text-sm">
          <div className="rounded-xl bg-white/10 p-3"><p className="text-slate-300">Date</p><p className="font-semibold text-white">{event.date}</p></div>
          <div className="rounded-xl bg-white/10 p-3"><p className="text-slate-300">Time</p><p className="font-semibold text-white">{event.time}</p></div>
          <div className="rounded-xl bg-white/10 p-3"><p className="text-slate-300">Venue</p><p className="font-semibold text-white">{event.venue}</p></div>
          <div className="rounded-xl bg-white/10 p-3"><p className="text-slate-300">Seats</p><p className="font-semibold text-white">{event.registeredCount}/{event.maxParticipants}</p></div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-300 mb-1">
            <span>Occupancy</span>
            <span>{seatRatio}%</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-cyan-300" style={{ width: `${seatRatio}%` }} />
          </div>
        </div>
      </section>

      {user?.role === 'organizer' && (
        <section className="space-y-4 fade-in">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <article className="rounded-2xl border border-slate-200 bg-white/90 p-4"><p className="text-sm text-slate-500">Total Registered</p><p className="text-3xl font-bold">{attendanceStats.total}</p></article>
            <article className="rounded-2xl border border-slate-200 bg-white/90 p-4"><p className="text-sm text-slate-500">Present</p><p className="text-3xl font-bold">{attendanceStats.present}</p></article>
            <article className="rounded-2xl border border-slate-200 bg-white/90 p-4"><p className="text-sm text-slate-500">Not Marked</p><p className="text-3xl font-bold">{attendanceStats.absent}</p></article>
            <article className="rounded-2xl border border-slate-200 bg-white/90 p-4"><p className="text-sm text-slate-500">Attendance Rate</p><p className="text-3xl font-bold">{attendanceStats.total ? `${Math.round((attendanceStats.present / attendanceStats.total) * 100)}%` : '0%'}</p></article>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white/90 p-5">
            <div className="flex flex-wrap justify-between gap-3 mb-4">
              <h2 className="text-xl font-semibold">Registrations</h2>
              <div className="flex flex-wrap gap-2">
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="rounded-lg border border-slate-300 p-2 text-sm"
                  placeholder="Search name, email, ID"
                />
                <button onClick={exportCsv} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm">Export CSV</button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-slate-200 rounded-lg overflow-hidden">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-3 border border-slate-200 text-left">Name</th>
                    <th className="p-3 border border-slate-200 text-left">Email</th>
                    <th className="p-3 border border-slate-200 text-left">Student ID</th>
                    <th className="p-3 border border-slate-200 text-left">Attendance</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRegistrations.map((reg) => (
                    <tr key={reg._id} className="odd:bg-white even:bg-slate-50/50">
                      <td className="p-3 border border-slate-200">{reg.userId?.name}</td>
                      <td className="p-3 border border-slate-200">{reg.userId?.email}</td>
                      <td className="p-3 border border-slate-200">{reg.userId?.studentId}</td>
                      <td className="p-3 border border-slate-200">
                        <span className={`text-xs px-2 py-1 rounded-full ${reg.attendance ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {reg.attendance ? 'Present' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!filteredRegistrations.length && (
                    <tr>
                      <td colSpan={4} className="p-4 border border-slate-200 text-center text-slate-500">No registrations found</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default EventDetails;

import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';

const initialForm = {
  title: '',
  description: '',
  date: '',
  time: '',
  venue: '',
  maxParticipants: 1
};

const CreateEvent = () => {
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const navigate = useNavigate();

  useEffect(() => {
    const load = async () => {
      if (!editId) return;
      try {
        const { data } = await api.get(`/events/${editId}`);
        setForm({
          title: data.title,
          description: data.description,
          date: data.date,
          time: data.time,
          venue: data.venue,
          maxParticipants: data.maxParticipants
        });
      } catch {
        setError('Failed to load event data');
      }
    };
    load();
  }, [editId]);

  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      if (editId) await api.put(`/events/${editId}`, form);
      else await api.post('/events', form);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  const capacityHint = useMemo(() => {
    const value = Number(form.maxParticipants || 0);
    if (value < 30) return 'Small workshop style event';
    if (value < 100) return 'Medium sized audience';
    return 'Large scale event';
  }, [form.maxParticipants]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:px-6 sm:py-8">
      <div className="grid lg:grid-cols-5 gap-6">
        <section className="lg:col-span-3 rounded-3xl border border-slate-200 bg-white/90 p-6 sm:p-7 shadow-sm fade-in">
          <h1 className="text-3xl font-bold">{editId ? 'Edit Event' : 'Create Event'}</h1>
          <p className="text-sm text-slate-500 mt-1">Design an experience students will actually want to attend.</p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            {error && <p className="text-sm text-red-600">{error}</p>}

            <div>
              <label className="text-sm font-medium text-slate-700">Event Title</label>
              <input className="mt-1 w-full border border-slate-300 rounded-lg p-2.5" placeholder="AI Hack Night" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Description</label>
              <textarea className="mt-1 w-full border border-slate-300 rounded-lg p-2.5" rows={4} placeholder="Share what students will gain from this event" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
            </div>

            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium text-slate-700">Date</label>
                <input className="mt-1 w-full border border-slate-300 rounded-lg p-2.5" type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Time</label>
                <input className="mt-1 w-full border border-slate-300 rounded-lg p-2.5" type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} required />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Venue</label>
              <input className="mt-1 w-full border border-slate-300 rounded-lg p-2.5" placeholder="Main Auditorium" value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} required />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700">Max Participants</label>
              <input className="mt-1 w-full border border-slate-300 rounded-lg p-2.5" type="number" min={1} value={form.maxParticipants} onChange={(e) => setForm({ ...form, maxParticipants: Number(e.target.value) })} required />
              <p className="text-xs text-slate-500 mt-1">{capacityHint}</p>
            </div>

            <button disabled={loading} className="px-4 py-2.5 rounded-lg bg-brand-600 text-white disabled:bg-slate-400 font-medium">
              {loading ? 'Saving...' : editId ? 'Update Event' : 'Create Event'}
            </button>
          </form>
        </section>

        <aside className="lg:col-span-2 rounded-3xl border border-slate-200 bg-slate-900 text-white p-6 sm:p-7 shadow-sm fade-in">
          <p className="text-xs uppercase tracking-wide text-cyan-200">Live Preview</p>
          <h2 className="text-2xl font-bold mt-2">{form.title || 'Your Event Title'}</h2>
          <p className="text-sm text-slate-300 mt-3 leading-relaxed">{form.description || 'Your event description will appear here as students browse events.'}</p>

          <div className="mt-5 space-y-2 text-sm">
            <p><span className="text-slate-400">Date:</span> {form.date || 'YYYY-MM-DD'}</p>
            <p><span className="text-slate-400">Time:</span> {form.time || '--:--'}</p>
            <p><span className="text-slate-400">Venue:</span> {form.venue || 'Campus venue'}</p>
            <p><span className="text-slate-400">Capacity:</span> {form.maxParticipants || 1} seats</p>
          </div>

          <div className="mt-6 rounded-xl border border-white/20 bg-white/5 p-4 text-xs text-slate-300">
            Tip: Strong event titles + concise outcomes increase student registration rates.
          </div>
        </aside>
      </div>
    </div>
  );
};

export default CreateEvent;

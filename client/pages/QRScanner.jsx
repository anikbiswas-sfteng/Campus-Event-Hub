import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const QRScanner = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);

  const scannerId = useMemo(() => 'qr-reader', []);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await api.get('/events');
      const myEvents = data.filter((event) => event.createdBy?._id === user?.id);
      setEvents(myEvents);
      if (myEvents[0]) setSelectedEvent(myEvents[0]._id);
    };

    fetchEvents();
  }, [user?.id]);

  useEffect(() => {
    if (!selectedEvent) return;

    const scanner = new Html5QrcodeScanner(scannerId, {
      fps: 10,
      qrbox: { width: 250, height: 250 }
    });

    const onScanSuccess = async (decodedText) => {
      try {
        const { data } = await api.post('/registrations/attendance/scan', {
          qrToken: decodedText,
          eventId: selectedEvent
        });

        const text = `${data.message} (${data.registration.userId.name})`;
        setMessage(text);
        setHistory((current) => [
          {
            id: `${Date.now()}-${Math.random()}`,
            name: data.registration.userId.name,
            studentId: data.registration.userId.studentId,
            status: data.registration.attendance ? 'Present' : 'Marked',
            at: new Date().toLocaleTimeString()
          },
          ...current
        ].slice(0, 12));
      } catch (error) {
        setMessage(error.response?.data?.message || 'Attendance marking failed');
      }
    };

    scanner.render(onScanSuccess, () => {});

    return () => {
      scanner.clear().catch(() => {});
    };
  }, [selectedEvent, scannerId]);

  const selectedEventLabel = events.find((event) => event._id === selectedEvent)?.title;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-6">
      <section className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-indigo-600 via-sky-600 to-cyan-600 text-white shadow-lg fade-in">
        <h1 className="text-3xl sm:text-4xl font-bold">QR Attendance Scanner</h1>
        <p className="mt-2 text-sky-100">Run check-ins in real time and keep a quick scan trail for your event desk.</p>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 fade-in">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div>
            <label className="text-sm text-slate-500">Select Event</label>
            <select
              value={selectedEvent}
              onChange={(e) => setSelectedEvent(e.target.value)}
              className="border border-slate-300 rounded-lg p-2 mt-1 w-full min-w-[260px]"
            >
              {events.map((event) => (
                <option key={event._id} value={event._id}>{event.title} ({event.date})</option>
              ))}
            </select>
          </div>

          <div className="text-sm text-slate-600">
            {selectedEventLabel ? (
              <p className="rounded-lg bg-slate-100 px-3 py-2">Live for: <span className="font-semibold text-slate-900">{selectedEventLabel}</span></p>
            ) : (
              <p className="rounded-lg bg-slate-100 px-3 py-2">Select an event to start scanning</p>
            )}
          </div>
        </div>

        {!events.length && <p className="mt-4 text-sm text-slate-600">No organizer events available to scan.</p>}

        <div className="mt-4 bg-white border border-slate-200 rounded-xl p-4">
          <div id={scannerId} />
        </div>

        {message && <p className="mt-4 text-sm font-medium text-brand-700">{message}</p>}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white/90 p-5 fade-in">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Recent Scan Activity</h2>
          <button onClick={() => setHistory([])} className="text-sm px-3 py-2 rounded-lg border border-slate-300 bg-white">
            Clear
          </button>
        </div>

        {history.length ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm border border-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-2 border border-slate-200 text-left">Name</th>
                  <th className="p-2 border border-slate-200 text-left">Student ID</th>
                  <th className="p-2 border border-slate-200 text-left">Status</th>
                  <th className="p-2 border border-slate-200 text-left">Time</th>
                </tr>
              </thead>
              <tbody>
                {history.map((scan) => (
                  <tr key={scan.id} className="odd:bg-white even:bg-slate-50/50">
                    <td className="p-2 border border-slate-200">{scan.name}</td>
                    <td className="p-2 border border-slate-200">{scan.studentId}</td>
                    <td className="p-2 border border-slate-200">{scan.status}</td>
                    <td className="p-2 border border-slate-200">{scan.at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-slate-500">No scans recorded in this session yet.</p>
        )}
      </section>
    </div>
  );
};

export default QRScanner;

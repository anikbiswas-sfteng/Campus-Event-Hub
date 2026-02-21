import { Link } from 'react-router-dom';

const EventCard = ({
  event,
  role,
  onRegister,
  onDelete,
  onToggleSave,
  isSaved,
  compact = false
}) => {
  const registeredCount = Number(event.registeredCount || 0);
  const maxParticipants = Number(event.maxParticipants || 1);
  const full = registeredCount >= maxParticipants;
  const seatRatio = Math.min(100, Math.round((registeredCount / maxParticipants) * 100));

  const eventDate = new Date(`${event.date}T${event.time || '00:00'}:00`);
  const now = new Date();
  const isPast = eventDate < now;
  const isToday = eventDate.toDateString() === now.toDateString();

  const statusLabel = isPast ? 'Completed' : isToday ? 'Today' : 'Upcoming';
  const statusClass = isPast
    ? 'bg-slate-100 text-slate-700'
    : isToday
      ? 'bg-amber-100 text-amber-700'
      : 'bg-emerald-100 text-emerald-700';

  const seatClass = full
    ? 'bg-rose-500'
    : seatRatio >= 75
      ? 'bg-amber-500'
      : 'bg-emerald-500';

  const handleShare = async () => {
    const url = `${window.location.origin}/events/${event._id}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: event.title, text: event.description, url });
        return;
      }
      await navigator.clipboard.writeText(url);
      alert('Event link copied to clipboard');
    } catch {
      alert('Unable to share this event right now');
    }
  };

  return (
    <article className={`rounded-2xl border border-slate-200 bg-white/90 shadow-sm hover:shadow-md transition ${compact ? 'p-4' : 'p-5'} fade-in`}>
      <div className="flex justify-between items-start gap-2">
        <div>
          <h3 className="text-lg font-semibold text-slate-900 leading-tight">{event.title}</h3>
          <p className="text-xs text-slate-500 mt-1">by {event.createdBy?.name || 'Organizer'}</p>
        </div>
        <div className="flex gap-2 items-center">
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusClass}`}>{statusLabel}</span>
          {event.isRegistered && <span className="text-xs px-2 py-1 bg-brand-100 text-brand-700 rounded-full">Registered</span>}
        </div>
      </div>

      <p className="mt-3 text-sm text-slate-600 leading-relaxed">{event.description}</p>

      <div className="mt-4 grid sm:grid-cols-2 gap-2 text-sm text-slate-700">
        <p><span className="font-medium">Date:</span> {event.date}</p>
        <p><span className="font-medium">Time:</span> {event.time}</p>
        <p><span className="font-medium">Venue:</span> {event.venue}</p>
        <p><span className="font-medium">Seats:</span> {registeredCount}/{maxParticipants}</p>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-slate-500 mb-1">
          <span>Capacity</span>
          <span>{seatRatio}% filled</span>
        </div>
        <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
          <div className={`h-full ${seatClass} transition-all`} style={{ width: `${seatRatio}%` }} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link to={`/events/${event._id}`} className="px-3 py-2 rounded-lg bg-slate-100 text-sm hover:bg-slate-200">
          Details
        </Link>

        {role === 'student' && !event.isRegistered && !isPast && (
          <button
            onClick={() => onRegister(event._id)}
            disabled={full}
            className="px-3 py-2 rounded-lg bg-brand-600 text-white text-sm disabled:bg-slate-300"
          >
            {full ? 'Full' : 'Register'}
          </button>
        )}

        {role === 'student' && (
          <button
            onClick={() => onToggleSave?.(event._id)}
            className={`px-3 py-2 rounded-lg text-sm border ${
              isSaved ? 'border-brand-500 text-brand-700 bg-brand-50' : 'border-slate-300 text-slate-700 bg-white'
            }`}
          >
            {isSaved ? 'Saved' : 'Save'}
          </button>
        )}

        <button onClick={handleShare} className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-700">
          Share
        </button>

        {role === 'organizer' && (
          <>
            <Link to={`/create-event?edit=${event._id}`} className="px-3 py-2 rounded-lg bg-amber-500 text-white text-sm">
              Edit
            </Link>
            <button onClick={() => onDelete(event._id)} className="px-3 py-2 rounded-lg bg-rose-600 text-white text-sm">
              Delete
            </button>
          </>
        )}
      </div>
    </article>
  );
};

export default EventCard;

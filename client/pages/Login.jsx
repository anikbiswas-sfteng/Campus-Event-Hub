import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const demoAccounts = {
  organizer: { email: 'organizer@college.edu', password: 'Organizer@123' },
  student: { email: 'student@college.edu', password: 'Student@123' }
};

const Login = () => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const { data } = await api.post('/auth/login', form);
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-6">
        <section className="hidden lg:flex rounded-3xl bg-gradient-to-br from-brand-700 via-brand-600 to-cyan-600 text-white p-8 flex-col justify-between">
          <div>
            <p className="text-brand-100">Campus Event Hub</p>
            <h1 className="text-4xl font-bold mt-2 leading-tight">Run events like a professional team.</h1>
            <p className="mt-3 text-brand-100">Role-based event operations for students and organizers, with live attendance workflows.</p>
          </div>
          <p className="text-sm text-brand-100">Sign in to continue managing and exploring campus events.</p>
        </section>

        <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white/90 p-6 sm:p-8 shadow-sm space-y-4 fade-in">
          <h1 className="text-3xl font-bold">Login</h1>
          <p className="text-sm text-slate-500">Access your organizer or student workspace.</p>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <input
            className="w-full border border-slate-300 rounded-lg p-2.5"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            className="w-full border border-slate-300 rounded-lg p-2.5"
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          <button disabled={loading} className="w-full bg-brand-600 text-white py-2.5 rounded-lg disabled:bg-slate-400 font-medium">
            {loading ? 'Signing in...' : 'Login'}
          </button>

          <div className="rounded-xl bg-slate-50 border border-slate-200 p-3">
            <p className="text-xs text-slate-600 mb-2">Quick demo fill:</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setForm(demoAccounts.student)} className="px-3 py-1.5 rounded-lg text-xs bg-white border border-slate-300">
                Student
              </button>
              <button type="button" onClick={() => setForm(demoAccounts.organizer)} className="px-3 py-1.5 rounded-lg text-xs bg-white border border-slate-300">
                Organizer
              </button>
            </div>
          </div>

          <p className="text-sm">
            No account? <Link to="/register" className="text-brand-700 font-medium">Register</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;

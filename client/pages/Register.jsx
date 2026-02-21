import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    studentId: '',
    role: 'student'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      const { data } = await api.post('/auth/register', form);
      login(data);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 gap-6">
        <section className="hidden lg:flex rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-sky-600 text-white p-8 flex-col justify-between">
          <div>
            <p className="text-emerald-100">Create Account</p>
            <h1 className="text-4xl font-bold mt-2 leading-tight">Join your campus event network.</h1>
            <p className="mt-3 text-emerald-100">As a student, discover and register. As an organizer, publish events and manage attendance.</p>
          </div>
          <p className="text-sm text-emerald-100">New accounts are ready to use immediately after sign-up.</p>
        </section>

        <form onSubmit={submit} className="rounded-3xl border border-slate-200 bg-white/90 p-6 sm:p-8 shadow-sm space-y-4 fade-in">
          <h1 className="text-3xl font-bold">Register</h1>
          <p className="text-sm text-slate-500">Create your student or organizer account.</p>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <input className="w-full border border-slate-300 rounded-lg p-2.5" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="w-full border border-slate-300 rounded-lg p-2.5" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className="w-full border border-slate-300 rounded-lg p-2.5" type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <input className="w-full border border-slate-300 rounded-lg p-2.5" placeholder="Student/Org ID" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required />
          <select className="w-full border border-slate-300 rounded-lg p-2.5" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
            <option value="student">Student</option>
            <option value="organizer">Organizer</option>
          </select>

          <button disabled={loading} className="w-full bg-brand-600 text-white py-2.5 rounded-lg disabled:bg-slate-400 font-medium">
            {loading ? 'Creating account...' : 'Register'}
          </button>

          <p className="text-sm">
            Already have an account? <Link to="/login" className="text-brand-700 font-medium">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Register;

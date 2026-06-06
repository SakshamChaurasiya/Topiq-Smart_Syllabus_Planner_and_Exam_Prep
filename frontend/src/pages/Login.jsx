// Login.jsx — Premium split-screen auth with full branding
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const LOGIN_BENEFITS = [
  { icon: '⚡', title: 'Cheat Code System', desc: '1-day survival mode — know exactly what to study' },
  { icon: '🤖', title: 'AI Syllabus Analysis', desc: 'Upload PDF → get topics, difficulty & marks weightage' },
  { icon: '🎯', title: 'Daily Missions', desc: 'Small actionable tasks that actually get done' },
  { icon: '🏆', title: 'Exam Readiness Score', desc: 'Know your % readiness before exam day' },
];

const Login = () => {
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill in all fields.');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back! 🚀');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* ── LEFT — Brand Panel ── */}
      <div className="auth-left">
        {/* Background blobs */}
        <div style={{ position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, background: 'radial-gradient(ellipse, rgba(99,102,241,0.18) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '5%', right: '-10%', width: 300, height: 300, background: 'radial-gradient(ellipse, rgba(6,182,212,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 380, width: '100%' }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 36 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--brand-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', boxShadow: '0 6px 20px rgba(99,102,241,0.4)' }}>⚡</div>
            <div>
              <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>Smart Syllabus Planner</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--primary-light)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Exam Survival Assistant</div>
            </div>
          </div>

          <h2 style={{ fontWeight: 900, fontSize: 'clamp(1.5rem,3vw,2rem)', letterSpacing: '-0.04em', marginBottom: 8, lineHeight: 1.15 }}>
            Stop Planning.<br />
            <span style={{ background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Start Executing.</span>
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 32 }}>
            Upload your syllabus, get AI-powered missions, and maximize your exam marks — whatever time you have left.
          </p>

          {/* Benefits list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {LOGIN_BENEFITS.map((b, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)',
                borderRadius: 12, padding: '12px 14px',
                animation: `slideIn 0.4s ease both ${i * 0.07}s`,
              }}>
                <span style={{ fontSize: '1.1rem', flexShrink: 0, marginTop: 1 }}>{b.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: 2 }}>{b.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>{b.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Social proof */}
          <div style={{ marginTop: 28, padding: '14px 16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 12 }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--success)', marginBottom: 4 }}>📊 Results from real students</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              "Scored 91% on my DSA exam using the 3-day Cheat Code. This app is unreal." — Priya S., CS Eng.
            </div>
          </div>
        </div>
      </div>

      {/* ── RIGHT — Login Form ── */}
      <div className="auth-right">
        <div className="auth-form-box animate-slide-up">
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: '1.65rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 6 }}>
              Welcome back
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>
              Sign in to continue your study journey
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email Address</label>
              <input
                id="login-email"
                type="email"
                className="form-input"
                placeholder="you@example.com"
                value={form.email}
                onChange={e => set('email', e.target.value)}
                required
                autoFocus
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="login-password"
                  type={showPass ? 'text' : 'password'}
                  className="form-input"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  required
                  style={{ paddingRight: 48 }}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '0.9rem', padding: 4 }}
                >
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn-cta"
              disabled={loading}
              style={{ width: '100%', marginTop: 8 }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />
                  Signing in...
                </span>
              ) : '🚀 Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-disabled)', fontWeight: 600 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />
          </div>

          <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary-light)', fontWeight: 700 }}>
              Create one free →
            </Link>
          </p>

          <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-disabled)', marginTop: 20, lineHeight: 1.5 }}>
            By signing in you agree to use Smart Syllabus Planner responsibly.<br />Free forever · No credit card required.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

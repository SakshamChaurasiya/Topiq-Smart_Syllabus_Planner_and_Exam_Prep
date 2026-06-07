// Login.jsx — 2025 redesign: centered card, no split panel, no blobs
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Zap, Eye, EyeOff, LogIn, Home } from 'lucide-react';

const Login = () => {
  const [form, setForm]         = useState({ email: '', password: '' });
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const location    = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please fill in all fields.');
    setLoading(true);
    try {
      await login(form.email, form.password);
      toast.success('Welcome back!');
      navigate(from, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card animate-slide-up">

        {/* Logo */}
        <div className="auth-logo">
          <div className="auth-logo-mark">
            T
          </div>
          <span className="auth-logo-name">Topiq</span>
        </div>

        {/* Heading */}
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">Sign in to continue your study journey</p>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">Email Address</label>
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
            <label className="form-label" htmlFor="login-password">Password</label>
            <div className="auth-password-wrap">
              <input
                id="login-password"
                type={showPass ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={form.password}
                onChange={e => set('password', e.target.value)}
                required
                style={{ paddingRight: 44 }}
              />
              <button
                type="button"
                className="auth-eye-btn"
                onClick={() => setShowPass(v => !v)}
                aria-label={showPass ? 'Hide password' : 'Show password'}
              >
                {showPass ? <EyeOff size={16} strokeWidth={2} /> : <Eye size={16} strokeWidth={2} />}
              </button>
            </div>
          </div>

          <button
            id="login-submit"
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="spinner" style={{ width: 16, height: 16 }} />
                Signing in...
              </>
            ) : (
              <>
                <LogIn size={16} strokeWidth={2} />
                Sign In
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <div className="auth-divider-line" />
          <span className="auth-divider-text">or</span>
          <div className="auth-divider-line" />
        </div>

        {/* Switch to register */}
        <p className="auth-footer">
          Don't have an account?{' '}
          <Link to="/register" className="auth-link">Create one free →</Link>
        </p>
        
        <Link to="/" className="btn btn-ghost btn-sm" style={{ width: '100%', marginTop: 12, gap: 6 }}>
          <Home size={14} />
          Go to Home
        </Link>

        <p className="auth-fine" style={{ marginTop: 16 }}>
          Free forever · No credit card required
        </p>

      </div>
    </div>
  );
};

export default Login;

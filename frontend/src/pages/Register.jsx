// Register.jsx — 2025 redesign: centered card, no split panel, flat goal selector
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { Zap, Eye, EyeOff, Check } from 'lucide-react';

const GOALS = [
  {
    value: 'pass',
    label: 'Pass Mode',
    score: '40%+',
    desc: 'Focus on high-mark topics only. Efficient survival for clearing.',
    color: 'var(--success)',
  },
  {
    value: 'good',
    label: 'Score Mode',
    score: '65%+',
    desc: 'Balanced approach for a strong result without burning out.',
    color: 'var(--accent)',
    popular: true,
  },
  {
    value: 'excellent',
    label: 'Topper Mode',
    score: '85%+',
    desc: 'Complete mastery with deep dives, revisions, and practice.',
    color: 'var(--warning)',
  },
];

const Register = () => {
  const [form, setForm]         = useState({ name: '', email: '', password: '', targetGoal: 'good', institution: '' });
  const [loading, setLoading]   = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [step, setStep]         = useState(1); // 1 = account info, 2 = goal selection
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleStep1 = (e) => {
    e.preventDefault();
    if (!form.name.trim())        return toast.error('Enter your name.');
    if (!form.email.trim())       return toast.error('Enter your email.');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters.');
    setStep(2);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.targetGoal, form.institution.trim());
      toast.success('Welcome to Topiq!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Try again.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const selectedGoal = GOALS.find(g => g.value === form.targetGoal);

  /* Password strength */
  const pwLen = form.password.length;
  const pwStrong = pwLen >= 8;

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

        {/* Step indicator */}
        <div className="auth-steps">
          {[1, 2].map((s, idx) => (
            <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className={`auth-step-dot${step > s ? ' done' : step === s ? ' active' : ''}`}>
                {step > s ? <Check size={11} strokeWidth={3} /> : s}
              </div>
              <span className={`auth-step-label${step >= s ? ' active' : ''}`}>
                {s === 1 ? 'Account' : 'Goal'}
              </span>
              {idx < 1 && (
                <div className={`auth-step-connector${step > 1 ? ' done' : ''}`} />
              )}
            </div>
          ))}
        </div>

        {/* ── STEP 1: Account Info ── */}
        {step === 1 && (
          <div className="animate-slide-up">
            <h1 className="auth-title">Create your account</h1>
            <p className="auth-subtitle">Free forever · No credit card required</p>

            <form onSubmit={handleStep1}>
              <div className="form-group">
                <label className="form-label" htmlFor="register-name">Full Name</label>
                <input
                  id="register-name"
                  className="form-input"
                  placeholder="e.g. Arjun Sharma"
                  value={form.name}
                  onChange={e => set('name', e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="register-email">Email Address</label>
                <input
                  id="register-email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => set('email', e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="register-password">Password</label>
                <div className="auth-password-wrap">
                  <input
                    id="register-password"
                    type={showPass ? 'text' : 'password'}
                    className="form-input"
                    placeholder="At least 6 characters"
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                    required
                    minLength={6}
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
                {/* Password strength bars */}
                {pwLen > 0 && (
                  <div className="auth-strength-bars">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={`auth-strength-bar${pwLen >= i * 2 ? (pwStrong ? ' strong' : ' weak') : ''}`}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="register-institution">
                  College / University <span style={{ color: 'var(--txt-3)', fontWeight: 400 }}>(Optional)</span>
                </label>
                <input
                  id="register-institution"
                  className="form-input"
                  placeholder="e.g. Stanford University"
                  value={form.institution}
                  onChange={e => set('institution', e.target.value)}
                />
              </div>

              <button type="submit" className="auth-submit">
                Continue →
              </button>
            </form>

            <p className="auth-footer" style={{ marginTop: 16 }}>
              Already have an account?{' '}
              <Link to="/login" className="auth-link">Sign in →</Link>
            </p>
          </div>
        )}

        {/* ── STEP 2: Goal Selection ── */}
        {step === 2 && (
          <div className="animate-slide-up">
            <h1 className="auth-title">What's your goal?</h1>
            <p className="auth-subtitle">
              Helps AI prioritize your study plan. Change it anytime.
            </p>

            <div style={{ marginBottom: 20 }}>
              {GOALS.map(g => (
                <button
                  key={g.value}
                  type="button"
                  className={`auth-goal-btn${form.targetGoal === g.value ? ' selected' : ''}`}
                  onClick={() => set('targetGoal', g.value)}
                >
                  {g.popular && (
                    <span className="auth-goal-popular">Popular</span>
                  )}
                  <div style={{ flex: 1 }}>
                    <div className="auth-goal-score" style={{ color: g.color }}>
                      {g.score}
                    </div>
                    <div className="auth-goal-label">{g.label}</div>
                    <p className="auth-goal-desc">{g.desc}</p>
                  </div>
                  {form.targetGoal === g.value && (
                    <div className="auth-goal-check">
                      <Check size={11} strokeWidth={3} />
                    </div>
                  )}
                </button>
              ))}
            </div>

            <button
              id="register-submit"
              className="auth-submit"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner" style={{ width: 16, height: 16 }} />
                  Creating account...
                </>
              ) : (
                `Start with ${selectedGoal?.label}`
              )}
            </button>

            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setStep(1)}
              style={{ width: '100%', marginTop: 10 }}
            >
              ← Back
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default Register;

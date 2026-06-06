// Register.jsx — Premium registration with goal-mode selector
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const GOALS = [
  {
    value: 'pass',
    emoji: '✅',
    label: 'Pass Mode',
    score: '40%+',
    desc: 'Focus on high-mark topics only. Efficient survival for clearing.',
    color: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
    border: 'rgba(16,185,129,0.35)',
  },
  {
    value: 'good',
    emoji: '🎯',
    label: 'Score Mode',
    score: '65%+',
    desc: 'Balanced approach for a strong result without burning out.',
    color: '#6366f1',
    bg: 'rgba(99,102,241,0.1)',
    border: 'rgba(99,102,241,0.4)',
    popular: true,
  },
  {
    value: 'excellent',
    emoji: '🏆',
    label: 'Topper Mode',
    score: '85%+',
    desc: 'Complete mastery with deep dives, revisions, and practice.',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.35)',
  },
];

const Register = () => {
  const [form, setForm]       = useState({ name: '', email: '', password: '', targetGoal: 'good' });
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [step, setStep]       = useState(1); // 1 = account info, 2 = goal selection
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleStep1 = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Enter your name.');
    if (!form.email.trim()) return toast.error('Enter your email.');
    if (form.password.length < 6) return toast.error('Password must be at least 6 characters.');
    setStep(2);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.targetGoal);
      toast.success('🎉 Welcome to Smart Syllabus Planner!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed. Try again.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const selectedGoal = GOALS.find(g => g.value === form.targetGoal);

  return (
    <div className="auth-page">
      {/* ── LEFT — Brand Panel ── */}
      <div className="auth-left">
        <div style={{ position: 'absolute', top: '15%', left: '50%', transform: 'translateX(-50%)', width: 500, height: 500, background: 'radial-gradient(ellipse, rgba(139,92,246,0.18) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '-10%', width: 300, height: 300, background: 'radial-gradient(ellipse, rgba(99,102,241,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />

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
            Study Smarter.<br />
            <span style={{ background: 'var(--brand-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Score Better.</span>
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 28 }}>
            Join thousands of engineering students who stopped guessing what to study and started winning with AI strategy.
          </p>

          {/* How it works mini */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { n: '01', icon: '📤', t: 'Upload your syllabus', d: 'PDF, image, or paste text' },
              { n: '02', icon: '🤖', t: 'AI analyzes everything', d: 'Topics, difficulty, marks weightage' },
              { n: '03', icon: '🗺️', t: 'Get your personalized plan', d: 'Roadmap + daily missions generated' },
              { n: '04', icon: '⚡', t: 'Execute with cheat codes', d: 'Maximize marks with time you have' },
            ].map((s, i) => (
              <div key={s.n} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                background: 'rgba(255,255,255,0.025)', border: '1px solid var(--border-subtle)',
                borderRadius: 12, padding: '10px 14px',
                animation: `slideIn 0.4s ease both ${i * 0.07}s`,
              }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', flexShrink: 0 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-primary)' }}>{s.t}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── RIGHT — Form ── */}
      <div className="auth-right">
        <div className="auth-form-box">

          {/* Step indicator */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 }}>
            {[1, 2].map(s => (
              <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%',
                  background: step >= s ? 'var(--brand-gradient)' : 'var(--bg-elevated)',
                  border: `2px solid ${step >= s ? 'transparent' : 'var(--border-default)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.72rem', fontWeight: 800, color: step >= s ? '#fff' : 'var(--text-muted)',
                  transition: 'all 0.3s',
                }}>
                  {step > s ? '✓' : s}
                </div>
                <span style={{ fontSize: '0.72rem', fontWeight: 600, color: step >= s ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                  {s === 1 ? 'Account Info' : 'Choose Goal'}
                </span>
                {s < 2 && <div style={{ width: 24, height: 2, background: step > 1 ? 'var(--primary)' : 'var(--border-default)', borderRadius: 2, transition: 'all 0.3s', marginLeft: 4 }} />}
              </div>
            ))}
          </div>

          {/* ── STEP 1: Account Info ── */}
          {step === 1 && (
            <div className="animate-slide-up">
              <h1 style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 4 }}>Create your account</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 24 }}>Free forever · No credit card required</p>

              <form onSubmit={handleStep1}>
                <div className="form-group">
                  <label className="form-label">Your Full Name</label>
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
                  <label className="form-label">Email Address</label>
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
                  <label className="form-label">Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="register-password"
                      type={showPass ? 'text' : 'password'}
                      className="form-input"
                      placeholder="At least 6 characters"
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                      required
                      minLength={6}
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
                  {form.password.length > 0 && (
                    <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                      {[1,2,3,4].map(i => (
                        <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: form.password.length >= i * 2 ? (form.password.length >= 8 ? 'var(--success)' : 'var(--warning)') : 'var(--border-default)', transition: 'all 0.2s' }} />
                      ))}
                    </div>
                  )}
                </div>

                <button type="submit" className="btn-cta" style={{ width: '100%', marginTop: 8 }}>
                  Continue →
                </button>
              </form>

              <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Already have an account?{' '}
                <Link to="/login" style={{ color: 'var(--primary-light)', fontWeight: 700 }}>Sign in →</Link>
              </p>
            </div>
          )}

          {/* ── STEP 2: Goal Selection ── */}
          {step === 2 && (
            <div className="animate-slide-up">
              <h1 style={{ fontSize: '1.6rem', fontWeight: 900, letterSpacing: '-0.04em', marginBottom: 4 }}>What's your goal? 🎯</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: 24 }}>
                This helps AI prioritize your study plan. You can always change it later.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                {GOALS.map(g => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => set('targetGoal', g.value)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: 14,
                      background: form.targetGoal === g.value ? g.bg : 'var(--bg-elevated)',
                      border: `2px solid ${form.targetGoal === g.value ? g.border : 'var(--border-default)'}`,
                      borderRadius: 14, padding: '16px 18px',
                      cursor: 'pointer', textAlign: 'left', transition: 'all 0.18s',
                      width: '100%', fontFamily: 'var(--font-family)',
                      position: 'relative', overflow: 'hidden',
                    }}
                  >
                    {g.popular && (
                      <div style={{ position: 'absolute', top: 10, right: 12, background: 'var(--brand-gradient)', color: '#fff', fontSize: '0.58rem', fontWeight: 800, padding: '2px 10px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Popular
                      </div>
                    )}
                    <div style={{ fontSize: '1.8rem', flexShrink: 0, lineHeight: 1 }}>{g.emoji}</div>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: form.targetGoal === g.value ? g.color : 'var(--text-primary)', marginBottom: 2, letterSpacing: '-0.01em' }}>
                        {g.label} — {g.score}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>{g.desc}</div>
                    </div>
                    {form.targetGoal === g.value && (
                      <div style={{ marginLeft: 'auto', width: 20, height: 20, borderRadius: '50%', background: g.color, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '0.72rem', fontWeight: 800, flexShrink: 0 }}>✓</div>
                    )}
                  </button>
                ))}
              </div>

              <button
                id="register-submit"
                className="btn-cta"
                onClick={handleSubmit}
                disabled={loading}
                style={{ width: '100%' }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                    <div className="spinner" style={{ width: 16, height: 16, borderWidth: 2, borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} />
                    Creating your account...
                  </span>
                ) : `🚀 Start with ${selectedGoal?.label}`}
              </button>

              <button
                className="btn btn-ghost"
                onClick={() => setStep(1)}
                style={{ width: '100%', marginTop: 10, fontSize: '0.83rem' }}
              >
                ← Back
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;

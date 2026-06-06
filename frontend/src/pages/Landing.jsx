// Landing.jsx — Premium startup landing page
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/* Animated counter hook */
const useCounter = (target, duration = 1500) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
};

const features = [
  {
    icon: '🤖', color: '#6366f1', bg: 'rgba(99,102,241,0.12)',
    title: 'AI Syllabus Analyzer',
    desc: 'Upload any syllabus PDF. AI extracts every topic, rates difficulty, estimates marks weightage, and builds your priority list — in under 2 minutes.',
    tag: 'Most Popular',
  },
  {
    icon: '⚡', color: '#ef4444', bg: 'rgba(239,68,68,0.12)',
    title: 'Cheat Code System',
    desc: '1 day left? 3 days? Activate survival mode. AI tells you exactly what to study, what to skip, and your hourly schedule to maximize marks.',
    tag: 'Game Changer',
  },
  {
    icon: '🎯', color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',
    title: 'Daily Mission Engine',
    desc: 'No more long timetables. Small, actionable missions: Study Topic 3.1 → Solve 5 questions → Revise notes. Done. Next.',
    tag: 'Most Used',
  },
  {
    icon: '🗺️', color: '#06b6d4', bg: 'rgba(6,182,212,0.12)',
    title: 'Smart Study Roadmap',
    desc: 'AI-generated day-by-day plan based on your exam date, available hours, and target score. Adjusts as you complete topics.',
    tag: 'AI-Powered',
  },
  {
    icon: '📊', color: '#10b981', bg: 'rgba(16,185,129,0.12)',
    title: 'Exam Readiness Score',
    desc: 'Know exactly where you stand. Live readiness percentage, weak topic radar, and smart recommendations to close the gap.',
    tag: 'Real-Time',
  },
  {
    icon: '🔄', color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',
    title: 'Revision Radar',
    desc: 'AI tracks which topics you completed and schedules revision sessions before you forget. Spaced repetition built-in.',
    tag: 'Smart',
  },
];

const testimonials = [
  { name: 'Priya S.', branch: 'CS Engineering', score: '91%', quote: 'I had 3 days before my DSA exam. Used the Cheat Code — got exactly what to study. Scored 91%. Absolutely wild.' },
  { name: 'Arjun M.', branch: 'Mech Engineering', quote: 'The AI analyzed my 40-page syllabus in 90 seconds. Built my entire plan automatically. Saved me hours of planning.', score: '78%' },
  { name: 'Sneha K.', branch: 'Electronics', quote: 'Daily missions are genius. Instead of staring at a timetable, I just open SSP and know exactly what to do next.', score: '85%' },
];

const steps = [
  { n: '01', icon: '📤', t: 'Upload Syllabus', d: 'PDF, image, or paste text' },
  { n: '02', icon: '🤖', t: 'AI Analyzes', d: 'Topics extracted in seconds' },
  { n: '03', icon: '🗺️', t: 'Get Your Plan', d: 'Personalized roadmap + missions' },
  { n: '04', icon: '✅', t: 'Execute Daily', d: 'Complete missions, ace exams' },
];

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, [isAuthenticated, navigate]);

  const c1 = useCounter(12400, 2000);
  const c2 = useCounter(94, 1800);
  const c3 = useCounter(2, 1200);

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh', fontFamily: 'var(--font-family)' }}>

      {/* ── NAVBAR ── */}
      <nav className="landing-nav">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--brand-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', boxShadow: 'var(--shadow-glow)' }}>⚡</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>SMART SYLLABUS PLANNER</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Your AI-Powered Exam Survival Assistant</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button className="btn btn-ghost" onClick={() => navigate('/login')} style={{ fontSize: '0.9rem' }}>Sign In</button>
          <button className="btn-cta" onClick={() => navigate('/register')} style={{ padding: '12px 28px', fontSize: '0.9rem', borderRadius: 'var(--r-full)' }}>
            🚀 Get Started Free
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="landing-hero">
        <div className="hero-blob-1" />
        <div className="hero-blob-2" />
        <div className="hero-blob-3" />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 900, width: '100%' }}>
          {/* Pill badge */}
          <div className="hero-pill">
            <span className="hero-dot" />
            🎯 Turn Your Syllabus Into Daily Wins
          </div>

          {/* Main heading */}
          <h1 className="hero-title">
            <span style={{ display: 'block', color: 'var(--text-primary)' }}>Study Smarter.</span>
            <span className="hero-title-accent">Score Better.</span>
          </h1>

          {/* Subtitle */}
          <p className="hero-subtitle">
            Stop guessing what to study. Let AI break down your syllabus into daily missions, track your progress, and maximize your exam marks.
          </p>

          <p className="hero-tagline">"Complete More, Stress Less"</p>

          {/* CTAs */}
          <div className="hero-ctas">
            <button className="btn-cta" onClick={() => navigate('/register')}>
              🎯 Start Planning Free
            </button>
            <button className="btn-outline-primary" onClick={() => navigate('/login')}>
              📺 Watch Demo
            </button>
          </div>

          {/* Animated stats */}
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">{c1.toLocaleString()}+</div>
              <div className="hero-stat-label">Students</div>
            </div>
            <div style={{ width: 1, height: 48, background: 'var(--border-subtle)' }} />
            <div className="hero-stat">
              <div className="hero-stat-value">{c2}%</div>
              <div className="hero-stat-label">Avg Score Improvement</div>
            </div>
            <div style={{ width: 1, height: 48, background: 'var(--border-subtle)' }} />
            <div className="hero-stat">
              <div className="hero-stat-value">&lt;{c3} min</div>
              <div className="hero-stat-label">AI Analysis Time</div>
            </div>
            <div style={{ width: 1, height: 48, background: 'var(--border-subtle)' }} />
            <div className="hero-stat">
              <div className="hero-stat-value">3</div>
              <div className="hero-stat-label">Study Modes</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROBLEM STATEMENT BAND ── */}
      <section className="section-sm" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container-sm" style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.7, fontStyle: 'italic' }}>
            Every student knows they need to study. The real problem is — <strong style={{ color: 'var(--text-primary)' }}>they don't know what to study first, which topics matter most, and how to use the time they have.</strong>
            <br />SSP solves the <strong style={{ color: 'var(--primary-light)' }}>execution problem</strong>, not just the planning problem.
          </p>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 56 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', borderRadius: 100, padding: '5px 16px', marginBottom: 20 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--primary-light)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Everything You Need</span>
            </div>
            <h2 style={{ fontWeight: 900, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)', letterSpacing: '-0.03em', marginBottom: 14, color: 'var(--text-primary)' }}>
              Your complete exam survival toolkit
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', maxWidth: 500, margin: '0 auto' }}>
              Six powerful features that work together to turn any syllabus into a winning study strategy.
            </p>
          </div>

          <div className="feature-grid">
            {features.map((f, i) => (
              <div key={f.title} className="feature-card animate-slide-up" style={{ animationDelay: `${i * 0.06}s` }}>
                <div className="feature-icon-wrap" style={{ background: f.bg }}>
                  <span style={{ fontSize: '1.4rem' }}>{f.icon}</span>
                </div>
                {f.tag && (
                  <span style={{ fontSize: '0.62rem', fontWeight: 800, color: f.color, textTransform: 'uppercase', letterSpacing: '0.08em', background: f.bg, padding: '2px 10px', borderRadius: 100, display: 'inline-block', marginBottom: 10 }}>
                    {f.tag}
                  </span>
                )}
                <h3 style={{ fontWeight: 800, marginBottom: 10, fontSize: '1.05rem', letterSpacing: '-0.02em' }}>{f.title}</h3>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="section" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)', borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="container-sm">
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontWeight: 900, fontSize: 'clamp(1.75rem,4vw,2.25rem)', letterSpacing: '-0.03em', marginBottom: 8 }}>
              From syllabus to success in 4 steps
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>No setup needed. No learning curve. Just results.</p>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
            {steps.map((s, i) => (
              <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-default)', borderRadius: 16, padding: '28px 28px', textAlign: 'center', minWidth: 168, transition: 'all 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-default)'}
                >
                  <div style={{ fontSize: '2rem', marginBottom: 10 }}>{s.icon}</div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--primary-light)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Step {s.n}</div>
                  <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: 4, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>{s.t}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{s.d}</div>
                </div>
                {i < 3 && <div style={{ width: 36, height: 2, background: 'linear-gradient(90deg, var(--primary), var(--secondary))', flexShrink: 0 }} />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── MOTIVATIONAL MODES ── */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontWeight: 900, fontSize: 'clamp(1.75rem,4vw,2.25rem)', letterSpacing: '-0.03em', marginBottom: 8 }}>
              Study at your own pace. Score on your own terms.
            </h2>
            <p style={{ color: 'var(--text-muted)' }}>Three modes. One goal — maximizing your marks with the time available.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {[
              { emoji: '✅', label: 'Pass Mode', score: '40%+', color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.25)', desc: 'Focus only on high-mark topics. Efficient survival strategy for clearing the exam.' },
              { emoji: '🎯', label: 'Score Mode', score: '65%+', color: '#6366f1', bg: 'rgba(99,102,241,0.08)', border: 'rgba(99,102,241,0.3)', desc: 'Balanced approach — cover important topics well and aim for a strong result.', popular: true },
              { emoji: '🏆', label: 'Topper Mode', score: '85%+', color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.25)', desc: 'Complete mastery. AI schedules deep dives, revisions, and practice for every unit.' },
            ].map(m => (
              <div key={m.label} style={{ background: m.bg, border: `2px solid ${m.popular ? m.border : 'var(--border-subtle)'}`, borderRadius: 16, padding: '28px 24px', textAlign: 'center', position: 'relative', transition: 'all 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = m.border; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = m.popular ? m.border : 'var(--border-subtle)'; e.currentTarget.style.transform = 'none'; }}
              >
                {m.popular && <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', background: 'var(--brand-gradient)', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '3px 14px', borderRadius: 100, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>Most Popular</div>}
                <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{m.emoji}</div>
                <div style={{ fontWeight: 900, fontSize: '1.15rem', color: m.color, marginBottom: 4, letterSpacing: '-0.02em' }}>{m.label}</div>
                <div style={{ fontSize: '0.8rem', color: m.color, fontWeight: 700, marginBottom: 14, opacity: 0.8 }}>Target: {m.score}</div>
                <p style={{ fontSize: '0.83rem', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="section" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontWeight: 900, fontSize: 'clamp(1.5rem,3vw,2rem)', letterSpacing: '-0.03em', marginBottom: 8 }}>Students who used SSP — in their own words</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {testimonials.map(t => (
              <div key={t.name} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: '24px', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
              >
                <div style={{ fontSize: '1.1rem', marginBottom: 14, color: '#f59e0b' }}>★★★★★</div>
                <p style={{ fontSize: '0.875rem', lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: 16, fontStyle: 'italic' }}>"{t.quote}"</p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{t.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{t.branch}</div>
                  </div>
                  <div style={{ background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, padding: '4px 12px', fontSize: '0.82rem', fontWeight: 800, color: 'var(--success)' }}>
                    Scored {t.score}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section className="section" style={{ textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.05) 40%, transparent 70%)', pointerEvents: 'none' }} />
        <div className="container-sm" style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 16, animation: 'float-blob 4s ease infinite' }}>🚀</div>
          <h2 style={{ fontWeight: 900, fontSize: 'clamp(1.75rem,4vw,2.5rem)', letterSpacing: '-0.04em', marginBottom: 12 }}>
            Ready to ace your exams?
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '1rem', marginBottom: 32, lineHeight: 1.7 }}>
            Join thousands of students who stopped guessing what to study and started winning with AI-powered exam strategy.
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-cta" onClick={() => navigate('/register')}>🎯 Start Planning Free</button>
            <button className="btn-outline-primary" onClick={() => navigate('/login')}>Already a member? Sign In</button>
          </div>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-disabled)', marginTop: 20 }}>
            No credit card required · Works without OpenAI key · Free forever
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="container" style={{ borderTop: '1px solid var(--border-subtle)', padding: '24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--brand-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem' }}>⚡</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.8rem', color: 'var(--text-primary)' }}>Smart Syllabus Planner</div>
            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>AI Exam Survival Assistant</div>
          </div>
        </div>
        <p style={{ color: 'var(--text-disabled)', fontSize: '0.75rem', margin: 0 }}>
          Built for engineering students who want results, not routines.
        </p>
      </footer>
    </div>
  );
};

export default Landing;

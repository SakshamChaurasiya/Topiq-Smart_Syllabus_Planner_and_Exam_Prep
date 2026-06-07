// Landing.jsx — Redesigned 2025-style landing page
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Zap, BrainCircuit, Flame, Target, Map,
  BarChart2, RefreshCcw, Upload, Sparkles,
  ArrowRight, LogIn, Sun, Moon,
} from 'lucide-react';

const features = [
  {
    Icon: BrainCircuit,
    title: 'AI Syllabus Analyzer',
    desc: 'Upload any syllabus PDF. AI extracts every topic, rates difficulty, estimates marks weightage, and builds your priority list — in under 2 minutes.',
    tag: 'Most Popular',
    size: 'bento-lg',
  },
  {
    Icon: Zap,
    title: 'Cheat Code System',
    desc: '1 day left? 3 days? Activate survival mode. AI tells you exactly what to study, what to skip, and your hourly schedule to maximize marks.',
    tag: 'Game Changer',
    size: 'bento-md',
  },
  {
    Icon: Target,
    title: 'Daily Mission Engine',
    desc: 'Small, actionable missions: Study Topic 3.1 → Solve 5 questions → Revise notes. Done. Next.',
    tag: 'Most Used',
    size: 'bento-md',
  },
  {
    Icon: Map,
    title: 'Smart Study Roadmap',
    desc: 'AI-generated day-by-day plan based on your exam date and target score.',
    tag: 'AI-Powered',
    size: 'bento-sm',
  },
  {
    Icon: BarChart2,
    title: 'Readiness Score',
    desc: 'Know exactly where you stand with live readiness tracking.',
    tag: 'Real-Time',
    size: 'bento-sm',
  },
  {
    Icon: RefreshCcw,
    title: 'Revision Radar',
    desc: 'Spaced repetition built-in for topics you tend to forget.',
    tag: 'Smart',
    size: 'bento-sm',
  },
];

const testimonials = [
  { name: 'Priya S.', branch: 'CS Engineering', score: '91%', quote: 'I had 3 days before my DSA exam. Used the Cheat Code — got exactly what to study. Scored 91%. Absolutely wild.' },
  { name: 'Arjun M.', branch: 'Mech Engineering', quote: 'The AI analyzed my 40-page syllabus in 90 seconds. Built my entire plan automatically. Saved me hours of planning.', score: '78%' },
  { name: 'Sneha K.', branch: 'Electronics', quote: 'Daily missions are genius. Instead of staring at a timetable, I just open SSP and know exactly what to do next.', score: '85%' },
];

const steps = [
  { n: '01', Icon: Upload,       t: 'Upload Syllabus', d: 'PDF, image, or paste text' },
  { n: '02', Icon: BrainCircuit, t: 'AI Analyzes',     d: 'Topics extracted in seconds' },
  { n: '03', Icon: Map,          t: 'Get Your Plan',   d: 'Personalized roadmap + missions' },
  { n: '04', Icon: Sparkles,     t: 'Execute Daily',   d: 'Complete missions, ace exams' },
];

const modes = [
  { label: 'Pass Mode',   score: '40%+', color: 'var(--success)', desc: 'Focus only on high-mark topics. Efficient survival strategy for clearing the exam.' },
  { label: 'Score Mode',  score: '65%+', color: 'var(--accent)',  desc: 'Balanced approach — cover important topics well and aim for a strong result.', popular: true },
  { label: 'Topper Mode', score: '85%+', color: 'var(--warning)', desc: 'Complete mastery. AI schedules deep dives, revisions, and practice for every unit.' },
];

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  return (
    <div className="landing-page">

      {/* ── NAVBAR ── */}
      <nav className="landing-nav">
        <div className="landing-nav-logo">
          <div className="landing-nav-logo-mark">
            <Zap size={18} strokeWidth={2.5} />
          </div>
          <div>
            <div className="landing-nav-name">SSP</div>
            <div className="landing-nav-tagline">AI Exam Assistant</div>
          </div>
        </div>

        <div className="landing-nav-actions">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {/* Sign In — icon always, text hidden on mobile */}
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/login')}
          >
            <LogIn size={15} strokeWidth={1.75} />
            <span className="landing-nav-signin-text">Sign In</span>
          </button>

          {/* Get Started */}
          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/register')}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="landing-hero hero-noise">
        <div className="hero-content">
          {/* Accent line */}
          <div className="hero-accent-line" />

          {/* Headline */}
          <h1 className="hero-title">
            Study Smarter.<br />Score Better.
          </h1>

          {/* Subheadline */}
          <p className="hero-subtitle">
            Stop guessing what to study. Let AI break down your syllabus into daily missions,
            track your progress, and maximize your exam marks.
          </p>

          {/* CTAs */}
          <div className="hero-ctas">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/register')}
            >
              <Target size={16} strokeWidth={2} />
              Start Planning Free
            </button>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => navigate('/login')}
            >
              <LogIn size={15} strokeWidth={2} />
              Sign In
            </button>
          </div>

          {/* Stats row — static numbers */}
          <div className="hero-stats">
            <div className="hero-stat">
              <div className="hero-stat-value">12,400+</div>
              <div className="hero-stat-label">Students</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">94%</div>
              <div className="hero-stat-label">Avg Improvement</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">&lt;2 min</div>
              <div className="hero-stat-label">AI Analysis</div>
            </div>
            <div className="hero-stat">
              <div className="hero-stat-value">3</div>
              <div className="hero-stat-label">Study Modes</div>
            </div>
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ── FEATURES (Bento grid) ── */}
      <section className="section">
        <div className="container">
          <div style={{ marginBottom: 40 }}>
            <div className="section-eyebrow">Everything You Need</div>
            <h2 className="section-title">Your complete exam survival toolkit</h2>
            <p className="section-desc">
              Six powerful features that work together to turn any syllabus into a winning study strategy.
            </p>
          </div>

          <div className="bento-grid">
            {features.map((f, i) => (
              <div
                key={f.title}
                className={`bento-card ${f.size} animate-slide-up`}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="bento-card-top">
                  <span className="bento-icon">
                    <f.Icon size={24} strokeWidth={1.75} />
                  </span>
                  {f.tag && <span className="bento-tag">{f.tag}</span>}
                </div>
                <div className="bento-card-title">{f.title}</div>
                <p className="bento-card-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ── HOW IT WORKS ── */}
      <section className="section">
        <div className="container-sm">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div className="section-eyebrow">How It Works</div>
            <h2 className="section-title">From syllabus to success in 4 steps</h2>
            <p className="section-desc" style={{ margin: '0 auto' }}>
              No setup needed. No learning curve. Just results.
            </p>
          </div>

          <div className="how-grid">
            {steps.map(s => (
              <div key={s.n} className="how-step">
                <div className="how-step-number">{s.n}</div>
                <div className="how-step-title">{s.t}</div>
                <p className="how-step-desc">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ── STUDY MODES ── */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <div className="section-eyebrow">Study Modes</div>
            <h2 className="section-title">Study at your own pace. Score on your terms.</h2>
            <p className="section-desc" style={{ margin: '0 auto' }}>
              Three modes. One goal — maximizing your marks with the time available.
            </p>
          </div>

          <div className="modes-grid">
            {modes.map(m => (
              <div
                key={m.label}
                className={`mode-card${m.popular ? ' mode-popular' : ''}`}
              >
                {m.popular && (
                  <div className="mode-popular-badge">Most Popular</div>
                )}
                <div className="mode-score" style={{ color: m.color }}>
                  {m.score}
                </div>
                <div className="mode-label">{m.label}</div>
                <p className="mode-desc">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ── TESTIMONIALS ── */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 className="section-title">Students who used SSP — in their own words</h2>
          </div>

          <div className="testimonials-grid">
            {testimonials.map(t => (
              <div key={t.name} className="testimonial-card">
                <div className="testimonial-stars">★★★★★</div>
                <p className="testimonial-quote">"{t.quote}"</p>
                <div className="testimonial-footer">
                  <div>
                    <div className="testimonial-name">{t.name}</div>
                    <div className="testimonial-branch">{t.branch}</div>
                  </div>
                  <div className="testimonial-score">Scored {t.score}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* ── CTA SECTION ── */}
      <section className="cta-section">
        <div className="container-sm">
          <h2 className="cta-title">Ready to ace your exams?</h2>
          <p className="cta-desc">
            Join thousands of students who stopped guessing what to study and
            started winning with AI-powered exam strategy.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/register')}
            >
              <Target size={16} strokeWidth={2} />
              Start Planning Free
            </button>
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => navigate('/login')}
            >
              <ArrowRight size={15} strokeWidth={2} />
              Already a member? Sign In
            </button>
          </div>
          <p className="cta-fine">
            No credit card required · Free forever
          </p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="landing-footer">
        <div className="footer-logo">
          <div className="footer-logo-mark">
            <Zap size={14} strokeWidth={2.5} />
          </div>
          <div className="footer-logo-name">Smart Syllabus Planner</div>
        </div>
        <p className="footer-copy">
          © {new Date().getFullYear()} Smart Syllabus Planner. All rights reserved.
        </p>
      </footer>

    </div>
  );
};

export default Landing;

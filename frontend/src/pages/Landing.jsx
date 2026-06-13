import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  BrainCircuit, Zap, Target, Map, Users, Trophy,
  Upload, CheckCircle, RefreshCcw, Search, Calendar,
  ArrowRight, LogIn, Sun, Moon,
} from 'lucide-react';

const Landing = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  const handleHowItWorks = () => {
    document.getElementById('how-it-works')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  const heroPills = [
    { label: "AI Syllabus Parser", Icon: BrainCircuit },
    { label: "Crisis Survival Mode", Icon: Zap },
    { label: "PYQ Alignment", Icon: Search },
    { label: "Auto-Rescheduling", Icon: Calendar },
    { label: "College Study Feed", Icon: Users },
    { label: "Gamification + Leaderboard", Icon: Trophy }
  ];

  const bentoCards = [
    {
      Icon: BrainCircuit,
      tag: "Core Feature",
      title: "AI Syllabus Analyzer",
      desc: "Upload a PDF, image, or paste text. Gemini AI extracts every unit and topic, assigns importance levels (critical/high/medium/low), estimates marks weightage, and calculates study hours — grounded only in what your syllabus actually says. Temperature set to 0.1 for deterministic extraction.",
      size: "bento-lg"
    },
    {
      Icon: Zap,
      tag: "Most Used",
      title: "Crisis Survival Mode",
      desc: "1 day left? Select a timeline preset. AI gives you a must-study list, a skip-topics list, and an hour-by-hour schedule capped to your available hours.",
      size: "bento-sm"
    },
    {
      Icon: Search,
      tag: "Evidence-Based",
      title: "Past Year Paper Alignment",
      desc: "Upload previous exam papers. The system cross-references questions against your syllabus and outputs three buckets: Overlap Topics (study first), PYQ-Only Topics (gaps), and AI-Only Topics (lower priority). No guessing.",
      size: "bento-md"
    },
    {
      Icon: Map,
      tag: "AI-Powered",
      title: "Smart Study Planner",
      desc: "Day-by-day roadmap to your exam date. Filters topics by your target goal. Detects missed days and auto-redistributes topics. Exports as .ics to Google Calendar, Apple Calendar, or Outlook.",
      size: "bento-md"
    },
    {
      Icon: Users,
      tag: "New",
      title: "College Study Feed",
      desc: "Share notes, summaries, and resources with students from your college. Upvote, filter by subject, and earn contributor badges.",
      size: "bento-sm"
    },
    {
      Icon: Trophy,
      tag: "21 Features Total",
      title: "Full Gamification Stack",
      desc: "XP, levels, daily streaks with streak freeze protection, confidence ratings per topic, 2x XP Fridays, quick quiz after missions, weekly performance report, GitHub-style activity grid, and a public leaderboard. Study progress that compounds.",
      size: "bento-lg"
    }
  ];

  const howSteps = [
    {
      num: "01",
      Icon: Upload,
      title: "Upload Your Syllabus",
      desc: "PDF, image, or paste text. Any format works."
    },
    {
      num: "02",
      Icon: BrainCircuit,
      title: "AI Analyzes It",
      desc: "Topics extracted, prioritized, and structured in under 2 minutes."
    },
    {
      num: "03",
      Icon: Map,
      title: "Get Your Roadmap",
      desc: "Personalized day-by-day plan plus daily missions generated."
    },
    {
      num: "04",
      Icon: CheckCircle,
      title: "Execute and Track",
      desc: "Complete missions, earn XP, track progress, ace your exam."
    }
  ];

  const spotlights = [
    {
      badge: "3 days before exam",
      bg: "rgba(239, 68, 68, 0.12)",
      color: "var(--danger)",
      Icon: Zap,
      title: "Activate Crisis Mode",
      body: "Select a 3-day preset. Topiq gives you a must-study list of critical topics, tells you exactly what to skip, and generates an hour-by-hour study schedule fitted to your available hours — not a generic timetable.",
      tag: "Cheat Code System"
    },
    {
      badge: "Uploaded a 40-page syllabus",
      bg: "rgba(14, 165, 233, 0.12)",
      color: "var(--info)",
      Icon: BrainCircuit,
      title: "AI Parses It in 90 Seconds",
      body: "Every unit, every topic, extracted with importance ratings and marks weightage. The AI only uses what's written in your syllabus — no hallucinated topics, no guesswork. Upload PYQs alongside it to get evidence-backed priorities.",
      tag: "AI Syllabus Analyzer + PYQ Alignment"
    },
    {
      badge: "Missed 3 days of study",
      bg: "rgba(245, 158, 11, 0.12)",
      color: "var(--warning)",
      Icon: RefreshCcw,
      title: "Topiq Catches You Up",
      body: "The planner detects missed days and shows a reschedule banner. One click redistributes those topics across your remaining days. Your streak is protected by Streak Freeze Tokens. No guilt, just a revised plan.",
      tag: "Auto-Rescheduling + Streak Freeze"
    }
  ];

  const modes = [
    {
      label: "Pass Mode",
      score: "40%+",
      color: "var(--success)",
      desc: "Focus on high-mark topics only. Efficient strategy for clearing the exam with the least possible time."
    },
    {
      label: "Score Mode",
      score: "65%+",
      color: "var(--accent)",
      desc: "Balanced preparation. Cover important and medium topics well, skip low-priority content.",
      popular: true
    },
    {
      label: "Topper Mode",
      score: "85%+",
      color: "var(--warning)",
      desc: "Complete coverage. Deep dives, revision cycles, and practice for every unit in your syllabus."
    }
  ];

  const stats = [
    { value: "21", label: "Features Built" },
    { value: "3", label: "Study Modes" },
    { value: "<2 min", label: "AI Analysis Time" },
    { value: "Free", label: "Always" }
  ];

  return (
    <div className="landing-page">
      {/* --- SECTION 1: NAVBAR --- */}
      <nav className="landing-nav">
        <div className="landing-nav-logo">
          <div className="landing-nav-logo-mark">T</div>
          <div className="landing-nav-name">Topiq</div>
          <div className="landing-nav-tagline">AI Exam Prep</div>
        </div>

        <div className="landing-nav-actions">
          <button
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => navigate('/login')}
          >
            <LogIn size={15} />
            <span className="landing-nav-signin-text" style={{ marginLeft: '6px' }}>Sign In</span>
          </button>

          <button
            className="btn btn-primary btn-sm"
            onClick={() => navigate('/register')}
          >
            Get Started
          </button>
        </div>
      </nav>

      {/* --- SECTION 2: HERO --- */}
      <section className="landing-hero">
        <div className="hero-content">
          <div className="hero-accent-line" />
          <h1 className="hero-title">
            Stop Guessing.<br />Start Scoring.
          </h1>
          <p className="hero-subtitle">
            Upload your syllabus. Get a personalized study plan, daily missions, and exam survival strategies — powered by Gemini AI.
          </p>
          <div className="hero-ctas">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/register')}
            >
              <Target size={16} style={{ marginRight: '8px' }} />
              Start Planning Free
            </button>
            <button
              className="btn btn-secondary btn-lg"
              onClick={handleHowItWorks}
            >
              <ArrowRight size={15} style={{ marginRight: '8px' }} />
              See How It Works
            </button>
          </div>
          <div className="cta-fine" style={{ marginTop: '16px' }}>
            No credit card · Free forever · Works with any syllabus format
          </div>

          <div className="hero-pills">
            {heroPills.map((p, idx) => {
              const IconComponent = p.Icon;
              return (
                <div key={idx} className="hero-pill">
                  <IconComponent size={12} />
                  <span>{p.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* --- SECTION 3: FEATURE SHOWCASE (Bento Grid) --- */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div className="section-eyebrow">What Topiq Does</div>
            <h2 className="section-title">Everything you need to go from syllabus to exam-ready</h2>
          </div>

          <div className="bento-grid">
            {bentoCards.map((c, idx) => {
              const IconComponent = c.Icon;
              return (
                <div key={idx} className={`bento-card ${c.size}`}>
                  <div className="bento-card-top">
                    <IconComponent size={24} className="bento-icon" />
                    {c.tag && <span className="bento-tag">{c.tag}</span>}
                  </div>
                  <h3 className="bento-card-title">{c.title}</h3>
                  <p className="bento-card-desc">{c.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- SECTION 4: HOW IT WORKS --- */}
      <section id="how-it-works" className="section" style={{ background: 'var(--bg-2)', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)' }}>
        <div className="container-lg">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div className="section-eyebrow">How It Works</div>
            <h2 className="section-title">From syllabus to exam-ready in 4 steps</h2>
          </div>

          <div className="how-grid">
            {howSteps.map((s, idx) => {
              const IconComponent = s.Icon;
              return (
                <div key={idx} className="how-step">
                  <div className="how-step-number">{s.num}</div>
                  <div className="how-step-icon">
                    <IconComponent size={32} />
                  </div>
                  <h3 className="how-step-title">{s.title}</h3>
                  <p className="how-step-desc">{s.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* --- SECTION 5: FEATURE SPOTLIGHTS --- */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '48px' }}>
            <div className="section-eyebrow">Real Scenarios</div>
            <h2 className="section-title">Built for how students actually study</h2>
            <p className="section-desc" style={{ margin: '8px auto 0' }}>
              Not how they're supposed to study.
            </p>
          </div>

          <div className="spotlights-grid">
            {spotlights.map((s, idx) => {
              const IconComponent = s.Icon;
              return (
                <div key={idx} className="spotlight-card">
                  <div>
                    <span
                      className="spotlight-scenario"
                      style={{ background: s.bg, color: s.color }}
                    >
                      {s.badge}
                    </span>
                  </div>
                  <IconComponent size={20} style={{ color: s.color, marginBottom: '12px' }} />
                  <h3 className="spotlight-title">{s.title}</h3>
                  <p className="spotlight-body">{s.body}</p>
                  <div className="spotlight-feature-tag">{s.tag}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <hr className="section-divider" />

      {/* --- SECTION 6: STUDY MODES --- */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '40px' }}>
            <div className="section-eyebrow">Study Modes</div>
            <h2 className="section-title">Three modes. One goal.</h2>
          </div>

          <div className="modes-grid">
            {modes.map((m, idx) => (
              <div
                key={idx}
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

      {/* --- SECTION 7: SOCIAL PROOF STATS --- */}
      <section className="stats-band">
        <div className="landing-footer-inner">
          <div className="stats-band-inner" style={{ width: '100%' }}>
            {stats.map((s, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '48px' }}>
                <div className="stat-item">
                  <div className="stat-item-value">{s.value}</div>
                  <div className="stat-item-label">{s.label}</div>
                </div>
                {idx < stats.length - 1 && (
                  <div className="stat-separator" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- SECTION 8: CTA BANNER --- */}
      <section className="cta-section">
        <div className="container-sm">
          <div className="hero-accent-line" style={{ marginBottom: '24px' }} />
          <h2 className="cta-title">Ready to ace your exams?</h2>
          <p className="cta-desc">
            Upload your syllabus. Get your plan. Start today.
          </p>
          <div className="hero-ctas">
            <button
              className="btn btn-primary btn-lg"
              onClick={() => navigate('/register')}
            >
              <Target size={16} style={{ marginRight: '8px' }} />
              Start Planning Free
            </button>
            <button
              className="btn btn-secondary btn-lg"
              onClick={handleHowItWorks}
            >
              <ArrowRight size={15} style={{ marginRight: '8px' }} />
              See How It Works
            </button>
          </div>
          <div className="cta-fine">No credit card required · Free forever</div>
        </div>
      </section>

      {/* --- SECTION 9: FOOTER --- */}
      <footer className="landing-footer">
        <div className="landing-footer-inner">
          <div className="footer-logo">
            <div className="footer-logo-mark">T</div>
            <div className="footer-logo-name">Topiq</div>
          </div>

          <div className="footer-nav">
            <button className="footer-nav-link" onClick={() => navigate('/login')}>
              Sign In
            </button>
            <button className="footer-nav-link" onClick={() => navigate('/register')}>
              Get Started
            </button>
          </div>

          <p className="footer-copy">
            © 2025 Topiq. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;

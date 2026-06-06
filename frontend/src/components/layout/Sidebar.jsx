// Sidebar.jsx — Premium branded sidebar with full product name
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navSections = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', icon: '⚡', label: 'Dashboard', desc: 'Your command center' },
    ],
  },
  {
    label: 'Study Tools',
    items: [
      { to: '/subjects',      icon: '📚', label: 'My Subjects',    desc: 'Manage subjects' },
      { to: '/missions',      icon: '🎯', label: 'Daily Missions', desc: 'Today\'s tasks' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/notifications', icon: '🔔', label: 'Notifications',  desc: 'Alerts & reminders', badge: true },
      { to: '/profile',       icon: '👤', label: 'Profile',        desc: 'Settings & goals' },
    ],
  },
];

const goalLabel = {
  excellent: { text: 'Topper Mode', icon: '🏆', color: '#f59e0b' },
  good:      { text: 'Score Mode',  icon: '🎯', color: '#6366f1' },
  pass:      { text: 'Pass Mode',   icon: '✅', color: '#10b981' },
};

const Sidebar = ({ unreadCount = 0 }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const goal = goalLabel[user?.targetGoal] || goalLabel.good;

  return (
    <aside className="sidebar">
      {/* ── Logo Area ── */}
      <div className="sidebar-logo-area">
        <div className="sidebar-brand">
          <div className="sidebar-icon">⚡</div>
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-name">Smart Syllabus Planner</div>
            <div className="sidebar-brand-sub">AI Exam Assistant</div>
          </div>
        </div>
        <div className="sidebar-tagline">
          🚀 Turn Syllabus into Daily Wins
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="sidebar-nav">
        {navSections.map(section => (
          <div key={section.label} className="sidebar-nav-section">
            <div className="sidebar-nav-label">{section.label}</div>
            {section.items.map(item => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
              >
                <div className="nav-icon-wrap">
                  {item.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.855rem', fontWeight: 600, lineHeight: 1.2 }}>{item.label}</div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-disabled)', lineHeight: 1, marginTop: 1 }}>{item.desc}</div>
                </div>
                {item.badge && unreadCount > 0 && (
                  <span className="nav-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}

        {/* Motivational card */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(6,182,212,0.08))',
          border: '1px solid rgba(99,102,241,0.2)',
          borderRadius: 12, padding: '14px 12px', marginTop: 8,
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary-light)', marginBottom: 6 }}>
            💡 Study Smarter
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 10 }}>
            Upload your syllabus to unlock AI-powered study plans and cheat codes.
          </div>
          <button
            onClick={() => navigate('/subjects')}
            style={{
              width: '100%', background: 'var(--brand-gradient)',
              border: 'none', borderRadius: 8, padding: '7px',
              fontSize: '0.72rem', fontWeight: 700, color: '#fff',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            Go to Subjects →
          </button>
        </div>
      </nav>

      {/* ── Footer / User ── */}
      <div className="sidebar-footer">
        {/* User card */}
        <NavLink to="/profile" className="sidebar-user-card" style={{ textDecoration: 'none' }}>
          <div className="sidebar-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || 'Student'}
            </div>
            <div style={{ fontSize: '0.65rem', fontWeight: 600, color: goal.color, marginTop: 1 }}>
              {goal.icon} {goal.text}
            </div>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-disabled)' }}>⚙️</div>
        </NavLink>

        <button
          onClick={() => { logout(); navigate('/'); }}
          className="sidebar-nav-item"
          style={{ width: '100%', background: 'none', border: '1px solid transparent', cursor: 'pointer', marginBottom: 0 }}
        >
          <div className="nav-icon-wrap">🚪</div>
          <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)', fontWeight: 500 }}>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

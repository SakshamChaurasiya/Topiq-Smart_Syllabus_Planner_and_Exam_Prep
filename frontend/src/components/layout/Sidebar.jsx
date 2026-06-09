// Sidebar.jsx — Compact app sidebar with mobile drawer support
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { getLevelTitle } from '../../constants/xpSystem';
import {
  LayoutDashboard, BookOpen, Target,
  Bell, User, LogOut, Sun, Moon, X, Sparkles, ArrowRight,
  BarChart2,
} from 'lucide-react';

const navSections = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', Icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/analytics', Icon: BarChart2,       label: 'Analytics' },
    ],
  },
  {
    label: 'Study',
    items: [
      { to: '/subjects',  Icon: BookOpen, label: 'My Subjects' },
      { to: '/missions',  Icon: Target,   label: 'Daily Missions' },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/notifications', Icon: Bell,  label: 'Notifications', badge: true },
      { to: '/profile',       Icon: User,  label: 'Profile' },
    ],
  },
];

const goalLabel = {
  excellent: { text: 'Topper Mode', color: '#f59e0b' },
  good:      { text: 'Score Mode',  color: '#6C47FF' },
  pass:      { text: 'Pass Mode',   color: '#22c55e' },
};

const Sidebar = ({ unreadCount = 0, mobileOpen = false, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const goal = goalLabel[user?.targetGoal] || goalLabel.good;

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  const handleClose = () => { if (onClose) onClose(); };

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`sidebar-overlay${mobileOpen ? ' active' : ''}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      <aside className={`sidebar${mobileOpen ? ' open' : ''}`}>

        {/* Mobile close button */}
        <button
          className="sidebar-mobile-close"
          onClick={handleClose}
          aria-label="Close navigation"
        >
          <X size={14} />
        </button>

        {/* ── Brand header ── */}
        <div className="sidebar-brand-header">
          <div className="sidebar-brand-logo">T</div>
          <span className="sidebar-brand-name">Topiq</span>
        </div>

        {/* ── User header (avatar + name) ── */}
        <div className="sidebar-user-header">
          <div className="sidebar-avatar-circle">{initials}</div>
          <div className="sidebar-user-meta">
            <div className="sidebar-user-name">{user?.name || 'Student'}</div>
            <div className="sidebar-user-level-title" style={{ color: 'var(--txt-3)', fontSize: '0.72rem', marginTop: '2px', fontWeight: 600 }}>
              {getLevelTitle(user?.level || 1).emoji} {getLevelTitle(user?.level || 1).title}
            </div>
            <div className="sidebar-user-level" style={{ color: goal.color }}>
              {goal.text}
            </div>
          </div>
        </div>

        {/* ── Navigation ── */}
        <nav className="sidebar-nav">
          {navSections.map(section => (
            <div key={section.label} className="sidebar-nav-section">
              <div className="sidebar-section-label">{section.label}</div>
              {section.items.map(({ to, Icon, label, badge }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={handleClose}
                  className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
                >
                  <span className="nav-icon">
                    <Icon size={16} strokeWidth={1.75} />
                  </span>
                  {label}
                  {badge && unreadCount > 0 && (
                    <span className="nav-link-badge">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}

          {/* Promo card */}
          <div className="sidebar-promo-card">
            <div className="sidebar-promo-header">
              <Sparkles size={12} strokeWidth={2} />
              Study Smarter
            </div>
            <p className="sidebar-promo-body">
              Upload your syllabus to unlock AI-powered study plans.
            </p>
            <button
              onClick={() => { navigate('/subjects'); handleClose(); }}
              className="sidebar-promo-btn"
            >
              Go to Subjects <ArrowRight size={11} strokeWidth={2.5} />
            </button>
          </div>
        </nav>

        {/* ── Footer (pinned bottom) ── */}
        <div className="sidebar-footer">
          {/* Compact XP bar */}
          {user?.xp != null && user?.xpToNext != null && (
            <div className="sidebar-xp-compact" title={`${user.xp} / ${user.xpToNext} XP`}>
              <div
                className="sidebar-xp-compact-fill"
                style={{ width: `${Math.min((user.xp / user.xpToNext) * 100, 100)}%` }}
              />
            </div>
          )}

          {/* Streak */}
          {user?.streak != null && (
            <div className="sidebar-streak-line">
              🔥 {user.streak} day streak
            </div>
          )}

          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="sidebar-link sidebar-theme-toggle"
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span className="sidebar-icon">
              {theme === 'dark'
                ? <Sun size={16} strokeWidth={1.75} />
                : <Moon size={16} strokeWidth={1.75} />}
            </span>
            <span className="sidebar-link-label">
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </span>
          </button>

          {/* Sign out */}
          <button
            onClick={() => { logout(); navigate('/'); }}
            className="sidebar-link sidebar-logout"
          >
            <span className="sidebar-icon">
              <LogOut size={16} strokeWidth={1.75} />
            </span>
            <span className="sidebar-link-label">Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;

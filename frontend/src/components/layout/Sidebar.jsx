// Sidebar.jsx — Premium branded sidebar with Lucide icons
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Zap, LayoutDashboard, BookOpen, Target,
  Bell, User, LogOut, Sparkles, ArrowRight, Settings,
} from 'lucide-react';

const navSections = [
  {
    label: 'Overview',
    items: [
      { to: '/dashboard', Icon: LayoutDashboard, label: 'Dashboard', desc: 'Your command center' },
    ],
  },
  {
    label: 'Study Tools',
    items: [
      { to: '/subjects',  Icon: BookOpen, label: 'My Subjects',    desc: 'Manage subjects' },
      { to: '/missions',  Icon: Target,   label: 'Daily Missions', desc: "Today's tasks" },
    ],
  },
  {
    label: 'Account',
    items: [
      { to: '/notifications', Icon: Bell,  label: 'Notifications', desc: 'Alerts & reminders', badge: true },
      { to: '/profile',       Icon: User,  label: 'Profile',       desc: 'Settings & goals' },
    ],
  },
];

const goalLabel = {
  excellent: { text: 'Topper Mode', color: '#f59e0b' },
  good:      { text: 'Score Mode',  color: '#6366f1' },
  pass:      { text: 'Pass Mode',   color: '#10b981' },
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
          <div className="sidebar-icon-logo">
            <Zap size={18} strokeWidth={2.5} />
          </div>
          <div className="sidebar-brand-text">
            <div className="sidebar-brand-name">Smart Syllabus Planner</div>
            <div className="sidebar-brand-sub">AI Exam Assistant</div>
          </div>
        </div>
        <div className="sidebar-tagline">Turn Syllabus into Daily Wins</div>
      </div>

      {/* ── Navigation ── */}
      <nav className="sidebar-nav">
        {navSections.map(section => (
          <div key={section.label} className="sidebar-nav-section">
            <div className="sidebar-section-label">{section.label}</div>
            {section.items.map(({ to, Icon, label, desc, badge }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
              >
                <span className="sidebar-icon">
                  <Icon size={17} strokeWidth={1.75} />
                </span>
                <span className="sidebar-link-text">
                  <span className="sidebar-link-label">{label}</span>
                  <span className="sidebar-link-desc">{desc}</span>
                </span>
                {badge && unreadCount > 0 && (
                  <span className="sidebar-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
                )}
              </NavLink>
            ))}
          </div>
        ))}

        {/* Motivational promo card */}
        <div className="sidebar-promo-card">
          <div className="sidebar-promo-header">
            <Sparkles size={14} strokeWidth={2} />
            Study Smarter
          </div>
          <p className="sidebar-promo-body">
            Upload your syllabus to unlock AI-powered study plans and cheat codes.
          </p>
          <button
            onClick={() => navigate('/subjects')}
            className="sidebar-promo-btn"
          >
            Go to Subjects <ArrowRight size={12} strokeWidth={2.5} />
          </button>
        </div>
      </nav>

      {/* ── Footer / User ── */}
      <div className="sidebar-footer">
        <NavLink to="/profile" className="sidebar-user-card" style={{ textDecoration: 'none' }}>
          <div className="sidebar-avatar">
            {user?.name?.charAt(0)?.toUpperCase() || '?'}
          </div>
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.name || 'Student'}</div>
            <div className="sidebar-user-goal" style={{ color: goal.color }}>
              {goal.text}
            </div>
          </div>
          <Settings size={14} strokeWidth={1.75} className="sidebar-user-settings" />
        </NavLink>

        <button
          onClick={() => { logout(); navigate('/'); }}
          className="sidebar-link sidebar-logout"
        >
          <span className="sidebar-icon">
            <LogOut size={17} strokeWidth={1.75} />
          </span>
          <span className="sidebar-link-label">Sign Out</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

// Topbar.jsx — Motivational top bar with Lucide icons + theme toggle + hamburger
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Trophy, Target, CheckCircle, Zap, Sun, Moon, Menu } from 'lucide-react';

const motivationalMessages = [
  'Keep the streak going!',
  'You got this — study smart today',
  'Small missions. Big results.',
  'Complete More. Stress Less.',
  'Study Smarter. Score Better.',
  'Every topic completed counts!',
];

const goalMeta = {
  excellent: { label: 'Topper Mode', color: '#f59e0b', Icon: Trophy },
  good:      { label: 'Score Mode',  color: '#6C47FF', Icon: Target },
  pass:      { label: 'Pass Mode',   color: '#22c55e', Icon: CheckCircle },
};

const Topbar = ({ title, subtitle, onMenuClick }) => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const hour = new Date().getHours();
  const greeting =
    hour < 5  ? 'Night owl' :
    hour < 12 ? 'Good morning' :
    hour < 17 ? 'Good afternoon' :
                'Good evening';
  const msg = motivationalMessages[new Date().getDay() % motivationalMessages.length];

  const meta = goalMeta[user?.targetGoal] || goalMeta.good;
  const { label: goalLabel, color: goalColor, Icon: GoalIcon } = meta;

  return (
    <header className="topbar">
      {/* Mobile: hamburger button */}
      {onMenuClick && (
        <button
          className="topbar-hamburger"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu size={20} strokeWidth={1.75} />
        </button>
      )}

      <div className="topbar-left">
        {title ? (
          <>
            <h2 className="topbar-title">{title}</h2>
            {subtitle && <p className="topbar-subtitle">{subtitle}</p>}
          </>
        ) : (
          <div>
            <div className="topbar-greeting">
              {greeting},{' '}
              <strong className="topbar-name">{user?.name?.split(' ')[0] || 'Student'}</strong>
            </div>
            <div className="topbar-msg">{msg}</div>
          </div>
        )}
      </div>

      <div className="topbar-right">
        {/* Goal badge */}
        <div className="topbar-goal-badge" style={{ '--goal-color': goalColor }}>
          <GoalIcon size={13} strokeWidth={2.5} style={{ color: goalColor }} />
          <span style={{ color: goalColor }}>{goalLabel}</span>
        </div>

        {/* Brand chip (hidden on mobile) */}
        <div className="topbar-brand-chip">
          <Zap size={12} strokeWidth={2.5} />
          <span>Topiq</span>
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="theme-toggle"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
      </div>
    </header>
  );
};

export default Topbar;

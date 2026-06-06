// Topbar.jsx — Motivational top bar with Lucide icons
import { useAuth } from '../../context/AuthContext';
import { Trophy, Target, CheckCircle, Zap } from 'lucide-react';

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
  good:      { label: 'Score Mode',  color: '#6366f1', Icon: Target },
  pass:      { label: 'Pass Mode',   color: '#10b981', Icon: CheckCircle },
};

const Topbar = ({ title, subtitle }) => {
  const { user } = useAuth();

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

        {/* Brand chip */}
        <div className="topbar-brand-chip">
          <Zap size={12} strokeWidth={2.5} />
          <span>SSP</span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;

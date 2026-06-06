// Topbar.jsx — Motivational top bar with dynamic greetings
import { useAuth } from '../../context/AuthContext';

const motivationalMessages = [
  '🔥 Keep the streak going!',
  '🚀 You got this — study smart today',
  '🎯 Small missions. Big results.',
  '⚡ Complete More. Stress Less.',
  '🏆 Study Smarter. Score Better.',
  '💪 Every topic completed counts!',
];

const Topbar = ({ title, subtitle }) => {
  const { user } = useAuth();

  const hour = new Date().getHours();
  const greeting = hour < 5 ? '🌙 Night owl' : hour < 12 ? '☀️ Good morning' : hour < 17 ? '🌤 Good afternoon' : '🌙 Good evening';
  const msg = motivationalMessages[new Date().getDay() % motivationalMessages.length];

  const goalColors = { excellent: '#f59e0b', good: '#6366f1', pass: '#10b981' };
  const goalLabels = { excellent: '🏆 Topper', good: '🎯 Score', pass: '✅ Pass' };

  return (
    <header className="topbar">
      <div>
        {title ? (
          <>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>{title}</h2>
            {subtitle && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: 0 }}>{subtitle}</p>}
          </>
        ) : (
          <div>
            <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: 1 }}>
              {greeting},{' '}
              <strong style={{ color: 'var(--text-primary)', fontWeight: 700 }}>
                {user?.name?.split(' ')[0] || 'Student'}
              </strong>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-disabled)', fontWeight: 500 }}>{msg}</div>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* Goal badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: `${goalColors[user?.targetGoal] || '#6366f1'}15`,
          border: `1px solid ${goalColors[user?.targetGoal] || '#6366f1'}35`,
          borderRadius: 'var(--r-full)', padding: '5px 14px',
          fontSize: '0.75rem', fontWeight: 700,
          color: goalColors[user?.targetGoal] || 'var(--primary-light)',
        }}>
          {goalLabels[user?.targetGoal] || '🎯 Score'} Mode
        </div>

        {/* Brand identifier */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 7,
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--r-full)', padding: '5px 14px',
        }}>
          <span style={{ fontSize: '0.7rem' }}>⚡</span>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '-0.01em' }}>
            Smart Syllabus Planner
          </span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;

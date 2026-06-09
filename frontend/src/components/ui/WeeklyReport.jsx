import React from 'react';

const WeeklyReport = ({ report, loading }) => {
  if (loading || !report) {
    return (
      <div className="card animate-fade-in" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ height: '20px', background: 'var(--surface)', borderRadius: 'var(--r8)', animation: 'pulse-glow 1.5s ease-in-out infinite' }} />
        <div style={{ height: '60px', background: 'var(--surface)', borderRadius: 'var(--r8)', animation: 'pulse-glow 1.5s ease-in-out infinite' }} />
        <div style={{ height: '30px', background: 'var(--surface)', borderRadius: 'var(--r8)', animation: 'pulse-glow 1.5s ease-in-out infinite' }} />
      </div>
    );
  }

  const {
    missionsCompleted,
    missionsTotal,
    completionRate,
    hoursStudied,
    topicsCompleted,
    strongestSubject,
    weakestSubject,
    currentStreak,
    xpEarnedThisWeek,
    weekLabel,
  } = report;

  return (
    <div className="card animate-fade-in" style={{ padding: '16px 20px' }}>
      {/* Header */}
      <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'none', padding: 0, marginBottom: '12px' }}>
        <div className="card-title" style={{ fontSize: '0.9rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
          This Week 📊
        </div>
        <span style={{ fontSize: '0.72rem', color: 'var(--txt-3)', fontWeight: 600 }}>
          {weekLabel}
        </span>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
        <div className="stat-pill" style={{ flex: '1 1 calc(50% - 4px)', padding: '10px', minWidth: '90px' }}>
          <div className="stat-pill-value" style={{ fontSize: '0.95rem', fontWeight: 800 }}>
            {missionsCompleted}/{missionsTotal}
          </div>
          <div className="stat-pill-label" style={{ fontSize: '0.65rem', color: 'var(--txt-3)' }}>Missions</div>
        </div>
        <div className="stat-pill" style={{ flex: '1 1 calc(50% - 4px)', padding: '10px', minWidth: '90px' }}>
          <div className="stat-pill-value" style={{ fontSize: '0.95rem', fontWeight: 800 }}>
            {hoursStudied}h
          </div>
          <div className="stat-pill-label" style={{ fontSize: '0.65rem', color: 'var(--txt-3)' }}>Hours</div>
        </div>
        <div className="stat-pill" style={{ flex: '1 1 calc(50% - 4px)', padding: '10px', minWidth: '90px' }}>
          <div className="stat-pill-value" style={{ fontSize: '0.95rem', fontWeight: 800 }}>
            {topicsCompleted}
          </div>
          <div className="stat-pill-label" style={{ fontSize: '0.65rem', color: 'var(--txt-3)' }}>Topics</div>
        </div>
        <div className="stat-pill" style={{ flex: '1 1 calc(50% - 4px)', padding: '10px', minWidth: '90px' }}>
          <div className="stat-pill-value" style={{ fontSize: '0.95rem', fontWeight: 800 }}>
            {xpEarnedThisWeek}
          </div>
          <div className="stat-pill-label" style={{ fontSize: '0.65rem', color: 'var(--txt-3)' }}>XP</div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 700, color: 'var(--txt-2)', marginBottom: '4px' }}>
          <span>Weekly completion</span>
          <span>{completionRate}%</span>
        </div>
        <div className="progress-bar" style={{ height: '5px', borderRadius: 'var(--r-full)', background: 'var(--surface2)', overflow: 'hidden' }}>
          <div 
            className="progress-bar-fill" 
            style={{ 
              width: `${completionRate}%`, 
              height: '100%', 
              background: 'var(--accent)', 
              borderRadius: 'var(--r-full)' 
            }} 
          />
        </div>
      </div>

      {/* Two-column Row (Strongest/Weakest) */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        <div style={{ flex: 1, padding: '8px 10px', background: 'var(--surface2)', borderRadius: 'var(--r8)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.62rem', color: 'var(--txt-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            💪 Strongest
          </div>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--txt)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {strongestSubject?.name || '—'}
          </div>
        </div>
        <div style={{ flex: 1, padding: '8px 10px', background: 'var(--surface2)', borderRadius: 'var(--r8)', border: '1px solid var(--border)' }}>
          <div style={{ fontSize: '0.62rem', color: 'var(--txt-3)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            ⚠️ Needs Work
          </div>
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: weakestSubject ? 'var(--warning)' : 'var(--success)', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {weakestSubject?.name || 'All good!'}
          </div>
        </div>
      </div>

      {/* Streak Section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.78rem', color: 'var(--txt-2)' }}>
        <span>🔥 Current Streak:</span>
        <span style={{ fontWeight: 800, color: 'var(--txt)' }}>{currentStreak} day{currentStreak !== 1 ? 's' : ''}</span>
      </div>

      {/* Perfect Week Banner */}
      {completionRate === 100 && (
        <div style={{ display: 'block', textAlign: 'center', background: 'var(--success)', color: '#fff', padding: '6px 12px', borderRadius: 'var(--r8)', fontSize: '0.75rem', fontWeight: 700, marginTop: '12px' }}>
          Perfect week! 🏆
        </div>
      )}
    </div>
  );
};

export default WeeklyReport;

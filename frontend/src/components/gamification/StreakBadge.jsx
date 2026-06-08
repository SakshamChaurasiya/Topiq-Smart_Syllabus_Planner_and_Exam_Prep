// StreakBadge.jsx — Gamification streak badge component
import React from 'react';

const StreakBadge = ({ streak, freezeTokens = 0 }) => {
  return (
    <div className="streak-badge">
      <span className="streak-icon">🔥</span>
      <span className="streak-count">{streak}</span>
      <span>Day Streak</span>
      {freezeTokens > 0 && (
        <div className="tooltip-wrap streak-freeze-badge" style={{ cursor: 'pointer' }}>
          <span>🧊</span>
          <div className="tooltip-box">
            You have {freezeTokens} Streak Freeze token(s). Your streak is protected if you miss a day.
          </div>
        </div>
      )}
    </div>
  );
};

export default StreakBadge;

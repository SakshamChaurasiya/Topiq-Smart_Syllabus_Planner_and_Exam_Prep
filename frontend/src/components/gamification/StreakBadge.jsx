// StreakBadge.jsx — Gamification streak badge component
import React from 'react';

const StreakBadge = ({ streak }) => {
  return (
    <div className="streak-badge">
      <span className="streak-icon">🔥</span>
      <span className="streak-count">{streak}</span>
      <span>Day Streak</span>
    </div>
  );
};

export default StreakBadge;

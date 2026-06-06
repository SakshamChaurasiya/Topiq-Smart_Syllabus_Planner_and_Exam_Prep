// XPProgressBar.jsx — Gamification XP progress bar component
import React from 'react';

const XPProgressBar = ({ currentXP, targetXP, level }) => {
  const progress = Math.min((currentXP / targetXP) * 100, 100);

  return (
    <div className="xp-bar">
      <div className="xp-icon">⭐</div>
      <div className="xp-info">
        <div className="xp-label">
          <span className="xp-level">Level {level}</span>
          <span>{currentXP.toLocaleString()} / {targetXP.toLocaleString()} XP</span>
        </div>
        <div className="xp-progress">
          <div className="xp-progress-fill" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
};

export default XPProgressBar;

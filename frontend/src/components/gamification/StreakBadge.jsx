// StreakBadge.jsx — Gamification streak badge component
import React from 'react';

const StreakBadge = ({ streak, freezeTokens = 0 }) => {
  const isHot = streak >= 7;

  let flameSizeClass = 'streak-flame';
  let flameStyle = {};
  if (streak < 3) {
    flameStyle = { fontSize: '0.9em' };
  } else if (streak < 7) {
    flameStyle = { fontSize: '1em' };
  } else if (streak < 14) {
    flameStyle = { fontSize: '1.1em' };
  } else {
    flameStyle = { fontSize: '1.2em' };
    flameSizeClass = 'streak-flame pulse';
  }

  const hasTokens = freezeTokens > 0;
  const badgeBorderRadius = hasTokens ? 'var(--r-full) 0 0 var(--r-full)' : 'var(--r-full)';

  return (
    <div className="streak-badge-wrap">
      <div
        className={`streak-badge-pill ${isHot ? 'hot' : 'cold'}`}
        style={{ borderRadius: badgeBorderRadius }}
      >
        <span className={flameSizeClass} style={flameStyle}>🔥</span>
        <span>{streak} Day Streak</span>
      </div>
      {hasTokens && (
        <div
          className="tooltip-wrap streak-freeze-pill"
          style={{ borderRadius: '0 var(--r-full) var(--r-full) 0', cursor: 'pointer' }}
        >
          <span>🧊 × {freezeTokens}</span>
          <div className="tooltip-box">
            You have {freezeTokens} freeze token(s). Miss a day and your streak is protected.
          </div>
        </div>
      )}
    </div>
  );
};

export default StreakBadge;

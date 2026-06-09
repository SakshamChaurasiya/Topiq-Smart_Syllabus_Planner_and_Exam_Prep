// XPProgressBar.jsx — Gamification XP progress bar component
import React from 'react';

const XPProgressBar = ({ currentXP, targetXP, level, leveledUp = false, levelTitle }) => {
  const TIER_COLORS = {
    starter: '#94a3b8',
    rising: '#38bdf8',
    intermediate: '#818cf8',
    advanced: '#fb923c',
    elite: '#f87171',
    legendary: '#fbbf24'
  };

  const LIGHTER_COLORS = {
    starter: '#b4becd',
    rising: '#73d0fa',
    intermediate: '#a6aefa',
    advanced: '#fcb276',
    elite: '#fa9b9b',
    legendary: '#fcd265'
  };

  const tier = levelTitle?.tier || 'starter';
  const tierColor = TIER_COLORS[tier] || TIER_COLORS.starter;
  const lighterTierColor = LIGHTER_COLORS[tier] || LIGHTER_COLORS.starter;

  const progressPct = Math.min((currentXP / targetXP) * 100, 100);

  return (
    <div className="xp-bar-container" style={{ position: 'relative' }}>
      {leveledUp && (
        <div className="xp-levelup-overlay" style={{ background: tierColor + 'dd' }}>
          <span className="xp-levelup-text">
            {levelTitle?.emoji || '📖'} Level Up! → Lvl {level}
          </span>
        </div>
      )}
      <div className="xp-top-row">
        <div className="xp-level-badge" style={{ background: tierColor }}>
          {levelTitle?.emoji || '📖'} Lvl {level}
        </div>
        <div className="xp-meta-row">
          <span className="xp-title-text">{levelTitle?.title || 'First Year Energy'}</span>
          <span className="xp-numbers">{currentXP.toLocaleString()} / {targetXP.toLocaleString()} XP</span>
        </div>
      </div>
      <div className="xp-track">
        <div
          className="xp-fill"
          style={{
            width: `${progressPct}%`,
            background: `linear-gradient(90deg, ${tierColor} 0%, ${lighterTierColor} 50%, ${tierColor} 100%)`,
          }}
        />
      </div>
    </div>
  );
};

export default XPProgressBar;

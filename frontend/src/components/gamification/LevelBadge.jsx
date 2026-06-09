import React from 'react';
import { getLevelTitle } from '../../constants/xpSystem';

const getTierColor = (tier) => {
  switch (tier) {
    case 'starter': return 'var(--txt-3)';
    case 'rising': return 'var(--info)';
    case 'intermediate': return 'var(--accent)';
    case 'advanced': return 'var(--warning)';
    case 'elite': return 'var(--danger)';
    case 'legendary': return '#f59e0b';
    default: return 'var(--txt-3)';
  }
};

const LevelBadge = ({ level, size = 'md' }) => {
  const { title, emoji, tier } = getLevelTitle(level);
  const color = getTierColor(tier);

  return (
    <div className={`level-badge-container level-badge-${size}`}>
      <div 
        className="level-badge-circle" 
        style={{ backgroundColor: color }}
      >
        {level}
      </div>
      <div className="level-badge-emoji">
        {emoji}
      </div>
      <div className="level-badge-title">
        {title}
      </div>
    </div>
  );
};

export default LevelBadge;
export { getTierColor };

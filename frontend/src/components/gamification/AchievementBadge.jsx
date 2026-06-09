import React from 'react';

const AchievementBadge = ({ badge, size = 'md' }) => {
  const { id, emoji, name, desc, color, earnedAt } = badge;
  const isEarned = !!earnedAt;

  const circleSize = size === 'sm' ? 36 : 48;
  const emojiFontSize = size === 'sm' ? '1.2rem' : '1.6rem';

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  };

  const tooltipText = isEarned
    ? `${desc} - Earned ${formatDate(earnedAt)}`
    : `Locked - ${desc}`;

  return (
    <div 
      className={`achievement-badge ${isEarned ? 'earned' : 'locked'}`} 
      data-testid={`badge-${id}`}
      style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center' }}
    >
      <div className="tooltip-wrap">
        <div 
          className="badge-emoji" 
          style={{ 
            width: `${circleSize}px`, 
            height: `${circleSize}px`, 
            backgroundColor: color,
            fontSize: emojiFontSize,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%'
          }}
        >
          {emoji}
        </div>
        <div className="tooltip-box">
          {tooltipText}
        </div>
      </div>
      <span className="achievement-name">{name}</span>
    </div>
  );
};

export default AchievementBadge;

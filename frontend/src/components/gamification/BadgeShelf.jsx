import React from 'react';
import { BADGES_FRONTEND } from '../../constants/badges';
import AchievementBadge from './AchievementBadge';

const BadgeShelf = ({ badges = [] }) => {
  const earnedCount = badges.length;

  return (
    <div className="achievement-badge-shelf-container">
      <div className="badge-shelf-count" data-testid="badge-shelf-count">
        {earnedCount} / {BADGES_FRONTEND.length} badges earned
      </div>
      <div className="achievement-badge-shelf">
        {BADGES_FRONTEND.map((def) => {
          const earned = badges.find((b) => b.badgeId === def.id);
          const badgeData = {
            ...def,
            earnedAt: earned ? earned.earnedAt : null,
          };
          return (
            <AchievementBadge 
              key={def.id} 
              badge={badgeData} 
              size="md" 
            />
          );
        })}
      </div>
    </div>
  );
};

export default BadgeShelf;

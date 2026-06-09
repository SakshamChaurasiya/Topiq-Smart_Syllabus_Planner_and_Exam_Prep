/**
 * WeeklyHistoryCard.jsx
 * Component to display a horizontally scrollable list of weekly performance cards.
 */

import React from 'react';

const WeeklyHistoryCard = ({ weeklyHistory = [] }) => {
  const getRateColor = (rate) => {
    if (rate === 0) return 'var(--txt-3)';
    if (rate < 50) return 'var(--danger)';
    if (rate < 80) return 'var(--warning)';
    if (rate < 100) return 'var(--info)';
    return 'var(--success)';
  };

  return (
    <div className="week-history-scroll">
      {weeklyHistory.map((week, idx) => {
        const {
          weekLabel,
          missionsCompleted,
          missionsTotal,
          completionRate,
          xpEarned,
          isCurrentWeek,
          isGenerated,
        } = week;

        return (
          <div
            key={idx}
            className={`week-card ${isCurrentWeek ? 'current' : ''}`}
            style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}
          >
            {/* Week Label */}
            <div
              style={{
                fontSize: '0.65rem',
                color: 'var(--txt-3)',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
              }}
            >
              {weekLabel}
            </div>

            {isGenerated ? (
              <>
                {/* Completion rate */}
                <div>
                  <div
                    style={{
                      fontSize: '1.3rem',
                      fontFamily: 'var(--font-heading, Syne, sans-serif)',
                      fontWeight: 800,
                      color: getRateColor(completionRate),
                      lineHeight: 1.1,
                    }}
                  >
                    {completionRate}%
                  </div>
                  <div style={{ fontSize: '0.62rem', color: 'var(--txt-3)', fontWeight: 600 }}>
                    done
                  </div>
                </div>

                {/* Missions count */}
                <div style={{ fontSize: '0.7rem', color: 'var(--txt-2)', fontWeight: 500 }}>
                  {missionsCompleted}/{missionsTotal} missions
                </div>

                {/* XP earned */}
                <div style={{ fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 700 }}>
                  +{xpEarned} XP
                </div>
              </>
            ) : (
              <div
                style={{
                  fontSize: '0.7rem',
                  color: 'var(--txt-3)',
                  fontStyle: 'italic',
                  marginTop: '8px',
                  fontWeight: 500,
                }}
              >
                No data
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default WeeklyHistoryCard;

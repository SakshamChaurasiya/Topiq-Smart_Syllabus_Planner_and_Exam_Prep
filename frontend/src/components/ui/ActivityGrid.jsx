/**
 * ActivityGrid.jsx
 * Contribution activity grid showing 12 weeks of completed missions + topic/planner activity.
 * All date keys use local time (IST in India) to match backend IST grouping.
 */

import React, { useState } from 'react';
import { format } from 'date-fns';

/** Format a local Date as YYYY-MM-DD — matches backend toISTDateStr() */
const toLocalDateStr = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const ActivityGrid = ({ activityData = [] }) => {
  const [hoveredDate, setHoveredDate] = useState(null);

  // 1. Today in local time
  const now = new Date();
  const todayLocal = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // local midnight

  // Find Monday of the CURRENT week so the grid always includes today on the right side
  const getLocalMonday = (localDate) => {
    const d = new Date(localDate);
    const day = d.getDay(); // 0=Sun
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    return d;
  };

  // Anchor: Monday of current week → go back 11 weeks for the first column
  // This gives 12 columns (11 past weeks + current week), always showing today
  const currentWeekMonday = getLocalMonday(todayLocal);
  const firstMonday = new Date(currentWeekMonday);
  firstMonday.setDate(currentWeekMonday.getDate() - 11 * 7);

  // Build 12 columns × 7 rows of local Date objects
  const weeks = [];
  for (let col = 0; col < 12; col++) {
    const weekDays = [];
    for (let row = 0; row < 7; row++) {
      const d = new Date(firstMonday);
      d.setDate(firstMonday.getDate() + col * 7 + row);
      weekDays.push(d);
    }
    weeks.push(weekDays);
  }

  // Lookup map: YYYY-MM-DD (local) → { count, minutes }
  const dataMap = {};
  activityData.forEach((item) => {
    if (item.date) {
      dataMap[item.date] = { count: item.count || 0, minutes: item.minutes || 0 };
    }
  });

  // Month labels — change when local month changes across columns
  const monthLabels = [];
  let lastMonth = -1;
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  weeks.forEach((week, colIndex) => {
    const month = week[0].getMonth();
    if (month !== lastMonth) {
      monthLabels.push({ text: monthNames[month], colIndex });
      lastMonth = month;
    }
  });

  const getLevel = (count) => {
    if (count === 0) return 0;
    if (count <= 2) return 1;
    if (count <= 4) return 2;
    if (count <= 7) return 3;
    return 4;
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 1: return 'rgba(108, 71, 255, 0.2)';
      case 2: return 'rgba(108, 71, 255, 0.45)';
      case 3: return 'rgba(108, 71, 255, 0.7)';
      case 4: return 'var(--accent)';
      default: return 'var(--surface-2)';
    }
  };

  return (
    <div className="activity-grid-wrap" style={{ width: '100%', overflowX: 'auto' }}>
      <div style={{ minWidth: '240px', padding: '4px' }}>
        {/* Month labels */}
        <div style={{ display: 'grid', gridTemplateColumns: '24px repeat(12, 12px)', gap: '2px', marginBottom: '6px' }}>
          <div />
          {weeks.map((week, colIndex) => {
            const label = monthLabels.find((l) => l.colIndex === colIndex);
            return (
              <div
                key={colIndex}
                style={{
                  fontSize: '0.65rem',
                  color: 'var(--txt-3)',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'visible',
                  width: '12px',
                }}
              >
                {label ? label.text : ''}
              </div>
            );
          })}
        </div>

        {/* Days + Grid */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
          {/* Day Labels */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '2px',
              height: '96px',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ fontSize: '0.6rem', color: 'var(--txt-3)', height: '12px', lineHeight: '12px', textAlign: 'right', width: '24px', paddingRight: '4px', fontWeight: 600 }}>Mon</div>
            <div style={{ height: '12px' }} />
            <div style={{ fontSize: '0.6rem', color: 'var(--txt-3)', height: '12px', lineHeight: '12px', textAlign: 'right', width: '24px', paddingRight: '4px', fontWeight: 600 }}>Wed</div>
            <div style={{ height: '12px' }} />
            <div style={{ fontSize: '0.6rem', color: 'var(--txt-3)', height: '12px', lineHeight: '12px', textAlign: 'right', width: '24px', paddingRight: '4px', fontWeight: 600 }}>Fri</div>
            <div style={{ height: '12px' }} />
            <div style={{ height: '12px' }} />
          </div>

          {/* Contribution cells */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(12, 12px)',
              gridTemplateRows: 'repeat(7, 12px)',
              gap: '2px',
              gridAutoFlow: 'column',
            }}
          >
            {weeks.map((week) =>
              week.map((date) => {
                // Use LOCAL date string — matches backend IST toISTDateStr()
                const dateStr = toLocalDateStr(date);
                const isFuture = date > todayLocal;

                const activity = dataMap[dateStr] || { count: 0, minutes: 0 };
                const level = isFuture ? 0 : getLevel(activity.count);
                const isHovered = hoveredDate === dateStr;

                const formattedDate = format(date, 'MMM d');
                const tooltipText = isFuture
                  ? null
                  : activity.count > 0
                    ? `${formattedDate} — ${activity.count} activit${activity.count !== 1 ? 'ies' : 'y'}`
                    : `${formattedDate} — No activity`;

                return (
                  <div
                    key={dateStr}
                    className="activity-cell"
                    style={{
                      backgroundColor: isFuture ? 'transparent' : getLevelColor(level),
                      opacity: isFuture ? 0 : 1,
                      cursor: isFuture ? 'default' : 'pointer',
                    }}
                    onMouseEnter={() => !isFuture && setHoveredDate(dateStr)}
                    onMouseLeave={() => setHoveredDate(null)}
                  >
                    {isHovered && tooltipText && (
                      <div
                        className="tooltip-box animate-fade-in"
                        style={{
                          opacity: 1,
                          visibility: 'visible',
                          pointerEvents: 'none',
                          bottom: 'calc(100% + 6px)',
                          background: 'var(--surface-2)',
                          border: '1px solid var(--border-2)',
                          padding: '4px 8px',
                          fontSize: '0.7rem',
                          color: 'var(--txt)',
                          zIndex: 10,
                          borderRadius: 'var(--r)',
                          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {tooltipText}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Legend */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '12px',
            fontSize: '0.65rem',
            color: 'var(--txt-3)',
            fontWeight: 600,
            paddingLeft: '28px',
          }}
        >
          <span>Less</span>
          <div style={{ display: 'flex', gap: '2px' }}>
            <div className="activity-cell" style={{ backgroundColor: getLevelColor(0), width: '10px', height: '10px', cursor: 'default' }} />
            <div className="activity-cell" style={{ backgroundColor: getLevelColor(1), width: '10px', height: '10px', cursor: 'default' }} />
            <div className="activity-cell" style={{ backgroundColor: getLevelColor(2), width: '10px', height: '10px', cursor: 'default' }} />
            <div className="activity-cell" style={{ backgroundColor: getLevelColor(3), width: '10px', height: '10px', cursor: 'default' }} />
            <div className="activity-cell" style={{ backgroundColor: getLevelColor(4), width: '10px', height: '10px', cursor: 'default' }} />
          </div>
          <span>More</span>
          <span style={{ marginLeft: 8, color: 'var(--txt-3)', opacity: 0.7 }}>· missions, topics & planner days</span>
        </div>
      </div>
    </div>
  );
};

export default ActivityGrid;

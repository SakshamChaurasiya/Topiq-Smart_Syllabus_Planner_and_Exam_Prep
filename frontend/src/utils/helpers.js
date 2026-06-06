import { LEVELS, MOTIVATIONAL_MESSAGES } from './constants';

/** Get the level object for a given XP amount */
export const getLevel = (xp = 0) => {
  const sorted = [...LEVELS].sort((a, b) => b.minXP - a.minXP);
  return sorted.find(l => xp >= l.minXP) || LEVELS[0];
};

/** Get XP needed for the next level */
export const getNextLevel = (xp = 0) => {
  const current = getLevel(xp);
  return LEVELS.find(l => l.level === current.level + 1) || null;
};

/** XP progress percentage toward next level */
export const getXPPercent = (xp = 0) => {
  const current = getLevel(xp);
  const next = getNextLevel(xp);
  if (!next) return 100;
  const range = next.minXP - current.minXP;
  const earned = xp - current.minXP;
  return Math.min(100, Math.round((earned / range) * 100));
};

/** Pick a random motivational message */
export const getRandomMessage = () =>
  MOTIVATIONAL_MESSAGES[Math.floor(Math.random() * MOTIVATIONAL_MESSAGES.length)];

/** Calculate average readiness from subjects array */
export const calculateReadiness = (subjects = []) => {
  if (!subjects.length) return 0;
  const total = subjects.reduce((sum, s) => sum + (s.progress || 0), 0);
  return Math.round(total / subjects.length);
};

/** Get color based on readiness/progress % */
export const getReadinessColor = (pct) => {
  if (pct >= 80) return 'var(--success)';
  if (pct >= 50) return 'var(--warning)';
  if (pct >= 30) return 'var(--accent)';
  return 'var(--danger)';
};

/** Get readiness label */
export const getReadinessLabel = (pct) => {
  if (pct >= 90) return '🏆 Exam Ready!';
  if (pct >= 70) return '🚀 Great Progress';
  if (pct >= 50) return '🔥 Halfway There';
  if (pct >= 30) return '⚡ Getting Going';
  return '📚 Just Started';
};

/** Generate initials from a name string */
export const getInitials = (name = '') => {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();
};

/** Clamp a value between min and max */
export const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

/** Generate a unique color from a string (for subject default colors) */
export const stringToColor = (str = '') => {
  const colors = [
    '#6C47FF', '#FF6B6B', '#00D4AA', '#FFB347',
    '#3B82F6', '#EC4899', '#8B5CF6', '#10B981',
  ];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

/** Format a number with commas */
export const numberWithCommas = (n) =>
  n?.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') ?? '0';

/** Check if an array is empty */
export const isEmpty = (arr) => !arr || arr.length === 0;

/** Shuffle an array */
export const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);

/** Get priority badge config */
export const getPriorityConfig = (priority) => {
  const map = {
    critical: { label: 'Critical', cls: 'badge-critical' },
    high:     { label: 'High',     cls: 'badge-danger'   },
    medium:   { label: 'Medium',   cls: 'badge-medium'   },
    low:      { label: 'Low',      cls: 'badge-low'      },
  };
  return map[priority] || map.medium;
};

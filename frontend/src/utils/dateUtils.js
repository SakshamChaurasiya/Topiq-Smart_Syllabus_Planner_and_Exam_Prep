/** Date utility functions */

/** Days until a target date (can be negative if past) */
export const daysUntil = (date) =>
  Math.ceil((new Date(date) - new Date()) / 86400000);

/** Is a date today? */
export const isToday = (date) =>
  new Date(date).toDateString() === new Date().toDateString();

/** Is a date in the past? */
export const isPast = (date) => new Date(date) < new Date();

/** Format date: "12 Jun 2025" */
export const formatDate = (date) =>
  new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

/** Format date: "Mon, 12 Jun" */
export const formatDateShort = (date) =>
  new Date(date).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });

/** Format just "12 Jun" */
export const formatDateTiny = (date) =>
  new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
  });

/** Format time: "10:30 AM" */
export const formatTime = (date) =>
  new Date(date).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

/** Format duration from minutes */
export const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) return '0m';
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

/** Get day of week name */
export const getDayName = (date, short = false) =>
  new Date(date).toLocaleDateString('en-IN', {
    weekday: short ? 'short' : 'long',
  });

/** Get dates for current week (Mon–Sun) */
export const getCurrentWeek = () => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
  const monday = new Date(now.setDate(diff));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
};

/** Relative time: "2 hours ago", "in 3 days" */
export const relativeTime = (date) => {
  const diff = new Date(date) - new Date();
  const abs = Math.abs(diff);
  const past = diff < 0;
  if (abs < 60000)     return past ? 'just now' : 'in a moment';
  if (abs < 3600000)   return past ? `${Math.round(abs/60000)}m ago` : `in ${Math.round(abs/60000)}m`;
  if (abs < 86400000)  return past ? `${Math.round(abs/3600000)}h ago` : `in ${Math.round(abs/3600000)}h`;
  if (abs < 604800000) return past ? `${Math.round(abs/86400000)}d ago` : `in ${Math.round(abs/86400000)}d`;
  return formatDate(date);
};

/** Returns urgency level based on days left */
export const getUrgency = (days) => {
  if (days <= 0)  return 'overdue';
  if (days <= 3)  return 'critical';
  if (days <= 7)  return 'high';
  if (days <= 14) return 'medium';
  return 'low';
};

export const getUrgencyColor = (days) => {
  const u = getUrgency(days);
  const map = {
    overdue: 'var(--danger)',
    critical: 'var(--danger)',
    high: 'var(--warning)',
    medium: 'var(--accent)',
    low: 'var(--success)',
  };
  return map[u];
};

/** Today's date as YYYY-MM-DD */
export const todayStr = () => new Date().toISOString().split('T')[0];

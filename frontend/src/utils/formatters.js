/** Number and value formatters */

/** Format XP: 1200 → "1.2K" */
export const formatXP = (xp = 0) =>
  xp >= 1000 ? `${(xp / 1000).toFixed(1)}K` : String(xp);

/** Format large numbers with K/M */
export const formatNumber = (n = 0) => {
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000)    return `${(n / 1000).toFixed(1)}K`;
  return String(n);
};

/** Format percentage: 75 → "75%" */
export const formatPercent = (n = 0) => `${Math.round(n)}%`;

/** Format duration in minutes: 90 → "1h 30m" */
export const formatDuration = (minutes = 0) => {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
};

/** Capitalize first letter */
export const capitalize = (str = '') =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

/** Title case */
export const titleCase = (str = '') =>
  str.replace(/\w\S*/g, (txt) =>
    txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase()
  );

/** Truncate text with ellipsis */
export const truncate = (str = '', length = 50) =>
  str.length > length ? str.slice(0, length) + '…' : str;

/** Format file size */
export const formatFileSize = (bytes = 0) => {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1048576)     return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1073741824)  return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(1)} GB`;
};

/** Format minutes as study time: "2h 30m of study" */
export const formatStudyTime = (minutes = 0) => {
  if (!minutes) return '0m';
  return formatDuration(minutes) + ' of study';
};

/** Ordinal: 1 → "1st", 2 → "2nd" */
export const ordinal = (n) => {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
};

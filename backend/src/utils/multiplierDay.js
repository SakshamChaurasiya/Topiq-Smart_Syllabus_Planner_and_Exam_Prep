// Every Friday is a guaranteed 2x day.
// Additionally, a random weekday is selected each week as a bonus 1.5x day.
// The random day is seeded by ISO week number so it's consistent across the server day
// (same random day for all users, resets weekly, deterministic — no DB needed).

const getISOWeek = (date) => {
  const d = new Date(date);
  d.setHours(0,0,0,0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return 1 + Math.round(((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
};

const getTodayMultiplier = (date = new Date()) => {
  const day = date.getDay(); // 0=Sun, 5=Fri
  if (day === 5) return { multiplier: 2, reason: '2x XP Friday 🔥', active: true };

  // Seeded random: use week number to pick a consistent bonus day (Mon-Thu, not Fri)
  const week = getISOWeek(date);
  const bonusDay = (week % 4) + 1; // 1=Mon, 2=Tue, 3=Wed, 4=Thu
  if (day === bonusDay) return { multiplier: 1.5, reason: '1.5x Bonus Day ⚡', active: true };

  return { multiplier: 1, reason: null, active: false };
};

// Returns what tomorrow's multiplier will be (for "coming tomorrow" notification)
const getTomorrowMultiplier = () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return getTodayMultiplier(tomorrow);
};

module.exports = { getTodayMultiplier, getTomorrowMultiplier };

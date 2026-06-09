/**
 * xpSystem.js
 * Utility functions for top-level XP and leveling curves in Topiq.
 */

// XP required to go FROM level N to level N+1
const getXPForLevel = (level) => {
  if (level <= 0) return 100;
  const base = 100;
  const growth = 80;
  const multiplier = level >= 10 ? 1 + (level - 9) * 0.15 : 1;
  return Math.round((base + growth * level) * multiplier);
};

// Total XP accumulated from level 1 to reach level N
const getTotalXPForLevel = (level) => {
  let total = 0;
  for (let i = 1; i < level; i++) {
    total += getXPForLevel(i);
  }
  return total;
};

// Level title — returns { title, emoji, tier } for a given level
const getLevelTitle = (level) => {
  if (level >= 50) return { title: 'Exam God',        emoji: '💀', tier: 'legendary' };
  if (level >= 35) return { title: 'Unstoppable',     emoji: '🔥', tier: 'elite' };
  if (level >= 21) return { title: 'On A Roll',       emoji: '⚡', tier: 'advanced' };
  if (level >= 11) return { title: 'Focused',         emoji: '🎯', tier: 'intermediate' };
  if (level >= 6)  return { title: 'Chai & Notes',    emoji: '☕', tier: 'rising' };
  return              { title: 'First Year Energy', emoji: '📖', tier: 'starter' };
};

module.exports = {
  getXPForLevel,
  getTotalXPForLevel,
  getLevelTitle,
};

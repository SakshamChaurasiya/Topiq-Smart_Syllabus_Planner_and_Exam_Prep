import api from './api';

/**
 * gamificationService — XP, levels, badges, leaderboard.
 * Uses localStorage + mission completion data since backend doesn't
 * have dedicated gamification endpoints yet.
 */
export const gamificationService = {
  getMissionStats: () => api.get('/missions/stats'),
  getDashboard:    () => api.get('/dashboard'),
};

// ── Local XP store (until backend supports gamification) ──
const XP_KEY = 'ssp_xp_data';

export const localGamification = {
  getData: () => {
    try {
      return JSON.parse(localStorage.getItem(XP_KEY)) || {
        xp: 0, streak: 0, lastStudyDate: null, earnedBadges: [],
      };
    } catch {
      return { xp: 0, streak: 0, lastStudyDate: null, earnedBadges: [] };
    }
  },

  addXP: (amount) => {
    const data = localGamification.getData();
    data.xp = (data.xp || 0) + amount;
    localStorage.setItem(XP_KEY, JSON.stringify(data));
    return data.xp;
  },

  updateStreak: () => {
    const data = localGamification.getData();
    const today = new Date().toDateString();
    const last  = data.lastStudyDate;
    if (last === today) return data.streak;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const isConsecutive = last === yesterday.toDateString();
    data.streak = isConsecutive ? (data.streak || 0) + 1 : 1;
    data.lastStudyDate = today;
    localStorage.setItem(XP_KEY, JSON.stringify(data));
    return data.streak;
  },

  unlockBadge: (badgeId) => {
    const data = localGamification.getData();
    if (!data.earnedBadges.includes(badgeId)) {
      data.earnedBadges.push(badgeId);
      localStorage.setItem(XP_KEY, JSON.stringify(data));
      return true;
    }
    return false;
  },
};

/**
 * streakSync.js
 * Middleware that runs on every authenticated request for key routes.
 * Checks if the user missed yesterday and resets streak if so.
 * Attach AFTER auth middleware on dashboard, missions, and study-plan routes.
 *
 * This moves streak logic fully server-side so it can never drift
 * regardless of how often a user visits the dashboard.
 */

const User = require('../models/user.model');

const streakSync = async (req, res, next) => {
  try {
    const user = req.user;
    if (!user) return next();

    const now = new Date();

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);

    const lastActive = user.lastActiveDate
      ? new Date(user.lastActiveDate)
      : null;

    if (!lastActive) {
      // First ever login — initialize streak
      user.streak = 0;
      user.lastActiveDate = now;
      await user.save();
      return next();
    }

    const lastActiveDay = new Date(lastActive);
    lastActiveDay.setHours(0, 0, 0, 0);

    const isActiveToday      = lastActiveDay.getTime() === todayStart.getTime();
    const wasActiveYesterday = lastActiveDay.getTime() === yesterdayStart.getTime();

    if (isActiveToday) {
      // Already updated today — nothing to change, no DB write needed
      return next();
    }

    if (wasActiveYesterday) {
      // Consecutive day — increment streak
      user.streak = (user.streak || 0) + 1;
      if (user.streak === 14) {
        try {
          const { awardBadge } = require("../utils/badges");
          await awardBadge(user._id, "no_days_off");
        } catch (badgeErr) {
          console.error("[StreakSync] Error awarding no_days_off badge:", badgeErr);
        }
      }
    } else {
      // Missed at least one day — reset streak (unless protected by a freeze token)
      if (user.streakFreezeTokens > 0) {
        user.streakFreezeTokens -= 1;
        user.streakFreezeUsedAt = now;
        console.log(`[StreakSync] Freeze token consumed for user ${user._id}`);
      } else {
        user.streak = 0;
      }
    }

    user.lastActiveDate = now;
    await user.save();

    next();
  } catch (err) {
    // Never block the request over a streak error
    console.error('[StreakSync] Error:', err.message);
    next();
  }
};

module.exports = { streakSync };

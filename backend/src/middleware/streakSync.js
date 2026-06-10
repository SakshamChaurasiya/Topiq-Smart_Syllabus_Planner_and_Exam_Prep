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

    // IST offset — matches analytics.controller.js
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

    // Get YYYY-MM-DD string in IST for any UTC date
    const toISTDateStr = (utcDate) => {
      const ist = new Date(utcDate.getTime() + IST_OFFSET_MS);
      const y = ist.getUTCFullYear();
      const m = String(ist.getUTCMonth() + 1).padStart(2, '0');
      const d = String(ist.getUTCDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    };

    // IST midnight (00:00:00 IST) as a UTC Date for a given YYYY-MM-DD IST string
    const istMidnightUTC = (istDateStr) => {
      const [y, m, d] = istDateStr.split('-').map(Number);
      return new Date(Date.UTC(y, m - 1, d) - IST_OFFSET_MS);
    };

    const todayISTStr     = toISTDateStr(now);
    const yesterdayISTStr = (() => {
      const [y, m, d] = todayISTStr.split('-').map(Number);
      const dt = new Date(Date.UTC(y, m - 1, d - 1));
      return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth()+1).padStart(2,'0')}-${String(dt.getUTCDate()).padStart(2,'0')}`;
    })();

    const todayStart     = istMidnightUTC(todayISTStr);
    const yesterdayStart = istMidnightUTC(yesterdayISTStr);

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

    const lastActiveDayISTStr = toISTDateStr(lastActive);
    const isActiveToday      = lastActiveDayISTStr === todayISTStr;
    const wasActiveYesterday = lastActiveDayISTStr === yesterdayISTStr;

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

/**
 * badges.js
 * Contains gamification badge definitions and the awardBadge helper logic.
 */

const Badge = require("../models/badge.model");
const Notification = require("../models/notification.model");

const BADGES = [
  { id: 'first_blood',      emoji: '🎯', name: 'First Blood',    desc: 'Completed your first mission',           color: '#6366f1' },
  { id: 'crisis_survivor',  emoji: '🔥', name: 'Crisis Survivor', desc: 'Completed a Crisis Mode plan',           color: '#ef4444' },
  { id: 'pyq_hunter',       emoji: '📚', name: 'PYQ Hunter',      desc: 'Uploaded and analyzed 3 past papers',    color: '#f59e0b' },
  { id: 'speed_demon',      emoji: '⚡', name: 'Speed Demon',     desc: 'Analyzed a syllabus in under 60 seconds', color: '#06b6d4' },
  { id: 'ice_cold',         emoji: '🧊', name: 'Ice Cold',        desc: 'Used a Streak Freeze token',              color: '#3b82f6' },
  { id: 'no_days_off',      emoji: '💀', name: 'No Days Off',     desc: 'Achieved a 14-day streak',                color: '#8b5cf6' },
  { id: 'topper',           emoji: '🏆', name: 'Topper',          desc: 'Completed all topics in a subject',       color: '#10b981' },
  { id: 'first_share',         emoji: '📝', name: 'First Share',         desc: 'Shared your first resource with the community', color: '#10b981' },
  { id: 'viral_note',          emoji: '🔥', name: 'Viral Note',          desc: 'A post of yours reached 20+ upvotes',            color: '#ef4444' },
  { id: 'campus_hero',         emoji: '🏫', name: 'Campus Hero',         desc: 'Posted 5+ resources for your college',           color: '#f59e0b' },
  { id: 'trusted_contributor', emoji: '💎', name: 'Trusted Contributor', desc: 'Earned a Contributor Score above 100',           color: '#6366f1' },
  { id: 'helper',              emoji: '🤝', name: 'Helper',              desc: 'Upvoted 10+ posts from other students',          color: '#38bdf8' },
];

/**
 * Award a badge to a user.
 * 
 * @param {string|mongoose.Types.ObjectId} userId 
 * @param {string} badgeId 
 * @returns {Promise<{awarded: boolean, badge?: object}>}
 */
const awardBadge = async (userId, badgeId) => {
    try {
        const badgeDef = BADGES.find(b => b.id === badgeId);
        if (!badgeDef) {
            console.error(`[Badges] Invalid badgeId requested: ${badgeId}`);
            return { awarded: false };
        }

        // Check if badge already exists in Badge collection for this user
        const existingBadge = await Badge.findOne({ userId, badgeId });
        if (existingBadge) {
            return { awarded: false };
        }

        // Create Badge document
        const newBadge = await Badge.create({ userId, badgeId });

        // Create a Notification for the user
        await new Notification({
            userId,
            title: `Badge Unlocked! ${badgeDef.emoji} ${badgeDef.name}`,
            message: badgeDef.desc,
            type: "achievement"
        }).save();

        return { awarded: true, badge: newBadge };
    } catch (error) {
        console.error(`[Badges] Error awarding badge ${badgeId} for user ${userId}:`, error.message);
        return { awarded: false };
    }
};

module.exports = {
    BADGES,
    awardBadge
};

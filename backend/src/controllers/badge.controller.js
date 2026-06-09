/**
 * badge.controller.js
 * Handles badge queries for the authenticated user.
 */

const Badge = require("../models/badge.model");
const { BADGES } = require("../utils/badges");
const { sendSuccess, sendError } = require("../utils/responseHelper");

/**
 * GET /api/badges
 * Fetch all earned badge documents for the user, mapped with badge definitions.
 */
const getBadges = async (req, res) => {
    try {
        const userId = req.user._id;

        // Fetch earned badges from database
        const earnedBadges = await Badge.find({ userId }).sort({ earnedAt: -1 });

        // Map database records to their definitions
        const earnedMapped = earnedBadges.map(doc => {
            const definition = BADGES.find(b => b.id === doc.badgeId) || {};
            return {
                _id: doc._id,
                userId: doc.userId,
                badgeId: doc.badgeId,
                earnedAt: doc.earnedAt,
                emoji: definition.emoji || "",
                name: definition.name || "",
                desc: definition.desc || "",
                color: definition.color || "#cccccc",
            };
        });

        return sendSuccess(res, 200, "Badges fetched successfully.", {
            earned: earnedMapped,
            total: BADGES.length
        });
    } catch (error) {
        console.error("[BadgeController] Error fetching badges:", error.message);
        return sendError(res, 500, "Failed to fetch badges.");
    }
};

module.exports = {
    getBadges
};

/**
 * streakFreeze.controller.js
 * Controller for retrieving and awarding streak freeze tokens.
 * awardToken works as both an Express route handler and a utility function.
 */

const { sendSuccess, sendError } = require("../utils/responseHelper");

// @route   GET /api/streak-freeze
// @desc    Get streak freeze tokens for current user
// @access  Protected
const getTokens = async (req, res) => {
    try {
        const user = req.user;
        if (!user) {
            return sendError(res, 401, "Not authenticated.");
        }
        return sendSuccess(res, 200, "Streak freeze tokens fetched successfully.", {
            streakFreezeTokens: user.streakFreezeTokens || 0,
            streakFreezeUsedAt: user.streakFreezeUsedAt || null,
        });
    } catch (error) {
        console.error("[StreakFreeze] getTokens error:", error.message);
        return sendError(res, 500, "Failed to retrieve streak freeze tokens.");
    }
};

// @route   POST /api/streak-freeze/award
// @desc    Award one streak freeze token to current user / named utility function
// @access  Protected / Internal
const awardToken = async (reqOrUser, res) => {
    // Check if called as an Express route handler: (req, res)
    if (res && typeof res.status === "function") {
        try {
            const user = reqOrUser.user;
            if (!user) {
                return sendError(res, 401, "Not authenticated.");
            }
            user.streakFreezeTokens = (user.streakFreezeTokens || 0) + 1;
            await user.save();
            return sendSuccess(res, 200, "Streak freeze token awarded successfully.", {
                streakFreezeTokens: user.streakFreezeTokens,
            });
        } catch (error) {
            console.error("[StreakFreeze] awardToken handler error:", error.message);
            return sendError(res, 500, "Failed to award streak freeze token.");
        }
    } else {
        // Called internally as a utility function: awardToken(user)
        const user = reqOrUser;
        if (!user) {
            throw new Error("User object is required to award token.");
        }
        user.streakFreezeTokens = (user.streakFreezeTokens || 0) + 1;
        await user.save();
        return user.streakFreezeTokens;
    }
};

module.exports = {
    getTokens,
    awardToken,
};

/**
 * leaderboard.controller.js
 * Controller for public leaderboards and public profiles.
 */

const User = require("../models/user.model");
const Mission = require("../models/mission.model");
const Subject = require("../models/subject.model");
const Badge = require("../models/badge.model");
const { sendSuccess, sendError } = require("../utils/responseHelper");
const { getXPForLevel, getLevelTitle, getTotalXPForLevel } = require("../utils/xpSystem");

// IST offset helpers for weekly leaderboard matching weekReport.controller.js
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const toISTDateStr = (utcDate) => {
    const ist = new Date(utcDate.getTime() + IST_OFFSET_MS);
    const y = ist.getUTCFullYear();
    const m = String(ist.getUTCMonth() + 1).padStart(2, '0');
    const d = String(ist.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const istMidnightUTC = (istDateStr) => {
    const [y, m, d] = istDateStr.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d) - IST_OFFSET_MS);
};

const getStartOfWeek = () => {
    const todayISTStr = toISTDateStr(new Date());
    const [y, m, d] = todayISTStr.split('-').map(Number);
    const jsDay = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun
    const diffToMon = jsDay === 0 ? -6 : 1 - jsDay;
    const monDate = new Date(Date.UTC(y, m - 1, d + diffToMon));
    const monY = monDate.getUTCFullYear();
    const monM = String(monDate.getUTCMonth() + 1).padStart(2, '0');
    const monD = String(monDate.getUTCDate()).padStart(2, '0');
    const monISTStr = `${monY}-${monM}-${monD}`;
    return istMidnightUTC(monISTStr); // UTC Date for Monday 00:00 IST
};

// Safe public user shape helper
const toPublicUser = (user, rank) => ({
    rank,
    userId: user._id,
    name: user.name,
    publicUsername: user.publicUsername || null,
    institution: user.institution || null,
    level: user.level,
    streak: user.streak,
    totalXP: getTotalXPForLevel(user.level) + (user.xp || 0),
    levelTitle: getLevelTitle(user.level),
    isPublicProfile: user.isPublicProfile || false,
});

/**
 * @route   GET /api/leaderboard/global
 * @desc    Get top 100 users globally
 * @access  Public (Optional Auth)
 */
const getGlobalLeaderboard = async (req, res) => {
    try {
        const users = await User.find({})
            .select("name publicUsername institution level xp streak lastActiveDate isPublicProfile")
            .sort({ level: -1, xp: -1, streak: -1 })
            .limit(100);

        const total = await User.countDocuments({});

        const leaderboard = users.map((u, index) => toPublicUser(u, index + 1));

        let myRank = null;
        if (req.user) {
            const index = users.findIndex(u => u._id.toString() === req.user._id.toString());
            if (index !== -1) {
                myRank = index + 1;
            }
        }

        return sendSuccess(res, 200, "Global leaderboard retrieved.", {
            leaderboard,
            myRank,
            total,
        });
    } catch (error) {
        console.error("[Leaderboard] Global error:", error.message);
        return sendError(res, 500, "Failed to fetch global leaderboard.");
    }
};

/**
 * @route   GET /api/leaderboard/college
 * @desc    Get top 50 users from a specific college
 * @access  Public (Optional Auth)
 */
const getCollegeLeaderboard = async (req, res) => {
    try {
        const { institution } = req.query;
        if (!institution) {
            return sendError(res, 400, "institution query param required");
        }

        const query = { institution: { $regex: new RegExp(institution, "i") } };

        const users = await User.find(query)
            .select("name publicUsername institution level xp streak lastActiveDate isPublicProfile")
            .sort({ level: -1, xp: -1, streak: -1 })
            .limit(50);

        const total = await User.countDocuments(query);

        const leaderboard = users.map((u, index) => toPublicUser(u, index + 1));

        let myRank = null;
        if (req.user) {
            const index = users.findIndex(u => u._id.toString() === req.user._id.toString());
            if (index !== -1) {
                myRank = index + 1;
            }
        }

        return sendSuccess(res, 200, "College leaderboard retrieved.", {
            leaderboard,
            myRank,
            institution,
            total,
        });
    } catch (error) {
        console.error("[Leaderboard] College error:", error.message);
        return sendError(res, 500, "Failed to fetch college leaderboard.");
    }
};

/**
 * @route   GET /api/leaderboard/weekly
 * @desc    Get top 50 users based on completed missions in the current week
 * @access  Public (Optional Auth)
 */
const getWeeklyLeaderboard = async (req, res) => {
    try {
        const weekStartUTC = getStartOfWeek();

        const completedMissions = await Mission.aggregate([
            { $match: { status: "completed", completedAt: { $gte: weekStartUTC } } },
            { $group: { _id: "$userId", missionsThisWeek: { $sum: 1 }, xpThisWeek: { $sum: "$xpReward" } } },
            { $sort: { missionsThisWeek: -1, xpThisWeek: -1 } },
            { $limit: 50 },
        ]);

        const totalResults = await Mission.aggregate([
            { $match: { status: "completed", completedAt: { $gte: weekStartUTC } } },
            { $group: { _id: "$userId" } },
            { $count: "total" }
        ]);

        const total = totalResults[0]?.total || 0;

        const leaderboard = [];
        let rank = 1;

        for (const item of completedMissions) {
            const user = await User.findById(item._id)
                .select("name publicUsername institution level xp streak isPublicProfile");
            
            if (!user) continue;

            const publicUser = toPublicUser(user, rank);
            leaderboard.push({
                ...publicUser,
                missionsThisWeek: item.missionsThisWeek,
                xpThisWeek: item.xpThisWeek,
            });
            rank++;
        }

        let myRank = null;
        if (req.user) {
            const index = leaderboard.findIndex(entry => entry.userId.toString() === req.user._id.toString());
            if (index !== -1) {
                myRank = leaderboard[index].rank;
            }
        }

        return sendSuccess(res, 200, "Weekly leaderboard retrieved.", {
            leaderboard,
            myRank,
            weekStart: weekStartUTC,
            total,
        });
    } catch (error) {
        console.error("[Leaderboard] Weekly error:", error.message);
        return sendError(res, 500, "Failed to fetch weekly leaderboard.");
    }
};

/**
 * @route   GET /api/profile/:username
 * @desc    Get a user's public profile page by username
 * @access  Public
 */
const getPublicProfile = async (req, res) => {
    try {
        const { username } = req.params;
        if (!username) {
            return sendError(res, 400, "Username is required.");
        }

        const user = await User.findOne({ publicUsername: username.toLowerCase().trim() })
            .select("name publicUsername institution level xp streak createdAt isPublicProfile");

        if (!user || user.isPublicProfile === false) {
            return sendError(res, 404, "Profile not found or is private.");
        }

        const badges = await Badge.find({ userId: user._id });
        const earnedBadges = badges.map(b => ({
            badgeId: b.badgeId,
            earnedAt: b.earnedAt,
        }));

        const totalMissionsCompleted = await Mission.countDocuments({ userId: user._id, status: "completed" });
        const subjectsCount = await Subject.countDocuments({ userId: user._id });

        const profileShape = {
            name: user.name,
            publicUsername: user.publicUsername,
            institution: user.institution,
            level: user.level,
            xp: user.xp,
            streak: user.streak,
            createdAt: user.createdAt,
            levelTitle: getLevelTitle(user.level),
            totalXP: getTotalXPForLevel(user.level) + (user.xp || 0),
            badges: earnedBadges,
            stats: {
                totalMissionsCompleted,
                subjectsCount,
            },
        };

        return sendSuccess(res, 200, "Public profile retrieved.", profileShape);
    } catch (error) {
        console.error("[Leaderboard] GetPublicProfile error:", error.message);
        return sendError(res, 500, "Failed to fetch public profile.");
    }
};

/**
 * @route   PUT /api/profile/settings
 * @desc    Update public profile preferences (opt-in/opt-out & public username)
 * @access  Protected
 */
const updatePublicProfile = async (req, res) => {
    try {
        const { isPublicProfile, publicUsername } = req.body;

        if (req.user.publicUsername) {
            if (publicUsername !== undefined && publicUsername !== null) {
                const trimmedUsername = publicUsername.toLowerCase().trim();
                if (req.user.publicUsername !== trimmedUsername) {
                    return sendError(res, 400, "Username cannot be changed once set.");
                }
            }
        } else {
            if (publicUsername !== undefined && publicUsername !== null && publicUsername !== "") {
                const trimmedUsername = publicUsername.toLowerCase().trim();
                
                // Validate username: 3-20 chars, lowercase letters, numbers, underscores, hyphens only
                const usernameRegex = /^[a-z0-9_-]{3,20}$/;
                if (!usernameRegex.test(trimmedUsername)) {
                    return sendError(res, 400, "Username must be 3-20 chars, letters/numbers/underscore/hyphen only.");
                }

                // Check uniqueness
                const taken = await User.findOne({ publicUsername: trimmedUsername, _id: { $ne: req.user._id } });
                if (taken) {
                    return sendError(res, 409, "Username already taken.");
                }

                req.user.publicUsername = trimmedUsername;
            }
        }

        if (isPublicProfile !== undefined && typeof isPublicProfile === "boolean") {
            req.user.isPublicProfile = isPublicProfile;
        }

        await req.user.save();

        return sendSuccess(res, 200, "Public profile settings updated.", {
            isPublicProfile: req.user.isPublicProfile,
            publicUsername: req.user.publicUsername,
        });
    } catch (error) {
        console.error("[Leaderboard] UpdatePublicProfile error:", error.message);
        return sendError(res, 500, "Failed to update public profile settings.");
    }
};

module.exports = {
    getGlobalLeaderboard,
    getCollegeLeaderboard,
    getWeeklyLeaderboard,
    getPublicProfile,
    updatePublicProfile,
};

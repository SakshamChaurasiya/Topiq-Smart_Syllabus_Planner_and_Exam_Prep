/**
 * leaderboard.routes.js
 * Defines routes for Leaderboards and Public Profiles.
 */

const express = require("express");
const router = express.Router();
const { protect, optionalAuth } = require("../middleware/auth.middleware");
const {
    getGlobalLeaderboard,
    getCollegeLeaderboard,
    getWeeklyLeaderboard,
    getPublicProfile,
    updatePublicProfile,
} = require("../controllers/leaderboard.controller");

// Public routes — optional authentication for ranking user relative to leaderboard
router.get("/leaderboard/global", optionalAuth, getGlobalLeaderboard);
router.get("/leaderboard/college", optionalAuth, getCollegeLeaderboard);
router.get("/leaderboard/weekly", optionalAuth, getWeeklyLeaderboard);

// Public route — fetch public profile by username
router.get("/profile/:username", getPublicProfile);

// Protected route — update public profile settings
router.put("/profile/settings", protect, updatePublicProfile);

module.exports = router;

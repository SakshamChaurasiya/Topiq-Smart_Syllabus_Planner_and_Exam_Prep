/**
 * mission.routes.js
 * Mission listing, today's view, and status management.
 */

const express = require("express");
const router = express.Router();
const {
    getMissions,
    getTodayMissions,
    updateMissionStatus,
    getMissionStats,
} = require("../controllers/mission.controller");
const { protect } = require("../middleware/auth.middleware");
const { streakSync } = require("../middleware/streakSync");

router.use(protect);

// Get today's missions (most used endpoint)
router.get("/today", streakSync, getTodayMissions);

// Get mission statistics
router.get("/stats", streakSync, getMissionStats);

// Get all missions with filters (?subjectId=&status=&date=)
router.get("/", streakSync, getMissions);

// Update mission status — streakSync ensures server-side streak update on completion
router.put("/:id/status", streakSync, updateMissionStatus);

module.exports = router;

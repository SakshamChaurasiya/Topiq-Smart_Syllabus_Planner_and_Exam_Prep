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

router.use(protect);

// Get today's missions (most used endpoint)
router.get("/today", getTodayMissions);

// Get mission statistics
router.get("/stats", getMissionStats);

// Get all missions with filters (?subjectId=&status=&date=)
router.get("/", getMissions);

// Update mission status
router.put("/:id/status", updateMissionStatus);

module.exports = router;

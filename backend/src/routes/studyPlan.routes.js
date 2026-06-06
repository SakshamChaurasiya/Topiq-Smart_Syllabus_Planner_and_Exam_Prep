/**
 * studyPlan.routes.js
 * Routing for general study plan operations (e.g., calendar exports).
 */

const express = require("express");
const router = express.Router();
const { exportStudyPlanToIcs, rescheduleMissedDays } = require("../controllers/planner.controller");
const { protect } = require("../middleware/auth.middleware");
const { streakSync } = require("../middleware/streakSync");

// Export study plan to ICS format
router.get("/:planId/export/ics", protect, streakSync, exportStudyPlanToIcs);

// Reschedule missed days
router.post("/:planId/reschedule", protect, streakSync, rescheduleMissedDays);

module.exports = router;

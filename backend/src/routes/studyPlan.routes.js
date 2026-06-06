/**
 * studyPlan.routes.js
 * Routing for general study plan operations (e.g., calendar exports).
 */

const express = require("express");
const router = express.Router();
const { exportStudyPlanToIcs, rescheduleMissedDays } = require("../controllers/planner.controller");
const { protect } = require("../middleware/auth.middleware");

// Export study plan to ICS format
router.get("/:planId/export/ics", protect, exportStudyPlanToIcs);

// Reschedule missed days
router.post("/:planId/reschedule", protect, rescheduleMissedDays);

module.exports = router;

/**
 * studyPlan.routes.js
 * Routing for general study plan operations (e.g., calendar exports).
 */

const express = require("express");
const router = express.Router();
const { exportStudyPlanToIcs } = require("../controllers/planner.controller");
const { protect } = require("../middleware/auth.middleware");

// Export study plan to ICS format
router.get("/:planId/export/ics", protect, exportStudyPlanToIcs);

module.exports = router;

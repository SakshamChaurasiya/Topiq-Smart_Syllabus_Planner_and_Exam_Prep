/**
 * planner.routes.js
 * Study plan generation and cheat code system.
 */

const express = require("express");
const router = express.Router();
const {
    generatePlan,
    generateCheatCode,
    getPlan,
    markDayComplete,
} = require("../controllers/planner.controller");
const { protect } = require("../middleware/auth.middleware");
const { streakSync } = require("../middleware/streakSync");

router.use(protect);
router.use(streakSync);

// Generate a full personalized study plan
router.post("/generate", generatePlan);

// Activate cheat code survival mode
router.post("/cheatcode", generateCheatCode);

// Get active plan for a subject
router.get("/:subjectId", getPlan);

// Mark a day in the plan as completed
router.put("/day/:planId/:dayIndex/complete", markDayComplete);

module.exports = router;

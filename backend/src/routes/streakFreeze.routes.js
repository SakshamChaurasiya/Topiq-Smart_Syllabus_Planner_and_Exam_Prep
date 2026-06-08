/**
 * streakFreeze.routes.js
 * Routing for streak freeze tokens operations.
 */

const express = require("express");
const router = express.Router();
const { getTokens, awardToken } = require("../controllers/streakFreeze.controller");
const { protect } = require("../middleware/auth.middleware");

// Require auth for all streak freeze routes
router.use(protect);

router.get("/", getTokens);
router.post("/award", awardToken);

module.exports = router;

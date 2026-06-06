/**
 * dashboard.routes.js
 */

const express = require("express");
const router = express.Router();
const { getDashboard } = require("../controllers/dashboard.controller");
const { protect } = require("../middleware/auth.middleware");
const { streakSync } = require("../middleware/streakSync");

router.get("/", protect, streakSync, getDashboard);

module.exports = router;

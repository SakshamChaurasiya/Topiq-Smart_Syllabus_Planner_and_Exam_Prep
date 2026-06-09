/**
 * weekReport.routes.js
 * Routing for weekly performance report endpoints.
 */

const express = require("express");
const router = express.Router();
const { getWeekReport } = require("../controllers/weekReport.controller");
const { protect } = require("../middleware/auth.middleware");

// Require authorization for report access
router.get("/", protect, getWeekReport);

module.exports = router;

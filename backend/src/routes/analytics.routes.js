/**
 * analytics.routes.js
 * Routes for fetching study analytics.
 */

const express = require("express");
const router = express.Router();
const { getStudyAnalytics } = require("../controllers/analytics.controller");
const { protect } = require("../middleware/auth.middleware");

router.get("/", protect, getStudyAnalytics);

module.exports = router;

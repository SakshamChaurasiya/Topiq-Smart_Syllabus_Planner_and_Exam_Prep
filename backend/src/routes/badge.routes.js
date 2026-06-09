/**
 * badge.routes.js
 * Routing for badges API endpoints.
 */

const express = require("express");
const router = express.Router();
const { getBadges } = require("../controllers/badge.controller");
const { protect } = require("../middleware/auth.middleware");

// Protect all badge routes
router.use(protect);

// GET /api/badges -> Fetch all badges for the logged-in user
router.get("/", getBadges);

module.exports = router;

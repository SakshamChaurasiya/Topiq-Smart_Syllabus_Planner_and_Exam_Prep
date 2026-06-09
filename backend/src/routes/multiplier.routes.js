/**
 * multiplier.routes.js
 * Routing for public XP multiplier API endpoints.
 */

const express = require("express");
const router = express.Router();
const { getTodayMultiplier, getTomorrowMultiplier } = require("../utils/multiplierDay");
const { sendSuccess } = require("../utils/responseHelper");

// GET /api/multiplier/today
router.get("/today", (req, res) => {
    try {
        const data = getTodayMultiplier();
        return sendSuccess(res, 200, "Today's multiplier fetched.", data);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch today's multiplier."
        });
    }
});

// GET /api/multiplier/tomorrow
router.get("/tomorrow", (req, res) => {
    try {
        const data = getTomorrowMultiplier();
        return sendSuccess(res, 200, "Tomorrow's multiplier fetched.", data);
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to fetch tomorrow's multiplier."
        });
    }
});

module.exports = router;

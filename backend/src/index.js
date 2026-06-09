/**
 * index.js — Topiq Backend Entry Point
 * Topiq — Node.js + Express Server
 *
 * What this file does:
 * 1. Connects to MongoDB
 * 2. Sets up middleware (cors, json parser, file uploads)
 * 3. Registers all API routes
 * 4. Handles global errors
 * 5. Starts the server
 */

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load environment variables FIRST before anything else
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const connectDB = require("./config/db");



const app = express();

// ============================================
// MIDDLEWARE SETUP
// ============================================

// CORS — Allow requests from the React frontend
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// Parse incoming JSON request bodies
app.use(express.json({ limit: "10mb" }));

// Parse URL-encoded form data
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve uploaded files statically (e.g., GET /uploads/filename.pdf)
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// ============================================
// API ROUTES
// ============================================

const authRoutes         = require("./routes/auth.routes");
const subjectRoutes      = require("./routes/subject.routes");
const syllabusRoutes     = require("./routes/syllabus.routes");
const plannerRoutes      = require("./routes/planner.routes");
const studyPlanRoutes    = require("./routes/studyPlan.routes");
const missionRoutes      = require("./routes/mission.routes");
const notificationRoutes = require("./routes/notification.routes");
const dashboardRoutes    = require("./routes/dashboard.routes");
const flashcardRoutes    = require("./routes/flashcard.routes");
const streakFreezeRoutes = require("./routes/streakFreeze.routes");

app.use("/api/auth",          authRoutes);
app.use("/api/subjects",      subjectRoutes);
app.use("/api/syllabus",      syllabusRoutes);
app.use("/api/planner",       plannerRoutes);
app.use("/api/study-plan",    studyPlanRoutes);
app.use("/api/missions",      missionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard",     dashboardRoutes);
app.use("/api/streak-freeze", streakFreezeRoutes);
app.use("/api",               flashcardRoutes);

// ============================================
// HEALTH CHECK
// ============================================
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Topiq server is running.",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
    });
});

// ============================================
// GLOBAL ERROR HANDLER
// ============================================
app.use((err, req, res, next) => {
    console.error("[Global Error]", err.message);

    if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
            success: false,
            message: "File is too large. Maximum size is 10MB.",
        });
    }

    if (err.message && err.message.includes("Invalid file type")) {
        return res.status(400).json({
            success: false,
            message: err.message,
        });
    }

    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal server error.",
    });
});

// ============================================
// 404 HANDLER
// ============================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found.`,
    });
});

// ============================================
// START SERVER (after MongoDB connects)
// ============================================
if (process.env.NODE_ENV !== "test") {
    connectDB().then(() => {
        const PORT = process.env.PORT || 5000;
        app.listen(PORT, () => {
            console.log("========================================");
            console.log(`🚀 Topiq Server running on PORT ${PORT}`);
            console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
            console.log(`🌐 API Base: http://localhost:${PORT}/api`);
            console.log(`💚 Health: http://localhost:${PORT}/health`);
            console.log("========================================");
        });
    }).catch((error) => {
        console.error("❌ Failed to start server:", error.message);
        process.exit(1);
    });
} else {
    // Under testing, just connect to the test database
    connectDB().catch((error) => {
        console.error("❌ Failed to connect to test database:", error.message);
    });
}

module.exports = app;
const express = require("express");
const connectDb = require("./config/db");
const dotenv = require("dotenv");

dotenv.config();

//MongoDB connection
connectDb();

const app = express();

const PORT = process.env.PORT || 5000;

//ENDPOINTS
app.use("/health", (req, res) => {
    res.status(200).json({
        message: "Server is healthy"
    })
})


app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});/**
 * index.js — SSP Backend Entry Point
 * Smart Syllabus Planner — Node.js + Express Server
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
const connectDB = require("./config/db");

// Load environment variables FIRST before anything else
// Specify the path to .env file (parent directory of src/)
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();

// Connect to MongoDB BEFORE starting the server
connectDB().then(() => {
    // Only start the server after MongoDB is connected
    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log("========================================");
        console.log(`🚀 SSP Server running on PORT ${PORT}`);
        console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
        console.log(`🌐 API Base: http://localhost:${PORT}/api`);
        console.log(`💚 Health: http://localhost:${PORT}/health`);
        console.log("========================================");
    });
}).catch((error) => {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
});

// ============================================
// MIDDLEWARE SETUP
// ============================================

// CORS — Allow requests from the React frontend
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true, // Allow cookies/auth headers
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    })
);

// Parse incoming JSON request bodies
app.use(express.json({ limit: "10mb" }));

// Parse URL-encoded form data (for form submissions)
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
const missionRoutes      = require("./routes/mission.routes");
const notificationRoutes = require("./routes/notification.routes");
const dashboardRoutes    = require("./routes/dashboard.routes");

app.use("/api/auth",          authRoutes);
app.use("/api/subjects",      subjectRoutes);
app.use("/api/syllabus",      syllabusRoutes);
app.use("/api/planner",       plannerRoutes);
app.use("/api/missions",      missionRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/dashboard",     dashboardRoutes);

// ============================================
// HEALTH CHECK
// ============================================
app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        message: "SSP Server is healthy 🚀",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "development",
    });
});

// ============================================
// GLOBAL ERROR HANDLER
// Catches any unhandled errors from routes
// ============================================
app.use((err, req, res, next) => {
    console.error("[Global Error]", err.message);

    // Handle Multer file upload errors
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

    // Generic server error
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || "Internal server error.",
    });
});

// ============================================
// 404 HANDLER — Route not found
// ============================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found.`,
    });
});
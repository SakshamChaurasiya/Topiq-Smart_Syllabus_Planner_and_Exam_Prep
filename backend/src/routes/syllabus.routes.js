/**
 * syllabus.routes.js
 * Upload, text input, AI analysis, and topic management.
 */

const express = require("express");
const router = express.Router();
const {
    uploadSyllabus,
    submitTextSyllabus,
    analyzeSyllabus,
    getSyllabus,
    markTopicComplete,
    uploadPYQ,
} = require("../controllers/syllabus.controller");
const { protect } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");
const { createAIRateLimit } = require("../middleware/aiRateLimit.middleware");

// Syllabus analysis: 3 re-runs per hour per user
const syllabusAnalysisLimiter = createAIRateLimit({
    windowMs: 60 * 60 * 1000,
    maxRequests: 3,
    message: "You can run AI analysis up to 3 times per hour. Use forceRerun: true only when needed.",
});

// PYQ upload: 5 uploads per hour per user  
const pyqUploadLimiter = createAIRateLimit({
    windowMs: 60 * 60 * 1000,
    maxRequests: 5,
    message: "You can upload PYQs up to 5 times per hour.",
});

router.use(protect);

// Upload PDF or image
router.post("/upload", upload.single("file"), uploadSyllabus);

// Submit plain text syllabus
router.post("/text", submitTextSyllabus);

// Upload past year paper PDF for analysis
router.post("/:syllabusId/pyq-upload", pyqUploadLimiter, upload.single("file"), uploadPYQ);

// Get syllabus for a subject
router.get("/:subjectId", getSyllabus);

// Trigger AI analysis
router.post("/:id/analyze", syllabusAnalysisLimiter, analyzeSyllabus);

// Mark a specific topic as complete/incomplete
router.put("/:syllabusId/topic/:topicId/complete", markTopicComplete);

module.exports = router;

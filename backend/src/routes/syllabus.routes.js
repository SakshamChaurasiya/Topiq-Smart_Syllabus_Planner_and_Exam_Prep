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
} = require("../controllers/syllabus.controller");
const { protect } = require("../middleware/auth.middleware");
const upload = require("../middleware/upload.middleware");

router.use(protect);

// Upload PDF or image
router.post("/upload", upload.single("file"), uploadSyllabus);

// Submit plain text syllabus
router.post("/text", submitTextSyllabus);

// Get syllabus for a subject
router.get("/:subjectId", getSyllabus);

// Trigger AI analysis
router.post("/:id/analyze", analyzeSyllabus);

// Mark a specific topic as complete/incomplete
router.put("/:syllabusId/topic/:topicId/complete", markTopicComplete);

module.exports = router;

/**
 * subject.routes.js
 * All subject CRUD endpoints — all protected.
 */

const express = require("express");
const router = express.Router();
const {
    getSubjects,
    getSubjectById,
    createSubject,
    updateSubject,
    deleteSubject,
    submitExamReview,
    dismissReview,
    unarchiveSubject,
} = require("../controllers/subject.controller");
const { protect } = require("../middleware/auth.middleware");

// All subject routes require authentication
router.use(protect);

router.get("/", getSubjects);
router.get("/:id", getSubjectById);
router.post("/", createSubject);
router.put("/:id", updateSubject);
router.delete("/:id", deleteSubject);

router.put('/:id/exam-review',    submitExamReview);
router.put('/:id/dismiss-review', dismissReview);
router.put('/:id/unarchive',      unarchiveSubject);

module.exports = router;

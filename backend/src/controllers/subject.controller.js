/**
 * subject.controller.js
 * Full CRUD for subject management.
 * All operations are scoped to the logged-in user.
 */

const Subject = require("../models/subject.model");
const Syllabus = require("../models/syllabus.model");
const StudyPlan = require("../models/studyPlan.model");
const Mission = require("../models/mission.model");
const { sendSuccess, sendError } = require("../utils/responseHelper");

// -------------------------------------------
// @route   GET /api/subjects
// @desc    Get all subjects for the logged-in user
// @access  Protected
// -------------------------------------------
const getSubjects = async (req, res) => {
    try {
        const subjects = await Subject.find({ userId: req.user._id }).sort({ createdAt: -1 });
        const active   = subjects.filter(s => !s.isArchived);
        const archived = subjects.filter(s => s.isArchived);
        return sendSuccess(res, 200, "Subjects fetched successfully.", { active, archived });
    } catch (error) {
        console.error("[Subject] GetAll error:", error.message);
        return sendError(res, 500, "Failed to fetch subjects.");
    }
};

// -------------------------------------------
// @route   GET /api/subjects/:id
// @desc    Get a single subject by ID
// @access  Protected
// -------------------------------------------
const getSubjectById = async (req, res) => {
    try {
        const subject = await Subject.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!subject) {
            return sendError(res, 404, "Subject not found.");
        }

        return sendSuccess(res, 200, "Subject fetched successfully.", subject);
    } catch (error) {
        console.error("[Subject] GetById error:", error.message);
        return sendError(res, 500, "Failed to fetch subject.");
    }
};

// -------------------------------------------
// @route   POST /api/subjects
// @desc    Create a new subject
// @access  Protected
// -------------------------------------------
const createSubject = async (req, res) => {
    try {
        const { name, code, examDate, difficulty, color, priority, notes } = req.body;

        if (!name) {
            return sendError(res, 400, "Subject name is required.");
        }

        const subject = await Subject.create({
            userId: req.user._id,
            name,
            code: code || null,
            examDate: examDate || null,
            difficulty: difficulty || "medium",
            color: color || "#6366f1",
            priority: priority || "medium",
            notes: notes || "",
        });

        return sendSuccess(res, 201, `Subject "${name}" created successfully.`, subject);
    } catch (error) {
        console.error("[Subject] Create error:", error.message);
        return sendError(res, 500, "Failed to create subject.");
    }
};

// -------------------------------------------
// @route   PUT /api/subjects/:id
// @desc    Update a subject
// @access  Protected
// -------------------------------------------
const updateSubject = async (req, res) => {
    try {
        const subject = await Subject.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!subject) {
            return sendError(res, 404, "Subject not found.");
        }

        const { name, code, examDate, difficulty, color, priority, notes, completedTopics } = req.body;

        // Update only provided fields
        if (name !== undefined) subject.name = name;
        if (code !== undefined) subject.code = code;
        if (examDate !== undefined) {
            subject.examDate = examDate;

            // Update active study plan's examDate and daysRemaining in sync
            const exam = new Date(examDate);
            exam.setHours(0, 0, 0, 0);

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const daysRemaining = Math.max(1, Math.ceil((exam - today) / (1000 * 60 * 60 * 24)));

            await StudyPlan.updateMany(
                { subjectId: subject._id, userId: req.user._id, isActive: true },
                { examDate: exam, daysRemaining }
            );
        }
        if (difficulty !== undefined) subject.difficulty = difficulty;
        if (color !== undefined) subject.color = color;
        if (priority !== undefined) subject.priority = priority;
        if (notes !== undefined) subject.notes = notes;
        if (completedTopics !== undefined) subject.completedTopics = completedTopics;
        await subject.save(); // Triggers the pre-save hook to recalculate progress

        if (subject.completedTopics === subject.totalTopics && subject.totalTopics > 0) {
            try {
                const { awardBadge } = require("../utils/badges");
                await awardBadge(req.user._id, "topper");
            } catch (badgeErr) {
                console.error("[Subject] Error awarding topper badge:", badgeErr);
            }
        }

        return sendSuccess(res, 200, "Subject updated successfully.", subject);
    } catch (error) {
        console.error("[Subject] Update error:", error.message);
        return sendError(res, 500, "Failed to update subject.");
    }
};

// -------------------------------------------
// @route   DELETE /api/subjects/:id
// @desc    Delete a subject and all related data
// @access  Protected
// -------------------------------------------
const deleteSubject = async (req, res) => {
    try {
        const subject = await Subject.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!subject) {
            return sendError(res, 404, "Subject not found.");
        }

        const subjectId = subject._id;

        // Delete all related data in parallel
        await Promise.all([
            Subject.findByIdAndDelete(subjectId),
            Syllabus.deleteMany({ subjectId }),
            StudyPlan.deleteMany({ subjectId }),
            Mission.deleteMany({ subjectId }),
        ]);

        return sendSuccess(res, 200, `Subject "${subject.name}" and all related data deleted successfully.`);
    } catch (error) {
        console.error("[Subject] Delete error:", error.message);
        return sendError(res, 500, "Failed to delete subject.");
    }
};

// ── HANDLER 1: submitExamReview ──
// PUT /api/subjects/:id/exam-review
// Saves the post-exam review and optionally archives the subject.
const submitExamReview = async (req, res) => {
  try {
    const subject = await Subject.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!subject) return sendError(res, 404, 'Subject not found.');

    const { rating, hardestTopic, topiqHelpfulness, reflection, action } = req.body;
    // action: 'archive' | 'delete' | 'keep'

    // Validate rating
    const validRatings = ['terrible', 'hard', 'okay', 'good', 'crushed'];
    if (!rating || !validRatings.includes(rating)) {
      return sendError(res, 400, 'Valid rating is required (terrible/hard/okay/good/crushed).');
    }

    // Save review fields
    subject.examReview = {
      rating,
      hardestTopic: hardestTopic || null,
      topiqHelpfulness: topiqHelpfulness || null,
      reflection: reflection?.slice(0, 200) || null,
      completedAt: new Date(),
      reviewDismissedCount: subject.examReview?.reviewDismissedCount || 0,
      reviewDismissedAt: subject.examReview?.reviewDismissedAt || null,
    };

    if (action === 'archive') {
      subject.isArchived = true;
      subject.archivedAt = new Date();
    }

    await subject.save();

    // Create a notification
    const Notification = require('../models/notification.model');
    const ratingEmoji = { terrible:'😰', hard:'😟', okay:'😐', good:'😊', crushed:'🎉' };
    await Notification.create({
      userId: req.user._id,
      title: `Exam reviewed: ${subject.name}`,
      message: `You rated your ${subject.name} exam as "${rating}" ${ratingEmoji[rating]}. ${action === 'archive' ? 'Subject archived.' : 'Subject kept active.'}`,
      type: 'achievement',
    }).catch(() => {}); // never crash over notification

    if (action === 'delete') {
      // Full cascade delete — same as deleteSubject
      const subjectId = subject._id;
      await Promise.all([
        Subject.findByIdAndDelete(subjectId),
        require('../models/syllabus.model').deleteMany({ subjectId }),
        require('../models/studyPlan.model').deleteMany({ subjectId }),
        require('../models/mission.model').deleteMany({ subjectId }),
      ]);
      return sendSuccess(res, 200, `"${subject.name}" reviewed and deleted.`, { action: 'deleted' });
    }

    return sendSuccess(res, 200, 'Exam review saved.', {
      action: action || 'keep',
      isArchived: subject.isArchived,
      examReview: subject.examReview,
    });
  } catch (error) {
    console.error('[Subject] submitExamReview error:', error.message);
    return sendError(res, 500, 'Failed to save exam review.');
  }
};

// ── HANDLER 2: dismissReview ──
// PUT /api/subjects/:id/dismiss-review
// Increments dismissal count. After 3 dismissals, banner stops appearing.
const dismissReview = async (req, res) => {
  try {
    const subject = await Subject.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!subject) return sendError(res, 404, 'Subject not found.');

    if (!subject.examReview) subject.examReview = {};
    subject.examReview.reviewDismissedCount =
      (subject.examReview.reviewDismissedCount || 0) + 1;
    subject.examReview.reviewDismissedAt = new Date();

    await subject.save();
    return sendSuccess(res, 200, 'Review dismissed.', {
      dismissCount: subject.examReview.reviewDismissedCount,
    });
  } catch (error) {
    console.error('[Subject] dismissReview error:', error.message);
    return sendError(res, 500, 'Failed to dismiss review.');
  }
};

// ── HANDLER 3: unarchiveSubject ──
// PUT /api/subjects/:id/unarchive
// Moves subject back to active.
const unarchiveSubject = async (req, res) => {
  try {
    const subject = await Subject.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });
    if (!subject) return sendError(res, 404, 'Subject not found.');

    subject.isArchived = false;
    subject.archivedAt = null;
    await subject.save();

    return sendSuccess(res, 200, `"${subject.name}" moved back to active subjects.`, subject);
  } catch (error) {
    console.error('[Subject] unarchiveSubject error:', error.message);
    return sendError(res, 500, 'Failed to unarchive subject.');
  }
};

module.exports = {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  submitExamReview,
  dismissReview,
  unarchiveSubject
};

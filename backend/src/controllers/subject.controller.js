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
        return sendSuccess(res, 200, "Subjects fetched successfully.", subjects);
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
        if (examDate !== undefined) subject.examDate = examDate;
        if (difficulty !== undefined) subject.difficulty = difficulty;
        if (color !== undefined) subject.color = color;
        if (priority !== undefined) subject.priority = priority;
        if (notes !== undefined) subject.notes = notes;
        if (completedTopics !== undefined) subject.completedTopics = completedTopics;

        await subject.save(); // Triggers the pre-save hook to recalculate progress

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

module.exports = { getSubjects, getSubjectById, createSubject, updateSubject, deleteSubject };

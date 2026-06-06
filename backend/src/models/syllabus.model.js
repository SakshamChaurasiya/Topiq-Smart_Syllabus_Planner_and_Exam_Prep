/**
 * syllabus.model.js
 * Stores uploaded/entered syllabus content for a subject.
 * After upload, AI analyzes and populates units and topics.
 */

const mongoose = require("mongoose");

// --- Topic Schema (nested inside Unit) ---
const topicSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true,
    },

    // AI-detected importance
    importance: {
        type: String,
        enum: ["critical", "high", "medium", "low"],
        default: "medium",
    },

    // AI-estimated difficulty
    difficulty: {
        type: String,
        enum: ["easy", "medium", "hard"],
        default: "medium",
    },

    // AI-estimated hours to complete this topic
    estimatedHours: {
        type: Number,
        default: 1,
    },

    // Whether the student marked this topic as completed
    isCompleted: {
        type: Boolean,
        default: false,
    },

    // Estimated marks weightage (e.g., 5 marks, 10 marks)
    marksWeightage: {
        type: Number,
        default: 0,
    },

    // AI-generated quick summary of what to study
    summary: {
        type: String,
        default: "",
    },
});

// --- Unit Schema (nested inside Syllabus) ---
const unitSchema = new mongoose.Schema({
    unitNumber: {
        type: Number,
        required: true,
    },
    unitName: {
        type: String,
        required: true,
        trim: true,
    },
    topics: [topicSchema],
    totalTopics: {
        type: Number,
        default: 0,
    },
    completedTopics: {
        type: Number,
        default: 0,
    },
});

// --- Main Syllabus Schema ---
const syllabusSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subject",
            required: true,
        },

        // How the syllabus was provided
        inputType: {
            type: String,
            enum: ["pdf", "image", "text"],
            required: true,
        },

        // Original text extracted from the upload or typed directly
        rawContent: {
            type: String,
            default: "",
        },

        // File path for uploaded PDF/image (stored in /uploads folder)
        filePath: {
            type: String,
            default: null,
        },

        // Original file name (for display purposes)
        originalFileName: {
            type: String,
            default: null,
        },

        // Whether AI has analyzed this syllabus yet
        isAnalyzed: {
            type: Boolean,
            default: false,
        },

        // Structured units and topics (populated after AI analysis)
        units: [unitSchema],

        // AI Analysis Results
        aiAnalysis: {
            // Short summary of the entire syllabus
            summary: {
                type: String,
                default: "",
            },

            // Total estimated hours to complete the full syllabus
            totalEstimatedHours: {
                type: Number,
                default: 0,
            },

            // Top topics the AI recommends studying first
            topPriorityTopics: {
                type: [String],
                default: [],
            },

            // Overall difficulty level
            overallDifficulty: {
                type: String,
                enum: ["easy", "medium", "hard", "very-hard"],
                default: "medium",
            },

            // Breakdown: { easy: 40, medium: 40, hard: 20 } (percentages)
            difficultyBreakdown: {
                easy: { type: Number, default: 0 },
                medium: { type: Number, default: 0 },
                hard: { type: Number, default: 0 },
            },

            // Topics most likely to appear in exams
            examLikelyTopics: {
                type: [String],
                default: [],
            },

            // Recommended study strategy
            studyStrategy: {
                type: String,
                default: "",
            },
        },

        // PYQ (Past Year Question) Analysis Results
        pyqAnalysis: {
            uploadedAt: {
                type: Date,
                default: null,
            },
            pyqSuggestedTopics: [
                {
                    topic: { type: String },
                    frequency: { type: Number, default: 1 },
                    yearsAppeared: { type: [String], default: [] },
                    estimatedMarks: { type: Number, default: 0 },
                },
            ],
            overlapTopics: {
                type: [String],
                default: [],
            },
            pyqOnlyTopics: {
                type: [String],
                default: [],
            },
            aiOnlyTopics: {
                type: [String],
                default: [],
            },
        },

        // Total topic count across all units
        totalTopics: {
            type: Number,
            default: 0,
        },

        // ── Cache Key for AI Analysis ────────────────────────────────────────
        // Keyed on hash(rawContent + institution + targetGoal) so any change
        // to the syllabus content OR user context invalidates the cache.
        analysisCache: {
            key:         { type: String, default: null },
            cachedAt:    { type: Date, default: null },
            institution: { type: String, default: '' },
            targetGoal:  { type: String, default: '' },
        },

        // ── Spaced Repetition Progress ───────────────────────────────────────
        // Tracks per-topic study history for generating revision missions
        // on the scientifically-backed SM-2 schedule (1 → 3 → 7 → 14 → 30 days).
        topicProgress: [
            {
                topicName:      { type: String },
                lastStudiedAt:  { type: Date },
                nextReviewDate: { type: Date },
                intervalIndex:  { type: Number, default: 0 },
                rating: {
                    type: String,
                    enum: ['got-it', 'shaky', 'no-idea'],
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("Syllabus", syllabusSchema);

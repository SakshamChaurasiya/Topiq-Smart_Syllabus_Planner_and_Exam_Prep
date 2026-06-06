/**
 * subject.model.js
 * Represents an academic subject (e.g., Data Structures, DBMS).
 * Each subject belongs to one user and can have a syllabus attached.
 */

const mongoose = require("mongoose");

const subjectSchema = new mongoose.Schema(
    {
        // The user who owns this subject
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        // Subject name e.g., "Data Structures and Algorithms"
        name: {
            type: String,
            required: [true, "Subject name is required"],
            trim: true,
        },

        // Short code e.g., "DSA", "DBMS"
        code: {
            type: String,
            trim: true,
            uppercase: true,
            default: null,
        },

        // Exam date for this subject
        examDate: {
            type: Date,
            default: null,
        },

        // Overall difficulty rating
        difficulty: {
            type: String,
            enum: ["easy", "medium", "hard"],
            default: "medium",
        },

        // UI display color (hex code)
        color: {
            type: String,
            default: "#6366f1",
        },

        // Total number of topics extracted from syllabus
        totalTopics: {
            type: Number,
            default: 0,
        },

        // How many topics the student has completed
        completedTopics: {
            type: Number,
            default: 0,
        },

        // Completion percentage (0–100)
        progress: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },

        // Whether the student has already uploaded and analyzed a syllabus
        hasSyllabus: {
            type: Boolean,
            default: false,
        },

        // Study priority set by the student or AI
        priority: {
            type: String,
            enum: ["low", "medium", "high", "critical"],
            default: "medium",
        },

        // Notes or description the student adds
        notes: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

// Auto-calculate progress before saving
subjectSchema.pre("save", function (next) {
    if (this.totalTopics > 0) {
        this.progress = Math.round((this.completedTopics / this.totalTopics) * 100);
    } else {
        this.progress = 0;
    }
    next();
});

module.exports = mongoose.model("Subject", subjectSchema);

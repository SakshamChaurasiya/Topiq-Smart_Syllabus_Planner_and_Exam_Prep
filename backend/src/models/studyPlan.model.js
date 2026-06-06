/**
 * studyPlan.model.js
 * Stores the AI-generated personalized study plan for a subject.
 * Includes daily plans, cheat code modes, and target goals.
 */

const mongoose = require("mongoose");

// --- Daily Study Session Schema ---
const dailyPlanSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
    },

    // Day label e.g., "Day 1", "Day 2"
    dayLabel: {
        type: String,
        default: "",
    },

    // Topics to cover on this day
    topics: [
        {
            topicName: String,
            unitName: String,
            estimatedHours: Number,
            importance: {
                type: String,
                enum: ["critical", "high", "medium", "low"],
                default: "medium",
            },
        },
    ],

    // Total study hours planned for this day
    plannedHours: {
        type: Number,
        default: 0,
    },

    // Whether the student completed all tasks for this day
    isCompleted: {
        type: Boolean,
        default: false,
    },

    // Notes or tips for this day
    studyTip: {
        type: String,
        default: "",
    },

    // Whether this day was marked completed because its topics were rescheduled
    rescheduled: {
        type: Boolean,
        default: false,
    },
});

// --- Main Study Plan Schema ---
const studyPlanSchema = new mongoose.Schema(
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

        syllabusId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Syllabus",
            required: true,
        },

        // Exam date entered by the student
        examDate: {
            type: Date,
            required: true,
        },

        // How many hours per day the student can study
        availableHoursPerDay: {
            type: Number,
            required: true,
            min: 1,
            max: 16,
        },

        // Student's target goal
        targetGoal: {
            type: String,
            enum: ["pass", "good", "excellent"],
            required: true,
            default: "good",
        },

        // Plan mode — normal or cheat code survival mode
        mode: {
            type: String,
            enum: ["normal", "1day", "3day", "7day", "15day", "custom"],
            default: "normal",
        },

        // Days remaining when plan was generated
        daysRemaining: {
            type: Number,
            default: 0,
        },

        // AI-generated daily schedule
        dailyPlans: [dailyPlanSchema],

        // AI-generated priority topics for this plan
        priorityTopics: {
            type: [String],
            default: [],
        },

        // Must-study topics (for cheat code mode)
        mustStudyTopics: {
            type: [String],
            default: [],
        },

        // AI survival strategy message
        survivalStrategy: {
            type: String,
            default: "",
        },

        // Overall plan summary from AI
        planSummary: {
            type: String,
            default: "",
        },

        // Whether this is the currently active plan
        isActive: {
            type: Boolean,
            default: true,
        },

        // Completion percentage of the plan
        completionPercentage: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("StudyPlan", studyPlanSchema);

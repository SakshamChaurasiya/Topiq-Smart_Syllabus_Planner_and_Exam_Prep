/**
 * mission.model.js
 * Small, actionable study tasks generated from the study plan.
 * Instead of showing "Study Unit 3", missions show:
 *   ✅ Complete Topic 3.1 (45 min)
 *   ✅ Solve 5 practice questions
 *   ✅ Write a 1-page summary
 */

const mongoose = require("mongoose");

const missionSchema = new mongoose.Schema(
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

        studyPlanId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "StudyPlan",
            required: true,
        },

        // Mission title — concise and action-oriented
        title: {
            type: String,
            required: true,
            trim: true,
        },

        // Description with specific instructions
        description: {
            type: String,
            default: "",
        },

        // Type of mission
        type: {
            type: String,
            enum: ["study", "revision", "practice", "summary", "quiz"],
            default: "study",
        },

        // Priority of this mission
        priority: {
            type: String,
            enum: ["critical", "high", "medium", "low"],
            default: "medium",
        },

        // Current status of the mission
        status: {
            type: String,
            enum: ["pending", "in-progress", "completed", "skipped"],
            default: "pending",
        },

        // The date this mission should be done by
        dueDate: {
            type: Date,
            required: true,
        },

        // Estimated time to complete (in minutes)
        estimatedMinutes: {
            type: Number,
            default: 30,
        },

        // When the student actually completed it
        completedAt: {
            type: Date,
            default: null,
        },

        // The topic this mission is about
        topicName: {
            type: String,
            default: "",
        },

        // Which unit this topic belongs to
        unitName: {
            type: String,
            default: "",
        },

        // XP reward for completing this mission (for Phase 2 gamification)
        xpReward: {
            type: Number,
            default: 10,
        },

        // Whether this is a bonus/extra mission
        isBonus: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

// Index for fast queries — get all missions for a user on a specific date
missionSchema.index({ userId: 1, dueDate: 1 });
missionSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model("Mission", missionSchema);

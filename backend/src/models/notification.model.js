/**
 * notification.model.js
 * Study reminders, exam alerts, and mission notifications.
 */

const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },

        title: {
            type: String,
            required: true,
            trim: true,
        },

        message: {
            type: String,
            required: true,
        },

        // Notification category
        type: {
            type: String,
            enum: [
                "task-reminder",
                "exam-reminder",
                "revision-alert",
                "mission-due",
                "plan-generated",
                "streak-alert",
                "general",
                "achievement",
                "xp-boost",
            ],
            default: "general",
        },

        // Has the user read this notification?
        isRead: {
            type: Boolean,
            default: false,
        },

        // Optional link to a related resource
        actionUrl: {
            type: String,
            default: null,
        },

        // Related subject (if applicable)
        subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subject",
            default: null,
        },

        // When this notification should fire (for scheduled alerts)
        scheduledFor: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Fast lookup: unread notifications for a user
notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model("Notification", notificationSchema);

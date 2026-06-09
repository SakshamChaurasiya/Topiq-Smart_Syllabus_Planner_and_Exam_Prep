/**
 * badge.model.js
 * Stores earned gamification badges for users.
 */

const mongoose = require("mongoose");

const badgeSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        badgeId: {
            type: String,
            required: true,
        },
        earnedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

// Unique index to prevent duplicate awards of the same badge to a user
badgeSchema.index({ userId: 1, badgeId: 1 }, { unique: true });

module.exports = mongoose.model("Badge", badgeSchema);

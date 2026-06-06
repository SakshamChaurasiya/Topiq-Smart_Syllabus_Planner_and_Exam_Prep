/**
 * user.model.js
 * Defines the User schema for MongoDB.
 * Stores authentication info and basic profile.
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
    {
        // Full name of the student
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
        },

        // Email must be unique — used for login
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
        },

        // Password is stored as a hashed value — never plain text
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters"],
            select: false, // Never return password in queries by default
        },

        // Optional profile avatar URL
        avatar: {
            type: String,
            default: null,
        },

        // Target academic goal
        targetGoal: {
            type: String,
            enum: ["pass", "good", "excellent"],
            default: "good",
        },

        // XP for gamification
        xp: {
            type: Number,
            default: 0,
        },

        // Level of the user
        level: {
            type: Number,
            default: 1,
        },

        // Daily activity streak
        streak: {
            type: Number,
            default: 0,
        },

        // Last date the user was active / completed a mission (YYYY-MM-DD)
        lastActiveDate: {
            type: String,
            default: null,
        },
    },
    {
        // Automatically add createdAt and updatedAt fields
        timestamps: true,
    }
);

// -----------------------------------------------
// MIDDLEWARE: Hash password before saving
// -----------------------------------------------
userSchema.pre("save", async function () {
    if (!this.isModified("password")) return;

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

// -----------------------------------------------
// INSTANCE METHOD: Check if entered password is correct
// -----------------------------------------------
userSchema.methods.comparePassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
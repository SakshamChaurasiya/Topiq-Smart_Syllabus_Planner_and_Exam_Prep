/**
 * auth.controller.js
 * Handles user registration, login, and profile retrieval.
 */

const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { sendSuccess, sendError } = require("../utils/responseHelper");

// -------------------------------------------
// Helper: Generate a signed JWT token
// -------------------------------------------
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
    );
};

// -------------------------------------------
// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
// -------------------------------------------
const register = async (req, res) => {
    try {
        const { name, email, password, targetGoal } = req.body;

        // Basic validation
        if (!name || !email || !password) {
            return sendError(res, 400, "Please provide name, email, and password.");
        }

        // Check if email already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return sendError(res, 400, "An account with this email already exists. Please login.");
        }

        // Create the user — password is automatically hashed by the model pre-save hook
        const user = await User.create({
            name,
            email,
            password,
            targetGoal: targetGoal || "good",
        });

        // Generate JWT token
        const token = generateToken(user._id);

        return sendSuccess(res, 201, "Account created successfully! Welcome to SSP.", {
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                targetGoal: user.targetGoal,
                avatar: user.avatar,
                xp: user.xp,
                level: user.level,
                streak: user.streak,
                targetXP: user.level * 250,
            },
        });
    } catch (error) {
        console.error("[Auth] Register error:", error.message);
        return sendError(res, 500, "Registration failed. Please try again.");
    }
};

// -------------------------------------------
// @route   POST /api/auth/login
// @desc    Login with email and password
// @access  Public
// -------------------------------------------
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return sendError(res, 400, "Please provide email and password.");
        }

        // Find user — explicitly select password because model has select:false
        const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

        if (!user) {
            return sendError(res, 401, "Invalid email or password.");
        }

        // Check password using the model's comparePassword method
        const isPasswordCorrect = await user.comparePassword(password);
        if (!isPasswordCorrect) {
            return sendError(res, 401, "Invalid email or password.");
        }

        // Generate token
        const token = generateToken(user._id);

        return sendSuccess(res, 200, "Login successful! Welcome back.", {
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                targetGoal: user.targetGoal,
                avatar: user.avatar,
                xp: user.xp,
                level: user.level,
                streak: user.streak,
                targetXP: user.level * 250,
            },
        });
    } catch (error) {
        console.error("[Auth] Login error:", error.message);
        return sendError(res, 500, "Login failed. Please try again.");
    }
};

// -------------------------------------------
// @route   GET /api/auth/me
// @desc    Get current logged-in user's profile
// @access  Protected
// -------------------------------------------
const getMe = async (req, res) => {
    try {
        // req.user is attached by auth.middleware.js
        const user = req.user;

        return sendSuccess(res, 200, "Profile fetched successfully.", {
            id: user._id,
            name: user.name,
            email: user.email,
            targetGoal: user.targetGoal,
            avatar: user.avatar,
            xp: user.xp,
            level: user.level,
            streak: user.streak,
            targetXP: user.level * 250,
            createdAt: user.createdAt,
        });
    } catch (error) {
        console.error("[Auth] GetMe error:", error.message);
        return sendError(res, 500, "Failed to fetch profile.");
    }
};

// -------------------------------------------
// @route   PUT /api/auth/update-profile
// @desc    Update user name or targetGoal
// @access  Protected
// -------------------------------------------
const updateProfile = async (req, res) => {
    try {
        const { name, targetGoal } = req.body;

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { name, targetGoal },
            { returnDocument: "after", runValidators: true }
        );

        return sendSuccess(res, 200, "Profile updated successfully.", {
            id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            targetGoal: updatedUser.targetGoal,
            avatar: updatedUser.avatar,
            xp: updatedUser.xp,
            level: updatedUser.level,
            streak: updatedUser.streak,
            targetXP: updatedUser.level * 250,
        });
    } catch (error) {
        console.error("[Auth] UpdateProfile error:", error.message);
        return sendError(res, 500, "Failed to update profile.");
    }
};

module.exports = { register, login, getMe, updateProfile };

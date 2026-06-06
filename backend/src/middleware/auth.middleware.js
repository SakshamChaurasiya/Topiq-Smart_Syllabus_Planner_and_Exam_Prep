/**
 * auth.middleware.js
 * Verifies the JWT token on every protected route.
 * If the token is valid, attaches the user to req.user.
 * If not, returns a 401 Unauthorized error.
 */

const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { sendError } = require("../utils/responseHelper");

const protect = async (req, res, next) => {
    let token;

    // Check if Authorization header exists and starts with "Bearer"
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith("Bearer")
    ) {
        // Extract token from "Bearer <token>"
        token = req.headers.authorization.split(" ")[1];
    }

    // If no token found, deny access
    if (!token) {
        return sendError(res, 401, "Access denied. No token provided. Please login.");
    }

    try {
        // Verify the token using our secret
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find the user from the decoded token payload
        // We use .select("-password") but since model already has select:false on password,
        // we just fetch normally
        const user = await User.findById(decoded.id);

        if (!user) {
            return sendError(res, 401, "User no longer exists. Please login again.");
        }

        // Attach the full user object to the request
        req.user = user;

        // Move to the next middleware or route handler
        next();
    } catch (error) {
        // Token is invalid or expired
        if (error.name === "JsonWebTokenError") {
            return sendError(res, 401, "Invalid token. Please login again.");
        }
        if (error.name === "TokenExpiredError") {
            return sendError(res, 401, "Token expired. Please login again.");
        }
        return sendError(res, 401, "Authentication failed.");
    }
};

module.exports = { protect };

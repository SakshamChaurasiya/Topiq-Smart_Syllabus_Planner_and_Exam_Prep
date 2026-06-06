/**
 * aiRateLimit.middleware.js
 * In-memory rate limiting middleware for protect expensive Gemini AI endpoints.
 * Note: Reset on server restart (acceptable for development). For production, upgrade to Redis.
 */

const aiRateLimitStore = new Map();

const createAIRateLimit = ({ 
    windowMs = 60 * 60 * 1000,  // 1 hour default
    maxRequests = 3,             // max AI calls per user per window
    message = "Too many AI requests. Please wait before trying again."
} = {}) => {
    return (req, res, next) => {
        const userId = req.user?._id?.toString();
        if (!userId) return next();

        const now = Date.now();
        const key = `${req.path}:${userId}`;
        const record = aiRateLimitStore.get(key);

        if (record) {
            // Clean up expired window
            if (now - record.windowStart > windowMs) {
                aiRateLimitStore.set(key, { windowStart: now, count: 1 });
                return next();
            }

            if (record.count >= maxRequests) {
                const resetIn = Math.ceil(
                    (windowMs - (now - record.windowStart)) / 60000
                );
                return res.status(429).json({
                    success: false,
                    message,
                    resetInMinutes: resetIn,
                });
            }

            record.count += 1;
            aiRateLimitStore.set(key, record);
        } else {
            aiRateLimitStore.set(key, { windowStart: now, count: 1 });
        }

        next();
    };
};

// Cleanup stale entries every hour to prevent memory leak
setInterval(() => {
    const now = Date.now();
    for (const [key, record] of aiRateLimitStore.entries()) {
        if (now - record.windowStart > 2 * 60 * 60 * 1000) {
            aiRateLimitStore.delete(key);
        }
    }
}, 60 * 60 * 1000);

module.exports = { createAIRateLimit };

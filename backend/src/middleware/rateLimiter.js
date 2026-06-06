/**
 * rateLimiter.js
 * MongoDB-backed rate limiter. Survives server restarts and horizontal scaling.
 * Uses a TTL-indexed collection so documents auto-delete after the window expires.
 */
const mongoose = require('mongoose');

const rateLimitSchema = new mongoose.Schema({
  key:       { type: String, required: true, unique: true },
  count:     { type: Number, default: 1 },
  resetAt:   { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
});

// TTL index: MongoDB auto-deletes documents when resetAt is reached
rateLimitSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });

const RateLimit = mongoose.model('RateLimit', rateLimitSchema);

/**
 * createRateLimiter(options)
 * @param {number} options.max       - max requests allowed in window
 * @param {number} options.windowMs  - window duration in milliseconds
 * @param {string} options.keyPrefix - unique prefix per route (e.g. 'syllabus_analyze')
 * @param {string} options.message   - error message when limit hit
 */
const createRateLimiter = ({ max, windowMs, keyPrefix, message }) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?._id?.toString() || req.ip;
      const key = `${keyPrefix}:${userId}`;
      const now = new Date();
      const resetAt = new Date(now.getTime() + windowMs);

      let record;
      try {
        // Try to upsert: increment count if key exists within window, else create new
        record = await RateLimit.findOneAndUpdate(
          { key, resetAt: { $gt: now } },
          { $inc: { count: 1 }, $setOnInsert: { resetAt, createdAt: now } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      } catch (upsertErr) {
        // Race condition on upsert (duplicate key) — just fetch the existing record
        if (upsertErr.code === 11000) {
          record = await RateLimit.findOne({ key, resetAt: { $gt: now } });
          if (record) {
            record.count += 1;
            await record.save();
          }
        } else {
          throw upsertErr;
        }
      }

      if (!record) {
        // No record found (shouldn't happen), create fresh
        record = await RateLimit.create({ key, count: 1, resetAt, createdAt: now });
      }

      const remaining = Math.max(0, max - record.count);
      const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);

      res.set({
        'X-RateLimit-Limit':     max,
        'X-RateLimit-Remaining': remaining,
        'X-RateLimit-Reset':     Math.ceil(record.resetAt.getTime() / 1000),
      });

      if (record.count > max) {
        return res.status(429).json({
          success: false,
          message: message || 'Too many requests. Please try again later.',
          retryAfter: retryAfterSec,
        });
      }

      next();
    } catch (err) {
      // On any DB error, fail open — never block legitimate users
      console.error('[RateLimiter] DB error — failing open:', err.message);
      next();
    }
  };
};

module.exports = { createRateLimiter };

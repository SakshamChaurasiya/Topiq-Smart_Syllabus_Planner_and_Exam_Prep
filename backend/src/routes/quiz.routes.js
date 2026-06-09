const express = require('express');
const router = express.Router();
const { generateQuiz, submitQuiz } = require('../controllers/quiz.controller');
const { protect } = require('../middleware/auth.middleware');
const { createAIRateLimit } = require('../middleware/aiRateLimit.middleware');

// Rate limiter: 3 quiz generations per hour per user
const aiRateLimit = createAIRateLimit({
  windowMs: 60 * 60 * 1000,
  maxRequests: 3,
  message: "Too many AI requests. Please wait before trying again."
});

router.post('/generate', protect, aiRateLimit, generateQuiz);
router.post('/submit',   protect, submitQuiz);

module.exports = router;

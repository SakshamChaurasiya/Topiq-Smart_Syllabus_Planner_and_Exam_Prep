const Mission = require('../models/mission.model');
const Subject = require('../models/subject.model');
const User = require('../models/user.model');
const { generateQuizQuestions } = require('../services/ai.service');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { getXPForLevel } = require('../utils/xpSystem');

// POST /api/quiz/generate
// Body: { topicName, subjectId, difficulty? }
// Generates 3 MCQs for a given topic. Auth + rate limited.
const generateQuiz = async (req, res) => {
  try {
    const { topicName, subjectId, difficulty = 'medium' } = req.body;
    if (!topicName || !subjectId) {
      return sendError(res, 400, 'topicName and subjectId are required.');
    }
    const subject = await Subject.findOne({ _id: subjectId, userId: req.user._id });
    if (!subject) return sendError(res, 404, 'Subject not found.');

    const result = await generateQuizQuestions(topicName, subject.name, difficulty);
    if (!result) {
      return sendError(res, 503, 'Quiz generation unavailable. Try again in a moment.');
    }
    return sendSuccess(res, 200, 'Quiz generated.', {
      questions: result.questions,
      topicName,
      subjectName: subject.name,
    });
  } catch (error) {
    console.error('[Quiz] generateQuiz error:', error.message);
    return sendError(res, 500, 'Failed to generate quiz.');
  }
};

// POST /api/quiz/submit
// Body: { answers: [0,2,1], questions: [...from generate response...] }
// Stateless — client sends questions back so no regeneration needed.
const submitQuiz = async (req, res) => {
  try {
    const { answers, questions } = req.body;
    if (!answers || !questions || answers.length !== questions.length) {
      return sendError(res, 400, 'answers and questions arrays must be provided and same length.');
    }

    // Score calculation
    let score = 0;
    const results = questions.map((q, i) => {
      const correct = answers[i] === q.correctIndex;
      if (correct) score++;
      return { correct, explanation: q.explanation, correctIndex: q.correctIndex, chosen: answers[i] };
    });

    // Bonus XP: 0→0, 1→5, 2→15, 3→30
    const bonusXPMap = { 0: 0, 1: 5, 2: 15, 3: 30 };
    const bonusXP = bonusXPMap[score] || 0;

    // Derive confidence from score
    const confidence = score <= 1 ? 'shaky' : score === 2 ? 'okay' : 'solid';

    // Award bonus XP to user
    const user = req.user;
    let leveledUp = false;
    const oldLevel = user.level;
    if (bonusXP > 0) {
      user.xp += bonusXP;
      while (user.xp >= getXPForLevel(user.level)) {
        user.xp -= getXPForLevel(user.level);
        user.level += 1;
        leveledUp = true;
      }
      await user.save();
    }

    return sendSuccess(res, 200, 'Quiz submitted.', {
      score,
      total: 3,
      bonusXP,
      confidence,
      results,
      leveledUp,
      user: {
        xp: user.xp,
        level: user.level,
        targetXP: getXPForLevel(user.level),
      },
    });
  } catch (error) {
    console.error('[Quiz] submitQuiz error:', error.message);
    return sendError(res, 500, 'Failed to submit quiz.');
  }
};

module.exports = { generateQuiz, submitQuiz };

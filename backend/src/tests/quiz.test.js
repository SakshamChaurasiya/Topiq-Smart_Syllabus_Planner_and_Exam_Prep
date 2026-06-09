/**
 * quiz.test.js
 * Unit tests for the quiz scoring and XP mapping logic.
 */

const { test } = require('node:test');
const assert = require('node:assert/strict');

// ── Score and bonus XP logic (extracted for isolated testing) ──
const scoreQuiz = (answers, questions) => {
  if (!answers || !questions || answers.length !== questions.length) {
    throw new Error('Invalid input');
  }
  let score = 0;
  const results = questions.map((q, i) => {
    const correct = answers[i] === q.correctIndex;
    if (correct) score++;
    return { correct, explanation: q.explanation };
  });
  const bonusXPMap = { 0: 0, 1: 5, 2: 15, 3: 30 };
  const bonusXP = bonusXPMap[score] || 0;
  const confidence = score <= 1 ? 'shaky' : score === 2 ? 'okay' : 'solid';
  return { score, bonusXP, confidence, results };
};

const mockQuestions = [
  { question: 'Q1', options: ['A','B','C','D'], correctIndex: 0, explanation: 'Exp 1' },
  { question: 'Q2', options: ['A','B','C','D'], correctIndex: 2, explanation: 'Exp 2' },
  { question: 'Q3', options: ['A','B','C','D'], correctIndex: 1, explanation: 'Exp 3' },
];

test('all correct answers gives score 3 and bonusXP 30', () => {
  const { score, bonusXP, confidence } = scoreQuiz([0, 2, 1], mockQuestions);
  assert.equal(score, 3);
  assert.equal(bonusXP, 30);
  assert.equal(confidence, 'solid');
});

test('all wrong answers gives score 0 and bonusXP 0', () => {
  const { score, bonusXP, confidence } = scoreQuiz([1, 1, 2], mockQuestions);
  assert.equal(score, 0);
  assert.equal(bonusXP, 0);
  assert.equal(confidence, 'shaky');
});

test('2 correct gives bonusXP 15 and confidence okay', () => {
  const { score, bonusXP, confidence } = scoreQuiz([0, 2, 2], mockQuestions);
  assert.equal(score, 2);
  assert.equal(bonusXP, 15);
  assert.equal(confidence, 'okay');
});

test('1 correct gives bonusXP 5 and confidence shaky', () => {
  const { score, bonusXP, confidence } = scoreQuiz([0, 1, 2], mockQuestions);
  assert.equal(score, 1);
  assert.equal(bonusXP, 5);
  assert.equal(confidence, 'shaky');
});

test('mismatched answers and questions throws error', () => {
  assert.throws(() => scoreQuiz([0, 1], mockQuestions), /Invalid input/);
});

test('results array has correct boolean per question', () => {
  const { results } = scoreQuiz([0, 2, 1], mockQuestions);
  assert.equal(results[0].correct, true);
  assert.equal(results[1].correct, true);
  assert.equal(results[2].correct, true);
});

test('explanation is preserved in results', () => {
  const { results } = scoreQuiz([0, 2, 1], mockQuestions);
  assert.equal(results[0].explanation, 'Exp 1');
});

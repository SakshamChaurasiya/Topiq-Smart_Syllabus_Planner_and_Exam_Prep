/**
 * cache.js
 * Utility for computing cache keys for AI analysis results.
 * The key includes syllabus content, institution, and target goal,
 * so changing any of these three will invalidate the cached result.
 */
const crypto = require('crypto');

/**
 * computeSyllabusCacheKey(syllabusText, institution, goal)
 * Returns a SHA-256 hex hash that changes if ANY of the three inputs change.
 *
 * @param {string} syllabusText  - raw syllabus text/content
 * @param {string} institution   - user's institution (from user profile)
 * @param {string} goal          - target goal: 'pass' | 'good' | 'excellent'
 * @returns {string} 64-char hex hash
 */
const computeSyllabusCacheKey = (syllabusText, institution = '', goal = '') => {
  const raw = [
    syllabusText.trim(),
    institution.trim().toLowerCase(),
    goal.trim().toLowerCase(),
  ].join('||SEPARATOR||');

  return crypto.createHash('sha256').update(raw).digest('hex');
};

module.exports = { computeSyllabusCacheKey };

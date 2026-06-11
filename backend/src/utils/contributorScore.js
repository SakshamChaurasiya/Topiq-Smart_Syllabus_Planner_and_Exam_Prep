const Post = require('../models/post.model');

/**
 * Computes a user's Contributor Score from their post activity.
 * Score = (posts × 5) + (upvotes received × 2) - (reports received × 10)
 * Clamped to minimum 0. Never stored — always computed fresh.
 *
 * @param {ObjectId|string} userId
 * @returns {Promise<number>} contributor score
 */
const getContributorScore = async (userId) => {
  try {
    const posts = await Post.find({ userId, isHidden: false }).select('upvotes reportedBy');
    const totalPosts   = posts.length;
    const totalUpvotes = posts.reduce((sum, p) => sum + (p.upvotes?.length || 0), 0);
    const totalReports = posts.reduce((sum, p) => sum + (p.reportedBy?.length || 0), 0);
    return Math.max(0, (totalPosts * 5) + (totalUpvotes * 2) - (totalReports * 10));
  } catch (err) {
    console.error('[ContributorScore] Error computing score:', err.message);
    return 0; // never crash — return 0 on error
  }
};

module.exports = { getContributorScore };

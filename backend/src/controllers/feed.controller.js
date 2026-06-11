const Post = require('../models/post.model');
const User = require('../models/user.model');
const { sendSuccess, sendError } = require('../utils/responseHelper');
const { awardBadge } = require('../utils/badges');
const { getContributorScore } = require('../utils/contributorScore');
const cloudinary = require('../config/cloudinary');

// ── Helper: safe author shape ──
// Never expose email, password, or private fields in feed responses
const toAuthorShape = (user) => ({
  _id: user._id,
  name: user.name,
  level: user.level,
  institution: user.institution || null,
  publicUsername: user.publicUsername || null,
});

// ── Helper: safe post shape ──
// Adds computed fields: upvoteCount, hasUpvoted, author
const toPostShape = (post, currentUserId) => {
  const p = post.toObject ? post.toObject() : { ...post };
  p.upvoteCount = p.upvotes?.length || 0;
  p.hasUpvoted = currentUserId
    ? p.upvotes?.some(id => id.toString() === currentUserId.toString())
    : false;
  // Remove raw arrays from response — use computed fields instead
  delete p.upvotes;
  delete p.reportedBy;
  delete p.attachmentPublicId; // never expose Cloudinary public_id to frontend
  return p;
};

// ──────────────────────────────────────────
// HANDLER 1: getFeed
// GET /api/feed?scope=college|worldwide&page=1&limit=10&subject=SubjectName
// Public with optional auth (myUpvotes only shown when logged in)
// ──────────────────────────────────────────
const getFeed = async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(20, parseInt(req.query.limit) || 10);
    const scope = req.query.scope || 'college'; // 'college' | 'worldwide'
    const subject = req.query.subject || null;    // filter by subjectTag
    const skip = (page - 1) * limit;

    // Build query
    const query = { isHidden: false };

    if (scope === 'college') {
      // College scope: show posts strictly from the user's institution
      const institution = req.user?.institution || null;
      if (institution) {
        query.institution = { $regex: new RegExp(`^${institution.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i') };
      } else {
        // User has no institution — show no posts
        query.institution = '__NON_EXISTENT_INSTITUTION__';
      }
    }
    // worldwide scope: no institution filter — show all non-hidden posts

    if (subject) {
      query.subjectTag = { $regex: new RegExp(subject, 'i') };
    }

    const [posts, total] = await Promise.all([
      Post.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name level institution publicUsername'),
      Post.countDocuments(query),
    ]);

    const currentUserId = req.user?._id || null;
    const shaped = posts.map(p => {
      const shaped = toPostShape(p, currentUserId);
      if (p.userId && typeof p.userId === 'object') {
        shaped.author = toAuthorShape(p.userId);
      }
      return shaped;
    });

    return sendSuccess(res, 200, 'Feed fetched.', {
      posts: shaped,
      page,
      totalPages: Math.ceil(total / limit),
      total,
    });
  } catch (error) {
    console.error('[Feed] getFeed error:', error.message);
    return sendError(res, 500, 'Failed to fetch feed.');
  }
};

// ──────────────────────────────────────────
// HANDLER 2: createPost
// POST /api/feed
// Protected. Handles both file uploads and text/link posts.
// ──────────────────────────────────────────
const createPost = async (req, res) => {
  try {
    const { type, subjectTag, title, description, resourceUrl, isWorldwide, flashcardSetId } = req.body;

    // Validate required fields
    if (!type || !['note', 'summary', 'resource', 'flashcard-share'].includes(type)) {
      return sendError(res, 400, 'Valid type is required (note/summary/resource/flashcard-share).');
    }
    if (!subjectTag || subjectTag.trim().length === 0) {
      return sendError(res, 400, 'Subject tag is required.');
    }
    if (!title || title.trim().length === 0) {
      return sendError(res, 400, 'Title is required.');
    }
    if (title.trim().length > 100) {
      return sendError(res, 400, 'Title must be 100 characters or less.');
    }
    if (type === 'resource') {
      if (!resourceUrl || (!resourceUrl.startsWith('http://') && !resourceUrl.startsWith('https://'))) {
        return sendError(res, 400, 'A valid URL is required for resource posts.');
      }
    }

    // Build post data
    const postData = {
      userId: req.user._id,
      institution: req.user.institution || null,
      type,
      subjectTag: subjectTag.trim(),
      title: title.trim(),
      description: description?.trim() || '',
      isWorldwide: isWorldwide === 'true' || isWorldwide === true,
      resourceUrl: resourceUrl || null,
      flashcardSetId: flashcardSetId || null,
    };

    // Handle file attachment (set by cloudinaryUpload middleware)
    if (req.file) {
      postData.attachmentUrl = req.file.path;     // Cloudinary URL
      postData.attachmentPublicId = req.file.filename; // Cloudinary public_id
      postData.attachmentType = req.file.mimetype === 'application/pdf' ? 'pdf' : 'image';
    } else if (resourceUrl) {
      postData.attachmentType = 'link';
    }

    const post = await Post.create(postData);

    // ── Badge triggers (all wrapped in try/catch) ──
    // first_share: first post ever
    try {
      const postCount = await Post.countDocuments({ userId: req.user._id });
      if (postCount === 1) await awardBadge(req.user._id, 'first_share');
    } catch (e) { console.error('[Feed] first_share badge error:', e.message); }

    // campus_hero: 5+ posts from same institution
    try {
      if (req.user.institution) {
        const collegeCount = await Post.countDocuments({
          userId: req.user._id,
          institution: req.user.institution,
          isHidden: false,
        });
        if (collegeCount >= 5) await awardBadge(req.user._id, 'campus_hero');
      }
    } catch (e) { console.error('[Feed] campus_hero badge error:', e.message); }

    // trusted_contributor: score > 100
    try {
      const score = await getContributorScore(req.user._id);
      if (score > 100) await awardBadge(req.user._id, 'trusted_contributor');
    } catch (e) { console.error('[Feed] trusted_contributor badge error:', e.message); }

    return sendSuccess(res, 201, 'Post created successfully.', toPostShape(post, req.user._id));
  } catch (error) {
    // If Cloudinary upload succeeded but DB save failed, clean up the asset
    if (req.file?.filename) {
      try {
        await cloudinary.uploader.destroy(req.file.filename, { resource_type: 'raw' });
      } catch (cleanupErr) {
        console.error('[Feed] Cloudinary cleanup error:', cleanupErr.message);
      }
    }
    console.error('[Feed] createPost error:', error.message);
    return sendError(res, 500, 'Failed to create post.');
  }
};

// ──────────────────────────────────────────
// HANDLER 3: toggleUpvote
// PUT /api/feed/:id/upvote
// Protected. Adds userId if not present, removes if present.
// ──────────────────────────────────────────
const toggleUpvote = async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, isHidden: false });
    if (!post) return sendError(res, 404, 'Post not found.');

    const userId = req.user._id;
    const alreadyUpvoted = post.upvotes.some(id => id.toString() === userId.toString());

    if (alreadyUpvoted) {
      // Remove upvote
      post.upvotes = post.upvotes.filter(id => id.toString() !== userId.toString());
    } else {
      // Add upvote
      post.upvotes.push(userId);
    }
    await post.save();

    // ── Badge triggers ──
    // viral_note: post reaches 20+ upvotes
    try {
      if (!alreadyUpvoted && post.upvotes.length >= 20) {
        await awardBadge(post.userId, 'viral_note');
      }
    } catch (e) { console.error('[Feed] viral_note badge error:', e.message); }

    // helper: user has upvoted 10+ distinct posts
    try {
      if (!alreadyUpvoted) {
        const upvotedCount = await Post.countDocuments({
          upvotes: userId,
          isHidden: false,
        });
        if (upvotedCount >= 10) await awardBadge(userId, 'helper');
      }
    } catch (e) { console.error('[Feed] helper badge error:', e.message); }

    // trusted_contributor: score > 100 for post author
    try {
      const score = await getContributorScore(post.userId);
      if (score > 100) await awardBadge(post.userId, 'trusted_contributor');
    } catch (e) { console.error('[Feed] trusted_contributor badge error:', e.message); }

    return sendSuccess(res, 200, alreadyUpvoted ? 'Upvote removed.' : 'Post upvoted.', {
      upvoteCount: post.upvotes.length,
      hasUpvoted: !alreadyUpvoted,
    });
  } catch (error) {
    console.error('[Feed] toggleUpvote error:', error.message);
    return sendError(res, 500, 'Failed to update upvote.');
  }
};

// ──────────────────────────────────────────
// HANDLER 4: reportPost
// PUT /api/feed/:id/report
// Protected. Auto-hides post after 3 unique reports.
// ──────────────────────────────────────────
const reportPost = async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, isHidden: false });
    if (!post) return sendError(res, 404, 'Post not found.');

    const userId = req.user._id;
    const alreadyReported = post.reportedBy.some(id => id.toString() === userId.toString());
    if (alreadyReported) {
      return sendError(res, 400, 'You have already reported this post.');
    }

    // Cannot report own post
    if (post.userId.toString() === userId.toString()) {
      return sendError(res, 400, 'You cannot report your own post.');
    }

    post.reportedBy.push(userId);
    if (post.reportedBy.length >= 3) {
      post.isHidden = true;
    }
    await post.save();

    return sendSuccess(res, 200, 'Post reported. Thank you for helping keep the feed clean.', {
      reported: true,
    });
  } catch (error) {
    console.error('[Feed] reportPost error:', error.message);
    return sendError(res, 500, 'Failed to report post.');
  }
};

// ──────────────────────────────────────────
// HANDLER 5: deletePost
// DELETE /api/feed/:id
// Protected. Owner only. Deletes Cloudinary asset too.
// ──────────────────────────────────────────
const deletePost = async (req, res) => {
  try {
    const post = await Post.findOne({ _id: req.params.id, userId: req.user._id });
    if (!post) return sendError(res, 404, 'Post not found or you do not have permission.');

    // Delete Cloudinary asset if one exists
    if (post.attachmentPublicId) {
      try {
        const resourceType = post.attachmentType === 'pdf' ? 'raw' : 'image';
        await cloudinary.uploader.destroy(post.attachmentPublicId, { resource_type: resourceType });
      } catch (cloudErr) {
        // Log but don't block deletion
        console.error('[Feed] Cloudinary deletion error:', cloudErr.message);
      }
    }

    await Post.findByIdAndDelete(post._id);
    return sendSuccess(res, 200, 'Post deleted successfully.');
  } catch (error) {
    console.error('[Feed] deletePost error:', error.message);
    return sendError(res, 500, 'Failed to delete post.');
  }
};

// ──────────────────────────────────────────
// HANDLER 6: getUserPosts
// GET /api/feed/user/:userId
// Public with optional auth. Used by public profile page.
// ──────────────────────────────────────────
const getUserPosts = async (req, res) => {
  try {
    const { userId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(20, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const query = { userId, isHidden: false };

    const [posts, total] = await Promise.all([
      Post.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('userId', 'name level institution publicUsername'),
      Post.countDocuments(query),
    ]);

    const currentUserId = req.user?._id || null;
    const shaped = posts.map(p => {
      const s = toPostShape(p, currentUserId);
      if (p.userId && typeof p.userId === 'object') {
        s.author = toAuthorShape(p.userId);
      }
      return s;
    });

    // Also return contributor score for profile display
    const contributorScore = await getContributorScore(userId);

    return sendSuccess(res, 200, 'User posts fetched.', {
      posts: shaped,
      page,
      totalPages: Math.ceil(total / limit),
      total,
      contributorScore,
    });
  } catch (error) {
    console.error('[Feed] getUserPosts error:', error.message);
    return sendError(res, 500, 'Failed to fetch user posts.');
  }
};

module.exports = { getFeed, createPost, toggleUpvote, reportPost, deletePost, getUserPosts };

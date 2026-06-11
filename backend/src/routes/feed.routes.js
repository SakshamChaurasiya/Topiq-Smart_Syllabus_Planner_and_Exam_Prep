const express = require('express');
const router  = express.Router();
const {
  getFeed, createPost, toggleUpvote, reportPost, deletePost, getUserPosts,
} = require('../controllers/feed.controller');
const { protect, optionalAuth } = require('../middleware/auth.middleware');
const cloudinaryUpload = require('../middleware/cloudinaryUpload.middleware');

// Public routes with optional auth (myUpvotes shown when logged in)
router.get('/',              optionalAuth, getFeed);
router.get('/user/:userId',  optionalAuth, getUserPosts);

// Protected routes
// cloudinaryUpload.single('attachment') handles optional file —
// if no file is sent, req.file is undefined and handler proceeds normally
router.post('/',             protect, cloudinaryUpload.single('attachment'), createPost);
router.put('/:id/upvote',   protect, toggleUpvote);
router.put('/:id/report',   protect, reportPost);
router.delete('/:id',       protect, deletePost);

module.exports = router;

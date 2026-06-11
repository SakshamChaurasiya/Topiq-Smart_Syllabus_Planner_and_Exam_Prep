const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    // Author
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // Copied from user.institution at post creation time.
    // Stored here so college-filtered queries don't need a join.
    // null means user had no institution set when posting.
    institution: {
      type: String,
      default: null,
      trim: true,
    },

    // Post type
    type: {
      type: String,
      enum: ['note', 'summary', 'resource', 'flashcard-share'],
      required: true,
    },

    // Subject this post is about (free text — not a ref)
    // Allows posts from students whose subject names differ slightly
    subjectTag: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    // Post content
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 500,
    },

    // Cloudinary asset — null if text/link only
    attachmentUrl: {
      type: String,
      default: null,
    },

    // Cloudinary public_id — needed to delete the asset when post is deleted
    attachmentPublicId: {
      type: String,
      default: null,
    },

    attachmentType: {
      type: String,
      enum: ['pdf', 'image', 'link', null],
      default: null,
    },

    // For type='resource': external URL
    resourceUrl: {
      type: String,
      default: null,
      trim: true,
    },

    // For type='flashcard-share': ref to existing FlashcardSet
    flashcardSetId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'FlashcardSet',
      default: null,
    },

    // Whether post is visible worldwide or only to same institution
    isWorldwide: {
      type: Boolean,
      default: false,
    },

    // Upvotes — array of userIds who upvoted
    // Using array of ObjectIds (not subdocs) for lean storage
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Reports — array of userIds who reported
    reportedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],

    // Auto-hidden when reportedBy.length >= 3
    isHidden: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

// ── Indexes ──
// Fast college-scoped feed sorted by newest
postSchema.index({ institution: 1, isHidden: 1, createdAt: -1 });
// Fast worldwide feed
postSchema.index({ isWorldwide: 1, isHidden: 1, createdAt: -1 });
// Fast user profile posts lookup
postSchema.index({ userId: 1, createdAt: -1 });
// Fast subject filtering within a feed
postSchema.index({ subjectTag: 1, isHidden: 1 });

module.exports = mongoose.model('Post', postSchema);

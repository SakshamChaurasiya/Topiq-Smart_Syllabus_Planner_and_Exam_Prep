const test = require("node:test");
const assert = require("node:assert");
const Post = require("../models/post.model");
const User = require("../models/user.model");
const Badge = require("../models/badge.model");
const Notification = require("../models/notification.model");
const badges = require("../utils/badges");
const contributorScore = require("../utils/contributorScore");
const cloudinary = require("../config/cloudinary");
const feedController = require("../controllers/feed.controller");

const makeMockRes = () => {
  const res = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.jsonData = data;
    return res;
  };
  return res;
};

// Helper to mock chainable mongoose queries
const createQueryMock = (result) => {
  const query = {};
  const selfFn = () => query;
  query.sort = selfFn;
  query.skip = selfFn;
  query.limit = selfFn;
  query.populate = async () => result;
  query.select = async () => result;
  return query;
};

test("Social Feed API Unit Tests", async (t) => {
  // Save originals
  const origFind = Post.find;
  const origCountDocuments = Post.countDocuments;
  const origCreate = Post.create;
  const origFindOne = Post.findOne;
  const origFindByIdAndDelete = Post.findByIdAndDelete;
  const origBadgeFindOne = Badge.findOne;
  const origBadgeCreate = Badge.create;
  const origNotifSave = Notification.prototype.save;
  const origDestroy = cloudinary.uploader?.destroy;

  // Valid 24-character hex IDs to prevent Mongoose Casting errors
  const mockUserId = "507f1f77bcf86cd799439011";
  const mockAuthorId = "507f1f77bcf86cd799439012";
  const mockPostId = "507f1f77bcf86cd799439013";

  // Setup DB Mocks
  Badge.findOne = async () => null; // pretend badge not yet awarded
  Badge.create = async (data) => data;
  Notification.prototype.save = async function() { return this; };

  t.after(() => {
    Post.find = origFind;
    Post.countDocuments = origCountDocuments;
    Post.create = origCreate;
    Post.findOne = origFindOne;
    Post.findByIdAndDelete = origFindByIdAndDelete;
    Badge.findOne = origBadgeFindOne;
    Badge.create = origBadgeCreate;
    Notification.prototype.save = origNotifSave;
    if (cloudinary.uploader) cloudinary.uploader.destroy = origDestroy;
  });

  await t.test("getFeed: shapes posts and works without auth", async () => {
    const mockPosts = [
      {
        _id: mockPostId,
        userId: {
          _id: mockAuthorId,
          name: "John Doe",
          level: 5,
          institution: "College A",
          publicUsername: "johndoe",
        },
        institution: "College A",
        type: "note",
        subjectTag: "Math",
        title: "Calculus Limits",
        upvotes: [mockUserId],
        reportedBy: [],
        attachmentPublicId: "cloudinary_id_123",
        toObject() {
          return {
            _id: this._id,
            userId: this.userId,
            institution: this.institution,
            type: this.type,
            subjectTag: this.subjectTag,
            title: this.title,
            upvotes: this.upvotes,
            reportedBy: this.reportedBy,
            attachmentPublicId: this.attachmentPublicId,
          };
        }
      }
    ];

    Post.find = (query) => {
      return createQueryMock(mockPosts);
    };

    Post.countDocuments = async () => 1;

    const req = {
      query: { scope: "worldwide" },
    };
    const res = makeMockRes();

    await feedController.getFeed(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.success, true);
    
    const posts = res.jsonData.data.posts;
    assert.strictEqual(posts.length, 1);
    
    const post = posts[0];
    assert.strictEqual(post.upvoteCount, 1);
    assert.strictEqual(post.hasUpvoted, false); // no req.user
    assert.strictEqual(post.upvotes, undefined); // removed
    assert.strictEqual(post.reportedBy, undefined); // removed
    assert.strictEqual(post.attachmentPublicId, undefined); // removed
    assert.strictEqual(post.author._id, mockAuthorId);
    assert.strictEqual(post.author.name, "John Doe");
    assert.strictEqual(post.author.level, 5);
  });
  
  await t.test("getFeed: college scope query strictly filters by user's institution", async () => {
    let capturedQuery = null;
    Post.find = (query) => {
      capturedQuery = query;
      return createQueryMock([]);
    };
    Post.countDocuments = async (query) => {
      return 0;
    };

    const req = {
      user: { _id: mockUserId, institution: "College B" },
      query: { scope: "college" },
    };
    const res = makeMockRes();

    await feedController.getFeed(req, res);

    assert.strictEqual(res.statusCode, 200);
    assert.ok(capturedQuery);
    assert.strictEqual(capturedQuery.isHidden, false);
    assert.ok(capturedQuery.institution);
    assert.ok(capturedQuery.institution.$regex instanceof RegExp);
    assert.ok(capturedQuery.institution.$regex.test("College B"));
    assert.ok(capturedQuery.institution.$regex.test("college b"));
    assert.strictEqual(capturedQuery.institution.$regex.test("College A"), false);
  });

  await t.test("createPost: validations", async () => {
    // Missing type
    let req = { body: { subjectTag: "Math", title: "Title" } };
    let res = makeMockRes();
    await feedController.createPost(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.jsonData.message, /Valid type is required/);

    // Missing subjectTag
    req = { body: { type: "note", title: "Title" } };
    res = makeMockRes();
    await feedController.createPost(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.jsonData.message, /Subject tag is required/);

    // Title too long
    req = { body: { type: "note", subjectTag: "Math", title: "A".repeat(101) } };
    res = makeMockRes();
    await feedController.createPost(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.jsonData.message, /Title must be 100 characters or less/);

    // Invalid resourceUrl
    req = { body: { type: "resource", subjectTag: "Math", title: "Title", resourceUrl: "invalid-url" } };
    res = makeMockRes();
    await feedController.createPost(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.jsonData.message, /A valid URL is required/);
  });

  await t.test("createPost: first_share, campus_hero and trusted_contributor badge awards, and DB error cleanup", async () => {
    // Mock Post.find for getContributorScore during post creation
    Post.find = (query) => {
      // Return 25 posts with upvotes to get a high contributor score
      const mockUserPosts = Array.from({ length: 25 }, () => ({
        upvotes: [mockUserId, mockAuthorId],
        reportedBy: [],
        toObject() { return this; }
      }));
      return createQueryMock(mockUserPosts);
    };

    Post.create = async (data) => {
      return {
        ...data,
        upvotes: [],
        reportedBy: [],
        toObject() { return this; }
      };
    };

    Post.countDocuments = async (query) => {
      if (query.userId && query.institution) {
        return 5; // trigger campus_hero
      }
      return 1; // trigger first_share (postCount === 1)
    };

    const req = {
      user: { _id: mockUserId, institution: "College B" },
      body: { type: "note", subjectTag: "Chemistry", title: "Organic Chemistry Notes" }
    };
    const res = makeMockRes();

    await feedController.createPost(req, res);

    assert.strictEqual(res.statusCode, 201);

    // DB save fail cleanup
    let destroyedPublicId = null;
    let destroyedType = null;
    if (!cloudinary.uploader) cloudinary.uploader = {};
    cloudinary.uploader.destroy = async (publicId, options) => {
      destroyedPublicId = publicId;
      destroyedType = options.resource_type;
      return { result: "ok" };
    };

    Post.create = async () => {
      throw new Error("DB Save Error");
    };

    const failReq = {
      user: { _id: mockUserId },
      body: { type: "note", subjectTag: "Math", title: "Math Notes" },
      file: { path: "http://url", filename: "cloud_file_id", mimetype: "application/pdf" }
    };
    const failRes = makeMockRes();

    await feedController.createPost(failReq, failRes);

    assert.strictEqual(failRes.statusCode, 500);
    assert.strictEqual(destroyedPublicId, "cloud_file_id");
    assert.strictEqual(destroyedType, "raw"); // PDF -> raw
  });

  await t.test("toggleUpvote: upvote toggle functionality and badges", async () => {
    let saveCount = 0;
    const mockPost = {
      _id: mockPostId,
      userId: mockAuthorId,
      upvotes: [],
      reportedBy: [],
      save: async () => { saveCount++; }
    };

    Post.findOne = async () => mockPost;

    // Mock Post.find for getContributorScore when author upvotes
    Post.find = (query) => {
      // Mock enough posts to score > 100 for author
      const mockUserPosts = Array.from({ length: 25 }, () => ({
        upvotes: [mockUserId, mockAuthorId],
        reportedBy: [],
        toObject() { return this; }
      }));
      return createQueryMock(mockUserPosts);
    };

    Post.countDocuments = async () => 10;

    const req = {
      user: { _id: mockUserId },
      params: { id: mockPostId }
    };
    const res = makeMockRes();

    // First upvote
    await feedController.toggleUpvote(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.data.upvoteCount, 1);
    assert.strictEqual(res.jsonData.data.hasUpvoted, true);
    assert.strictEqual(saveCount, 1);

    // Second upvote (remove upvote)
    await feedController.toggleUpvote(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.jsonData.data.upvoteCount, 0);
    assert.strictEqual(res.jsonData.data.hasUpvoted, false);
    assert.strictEqual(saveCount, 2);
  });

  await t.test("reportPost: blocks self reporting, blocks duplicate reporting, auto hides", async () => {
    let saveCount = 0;
    const mockPost = {
      _id: mockPostId,
      userId: mockAuthorId,
      reportedBy: [mockUserId],
      isHidden: false,
      save: async () => { saveCount++; }
    };

    Post.findOne = async () => mockPost;

    // Self report check
    let req = { user: { _id: mockAuthorId }, params: { id: mockPostId } };
    let res = makeMockRes();
    await feedController.reportPost(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.jsonData.message, /cannot report your own post/);

    // Duplicate report check
    req = { user: { _id: mockUserId }, params: { id: mockPostId } };
    res = makeMockRes();
    await feedController.reportPost(req, res);
    assert.strictEqual(res.statusCode, 400);
    assert.match(res.jsonData.message, /already reported/);

    // Third report triggers isHidden
    const mockUser3Id = "507f1f77bcf86cd799439015";
    mockPost.reportedBy = [mockUserId, "507f1f77bcf86cd799439014"];
    req = { user: { _id: mockUser3Id }, params: { id: mockPostId } };
    res = makeMockRes();
    await feedController.reportPost(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(mockPost.isHidden, true);
  });

  await t.test("deletePost: checks owner permission and deletes from Cloudinary", async () => {
    const mockPost = {
      _id: mockPostId,
      userId: mockAuthorId,
      attachmentPublicId: "cloud_asset_id",
      attachmentType: "pdf"
    };

    Post.findOne = async (query) => {
      if (query._id === mockPostId && query.userId === mockAuthorId) {
        return mockPost;
      }
      return null;
    };

    let deletedPostId = null;
    Post.findByIdAndDelete = async (id) => {
      deletedPostId = id;
      return mockPost;
    };

    let destroyedPublicId = null;
    let destroyedType = null;
    cloudinary.uploader.destroy = async (publicId, options) => {
      destroyedPublicId = publicId;
      destroyedType = options.resource_type;
      return { result: "ok" };
    };

    // Try delete with wrong user
    let req = { user: { _id: mockUserId }, params: { id: mockPostId } };
    let res = makeMockRes();
    await feedController.deletePost(req, res);
    assert.strictEqual(res.statusCode, 404);

    // Delete with correct user
    req = { user: { _id: mockAuthorId }, params: { id: mockPostId } };
    res = makeMockRes();
    await feedController.deletePost(req, res);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(deletedPostId, mockPostId);
    assert.strictEqual(destroyedPublicId, "cloud_asset_id");
    assert.strictEqual(destroyedType, "raw"); // pdf -> raw
  });
});

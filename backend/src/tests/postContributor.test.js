const test = require("node:test");
const assert = require("node:assert");
const Post = require("../models/post.model");
const { getContributorScore } = require("../utils/contributorScore");

test("Contributor Score Unit Tests", async (t) => {
  const originalFind = Post.find;

  t.after(() => {
    Post.find = originalFind;
  });

  await t.test("Score computation: posts, upvotes, reports", async () => {
    Post.find = (query) => {
      assert.strictEqual(query.userId, "mock-user-123");
      assert.strictEqual(query.isHidden, false);
      return {
        select: async (fields) => {
          assert.strictEqual(fields, "upvotes reportedBy");
          return [
            { upvotes: [1, 2], reportedBy: [] }, // 1 post, 2 upvotes, 0 reports
            { upvotes: [1, 2, 3], reportedBy: [1] }, // 1 post, 3 upvotes, 1 report
            { upvotes: [], reportedBy: [] }, // 1 post, 0 upvotes, 0 reports
          ];
        }
      };
    };

    // total posts = 3 -> 3 * 5 = 15
    // total upvotes = 5 -> 5 * 2 = 10
    // total reports = 1 -> 1 * 10 = 10
    // expected score = 15 + 10 - 10 = 15
    const score = await getContributorScore("mock-user-123");
    assert.strictEqual(score, 15);
  });

  await t.test("Score computation: clamps to 0 on negative score", async () => {
    Post.find = (query) => {
      return {
        select: async () => {
          return [
            { upvotes: [], reportedBy: [1, 2, 3] }, // 1 post, 0 upvotes, 3 reports
          ];
        }
      };
    };

    // total posts = 1 -> 1 * 5 = 5
    // total upvotes = 0 -> 0 * 2 = 0
    // total reports = 3 -> 3 * 10 = 30
    // expected score = 5 + 0 - 30 = -25 -> clamps to 0
    const score = await getContributorScore("mock-user-123");
    assert.strictEqual(score, 0);
  });

  await t.test("Score computation: handles error gracefully", async () => {
    Post.find = () => {
      throw new Error("DB Error");
    };

    const score = await getContributorScore("mock-user-123");
    assert.strictEqual(score, 0);
  });
});

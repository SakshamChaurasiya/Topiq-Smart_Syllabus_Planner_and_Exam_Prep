/**
 * xpSystem.test.js
 * Unit tests for the XP and leveling curve formulas.
 */

const test = require("node:test");
const assert = require("node:assert");
const { getXPForLevel, getTotalXPForLevel, getLevelTitle } = require("../utils/xpSystem");

test("XP System Unit Tests", async (t) => {
  
  await t.test("Test 1: Level 1 requires 180 XP", () => {
    assert.strictEqual(getXPForLevel(1), 180);
  });

  await t.test("Test 2: XP required increases with each level", () => {
    for (let lvl = 1; lvl < 100; lvl++) {
      const currentLevelXP = getXPForLevel(lvl);
      const nextLevelXP = getXPForLevel(lvl + 1);
      assert.ok(nextLevelXP > currentLevelXP, `Level ${lvl + 1} XP (${nextLevelXP}) must be greater than Level ${lvl} XP (${currentLevelXP})`);
    }
  });

  await t.test("Test 3: Level 10+ has multiplier applied", () => {
    const lvl9XP = getXPForLevel(9);
    const lvl10XP = getXPForLevel(10);
    assert.ok(lvl10XP > lvl9XP * 1.1, `Level 10 XP (${lvl10XP}) should be at least 10% larger than Level 9 XP (${lvl9XP}) due to multiplier`);
  });

  await t.test("Test 4: getLevelTitle(1) returns tier 'starter'", () => {
    const res = getLevelTitle(1);
    assert.strictEqual(res.tier, "starter");
  });

  await t.test("Test 5: getLevelTitle(50) returns tier 'legendary'", () => {
    const res = getLevelTitle(50);
    assert.strictEqual(res.tier, "legendary");
  });

  await t.test("Test 6: getTotalXPForLevel(1) returns 0", () => {
    assert.strictEqual(getTotalXPForLevel(1), 0);
  });

  await t.test("Test 7: getTotalXPForLevel(2) equals getXPForLevel(1)", () => {
    assert.strictEqual(getTotalXPForLevel(2), getXPForLevel(1));
  });

});

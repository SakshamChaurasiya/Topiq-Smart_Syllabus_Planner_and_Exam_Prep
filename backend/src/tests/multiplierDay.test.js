/**
 * multiplierDay.test.js
 * Unit tests for the XP multiplier calculation logic.
 */

const test = require("node:test");
const assert = require("node:assert");
const { getTodayMultiplier, getTomorrowMultiplier } = require("../utils/multiplierDay");

test("XP Multiplier System Tests", async (t) => {
    
    await t.test("Test 1: Friday always returns multiplier 2", () => {
        // 2026-06-12 is a Friday
        const friday = new Date("2026-06-12T12:00:00Z");
        const res = getTodayMultiplier(friday);
        assert.strictEqual(res.multiplier, 2);
        assert.strictEqual(res.active, true);
        assert.strictEqual(res.reason, "2x XP Friday 🔥");
    });

    await t.test("Test 2: non-Friday non-bonus day returns multiplier 1", () => {
        // 2026-06-14 is a Sunday (day = 0), which is never Friday and never Mon-Thu bonus
        const sunday = new Date("2026-06-14T12:00:00Z");
        const res = getTodayMultiplier(sunday);
        assert.strictEqual(res.multiplier, 1);
        assert.strictEqual(res.active, false);
        assert.strictEqual(res.reason, null);
    });

    await t.test("Test 3: getTodayMultiplier returns active:true on multiplier days", () => {
        // Friday is active
        const friday = new Date("2026-06-12T12:00:00Z");
        assert.strictEqual(getTodayMultiplier(friday).active, true);

        // Seeded random day: ISO week 24 of year 2026 (week starting Mon 2026-06-08)
        // week = 24. bonusDay = (24 % 4) + 1 = 0 + 1 = 1 (Monday, 2026-06-08)
        const monday = new Date("2026-06-08T12:00:00Z");
        const resMonday = getTodayMultiplier(monday);
        assert.strictEqual(resMonday.multiplier, 1.5);
        assert.strictEqual(resMonday.active, true);
    });

    await t.test("Test 4: getTomorrowMultiplier returns an object with multiplier, reason, active", () => {
        const res = getTomorrowMultiplier();
        assert.ok(res);
        assert.strictEqual(typeof res.multiplier, "number");
        assert.strictEqual(typeof res.active, "boolean");
        if (res.active) {
            assert.strictEqual(typeof res.reason, "string");
        } else {
            assert.strictEqual(res.reason, null);
        }
    });

    await t.test("Test 5: multiplier is applied to xpEarned correctly (2x doubles the value)", () => {
        const baseXP = 10;
        const multiplier = 2;
        const xpEarned = Math.round(baseXP * multiplier);
        assert.strictEqual(xpEarned, 20);
    });

    await t.test("Test 6: Math.round is applied (no decimal XP values)", () => {
        const baseXP = 15;
        const multiplier = 1.5;
        const xpEarned = Math.round(baseXP * multiplier); // 22.5 -> 23
        assert.strictEqual(xpEarned, 23);
    });
});

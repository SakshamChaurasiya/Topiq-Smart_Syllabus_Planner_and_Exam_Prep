/**
 * rate-limit-cache-test.js
 * Tests: Caching, Force Rerun, and AI Rate Limiting middleware.
 * Run: node tests/rate-limit-cache-test.js
 */

const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const Syllabus = require("../src/models/syllabus.model");
const BASE = "http://localhost:5000/api";
const TS = Date.now();
const EMAIL = `rltest_${TS}@test.com`;
const PASSWORD = "test123456";

let TOKEN = "";
let SUBJECT_ID = "";
let SYLLABUS_ID = "";

const results = [];
const assert = (name, ok) => { results.push({ name, ok }); };
const HEADERS = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` });

async function post(url, body, headers) {
  const res = await fetch(`${BASE}${url}`, { method: "POST", headers: headers || { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json();
  return { status: res.status, data };
}

async function run() {
  console.log("═══════════════════════════════════════");
  console.log("    AI CACHING & RATE LIMITING TEST");
  console.log("═══════════════════════════════════════\n");

  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected");

    // 1. Register
    console.log("🔹 1. Register user");
    const reg = await post("/auth/register", { name: "RL Test User", email: EMAIL, password: PASSWORD, targetGoal: "good", institution: "MIT" });
    assert("Register -> 201", reg.status === 201);
    TOKEN = reg.data?.data?.token || "";

    // 2. Add Subject
    console.log("🔹 2. Add Subject");
    const sub = await post("/subjects", { name: "Software Engineering", code: "SE101", difficulty: "medium", color: "#6366f1" }, HEADERS());
    assert("Subject -> 201", sub.status === 201);
    SUBJECT_ID = sub.data?.data?._id || "";

    // 3. Save Syllabus Text
    console.log("🔹 3. Save Syllabus Text");
    const syl = await post("/syllabus/text", { subjectId: SUBJECT_ID, rawContent: "Unit 1: Agile Software Development practices and XP principles." }, HEADERS());
    assert("Syllabus upload -> 201", syl.status === 201 || syl.status === 200);
    SYLLABUS_ID = syl.data?.data?.syllabusId;

    // 4. First AI analysis call (No cache, first run ever - rate limiter count increments to 1)
    console.log("🔹 4. First AI analysis run (should call AI, not from cache)");
    const run1 = await post(`/syllabus/${SYLLABUS_ID}/analyze`, {}, HEADERS());
    assert("First Run status -> 200", run1.status === 200);
    assert("First Run is NOT from cache", !run1.data?.data?.fromCache);

    // 5. Second AI analysis call without forceRerun (should hit CACHE - rate limiter should NOT be incremented because we bypass call before limit or wait, actually route middleware runs first so count becomes 2)
    console.log("🔹 5. Second AI analysis run without forceRerun (should hit Cache)");
    const run2 = await post(`/syllabus/${SYLLABUS_ID}/analyze`, {}, HEADERS());
    assert("Second Run status -> 200", run2.status === 200);
    assert("Second Run IS from cache", run2.data?.data?.fromCache === true);

    // 6. Third AI analysis call with forceRerun = true (should bypass cache, rate limiter count becomes 3)
    console.log("🔹 6. Third AI analysis run with forceRerun = true (should bypass cache)");
    const run3 = await post(`/syllabus/${SYLLABUS_ID}/analyze`, { forceRerun: true }, HEADERS());
    assert("Third Run status -> 200", run3.status === 200);
    assert("Third Run is NOT from cache", !run3.data?.data?.fromCache);

    // 7. Fourth AI analysis call with forceRerun = true (should exceed rate limit since maxRequests = 3)
    console.log("🔹 7. Fourth AI analysis run with forceRerun = true (should be rate-limited)");
    const run4 = await post(`/syllabus/${SYLLABUS_ID}/analyze`, { forceRerun: true }, HEADERS());
    assert("Fourth Run status -> 429", run4.status === 429);
    assert("Response has success = false", run4.data?.success === false);
    assert("Response contains resetInMinutes", typeof run4.data?.resetInMinutes === "number");

  } catch (error) {
    console.error("❌ Exception during test:", error);
    assert("No unhandled exceptions", false);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected");
  }

  console.log("\n═══════════════════════════════════════");
  console.log("  TEST RESULTS");
  console.log("═══════════════════════════════════════");
  let failed = false;
  results.forEach(r => {
    console.log(`${r.ok ? "✅" : "❌"} ${r.name}`);
    if (!r.ok) failed = true;
  });
  console.log("═══════════════════════════════════════");
  if (failed) {
    console.error("❌ Caching and rate limiting assertions failed.");
    process.exit(1);
  } else {
    console.log("🎉 Caching and rate limiting tests passed successfully!");
    process.exit(0);
  }
}

run();

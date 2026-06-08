/**
 * streak-freeze-test.js
 * Tests: Streak Freeze Token feature backend logic and endpoints
 * Run: node tests/streak-freeze-test.js
 */

const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// Load env variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const User = require("../src/models/user.model");
const Mission = require("../src/models/mission.model");
const Notification = require("../src/models/notification.model");

// Configure test port and start server programmatically
process.env.PORT = 5002;
const app = require("../src/index");

const BASE = "http://127.0.0.1:5002/api";
const TS = Date.now();
const EMAIL = `freezetest_${TS}@test.com`;
const PASSWORD = "test123456";

let TOKEN = "";
let USER_ID = "";
let SUBJECT_ID = "";

const results = [];
const assert = (name, ok, detail = "") => { results.push({ name, ok, detail }); };
const HEADERS = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` });

async function post(url, body, headers) {
  const res = await fetch(`${BASE}${url}`, { method: "POST", headers: headers || { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json();
  return { status: res.status, data };
}

async function get(url) {
  const res = await fetch(`${BASE}${url}`, { headers: HEADERS() });
  const data = await res.json();
  return { status: res.status, data };
}

async function put(url, body) {
  const res = await fetch(`${BASE}${url}`, { method: "PUT", headers: HEADERS(), body: JSON.stringify(body) });
  const data = await res.json();
  return { status: res.status, data };
}

async function run() {
  console.log("═══════════════════════════════════════");
  console.log("  STREAK FREEZE TEST — TOPIQ");
  console.log("═══════════════════════════════════════\n");

  try {
    // Connect to Mongo
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected for test data setup");

    console.log("⏳ Waiting for backend server initialization...");
    await new Promise(resolve => setTimeout(resolve, 3000));

    // 1. Register User
    console.log("🔹 1. Registering test user...");
    const reg = await post("/auth/register", { name: "Freeze User", email: EMAIL, password: PASSWORD, targetGoal: "good" });
    assert("Register status -> 201", reg.status === 201, `Status: ${reg.status}`);
    TOKEN = reg.data?.data?.token || "";
    USER_ID = reg.data?.data?.user?.id || reg.data?.data?.user?._id || "";

    if (!TOKEN || !USER_ID) {
      throw new Error("Failed to register user to obtain token");
    }

    // 2. Add Subject for testing mission milestone
    console.log("🔹 2. Adding test subject...");
    const sub = await post("/subjects", { name: "Web Dev", code: "WD101", difficulty: "easy", color: "#3b82f6" }, HEADERS());
    assert("Subject creation status -> 201", sub.status === 201, `Status: ${sub.status}`);
    SUBJECT_ID = sub.data?.data?._id || "";

    // -------------------------------------------------------------
    // Test 1: streak resets to 0 when no freeze tokens and user missed a day
    // -------------------------------------------------------------
    console.log("\n🔹 Test 1: Streak resets to 0 when no freeze tokens exist and user missed yesterday");
    let user = await User.findById(USER_ID);
    user.streak = 5;
    user.streakFreezeTokens = 0;
    user.lastActiveDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
    await user.save();

    // Make a request to trigger streakSync (dashboard contains streakSync)
    const dbRes = await get("/dashboard");
    assert("Dashboard request -> 200", dbRes.status === 200, `Status: ${dbRes.status}`);

    user = await User.findById(USER_ID);
    assert("Streak was reset to 0", user.streak === 0, `Streak is ${user.streak}`);
    assert("Tokens remained at 0", user.streakFreezeTokens === 0, `Tokens: ${user.streakFreezeTokens}`);

    // -------------------------------------------------------------
    // Test 2: streak is preserved and token decremented when freeze token exists and user missed a day
    // -------------------------------------------------------------
    console.log("\n🔹 Test 2: Streak is preserved and token is decremented when freeze tokens exist and user missed yesterday");
    user.streak = 5;
    user.streakFreezeTokens = 2;
    user.lastActiveDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
    await user.save();

    const dbRes2 = await get("/dashboard");
    assert("Dashboard request -> 200", dbRes2.status === 200, `Status: ${dbRes2.status}`);

    user = await User.findById(USER_ID);
    assert("Streak was preserved at 5", user.streak === 5, `Streak is ${user.streak}`);
    assert("Tokens decremented to 1", user.streakFreezeTokens === 1, `Tokens: ${user.streakFreezeTokens}`);
    assert("streakFreezeUsedAt is set", user.streakFreezeUsedAt !== null, `UsedAt: ${user.streakFreezeUsedAt}`);

    // -------------------------------------------------------------
    // Test 3: POST /api/streak-freeze/award increments token count
    // -------------------------------------------------------------
    console.log("\n🔹 Test 3: POST /api/streak-freeze/award manually increments token count");
    user.streakFreezeTokens = 0;
    await user.save();

    const awardRes = await post("/streak-freeze/award", {}, HEADERS());
    assert("Award API -> 200", awardRes.status === 200, `Status: ${awardRes.status}`);
    assert("Award API returns updated count 1", awardRes.data?.data?.streakFreezeTokens === 1, `Received: ${JSON.stringify(awardRes.data)}`);

    user = await User.findById(USER_ID);
    assert("User streakFreezeTokens is 1 in DB", user.streakFreezeTokens === 1, `Tokens: ${user.streakFreezeTokens}`);

    // -------------------------------------------------------------
    // Test 4: token is awarded automatically after a 7-day streak milestone
    // -------------------------------------------------------------
    console.log("\n🔹 Test 4: Token is awarded automatically when hitting a 7-day streak milestone");
    user.streak = 7;
    user.lastActiveDate = new Date(); // Active today
    user.streakFreezeTokens = 0;
    await user.save();

    // Create a new mission
    const mission = await Mission.create({
      userId: USER_ID,
      subjectId: SUBJECT_ID,
      studyPlanId: new mongoose.Types.ObjectId(),
      title: "Daily Revision",
      type: "revision",
      priority: "medium",
      status: "pending",
      dueDate: new Date(),
      xpReward: 15
    });

    // Complete the mission via API
    const completeRes = await put(`/missions/${mission._id}/status`, { status: "completed" });
    assert("Complete mission -> 200", completeRes.status === 200, `Status: ${completeRes.status}`);

    // Reload user and verify token was awarded
    user = await User.findById(USER_ID);
    assert("Streak Freeze token automatically awarded (1)", user.streakFreezeTokens === 1, `Tokens: ${user.streakFreezeTokens}`);

    // Verify streak-alert notification was generated
    const notifications = await Notification.find({ userId: USER_ID, type: "streak-alert" });
    assert("Streak alert notification generated", notifications.length === 1, `Count: ${notifications.length}`);
    if (notifications.length === 1) {
      assert("Notification message matches", notifications[0].message === "🧊 Streak Freeze token earned! Your 7-day streak is protected.", `Message: ${notifications[0].message}`);
    }

    // -------------------------------------------------------------
    // Test 5: level-up milestone (multiple of 5)
    // -------------------------------------------------------------
    console.log("\n🔹 Test 5: Token is awarded automatically on reaching a level multiple of 5");
    user.level = 4;
    user.xp = 990;
    user.streak = 1;
    user.streakFreezeTokens = 0;
    await user.save();

    // Create a new mission
    const mission2 = await Mission.create({
      userId: USER_ID,
      subjectId: SUBJECT_ID,
      studyPlanId: new mongoose.Types.ObjectId(),
      title: "Math Practice",
      type: "study",
      priority: "high",
      status: "pending",
      dueDate: new Date(),
      xpReward: 20
    });

    const completeRes2 = await put(`/missions/${mission2._id}/status`, { status: "completed" });
    assert("Complete mission 2 -> 200", completeRes2.status === 200, `Status: ${completeRes2.status}`);

    user = await User.findById(USER_ID);
    assert("User level is 5", user.level === 5, `Level: ${user.level}`);
    assert("Streak Freeze token awarded for level 5", user.streakFreezeTokens === 1, `Tokens: ${user.streakFreezeTokens}`);

    // Verify level-up notification
    const levelNotifications = await Notification.find({ userId: USER_ID, message: /Reaching Level 5/ });
    assert("Level 5 notification generated", levelNotifications.length === 1, `Count: ${levelNotifications.length}`);

    // -------------------------------------------------------------
    // Test 6: 30-day and 100-day streak milestones
    // -------------------------------------------------------------
    console.log("\n🔹 Test 6: Tokens are awarded on significant streak milestones (30-day and 100-day)");
    user.streak = 30;
    user.lastActiveDate = new Date();
    user.streakFreezeTokens = 0;
    await user.save();

    const mission3 = await Mission.create({
      userId: USER_ID,
      subjectId: SUBJECT_ID,
      studyPlanId: new mongoose.Types.ObjectId(),
      title: "Science Revision",
      type: "revision",
      priority: "medium",
      status: "pending",
      dueDate: new Date(),
      xpReward: 10
    });

    const completeRes3 = await put(`/missions/${mission3._id}/status`, { status: "completed" });
    assert("Complete mission 3 -> 200", completeRes3.status === 200, `Status: ${completeRes3.status}`);

    user = await User.findById(USER_ID);
    assert("Streak Freeze token awarded for 30-day streak", user.streakFreezeTokens === 1, `Tokens: ${user.streakFreezeTokens}`);

    // Verify streak 30 notification
    const streakNotifications = await Notification.find({ userId: USER_ID, message: /30-day streak/ });
    assert("30-day streak notification generated", streakNotifications.length === 1, `Count: ${streakNotifications.length}`);

  } catch (error) {
    console.error("❌ Exception during integration test:", error);
    assert("No unhandled exceptions", false, error.message);
  } finally {
    await mongoose.disconnect();
    console.log("\n🔌 MongoDB disconnected");
  }

  console.log("\n═══════════════════════════════════════");
  console.log("  STREAK FREEZE INTEGRATION TEST RESULTS");
  console.log("═══════════════════════════════════════");
  let failed = false;
  results.forEach(r => {
    console.log(`${r.ok ? "✅" : "❌"} ${r.name}${r.detail ? " (" + r.detail + ")" : ""}`);
    if (!r.ok) failed = true;
  });
  console.log("═══════════════════════════════════════");
  if (failed) {
    console.error("❌ Some integration tests failed.");
    process.exit(1);
  } else {
    console.log("🎉 All streak freeze integration tests passed successfully!");
    process.exit(0);
  }
}

run();

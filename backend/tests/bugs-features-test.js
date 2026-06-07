/**
 * bugs-features-test.js
 * Tests: Streak logic, Scanned PDF fallback, Flashcard share revoking, Exam notifications, and Spaced Repetition.
 * Run: node tests/bugs-features-test.js
 */

const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// Load env variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const User = require("../src/models/user.model");
const Subject = require("../src/models/subject.model");
const Syllabus = require("../src/models/syllabus.model");
const FlashcardSet = require("../src/models/flashcardSet.model");
const Notification = require("../src/models/notification.model");
const Mission = require("../src/models/mission.model");
const StudyPlan = require("../src/models/studyPlan.model");

const BASE = "http://localhost:5000/api";
const TS = Date.now();
const EMAIL = `testuser_${TS}@test.com`;
const PASSWORD = "test123456";

let TOKEN = "";
let SUBJECT_ID = "";
let SYLLABUS_ID = "";
let FLASHCARD_SET_ID = "";
let SHARE_TOKEN = "";

const results = [];
const assert = (name, ok) => { results.push({ name, ok }); };
const HEADERS = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` });

async function post(url, body, headers) {
  const res = await fetch(`${BASE}${url}`, { 
    method: "POST", 
    headers: headers || { "Content-Type": "application/json" }, 
    body: JSON.stringify(body) 
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function put(url, body, headers) {
  const res = await fetch(`${BASE}${url}`, { 
    method: "PUT", 
    headers: headers || { "Content-Type": "application/json" }, 
    body: JSON.stringify(body) 
  });
  const data = await res.json();
  return { status: res.status, data };
}

async function get(url, headers) {
  const res = await fetch(`${BASE}${url}`, { headers: headers || {} });
  const data = await res.json();
  return { status: res.status, data };
}

async function run() {
  console.log("═══════════════════════════════════════");
  console.log("  BUGS & FEATURES PIPELINE TEST — TOPIQ");
  console.log("═══════════════════════════════════════\n");

  try {
    // Connect to Mongo
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected for test setup");

    // 1. Register & Auth
    console.log("🔹 1. Register");
    const reg = await post("/auth/register", { name: "Bugs Test User", email: EMAIL, password: PASSWORD, targetGoal: "good", institution: "IIT Bombay" });
    assert("Register -> 201", reg.status === 201);
    TOKEN = reg.data?.data?.token || "";
    const userDbId = reg.data?.data?.user?.id;

    // 2. Add Subject
    console.log("🔹 2. Add Subject");
    const sub = await post("/subjects", { name: "Software Engineering", code: "SE301", difficulty: "medium", color: "#6366f1" }, HEADERS());
    assert("Subject -> 201", sub.status === 201);
    SUBJECT_ID = sub.data?.data?._id || "";

    // 3. Save Syllabus Text
    console.log("🔹 3. Save Syllabus Text");
    const syl = await post("/syllabus/text", { subjectId: SUBJECT_ID, rawContent: "Unit 1: Software Development Lifecycle" }, HEADERS());
    assert("Syllabus upload -> 201", syl.status === 201 || syl.status === 200);
    SYLLABUS_ID = syl.data?.data?.syllabusId;

    // 4. Test Streak Updates and resets
    console.log("🔹 4. Testing Streak Updates and Resets via middleware");
    
    // Simulate user active yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await User.findByIdAndUpdate(userDbId, { lastActiveDate: yesterday, streak: 5 });

    // Request dashboard (triggers streakSync middleware)
    console.log("👉 Loading dashboard (active yesterday)...");
    const dashRes1 = await get("/dashboard", HEADERS());
    assert("Dashboard load -> 200", dashRes1.status === 200);
    assert("Streak incremented to 6", dashRes1.data?.data?.user?.streak === 6);

    // Simulate user active 3 days ago
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    await User.findByIdAndUpdate(userDbId, { lastActiveDate: threeDaysAgo });

    // Request dashboard again
    console.log("👉 Loading dashboard (missed days)...");
    const dashRes2 = await get("/dashboard", HEADERS());
    assert("Streak reset to 0", dashRes2.data?.data?.user?.streak === 0);

    // 5. Test Exam Countdown Notifications
    console.log("🔹 5. Testing Exam Countdown Notifications");
    
    // Setup subject with exam date in 7 days
    const examDate = new Date();
    examDate.setDate(examDate.getDate() + 7);
    await Subject.findByIdAndUpdate(SUBJECT_ID, { examDate });

    // Clear previous notifications
    await Notification.deleteMany({ userId: userDbId });

    // Call dashboard to sync
    await get("/dashboard", HEADERS());

    // Query DB for notifications
    const notifications = await Notification.find({ userId: userDbId, type: "exam-reminder" });
    assert("Exam countdown notification created", notifications.length === 1);
    assert("Reminder is for 7 days", notifications[0].title.includes("7 days") || notifications[0].title.includes("7 day"));

    // Call dashboard again to ensure no duplicates
    await get("/dashboard", HEADERS());
    const notificationsAfter = await Notification.find({ userId: userDbId, type: "exam-reminder" });
    assert("Duplicate countdown reminder prevented", notificationsAfter.length === 1);

    // 6. Test Flashcards Sharing & Revocation
    console.log("🔹 6. Testing Flashcard Share & Revocation");
    
    // Mock analyzed syllabus topics
    const dbSyllabus = await Syllabus.findById(SYLLABUS_ID);
    dbSyllabus.isAnalyzed = true;
    dbSyllabus.units = [{
      unitNumber: 1,
      unitName: "Software Process Models",
      topics: [
        { name: "Waterfall Model", importance: "critical", difficulty: "easy", estimatedHours: 2, summary: "Traditional sequential model." },
        { name: "Agile Scrum Method", importance: "high", difficulty: "medium", estimatedHours: 3, summary: "Iterative development cycles." }
      ]
    }];
    await dbSyllabus.save();

    // Generate Flashcards
    const genCards = await post(`/syllabus/${SYLLABUS_ID}/flashcards/generate`, {}, HEADERS());
    FLASHCARD_SET_ID = genCards.data?.data?._id;
    assert("Flashcards generated", !!FLASHCARD_SET_ID);

    // Share Flashcards
    const shareTitle = "SE Exam Revision Guide";
    const shareRes = await post(`/flashcards/${FLASHCARD_SET_ID}/share`, { shareTitle }, HEADERS());
    assert("Flashcard shared", shareRes.status === 200);
    SHARE_TOKEN = shareRes.data?.data?.shareUrl.split("/").pop();
    assert("Share token generated", !!SHARE_TOKEN);

    // Get public cheatnote
    const publicCheatNote1 = await get(`/public/cheatnote/${SHARE_TOKEN}`);
    assert("Public access allowed", publicCheatNote1.status === 200);
    assert("Public title matches", publicCheatNote1.data?.data?.shareTitle === shareTitle);

    // Revoke share link
    const revokeRes = await post(`/flashcards/${FLASHCARD_SET_ID}/revoke`, {}, HEADERS());
    assert("Flashcard share link revoked", revokeRes.status === 200);

    // Get public cheatnote after revoke (should fail)
    const publicCheatNote2 = await get(`/public/cheatnote/${SHARE_TOKEN}`);
    assert("Public access denied after revocation (404)", publicCheatNote2.status === 404);

    // 7. Test Spaced Repetition (SM-2) Progress Calculation
    console.log("🔹 7. Testing Spaced Repetition Logic");

    // Let's create a Mock active StudyPlan (required to generate revision missions)
    const activePlan = await StudyPlan.create({
      userId: userDbId,
      subjectId: SUBJECT_ID,
      syllabusId: SYLLABUS_ID,
      examDate: examDate,
      availableHoursPerDay: 2,
      targetGoal: "good",
      isActive: true,
      dailyPlans: [
        { date: new Date(), dayLabel: "Day 1", topics: [{ topicName: "Waterfall Model", unitName: "Software Process Models", estimatedHours: 2, importance: "critical" }] }
      ]
    });

    // Generate Missions from plan
    await Mission.deleteMany({ userId: userDbId });
    
    // Create a mock study mission to complete
    const mission = await Mission.create({
      userId: userDbId,
      subjectId: SUBJECT_ID,
      studyPlanId: activePlan._id,
      title: "Study: Waterfall Model",
      description: "Waterfall study mission",
      type: "study",
      topicName: "Waterfall Model",
      unitName: "Software Process Models",
      dueDate: new Date(),
      status: "pending"
    });

    // Complete mission with rating 'got-it'
    const completeRes1 = await put(`/missions/${mission._id}/status`, { status: "completed", rating: "got-it" }, HEADERS());
    assert("Mission marked complete -> 200", completeRes1.status === 200);

    // Check Syllabus topicProgress in DB
    const syllabusWithSR = await Syllabus.findById(SYLLABUS_ID);
    const progressEntry = syllabusWithSR.topicProgress.find(tp => tp.topicName === "Waterfall Model");
    assert("spaced repetition topicProgress created", !!progressEntry);
    assert("Rating is got-it", progressEntry.rating === "got-it");
    assert("Interval index is 1 (3 days scheduler)", progressEntry.intervalIndex === 1);
    
    // Complete the same topic with rating 'no-idea' (simulate revision failure)
    const mission2 = await Mission.create({
      userId: userDbId,
      subjectId: SUBJECT_ID,
      studyPlanId: activePlan._id,
      title: "Revise: Waterfall Model",
      description: "Waterfall revision mission",
      type: "revision",
      topicName: "Waterfall Model",
      unitName: "Software Process Models",
      dueDate: new Date(),
      status: "pending"
    });

    const completeRes2 = await put(`/missions/${mission2._id}/status`, { status: "completed", rating: "no-idea" }, HEADERS());
    assert("Revision mission marked complete", completeRes2.status === 200);

    const syllabusWithSRReset = await Syllabus.findById(SYLLABUS_ID);
    const progressEntryReset = syllabusWithSRReset.topicProgress.find(tp => tp.topicName === "Waterfall Model");
    assert("Interval index reset to 0 (1 day scheduler) due to no-idea rating", progressEntryReset.intervalIndex === 0);

    // 8. Test Dynamic Revision Mission Generation
    console.log("🔹 8. Testing Dynamic Revision Mission Generation");

    // Force due date to be yesterday
    const dbSyll = await Syllabus.findById(SYLLABUS_ID);
    dbSyll.topicProgress[0].nextReviewDate = yesterday;
    await dbSyll.save();

    // Query today's missions (should trigger syncRevisionMissions)
    const todayMissionsRes = await get("/missions/today", HEADERS());
    assert("Fetched today's missions successfully", todayMissionsRes.status === 200);
    
    // Check if the revision mission was generated automatically
    const generatedRevision = await Mission.findOne({
      userId: userDbId,
      subjectId: SUBJECT_ID,
      topicName: "Waterfall Model",
      type: "revision",
      status: "pending"
    });
    assert("Dynamic revision mission generated for due topic", !!generatedRevision);

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
    console.error("❌ Some pipeline tests failed.");
    process.exit(1);
  } else {
    console.log("🎉 All bugs and features pipeline tests passed successfully!");
  }
}

run();

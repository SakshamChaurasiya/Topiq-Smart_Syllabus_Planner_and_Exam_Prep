/**
 * reschedule-test.js
 * Tests: Auto-Rescheduling Missed Days
 * Run: node tests/reschedule-test.js
 */

const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// Load env variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const StudyPlan = require("../src/models/studyPlan.model");
const BASE = "http://localhost:5000/api";
const TS = Date.now();
const EMAIL = `reschedtest_${TS}@test.com`;
const PASSWORD = "test123456";

let TOKEN = "";
let SUBJECT_ID = "";
let PLAN_ID = "";

const results = [];
const assert = (name, ok) => { results.push({ name, ok }); };
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

async function run() {
  console.log("═══════════════════════════════════════");
  console.log("  RESCHEDULING TEST — TOPIQ");
  console.log("═══════════════════════════════════════\n");

  try {
    // Connect to Mongo
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected for test data setup");

    // 1. Register
    console.log("🔹 1. Register");
    const reg = await post("/auth/register", { name: "Resched User", email: EMAIL, password: PASSWORD, targetGoal: "good", institution: "Stanford" });
    assert("Register -> 201", reg.status === 201);
    TOKEN = reg.data?.data?.token || "";

    // 2. Add Subject
    console.log("🔹 2. Add Subject");
    const sub = await post("/subjects", { name: "Algorithms", code: "ALG", difficulty: "medium", color: "#6366f1" }, HEADERS());
    assert("Subject -> 201", sub.status === 201);
    SUBJECT_ID = sub.data?.data?._id || "";

    // 3. Save Syllabus Text
    console.log("🔹 3. Save Syllabus Text");
    const syl = await post("/syllabus/text", { subjectId: SUBJECT_ID, rawContent: "Unit 1: Foundations\n1.1 Sorting\n1.2 Searching\nUnit 2: Graphs\n2.1 BFS\n2.2 DFS\nUnit 3: DP\n3.1 Knapsack" }, HEADERS());
    assert("Syllabus upload -> 201", syl.status === 201 || syl.status === 200);
    const syllabusId = syl.data?.data?.syllabusId;

    // 4. Run AI Analysis
    console.log("🔹 4. Analyze Syllabus");
    await post(`/syllabus/${syllabusId}/analyze`, {}, HEADERS());

    // 5. Generate Plan (3 days)
    console.log("🔹 5. Generate Plan");
    const examDate = new Date();
    examDate.setDate(examDate.getDate() + 3);
    const plan = await post("/planner/generate", { subjectId: SUBJECT_ID, examDate: examDate.toISOString(), availableHoursPerDay: 4, targetGoal: "good" }, HEADERS());
    assert("Generate Plan -> 201", plan.status === 201);
    PLAN_ID = plan.data?.data?.plan?._id || "";

    // 6. DB Date Manipulation: Simulate missed days
    console.log("🔹 6. Manipulating DB dates to simulate missed days");
    const dbPlan = await StudyPlan.findById(PLAN_ID);
    assert("StudyPlan found in DB", !!dbPlan);
    assert("Plan has at least 3 days", dbPlan.dailyPlans.length >= 3);

    // Make Day 1 (index 0) 2 days ago, uncompleted
    dbPlan.dailyPlans[0].date = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
    dbPlan.dailyPlans[0].isCompleted = false;
    dbPlan.dailyPlans[0].rescheduled = false;

    // Make Day 2 (index 1) 1 day ago, uncompleted
    dbPlan.dailyPlans[1].date = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
    dbPlan.dailyPlans[1].isCompleted = false;
    dbPlan.dailyPlans[1].rescheduled = false;

    // Make Day 3 (index 2) tomorrow, uncompleted
    dbPlan.dailyPlans[2].date = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000);
    dbPlan.dailyPlans[2].isCompleted = false;
    dbPlan.dailyPlans[2].rescheduled = false;

    await dbPlan.save();
    console.log("✅ Dates updated in DB (Day 1: -2d, Day 2: -1d, Day 3: +1d)");

    // 7. Call Reschedule Endpoint
    console.log("🔹 7. Triggering Reschedule API");
    const reschRes = await post(`/study-plan/${PLAN_ID}/reschedule`, {}, HEADERS());
    assert("Reschedule API status -> 200", reschRes.status === 200);
    assert("Contains rescheduledTopicCount", typeof reschRes.data?.data?.rescheduledTopicCount === "number");
    assert("Affected days length >= 1", reschRes.data?.data?.affectedDays?.length >= 1);

    // 8. Load updated DB state and assert results
    console.log("🔹 8. Verifying DB update");
    const updatedPlan = await StudyPlan.findById(PLAN_ID);

    // Day 1 & Day 2 should be marked isCompleted and rescheduled
    assert("Day 1 is completed", updatedPlan.dailyPlans[0].isCompleted === true);
    assert("Day 1 is marked rescheduled", updatedPlan.dailyPlans[0].rescheduled === true);
    assert("Day 2 is completed", updatedPlan.dailyPlans[1].isCompleted === true);
    assert("Day 2 is marked rescheduled", updatedPlan.dailyPlans[1].rescheduled === true);

    // Day 3 should remain uncompleted but receive topics
    assert("Day 3 is uncompleted", updatedPlan.dailyPlans[2].isCompleted === false);
    assert("Day 3 has warning tip note", updatedPlan.dailyPlans[2].studyTip.includes("⚠ Includes rescheduled topics"));
    
    // Total plan completion percentage should have updated
    assert("Completion percentage updated", updatedPlan.completionPercentage > 0);

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
    console.error("❌ Some tests failed.");
    process.exit(1);
  } else {
    console.log("🎉 Reschedule tests passed successfully!");
    process.exit(0);
  }
}

run();

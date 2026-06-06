/**
 * core-flow-test.js
 * Tests: Register → Add Subject → Upload Syllabus (text) → 
 *        Get Subject → Check Dashboard → Check Missions
 * Run: node tests/core-flow-test.js
 */

const BASE = "http://localhost:5000/api";
const TS = Date.now();
const EMAIL = `coretest_${TS}@test.com`;
const PASSWORD = "test123456";

let TOKEN = "";
let SUBJECT_ID = "";

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
async function put(url, body) {
  const res = await fetch(`${BASE}${url}`, { method: "PUT", headers: HEADERS(), body: JSON.stringify(body) });
  const data = await res.json();
  return { status: res.status, data };
}
async function del(url) {
  const res = await fetch(`${BASE}${url}`, { method: "DELETE", headers: HEADERS() });
  const data = await res.json();
  return { status: res.status, data };
}

async function run() {
  console.log("═══════════════════════════════════════");
  console.log("  CORE FLOW TESTS — Smart Syllabus Planner");
  console.log("═══════════════════════════════════════\n");

  // 1. Register
  console.log("🔹 1. Register");
  const reg = await post("/auth/register", { name: "Core Test User", email: EMAIL, password: PASSWORD, targetGoal: "good" });
  assert("Register → 201", reg.status === 201);
  assert("Register returns token", !!reg.data?.data?.token);
  TOKEN = reg.data?.data?.token || "";

  // 2. Create Subject
  console.log("🔹 2. Create Subject");
  const sub = await post("/subjects", { name: "Data Structures", code: "DSA", difficulty: "medium", color: "#6366f1", examDate: new Date(Date.now() + 15 * 86400000).toISOString() }, HEADERS());
  assert("Create subject → 201", sub.status === 201);
  assert("Subject has _id", !!sub.data?.data?._id);
  assert("Subject has name", sub.data?.data?.name === "Data Structures");
  assert("Subject has code", sub.data?.data?.code === "DSA");
  assert("Subject has examDate", !!sub.data?.data?.examDate);
  assert("Subject progress = 0", sub.data?.data?.progress === 0);
  SUBJECT_ID = sub.data?.data?._id || "";

  // 3. Get all subjects
  console.log("🔹 3. Get All Subjects");
  const subs = await get("/subjects");
  assert("Get subjects → 200", subs.status === 200);
  assert("Has at least 1 subject", (subs.data?.data?.length || 0) >= 1);

  // 4. Get subject by ID
  console.log("🔹 4. Get Subject by ID");
  const single = await get(`/subjects/${SUBJECT_ID}`);
  assert("Get by id → 200", single.status === 200);
  assert("Correct subject name", single.data?.data?.name === "Data Structures");

  // 5. Update subject
  console.log("🔹 5. Update Subject");
  const updated = await put(`/subjects/${SUBJECT_ID}`, { name: "Data Structures & Algorithms", difficulty: "hard" });
  assert("Update → 200", updated.status === 200);
  assert("Name updated", updated.data?.data?.name === "Data Structures & Algorithms");
  assert("Difficulty updated", updated.data?.data?.difficulty === "hard");

  // 6. Upload syllabus (text mode)
  console.log("🔹 6. Upload Syllabus (text)");
  const syllabusText = `
Unit 1: Arrays and Strings
- Introduction to Arrays
- Array Operations (Insert, Delete, Search)
- Strings and Pattern Matching
- Two Pointer Technique

Unit 2: Linked Lists
- Singly Linked List
- Doubly Linked List
- Circular Linked List
- Linked List Problems

Unit 3: Stacks and Queues
- Stack Implementation
- Queue Implementation
- Priority Queue
- Stack/Queue Applications

Unit 4: Trees
- Binary Trees
- Binary Search Trees
- AVL Trees
- Tree Traversals (Inorder, Preorder, Postorder)

Unit 5: Graphs
- Graph Representation
- BFS and DFS
- Dijkstra's Algorithm
- Minimum Spanning Trees
`;

  const sylRes = await post("/syllabus/text", { subjectId: SUBJECT_ID, rawContent: syllabusText }, HEADERS());
  assert("Syllabus upload → 201 or 200", sylRes.status === 201 || sylRes.status === 200);
  assert("Syllabus has syllabusId", !!sylRes.data?.data?.syllabusId);
  const SYLLABUS_ID = sylRes.data?.data?.syllabusId || "";

  // 6a. Run AI Analysis
  console.log("🔹 6a. Run AI Analysis");
  const analRes = await post(`/syllabus/${SYLLABUS_ID}/analyze`, {}, HEADERS());
  assert("Analyze syllabus → 200", analRes.status === 200);
  assert("Syllabus is analyzed", analRes.data?.data?.totalTopics > 0);

  // 6b. Generate Study Plan
  console.log("🔹 6b. Generate Study Plan");
  const planRes = await post("/planner/generate", {
    subjectId: SUBJECT_ID,
    examDate: new Date(Date.now() + 15 * 86400000).toISOString(),
    availableHoursPerDay: 4,
    targetGoal: "good"
  }, HEADERS());
  assert("Generate plan → 201", planRes.status === 201);
  assert("Plan has missions created", planRes.data?.data?.missionsCreated > 0);

  // 7. Check dashboard
  console.log("🔹 7. Dashboard");
  const dash = await get("/dashboard");
  assert("Dashboard → 200", dash.status === 200);
  assert("Dashboard has overview", !!dash.data?.data?.overview);
  assert("Dashboard has totalSubjects >= 1", (dash.data?.data?.overview?.totalSubjects || 0) >= 1);
  assert("Dashboard has todayStats", !!dash.data?.data?.todayStats);
  assert("Dashboard user object has streak=0 initial", dash.data?.data?.user?.streak === 0);

  // 8. Get missions (should NOT be empty after plan)
  console.log("🔹 8. Missions After Plan");
  const missionsRes = await get("/missions/today");
  assert("Missions today → 200", missionsRes.status === 200);
  const todayMissions = missionsRes.data?.data?.missions || [];
  assert("Has missions generated", todayMissions.length > 0);
  console.log(`   (${todayMissions.length} missions generated for today)`);

  // 8a. Complete a mission and verify gamification
  if (todayMissions.length > 0) {
    const missionToComplete = todayMissions[0];
    console.log(`🔹 8a. Complete Mission: ${missionToComplete.title}`);
    const compRes = await put(`/missions/${missionToComplete._id}/status`, { status: "completed" });
    assert("Complete mission → 200", compRes.status === 200);
    assert("XP Earned returned", compRes.data?.data?.xpEarned > 0);
    assert("User gamification returned", compRes.data?.data?.user?.xp !== undefined);

    // Verify dashboard has updated gamification
    console.log("🔹 8b. Verify Gamification on Dashboard");
    const dashAfter = await get("/dashboard");
    assert("Dashboard after complete → 200", dashAfter.status === 200);
    assert("User has streak = 1", dashAfter.data?.data?.user?.streak === 1);
    assert("User has level = 1", dashAfter.data?.data?.user?.level === 1);
    assert("User has XP > 0", dashAfter.data?.data?.user?.xp > 0);
  }

  // 9. Get mission stats
  console.log("🔹 9. Mission Stats");
  const statsRes = await get("/missions/stats");
  assert("Mission stats → 200", statsRes.status === 200);
  assert("Stats has total field", statsRes.data?.data?.total !== undefined);
  assert("Stats has completionRate", statsRes.data?.data?.completionRate !== undefined);

  // 10. Get notifications
  console.log("🔹 10. Notifications");
  const notifRes = await get("/notifications");
  assert("Notifications → 200", notifRes.status === 200);

  // 11. Delete subject (cleanup)
  console.log("🔹 11. Delete Subject (cleanup)");
  const delRes = await del(`/subjects/${SUBJECT_ID}`);
  assert("Delete → 200", delRes.status === 200);

  // Verify deletion
  const afterDel = await get(`/subjects/${SUBJECT_ID}`);
  assert("After delete → 404", afterDel.status === 404);

  // ── Results ──
  const passed = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  console.log("\n═══════════════════════════════════════");
  console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${results.length} total`);
  console.log("═══════════════════════════════════════\n");
  results.forEach(r => {
    console.log(`  ${r.ok ? "✅ PASS" : "❌ FAIL"}: ${r.name}`);
  });

  if (failed === 0) console.log("\n🎉 All core flow tests passed!\n");
  else {
    console.log(`\n⚠️ ${failed} test(s) failed.\n`);
    process.exit(1);
  }
}

run().catch(err => { console.error("Test error:", err); process.exit(1); });

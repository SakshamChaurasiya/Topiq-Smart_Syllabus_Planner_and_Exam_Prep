/**
 * calendar-export-test.js
 * Tests: Register → Add Subject → Upload Syllabus (text) → Analyze Syllabus → Generate Plan → Export to .ics
 * Run: node tests/calendar-export-test.js
 */

const BASE = "http://localhost:5000/api";
const TS = Date.now();
const EMAIL = `caltest_${TS}@test.com`;
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
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = text;
  }
  return { status: res.status, data, headers: res.headers };
}
async function put(url, body) {
  const res = await fetch(`${BASE}${url}`, { method: "PUT", headers: HEADERS(), body: JSON.stringify(body) });
  const data = await res.json();
  return { status: res.status, data };
}

async function run() {
  console.log("═══════════════════════════════════════");
  console.log("  CALENDAR EXPORT TEST — SSP");
  console.log("═══════════════════════════════════════\n");

  try {
    // 1. Register
    console.log("🔹 1. Register");
    const reg = await post("/auth/register", { name: "Cal Test User", email: EMAIL, password: PASSWORD, targetGoal: "good", institution: "Stanford" });
    assert("Register -> 201", reg.status === 201);
    TOKEN = reg.data?.data?.token || "";
    assert("Token generated", !!TOKEN);

    // 2. Add Subject
    console.log("🔹 2. Add Subject");
    const sub = await post("/subjects", { name: "System Integration", code: "SI101", difficulty: "hard", color: "#4f46e5" }, HEADERS());
    assert("Subject -> 201", sub.status === 201);
    SUBJECT_ID = sub.data?.data?._id || "";
    assert("Subject ID obtained", !!SUBJECT_ID);

    // 3. Save Syllabus Text
    console.log("🔹 3. Save Syllabus Text");
    const syl = await post("/syllabus/text", { subjectId: SUBJECT_ID, rawContent: "Unit 1: Calendar Integration\n1.1 ICS Format basics\n1.2 Event generation and reminders" }, HEADERS());
    assert("Syllabus upload -> 200 or 201", syl.status === 200 || syl.status === 201);
    const syllabusId = syl.data?.data?.syllabusId;
    assert("Syllabus ID obtained", !!syllabusId);

    // 4. Run AI Analysis
    console.log("🔹 4. Analyze Syllabus");
    const analyze = await post(`/syllabus/${syllabusId}/analyze`, {}, HEADERS());
    assert("Analyze -> 200", analyze.status === 200);

    // 5. Generate Plan
    console.log("🔹 5. Generate Plan");
    const examDate = new Date();
    examDate.setDate(examDate.getDate() + 10); // 10 days from now
    const plan = await post("/planner/generate", { subjectId: SUBJECT_ID, examDate: examDate.toISOString(), availableHoursPerDay: 4, targetGoal: "good" }, HEADERS());
    assert("Generate Plan -> 201", plan.status === 201);
    PLAN_ID = plan.data?.data?.plan?._id || "";
    assert("Plan ID obtained", !!PLAN_ID);

    // 6. Export to ICS
    console.log("🔹 6. Export to ICS Calendar File");
    const exportRes = await get(`/study-plan/${PLAN_ID}/export/ics`);
    assert("Export -> 200", exportRes.status === 200);
    assert("Content-Type header has calendar", exportRes.headers.get("content-type")?.includes("text/calendar"));
    assert("Content-Disposition contains filename", exportRes.headers.get("content-disposition")?.includes("study-plan.ics"));
    
    const icsContent = exportRes.data;
    assert("ICS starts with BEGIN:VCALENDAR", icsContent.startsWith("BEGIN:VCALENDAR"));
    assert("ICS has VERSION:2.0", icsContent.includes("VERSION:2.0"));
    assert("ICS has PRODID", icsContent.includes("PRODID:-//SmartSyllabusPlanner//SSP//EN"));
    assert("ICS includes VEVENT", icsContent.includes("BEGIN:VEVENT"));
    assert("ICS includes VALARM reminder", icsContent.includes("BEGIN:VALARM"));
    assert("ICS includes TRIGGER:-PT60M", icsContent.includes("TRIGGER:-PT60M"));
    assert("ICS ends with END:VCALENDAR", icsContent.trim().endsWith("END:VCALENDAR"));
    assert("ICS has EXAM event", icsContent.includes("SUMMARY:EXAM:"));

  } catch (error) {
    console.error("❌ Exception during test:", error);
    assert("No unhandled exceptions", false);
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
    console.log("🎉 All tests passed successfully!");
    process.exit(0);
  }
}

run();

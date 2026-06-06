/**
 * flashcards-test.js
 * Tests: Flashcards Generation & Sharing Pipeline
 * Run: node tests/flashcards-test.js
 */

const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// Load env variables
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const Syllabus = require("../src/models/syllabus.model");
const FlashcardSet = require("../src/models/flashcardSet.model");
const BASE = "http://localhost:5000/api";
const TS = Date.now();
const EMAIL = `fctest_${TS}@test.com`;
const PASSWORD = "test123456";

let TOKEN = "";
let SUBJECT_ID = "";
let SYLLABUS_ID = "";
let SET_ID = "";
let SHARE_TOKEN = "";

const results = [];
const assert = (name, ok) => { results.push({ name, ok }); };
const HEADERS = () => ({ "Content-Type": "application/json", Authorization: `Bearer ${TOKEN}` });

async function post(url, body, headers) {
  const res = await fetch(`${BASE}${url}`, { method: "POST", headers: headers || { "Content-Type": "application/json" }, body: JSON.stringify(body) });
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
  console.log("  AI FLASHCARDS & SHARING TEST — SSP");
  console.log("═══════════════════════════════════════\n");

  try {
    // Connect to Mongo
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected for test setup");

    // 1. Register
    console.log("🔹 1. Register");
    const reg = await post("/auth/register", { name: "FC Test User", email: EMAIL, password: PASSWORD, targetGoal: "good", institution: "Stanford" });
    assert("Register -> 201", reg.status === 201);
    TOKEN = reg.data?.data?.token || "";

    // 2. Add Subject
    console.log("🔹 2. Add Subject");
    const sub = await post("/subjects", { name: "Computer Networks", code: "CN202", difficulty: "medium", color: "#3b82f6" }, HEADERS());
    assert("Subject -> 201", sub.status === 201);
    SUBJECT_ID = sub.data?.data?._id || "";

    // 3. Save Syllabus Text
    console.log("🔹 3. Save Syllabus Text");
    const syl = await post("/syllabus/text", { subjectId: SUBJECT_ID, rawContent: "Unit 1: TCP/IP Stack" }, HEADERS());
    assert("Syllabus upload -> 201", syl.status === 201 || syl.status === 200);
    SYLLABUS_ID = syl.data?.data?.syllabusId;

    // To verify priority filtering, we insert 3 topics directly in the DB:
    // Topic A: critical, Topic B: high, Topic C: low
    const dbSyllabus = await Syllabus.findById(SYLLABUS_ID);
    dbSyllabus.isAnalyzed = true;
    dbSyllabus.units = [{
      unitNumber: 1,
      unitName: "TCP/IP Stack Layering",
      topics: [
        { name: "IP Routing Protocols", importance: "critical", difficulty: "hard", estimatedHours: 4, summary: "Focus on BGP and OSPF details." },
        { name: "TCP Three-way Handshake", importance: "high", difficulty: "medium", estimatedHours: 2, summary: "Focus on SYN, SYN-ACK, ACK seq numbers." },
        { name: "Ping Utility historical overview", importance: "low", difficulty: "easy", estimatedHours: 1, summary: "Just basic ICMP echo." }
      ]
    }];
    await dbSyllabus.save();
    console.log("✅ Mock analyzed syllabus saved directly to DB (1 critical, 1 high, 1 low topic)");

    // 4. Generate AI Flashcards (should only include critical and high priority topics)
    console.log("🔹 4. Triggering Flashcards Generation");
    const genRes = await post(`/syllabus/${SYLLABUS_ID}/flashcards/generate`, {}, HEADERS());
    assert("Generate Flashcards status -> 200", genRes.status === 200);
    SET_ID = genRes.data?.data?._id || "";
    assert("Flashcard Set ID obtained", !!SET_ID);
    assert("Cards array is generated", Array.isArray(genRes.data?.data?.cards));
    
    // Low priority topic should be excluded, leaving exactly 2 cards
    const cardsLength = genRes.data?.data?.cards?.length || 0;
    assert("Low importance topic is filtered out (exactly 2 cards created)", cardsLength === 2);
    
    // Verify content structure
    if (cardsLength > 0) {
      assert("Card has non-empty front question", !!genRes.data?.data?.cards[0]?.front);
      assert("Card has non-empty back answer", !!genRes.data?.data?.cards[0]?.back);
    }

    // 5. Fetch Flashcard Set (Get Owner View)
    console.log("🔹 5. Fetching Flashcard Set");
    const getRes = await get(`/syllabus/${SYLLABUS_ID}/flashcards`, HEADERS());
    assert("Fetch Flashcards status -> 200", getRes.status === 200);
    assert("Correct Set ID returned", getRes.data?.data?._id === SET_ID);

    // 6. Share Flashcard Set
    console.log("🔹 6. Enabling Flashcard Sharing");
    const shareTitle = "CN Exam prep - BGP & TCP Handshake";
    const shareRes = await post(`/flashcards/${SET_ID}/share`, { shareTitle }, HEADERS());
    assert("Share status -> 200", shareRes.status === 200);
    
    const shareUrl = shareRes.data?.data?.shareUrl || "";
    assert("shareUrl is generated", !!shareUrl);
    SHARE_TOKEN = shareUrl.split("/").pop();
    assert("shareToken obtained", !!SHARE_TOKEN);

    // 7. Get Public Cheat Note (No Auth)
    console.log("🔹 7. Fetching Shared Cheat Note publicly (unauthenticated)");
    const publicRes = await get(`/public/cheatnote/${SHARE_TOKEN}`);
    assert("Public fetch status -> 200", publicRes.status === 200);
    assert("Shared note title matches", publicRes.data?.data?.shareTitle === shareTitle);
    assert("Shared subject name matches Computer Networks", publicRes.data?.data?.subjectName === "Computer Networks");
    assert("Shared cards contains exactly 2 cards", publicRes.data?.data?.cards?.length === 2);

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
    console.log("🎉 Flashcard and Sharing tests passed successfully!");
    process.exit(0);
  }
}

run();

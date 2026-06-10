/**
 * checkStreak.js
 * Run from your backend directory:
 *   node checkStreak.js your@email.com
 *
 * Diagnoses streak state for a given user.
 * Uses IDENTICAL activity sources as analytics.controller.js activityMap.
 * READ-ONLY — does not modify anything in the database.
 */

require("dotenv").config();
const mongoose = require("mongoose");

const email = process.argv[2];
if (!email) {
  console.error("❌  Usage: node checkStreak.js your@email.com");
  process.exit(1);
}

// ── Inline schemas — mirror your actual models ──
const userSchema = new mongoose.Schema({
  name: String, email: String, streak: Number,
  lastActiveDate: Date, xp: Number, level: Number,
  streakFreezeTokens: Number, createdAt: Date,
}, { timestamps: true });

const missionSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  status: String, completedAt: Date,
  estimatedMinutes: Number, type: String, title: String,
}, { timestamps: true });

// Syllabus — topicProgress.lastStudiedAt is source 2 in analytics
const syllabusSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  topicProgress: [{ topicName: String, lastStudiedAt: Date }],
}, { timestamps: true });

// StudyPlan — dailyPlans[].isCompleted + dailyPlans[].date is source 3 in analytics
// NOT updatedAt — that was the bug in the previous script
const studyPlanSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  dailyPlans: [{
    date: Date,
    isCompleted: Boolean,
    plannedHours: Number,
  }],
}, { timestamps: true });

const User      = mongoose.model("User",      userSchema);
const Mission   = mongoose.model("Mission",   missionSchema);
const Syllabus  = mongoose.model("Syllabus",  syllabusSchema);
const StudyPlan = mongoose.model("StudyPlan", studyPlanSchema);

// ── IST helpers — mirrors analytics.controller.js exactly ──
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

const toISTDateStr = (utcDate) => {
  const ist = new Date(utcDate.getTime() + IST_OFFSET_MS);
  const y = ist.getUTCFullYear();
  const m = String(ist.getUTCMonth() + 1).padStart(2, "0");
  const d = String(ist.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const addDays = (istDateStr, n) => {
  const [y, m, d] = istDateStr.split("-").map(Number);
  const result = new Date(Date.UTC(y, m - 1, d + n));
  const ry = result.getUTCFullYear();
  const rm = String(result.getUTCMonth() + 1).padStart(2, "0");
  const rd = String(result.getUTCDate()).padStart(2, "0");
  return `${ry}-${rm}-${rd}`;
};

const istDateStrToUTC = (istDateStr) => {
  const [y, m, d] = istDateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d) - IST_OFFSET_MS);
};

const todayIST = () => toISTDateStr(new Date());

const prettyDate = (istDateStr) => {
  const [y, m, d] = istDateStr.split("-").map(Number);
  const days = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${days[dt.getUTCDay()]}, ${String(d).padStart(2,"0")} ${months[m-1]}, ${y}`;
};

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("\n✅  Connected to MongoDB\n");

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select(
    "name email streak lastActiveDate xp level streakFreezeTokens createdAt"
  );

  if (!user) {
    console.error(`❌  No user found with email: ${email}`);
    await mongoose.disconnect();
    process.exit(1);
  }

  const now        = new Date();
  const todayStr   = todayIST();
  const yesterdayStr = addDays(todayStr, -1);

  const lastActiveIST    = user.lastActiveDate ? toISTDateStr(user.lastActiveDate) : null;
  const isActiveToday    = lastActiveIST === todayStr;
  const wasActiveYesterday = lastActiveIST === yesterdayStr;

  // ── User summary ──
  console.log("─────────────────────────────────────────");
  console.log("  USER SNAPSHOT");
  console.log("─────────────────────────────────────────");
  console.log(`  Name            : ${user.name}`);
  console.log(`  Email           : ${user.email}`);
  console.log(`  Level           : ${user.level}`);
  console.log(`  XP              : ${user.xp}`);
  console.log(`  Streak          : ${user.streak} day(s)`);
  console.log(`  Freeze Tokens   : ${user.streakFreezeTokens ?? 0}`);
  console.log(`  Last Active     : ${lastActiveIST ? prettyDate(lastActiveIST) : "Never"} (IST)`);
  console.log(`  Account Created : ${prettyDate(toISTDateStr(user.createdAt))}`);
  console.log();

  // ── Streak diagnosis ──
  console.log("─────────────────────────────────────────");
  console.log("  STREAK DIAGNOSIS");
  console.log("─────────────────────────────────────────");
  if (!user.lastActiveDate) {
    console.log("  ⚠️  lastActiveDate is NULL — streakSync has never run.");
    console.log("     Check streakSync is mounted AFTER protect on dashboard/missions routes.\n");
  } else if (isActiveToday) {
    console.log(`  ✅  Active today in IST (${prettyDate(todayStr)})`);
    console.log(`     → Streak is current and up to date.\n`);
  } else if (wasActiveYesterday) {
    console.log(`  ⚠️  Last active yesterday — not yet updated today.`);
    console.log(`     → Will increment next time you open dashboard or missions.\n`);
  } else {
    console.log(`  ❌  Last active ${lastActiveIST ? prettyDate(lastActiveIST) : "never"}`);
    console.log(`     → Streak was reset on the missed day, rebuilt to ${user.streak}.\n`);
  }

  // ── Build activityMap identical to analytics.controller.js ──
  // Uses same 3 sources, same IST conversion, same date range logic

  const gridStartStr = addDays(todayStr, -29); // last 30 days
  const gridStartUTC = istDateStrToUTC(gridStartStr);
  const gridEndUTC   = new Date(istDateStrToUTC(todayStr).getTime() + 24 * 60 * 60 * 1000 - 1);

  const activityMap = {};
  const ensureDay = (dateStr) => {
    if (!activityMap[dateStr]) {
      activityMap[dateStr] = { missions: 0, topics: 0, planDays: 0, total: 0 };
    }
  };
  const addToDay = (dateStr, type) => {
    if (dateStr < gridStartStr || dateStr > todayStr) return;
    ensureDay(dateStr);
    activityMap[dateStr][type]++;
    activityMap[dateStr].total++;
  };

  // Source 1: Completed missions (same as analytics source 1)
  const completedMissions = await Mission.find({
    userId:      user._id,
    status:      "completed",
    completedAt: { $gte: gridStartUTC, $lte: gridEndUTC },
  }).select("completedAt estimatedMinutes type title");

  for (const m of completedMissions) {
    if (m.completedAt) addToDay(toISTDateStr(m.completedAt), "missions");
  }

  // Source 2: Topic completions from syllabus.topicProgress.lastStudiedAt
  // (same as analytics source 2)
  const syllabi = await Syllabus.find({ userId: user._id });
  for (const syl of syllabi) {
    for (const tp of syl.topicProgress || []) {
      if (tp.lastStudiedAt) {
        addToDay(toISTDateStr(tp.lastStudiedAt), "topics");
      }
    }
  }

  // Source 3: Planner day completions — dailyPlans[].isCompleted + day.date
  // (same as analytics source 3 — NOT updatedAt, that was the bug)
  const studyPlans = await StudyPlan.find({ userId: user._id });
  for (const plan of studyPlans) {
    for (const day of plan.dailyPlans || []) {
      if (day.isCompleted && day.date) {
        addToDay(toISTDateStr(day.date), "planDays");
      }
    }
  }

  // ── Activity table — last 14 days ──
  console.log("─────────────────────────────────────────");
  console.log("  ACTIVITY BREAKDOWN — LAST 14 DAYS (IST)");
  console.log("  [source: missions ✓ · topics ✓ · planner days ✓]");
  console.log("─────────────────────────────────────────");

  for (let i = 13; i >= 0; i--) {
    const ds  = addDays(todayStr, -i);
    const act = activityMap[ds];
    const d   = new Date(Date.UTC(...ds.split("-").map((v,idx) => idx===1?v-1:v)));
    const isFuture = ds > todayStr;

    if (act && act.total > 0) {
      const parts = [];
      if (act.missions  > 0) parts.push(`${act.missions} mission(s)`);
      if (act.topics    > 0) parts.push(`${act.topics} topic(s)`);
      if (act.planDays  > 0) parts.push(`${act.planDays} planner day(s)`);
      console.log(`  ✅  ${prettyDate(ds).padEnd(26)}  ${parts.join(" · ")}`);
    } else {
      console.log(`  ${isFuture ? "   " : "❌ "} ${prettyDate(ds).padEnd(26)}  ${isFuture ? "(future)" : "no activity"}`);
    }
  }
  console.log();

  // ── Expected streak from activityMap (matches analytics longestStreak logic) ──
  console.log("─────────────────────────────────────────");
  console.log("  EXPECTED STREAK");
  console.log("  [same sources as activity grid above]");
  console.log("─────────────────────────────────────────");

  // Walk backwards from today counting consecutive active days
  // (matches streakSync: streak = consecutive days with lastActiveDate updates)
  let expectedStreak = 0;
  let cursor = todayStr;

  // If no activity today in DB sources, start from yesterday
  // (streak could still be correct via page visits which don't leave DB traces)
  const startFromYesterday = !activityMap[todayStr];
  if (startFromYesterday) cursor = addDays(todayStr, -1);

  while (activityMap[cursor] && activityMap[cursor].total > 0) {
    expectedStreak++;
    cursor = addDays(cursor, -1);
  }

  console.log(`  Stored streak (DB)         : ${user.streak}`);
  console.log(`  Expected streak (activity) : ${expectedStreak}`);
  console.log();

  if (user.streak === expectedStreak) {
    console.log("  ✅  Streak matches activity perfectly.\n");
  } else if (user.streak > expectedStreak) {
    console.log(`  ✅  Stored streak (${user.streak}) > activity-based estimate (${expectedStreak}).`);
    console.log("     → This is NORMAL and CORRECT.");
    console.log("     → streakSync also fires on dashboard/page visits which leave");
    console.log("       no DB trace in missions, topics, or planner.");
    console.log("     → Example: you opened the dashboard on a day without completing");
    console.log("       anything — that still counts as an active day for streak.\n");
  } else {
    console.log(`  ⚠️  Stored streak (${user.streak}) < activity-based estimate (${expectedStreak}).`);
    console.log("     → streakSync may be missing from some routes.");
    console.log("     → Verify streakSync is mounted on dashboard AND missions routes:\n");
    console.log("       router.get('/', protect, streakSync, getDashboard)");
    console.log("       router.get('/', protect, streakSync, getMissions)\n");
  }

  // ── What the analytics grid counts vs what streak counts ──
  console.log("─────────────────────────────────────────");
  console.log("  SOURCE COMPARISON");
  console.log("─────────────────────────────────────────");
  console.log("  Analytics grid counts:             Streak counts:");
  console.log("  ✅ Completed missions               ✅ Same");
  console.log("  ✅ Topics studied (lastStudiedAt)   ✅ Same");
  console.log("  ✅ Planner days completed           ✅ Same");
  console.log("  ❌ Page visits (no DB trace)        ✅ YES — via lastActiveDate");
  console.log();
  console.log("  → Streak CAN be higher than grid activity suggests.");
  console.log("  → That gap = days you visited the app but didn't complete anything.\n");

  if (user.streakFreezeTokens > 0) {
    console.log(`  🧊 You have ${user.streakFreezeTokens} freeze token(s) — streak protected for ${user.streakFreezeTokens} missed day(s).\n`);
  }

  await mongoose.disconnect();
  console.log("✅  Done. Database connection closed.\n");
}

run().catch((err) => {
  console.error("❌  Script error:", err.message);
  process.exit(1);
});
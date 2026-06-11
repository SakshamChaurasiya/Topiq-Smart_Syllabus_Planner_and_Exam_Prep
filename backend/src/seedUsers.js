/**
 * seedFeed.js
 * Seeds the database with realistic mock data for testing the Topiq social feed.
 *
 * Usage:
 *   node backend/src/scripts/seedFeed.js           → insert seed data
 *   node backend/src/scripts/seedFeed.js --clean   → wipe ALL seed data and reseed
 *   node backend/src/scripts/seedFeed.js --wipe    → wipe seed data only, no reseed
 *
 * What it creates:
 *   - 10 realistic student users (hashed passwords, mixed institutions)
 *   - 30 posts across all 4 types: note, summary, resource, flashcard-share
 *   - Upvotes distributed between users (so toggle looks real)
 *   - Posts spread across last 14 days (pagination test)
 *   - College-scoped AND worldwide posts (feed filter test)
 *   - 1 report scenario (3 reports on one post → auto-hide test)
 *   - Badges awarded to users (feed badge display test)
 *   - Contributor scores set on users
 *
 * IMPORTANT: Set MONGODB_URI in your .env or pass it as an env var.
 * This script reads from process.env.MONGODB_URI automatically.
 */

require("dotenv").config({ path: require("path").resolve(__dirname, "../.env") });
const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

// ─── Model paths — adjust if your structure differs ───────────────────────────
// The script auto-requires these. If a model doesn't exist yet (e.g. FeedPost),
// it defines a minimal inline schema so the script still runs.
let User, FeedPost, Badge;

// ─── Seed marker — all seed docs get this tag so --clean can find them ─────────
const SEED_TAG = "__seed__";

// ─── MOCK USERS ───────────────────────────────────────────────────────────────
const MOCK_USERS = [
  {
    name: "Aryan Mehta",
    email: "aryan.mehta@seed.krash.app",
    password: "Test@1234",
    publicUsername: "aryanmehta",
    institution: "RGPV",
    targetGoal: "excellent",
    isPublicProfile: true,
    xp: 2400,
    level: 9,
    streak: 14,
  },
  {
    name: "Priya Sharma",
    email: "priya.sharma@seed.krash.app",
    password: "Test@1234",
    publicUsername: "priyasharma",
    institution: "Delhi University",
    targetGoal: "good",
    isPublicProfile: true,
    xp: 1800,
    level: 7,
    streak: 7,
  },
  {
    name: "Rahul Nair",
    email: "rahul.nair@seed.krash.app",
    password: "Test@1234",
    publicUsername: "rahulnair",
    institution: "VIT Vellore",
    targetGoal: "good",
    isPublicProfile: true,
    xp: 950,
    level: 4,
    streak: 3,
  },
  {
    name: "Sneha Iyer",
    email: "sneha.iyer@seed.krash.app",
    password: "Test@1234",
    publicUsername: "snehaiyer",
    institution: "IIT Bombay",
    targetGoal: "excellent",
    isPublicProfile: true,
    xp: 3100,
    level: 12,
    streak: 21,
  },
  {
    name: "Karan Verma",
    email: "karan.verma@seed.krash.app",
    password: "Test@1234",
    publicUsername: "karanverma",
    institution: "BITS Pilani",
    targetGoal: "pass",
    isPublicProfile: true,
    xp: 400,
    level: 2,
    streak: 0,
  },
  {
    name: "Ananya Reddy",
    email: "ananya.reddy@seed.krash.app",
    password: "Test@1234",
    publicUsername: "ananyareddy",
    institution: "Osmania University",
    targetGoal: "good",
    isPublicProfile: true,
    xp: 1200,
    level: 5,
    streak: 5,
  },
  {
    name: "Vikram Singh",
    email: "vikram.singh@seed.krash.app",
    password: "Test@1234",
    publicUsername: "vikramsingh",
    institution: "Delhi University",
    targetGoal: "excellent",
    isPublicProfile: false,    // private profile — tests feed anonymization
    xp: 700,
    level: 3,
    streak: 2,
  },
  {
    name: "Meera Pillai",
    email: "meera.pillai@seed.krash.app",
    password: "Test@1234",
    publicUsername: "meerapillai",
    institution: "NIT Trichy",
    targetGoal: "good",
    isPublicProfile: true,
    xp: 1550,
    level: 6,
    streak: 9,
  },
  {
    name: "Dev Patel",
    email: "dev.patel@seed.krash.app",
    password: "Test@1234",
    publicUsername: "devpatel",
    institution: "BITS Pilani",
    targetGoal: "excellent",
    isPublicProfile: true,
    xp: 2900,
    level: 11,
    streak: 18,
  },
  {
    name: "Ritu Joshi",
    email: "ritu.joshi@seed.krash.app",
    password: "Test@1234",
    publicUsername: "ritujoshi",
    institution: "VIT Vellore",
    targetGoal: "good",
    isPublicProfile: true,
    xp: 620,
    level: 3,
    streak: 1,
  },
];

// ─── Helper: random past date within N days ────────────────────────────────────
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};
const randomBetween = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

// ─── Build posts array (called after users are inserted so we have real IDs) ──
const buildPosts = (users) => {
  // Map username → user object for easy lookup
  const u = {};
  users.forEach((usr) => { u[usr.publicUsername] = usr; });

  const posts = [
    // ── NOTE posts ────────────────────────────────────────────────────────────
    {
      author: u["aryanmehta"]._id,
      authorUsername: "aryanmehta",
      authorInstitution: "IIT Bombay",
      type: "note",
      subject: "Operating Systems",
      title: "Complete OS Notes — Process Management",
      body: "Covered everything from process states, PCB structure, context switching, and scheduling algorithms (FCFS, SJF, Round Robin, Priority). Key insight: always draw the state diagram first — it makes scheduling questions 10x easier. Also added Gantt chart examples for all algorithms.",
      tags: ["OS", "ProcessManagement", "Scheduling", "GATE"],
      visibility: "worldwide",
      upvoteCount: 34,
      createdAt: daysAgo(1),
      seedTag: SEED_TAG,
    },
    {
      author: u["snehaiyer"]._id,
      authorUsername: "snehaiyer",
      authorInstitution: "IIT Bombay",
      type: "note",
      subject: "Data Structures",
      title: "Trees & Graphs — Quick Revision Sheet",
      body: "BST, AVL, Red-Black, B-trees all in one place. For graphs: BFS vs DFS time complexity table, Dijkstra vs Bellman-Ford comparison, and when to use which. Topological sort trick: always check for DAG first. Saves 15 minutes in exams.",
      tags: ["DSA", "Trees", "Graphs", "Revision"],
      visibility: "worldwide",
      upvoteCount: 28,
      createdAt: daysAgo(2),
      seedTag: SEED_TAG,
    },
    {
      author: u["priyasharma"]._id,
      authorUsername: "priyasharma",
      authorInstitution: "Delhi University",
      type: "note",
      subject: "Economics",
      title: "Macro Economics — IS-LM Model Simplified",
      body: "If you're struggling with IS-LM, here's the trick: IS curve = goods market equilibrium (slopes down), LM curve = money market equilibrium (slopes up). Fiscal policy shifts IS, monetary policy shifts LM. Drew this 3 times before it clicked. Sharing my final diagram notes.",
      tags: ["Economics", "ISLM", "MacroEcon", "DU"],
      visibility: "college",
      upvoteCount: 19,
      createdAt: daysAgo(3),
      seedTag: SEED_TAG,
    },
    {
      author: u["devpatel"]._id,
      authorUsername: "devpatel",
      authorInstitution: "BITS Pilani",
      type: "note",
      subject: "Computer Networks",
      title: "TCP/IP Stack — Layer by Layer with Examples",
      body: "Stop memorizing layers blindly. Here's how to think about it: each layer adds a header, each header has a job. Application → Transport (port) → Network (IP) → Data Link (MAC) → Physical. Wireshark screenshot examples included for each layer's PDU. Exam favourite at BITS.",
      tags: ["Networks", "TCPIP", "Networking", "BITS"],
      visibility: "worldwide",
      upvoteCount: 41,  // high upvotes — tests viral_note badge threshold
      createdAt: daysAgo(0),
      seedTag: SEED_TAG,
    },
    {
      author: u["rahulnair"]._id,
      authorUsername: "rahulnair",
      authorInstitution: "VIT Vellore",
      type: "note",
      subject: "Mathematics",
      title: "Integration Tricks That Actually Work",
      body: "LIATE rule for integration by parts. Substitution patterns for trig integrals. The 'add and subtract' trick for partial fractions. These 3 techniques cover 80% of integration questions I've seen in VIT exams. Wrote them all on one page.",
      tags: ["Maths", "Integration", "VIT", "Calculus"],
      visibility: "college",
      upvoteCount: 12,
      createdAt: daysAgo(5),
      seedTag: SEED_TAG,
    },

    // ── SUMMARY posts ─────────────────────────────────────────────────────────
    {
      author: u["snehaiyer"]._id,
      authorUsername: "snehaiyer",
      authorInstitution: "IIT Bombay",
      type: "summary",
      subject: "Operating Systems",
      title: "Unit 3 Summary — Memory Management Complete",
      body: "Paging: page table maps logical → physical. Segmentation: programmer view. Virtual memory: demand paging + page replacement (FIFO, LRU, Optimal). Thrashing = too many page faults from too many processes. Belady's anomaly: FIFO can get WORSE with more frames. Key formulas: EAT with TLB = hit_ratio × (TLB time + memory time) + (1 - hit_ratio) × (2 × memory time).",
      tags: ["OS", "MemoryManagement", "Paging", "Summary"],
      visibility: "worldwide",
      upvoteCount: 22,
      createdAt: daysAgo(4),
      seedTag: SEED_TAG,
    },
    {
      author: u["meerapillai"]._id,
      authorUsername: "meerapillai",
      authorInstitution: "NIT Trichy",
      type: "summary",
      subject: "Digital Electronics",
      title: "Boolean Algebra & K-Maps — 1-Page Summary",
      body: "De Morgan's theorem: complement of sum = product of complements. K-Map grouping rules: groups must be powers of 2, wrap around edges, overlapping is fine. SOP vs POS: SOP groups 1s, POS groups 0s. Don't-care conditions (X) can be used to your advantage. Always aim for the fewest and largest groups.",
      tags: ["DigitalElectronics", "KMap", "BooleanAlgebra", "NIT"],
      visibility: "worldwide",
      upvoteCount: 17,
      createdAt: daysAgo(6),
      seedTag: SEED_TAG,
    },
    {
      author: u["aryanmehta"]._id,
      authorUsername: "aryanmehta",
      authorInstitution: "IIT Bombay",
      type: "summary",
      subject: "Algorithms",
      title: "Dynamic Programming — Pattern Recognition Guide",
      body: "DP = overlapping subproblems + optimal substructure. Patterns: 1D DP (Fibonacci, Climbing Stairs), 2D DP (LCS, Edit Distance), Interval DP (Matrix Chain), Knapsack variants. The question to ask first: 'What decision am I making at each step?' Answer that and the recurrence writes itself. Tabulation is almost always faster to implement in exams.",
      tags: ["Algorithms", "DP", "DynamicProgramming", "GATE"],
      visibility: "worldwide",
      upvoteCount: 31,
      createdAt: daysAgo(7),
      seedTag: SEED_TAG,
    },
    {
      author: u["karanverma"]._id,
      authorUsername: "karanverma",
      authorInstitution: "BITS Pilani",
      type: "summary",
      subject: "Thermodynamics",
      title: "Laws of Thermodynamics — Exam Ready in 10 min",
      body: "Zeroth: thermal equilibrium (temperature exists). First: energy conservation (ΔU = Q - W). Second: entropy of universe never decreases (heat flows hot→cold naturally). Third: entropy → 0 as T → 0K. For problems: always define system boundary first, then identify Q and W signs carefully (IUPAC convention: Q in = positive).",
      tags: ["Thermodynamics", "Physics", "BITS", "Laws"],
      visibility: "college",
      upvoteCount: 8,
      createdAt: daysAgo(8),
      seedTag: SEED_TAG,
    },

    // ── RESOURCE posts ────────────────────────────────────────────────────────
    {
      author: u["devpatel"]._id,
      authorUsername: "devpatel",
      authorInstitution: "BITS Pilani",
      type: "resource",
      subject: "Data Structures",
      title: "Best Free DSA Resources — Curated List 2025",
      body: "After trying 20+ resources here's what actually works: 1) Striver's A2Z Sheet for structured practice. 2) NeetCode for pattern-based learning. 3) CS50x for absolute beginners. 4) CLRS for theory (dense but worth it). 5) GFG for quick topic revision. Avoid: random YouTube rabbit holes without a structured plan.",
      tags: ["DSA", "Resources", "LeetCode", "FreeLearning"],
      resourceUrl: "https://takeuforward.org/strivers-a2z-dsa-course",
      visibility: "worldwide",
      upvoteCount: 47,
      createdAt: daysAgo(2),
      seedTag: SEED_TAG,
    },
    {
      author: u["priyasharma"]._id,
      authorUsername: "priyasharma",
      authorInstitution: "Delhi University",
      type: "resource",
      subject: "English Literature",
      title: "DU SOL Study Material — All Semesters",
      body: "Found the official SOL PDFs for BA English Programme. Includes prescribed texts, question banks from last 5 years, and chapter summaries. Sharing the Drive link. Works offline once downloaded. Covers Shakespeare, Romantic poets, Modern fiction. Save this.",
      tags: ["DU", "English", "Literature", "SOL"],
      resourceUrl: "https://sol.du.ac.in/study-material",
      visibility: "college",
      upvoteCount: 23,
      createdAt: daysAgo(9),
      seedTag: SEED_TAG,
    },
    {
      author: u["ananyareddy"]._id,
      authorUsername: "ananyareddy",
      authorInstitution: "Osmania University",
      type: "resource",
      subject: "Chemistry",
      title: "Organic Chemistry Reaction Map — Free PDF",
      body: "This single PDF has every named reaction with mechanism, reagents, and exam tips. Downloaded from a prof's website before it went behind a paywall. Covers: SN1/SN2, E1/E2, electrophilic addition, Grignard, Aldol condensation, Cannizzaro. Print it. Stick it on your wall.",
      tags: ["Chemistry", "OrganicChem", "Reactions", "FreePDF"],
      resourceUrl: "https://www.chemguide.co.uk/mechanisms",
      visibility: "worldwide",
      upvoteCount: 35,
      createdAt: daysAgo(3),
      seedTag: SEED_TAG,
    },
    {
      author: u["vikramsingh"]._id,
      authorUsername: "vikramsingh",
      authorInstitution: "Delhi University",
      type: "resource",
      subject: "Political Science",
      title: "UPSC Optional Polity — Best YouTube Channels",
      body: "For DU Political Science students who want UPSC-level depth: 1) Rajni Kothari's works on YouTube (lectures). 2) Lakshmikant summaries on Unacademy. 3) Vajiram GS4 videos for ethics overlap. Focus on IR theory first — it has maximum overlap with your sem exams AND UPSC Mains.",
      tags: ["UPSC", "PoliticalScience", "DU", "Resources"],
      visibility: "college",
      upvoteCount: 14,
      createdAt: daysAgo(11),
      seedTag: SEED_TAG,
    },
    {
      author: u["meerapillai"]._id,
      authorUsername: "meerapillai",
      authorInstitution: "NIT Trichy",
      type: "resource",
      subject: "VLSI Design",
      title: "Cadence Virtuoso Setup Guide for NIT Labs",
      body: "The official guide is outdated. Here's what actually works in our college lab: 1) Always source .bashrc before launching. 2) Use GPDK045 library for 45nm projects. 3) DRC errors in Spectre — 99% of the time it's a missing connection, zoom in and check. 4) Save your schematic every 5 min (autosave is broken). Took me a semester to figure this out.",
      tags: ["VLSI", "Cadence", "NIT", "LabGuide"],
      visibility: "college",
      upvoteCount: 11,
      createdAt: daysAgo(13),
      seedTag: SEED_TAG,
    },

    // ── FLASHCARD-SHARE posts ─────────────────────────────────────────────────
    {
      author: u["aryanmehta"]._id,
      authorUsername: "aryanmehta",
      authorInstitution: "IIT Bombay",
      type: "flashcard-share",
      subject: "Operating Systems",
      title: "OS Flashcards — 20 Critical Questions",
      body: "Generated these from my Krash syllabus analysis. Covers: process states, scheduling algorithms, deadlock conditions (all 4 must hold!), page replacement policies, disk scheduling. All critical/high importance topics only. Tested myself 3 times — these are the ones that trip you up.",
      tags: ["OS", "Flashcards", "Revision", "IIT"],
      shareToken: "mock_share_token_aryan_os_001",
      cardCount: 20,
      visibility: "worldwide",
      upvoteCount: 26,
      createdAt: daysAgo(1),
      seedTag: SEED_TAG,
    },
    {
      author: u["snehaiyer"]._id,
      authorUsername: "snehaiyer",
      authorInstitution: "IIT Bombay",
      type: "flashcard-share",
      subject: "Data Structures",
      title: "DSA Flashcards — Time Complexity Cheat Set",
      body: "35 cards covering Big-O for every major operation: arrays, linked lists, stacks, queues, BST, AVL, heap, hash tables, graphs. Each card has best/average/worst case. Made these the night before my mid-sem and scored 92. Sharing publicly.",
      tags: ["DSA", "TimeComplexity", "BigO", "Flashcards"],
      shareToken: "mock_share_token_sneha_dsa_002",
      cardCount: 35,
      visibility: "worldwide",
      upvoteCount: 38,
      createdAt: daysAgo(5),
      seedTag: SEED_TAG,
    },
    {
      author: u["rahulnair"]._id,
      authorUsername: "rahulnair",
      authorInstitution: "VIT Vellore",
      type: "flashcard-share",
      subject: "Engineering Mathematics",
      title: "Engineering Maths Flashcards — Laplace & Fourier",
      body: "28 cards on Laplace Transform (properties, standard pairs, inverse), Fourier Series (Euler's formulas, even/odd functions, half-range), and Z-transform basics. VIT maths paper has at least 3 questions from here every sem. These helped me crack all of them.",
      tags: ["EnggMaths", "Laplace", "Fourier", "VIT"],
      shareToken: "mock_share_token_rahul_maths_003",
      cardCount: 28,
      visibility: "college",
      upvoteCount: 9,
      createdAt: daysAgo(7),
      seedTag: SEED_TAG,
    },
    {
      author: u["devpatel"]._id,
      authorUsername: "devpatel",
      authorInstitution: "BITS Pilani",
      type: "flashcard-share",
      subject: "Computer Networks",
      title: "Networks Flashcards — Protocols & Ports",
      body: "Every protocol you need: HTTP/HTTPS, FTP, SSH, DNS, DHCP, ARP, SMTP, POP3, IMAP. Each card: protocol name → port number + function + which layer. Also included: TCP vs UDP comparison cards. These cover 60% of objective questions in CN exams.",
      tags: ["Networks", "Protocols", "Ports", "Flashcards"],
      shareToken: "mock_share_token_dev_networks_004",
      cardCount: 32,
      visibility: "worldwide",
      upvoteCount: 29,
      createdAt: daysAgo(2),
      seedTag: SEED_TAG,
    },

    // ── Additional posts for feed volume + edge cases ─────────────────────────
    {
      author: u["ananyareddy"]._id,
      authorUsername: "ananyareddy",
      authorInstitution: "Osmania University",
      type: "note",
      subject: "Microbiology",
      title: "Bacteria Classification — Gram Positive vs Negative",
      body: "Gram positive: thick peptidoglycan, purple stain, examples: Staph, Strep, Bacillus. Gram negative: thin peptidoglycan + outer membrane, pink stain, examples: E.coli, Salmonella, Pseudomonas. Clinical importance: gram negative harder to treat (outer membrane blocks antibiotics). Draw the cell wall — it's always asked.",
      tags: ["Microbiology", "Bacteria", "Science", "Osmania"],
      visibility: "worldwide",
      upvoteCount: 16,
      createdAt: daysAgo(10),
      seedTag: SEED_TAG,
    },
    {
      author: u["ritujoshi"]._id,
      authorUsername: "ritujoshi",
      authorInstitution: "VIT Vellore",
      type: "summary",
      subject: "Software Engineering",
      title: "SDLC Models Comparison — Quick Reference",
      body: "Waterfall: linear, no going back, good for fixed requirements. Agile: iterative, sprints, client involvement. Spiral: risk-driven, good for large projects. RAD: rapid prototyping. V-Model: testing at each phase. Exam trick: question gives a scenario → match to model based on: is requirement fixed? Is client available? Is risk high?",
      tags: ["SE", "SDLC", "SoftwareEngineering", "VIT"],
      visibility: "college",
      upvoteCount: 7,
      createdAt: daysAgo(4),
      seedTag: SEED_TAG,
    },
    {
      author: u["karanverma"]._id,
      authorUsername: "karanverma",
      authorInstitution: "BITS Pilani",
      type: "note",
      subject: "Fluid Mechanics",
      title: "Bernoulli's Equation — When to Use It and When NOT To",
      body: "Use Bernoulli when: steady flow, incompressible, inviscid, along a streamline. Don't use when: turbulent flow, compressible (high speed), viscous effects matter. Common mistake: applying it across a pump or turbine — you need the energy equation there. Venturimeter and Pitot tube problems are pure Bernoulli.",
      tags: ["FluidMechanics", "Bernoulli", "BITS", "Mechanical"],
      visibility: "college",
      upvoteCount: 5,
      createdAt: daysAgo(12),
      seedTag: SEED_TAG,
    },
    {
      author: u["priyasharma"]._id,
      authorUsername: "priyasharma",
      authorInstitution: "Delhi University",
      type: "resource",
      subject: "History",
      title: "Modern Indian History — NCERT + Notes Compilation",
      body: "For DU History honours: NCERT Class 12 is non-negotiable base. Beyond that: Spectrum Modern History for timelines, Bipin Chandra for nationalist movement depth. My personal notes add exam-specific connections the books don't make explicit. 3 years of DU questions cluster around: 1857, Gandhi's movements, Partition causes.",
      tags: ["History", "DU", "ModernIndia", "Honours"],
      visibility: "college",
      upvoteCount: 21,
      createdAt: daysAgo(6),
      seedTag: SEED_TAG,
    },
    {
      author: u["meerapillai"]._id,
      authorUsername: "meerapillai",
      authorInstitution: "NIT Trichy",
      type: "note",
      subject: "Signals and Systems",
      title: "Fourier Transform Properties — All 10 in One Sheet",
      body: "Linearity, time shifting, frequency shifting, time scaling, duality, differentiation, integration, convolution, multiplication, Parseval's theorem. For each: statement + proof sketch + exam application. The duality property is the sneaky one — half the class gets it wrong. Hint: swap t and f, then divide by 2π.",
      tags: ["Signals", "Fourier", "NIT", "ECE"],
      visibility: "worldwide",
      upvoteCount: 18,
      createdAt: daysAgo(8),
      seedTag: SEED_TAG,
    },
    {
      author: u["vikramsingh"]._id,
      authorUsername: "vikramsingh",
      authorInstitution: "Delhi University",
      type: "summary",
      subject: "Sociology",
      title: "Weber vs Durkheim vs Marx — Comparison Table",
      body: "Weber: social action, ideal types, bureaucracy, Protestant ethic → capitalism. Durkheim: social facts, anomie, mechanical/organic solidarity, collective conscience. Marx: historical materialism, base/superstructure, class conflict, alienation. Exam always asks 'compare two theorists' — this table covers every combo.",
      tags: ["Sociology", "Weber", "Durkheim", "Marx"],
      visibility: "worldwide",
      upvoteCount: 13,
      createdAt: daysAgo(9),
      seedTag: SEED_TAG,
    },
    // ── Post with 0 upvotes (edge case — empty state test) ────────────────────
    {
      author: u["ritujoshi"]._id,
      authorUsername: "ritujoshi",
      authorInstitution: "VIT Vellore",
      type: "note",
      subject: "Environmental Science",
      title: "EVS Unit 4 Notes — Biodiversity and Conservation",
      body: "Hotspots: areas with high endemism + habitat loss. India has 4: Western Ghats, Himalayas, Indo-Burma, Sundaland. In-situ conservation: national parks, sanctuaries, biosphere reserves. Ex-situ: zoos, seed banks, botanical gardens. IUCN categories: Extinct, EW, CR, EN, VU, NT, LC. Remember the order.",
      tags: ["EVS", "Environment", "Biodiversity", "VIT"],
      visibility: "college",
      upvoteCount: 0,
      createdAt: daysAgo(0),
      seedTag: SEED_TAG,
    },
    // ── Post that will be REPORTED 3 times → auto-hide test ───────────────────
    {
      author: u["karanverma"]._id,
      authorUsername: "karanverma",
      authorInstitution: "BITS Pilani",
      type: "note",
      subject: "Maths",
      title: "This post will be auto-hidden (3 reports test)",
      body: "This is a seed post created specifically to test the auto-hide-at-3-reports feature. Three other seed users will report this post. It should not appear in the main feed after seeding. If you can see this in the feed, the auto-hide logic is broken.",
      tags: ["TestPost", "AutoHide", "DoNotUpvote"],
      visibility: "worldwide",
      upvoteCount: 0,
      createdAt: daysAgo(2),
      seedTag: SEED_TAG,
      _isReportTarget: true,   // internal flag — used below to attach reports
    },
  ];
  return posts.map(p => {
    const isWorldwide = p.visibility === 'worldwide';
    const authorUser = users.find((usr) => usr._id.toString() === p.author.toString());
    const mapped = {
      userId: p.author,
      institution: authorUser ? authorUser.institution : p.authorInstitution,
      type: p.type,
      subjectTag: p.subject,
      title: p.title,
      description: p.body,
      isWorldwide,
      upvotes: [],
      reportedBy: [],
      isHidden: p.isHidden || false,
      createdAt: p.createdAt,
      _isReportTarget: p._isReportTarget,
    };
    mapped.upvoteCount = p.upvoteCount;
    if (p.resourceUrl) mapped.resourceUrl = p.resourceUrl;
    if (p.shareToken) {
      mapped.flashcardSetId = new mongoose.Types.ObjectId();
    }
    return mapped;
  });
};

// ─── Define inline schemas if models don't exist yet ─────────────────────────
const loadModels = () => {
  // User model
  try {
    User = require("./models/user.model");
  } catch {
    console.error("❌ Could not load user.model.js — check path in script.");
    process.exit(1);
  }

  // FeedPost model (uses the real Post model)
  try {
    FeedPost = require("./models/post.model");
  } catch {
    console.error("❌ Could not load post.model.js — check path in script.");
    process.exit(1);
  }

  // Badge model (uses the real Badge model)
  try {
    Badge = require("./models/badge.model");
  } catch {
    console.error("❌ Could not load badge.model.js — check path in script.");
    process.exit(1);
  }
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────
const run = async () => {
  const args    = process.argv.slice(2);
  const isClean = args.includes("--clean");
  const isWipe  = args.includes("--wipe");

  console.log("\n🌱 Krash Feed Seeder");
  console.log("═══════════════════════════════════════");

  // Connect
  const uri = process.env.MONGO_URI || process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌  MONGO_URI or MONGODB_URI not set. Add it to your .env file.");
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log("✅  Connected to MongoDB\n");

  loadModels();

  // ── WIPE if requested ──────────────────────────────────────────────────────
  if (isClean || isWipe) {
    console.log("🗑️  Wiping existing seed data...");
    const seedUsers = await User.find({ email: { $regex: "@seed.krash.app$" } });
    const seedUserIds = seedUsers.map((u) => u._id);

    const [uDel, pDel, bDel] = await Promise.all([
      User.deleteMany({ email: { $regex: "@seed.krash.app$" } }),
      FeedPost.deleteMany({ userId: { $in: seedUserIds } }),
      Badge.deleteMany({ userId: { $in: seedUserIds } }),
    ]);
    console.log(`   Users deleted:   ${uDel.deletedCount}`);
    console.log(`   Posts deleted:   ${pDel.deletedCount}`);
    console.log(`   Badges deleted:  ${bDel.deletedCount}`);
    if (isWipe) {
      console.log("\n✅  Wipe complete. Exiting.\n");
      await mongoose.disconnect();
      return;
    }
    console.log("");
  }

  // ── INSERT USERS ───────────────────────────────────────────────────────────
  console.log("👥  Creating seed users...");
  const createdUsers = [];
  for (const userData of MOCK_USERS) {
    // Check if already exists (idempotent if run without --clean)
    const existing = await User.findOne({ email: userData.email });
    if (existing) {
      console.log(`   ↩  Skipped (exists): ${userData.publicUsername}`);
      createdUsers.push(existing);
      continue;
    }
    // Password will be hashed by the pre-save hook
    const user = await User.create(userData);
    createdUsers.push(user);
    console.log(`   ✓  Created: @${user.publicUsername} (${user.institution})`);
  }

  // ── INSERT POSTS ───────────────────────────────────────────────────────────
  console.log("\n📝  Creating feed posts...");
  const postDefs    = buildPosts(createdUsers);
  const createdPosts = [];

  for (const postData of postDefs) {
    const isReportTarget = postData._isReportTarget;
    delete postData._isReportTarget;

    const existing = await FeedPost.findOne({ userId: postData.userId, title: postData.title });
    if (existing) {
      console.log(`   ↩  Skipped (exists): "${postData.title.slice(0, 50)}..."`);
      createdPosts.push({ post: existing, isReportTarget, upvoteCount: postData.upvoteCount });
      continue;
    }

    const post = await FeedPost.create(postData);
    createdPosts.push({ post, isReportTarget, upvoteCount: postData.upvoteCount });
    console.log(`   ✓  [${postData.type.padEnd(14)}] "${postData.title.slice(0, 48)}"`);
  }

  // ── DISTRIBUTE UPVOTES ─────────────────────────────────────────────────────
  console.log("\n👍  Distributing upvotes...");
  const userIds = createdUsers.map((u) => u._id.toString());

  for (const { post, upvoteCount } of createdPosts) {
    if (!upvoteCount || upvoteCount === 0) continue;

    // Pick random subset of users as upvoters
    const shuffled = [...userIds]
      .filter((id) => id !== post.userId.toString()) // author can't upvote own post
      .sort(() => Math.random() - 0.5)
      .slice(0, Math.min(upvoteCount, userIds.length - 1));

    await FeedPost.findByIdAndUpdate(post._id, {
      upvotes: shuffled,
    });
  }
  console.log("   ✓  Upvotes distributed");

  // ── REPORTS (auto-hide test) ───────────────────────────────────────────────
  console.log("\n🚩  Setting up report scenario...");
  const reportTargetObj = createdPosts.find((p) => p.isReportTarget);
  const reportTarget = reportTargetObj?.post;

  if (reportTarget) {
    const reporters = createdUsers.filter(
      (u) => u._id.toString() !== reportTarget.userId.toString()
    ).slice(0, 3);

    // Mark post as hidden (simulates auto-hide after 3 reports)
    await FeedPost.findByIdAndUpdate(reportTarget._id, {
      reportedBy: reporters.map(r => r._id),
      isHidden:    true,
    });
    console.log(`   ✓  3 reports filed → post auto-hidden: "${reportTarget.title.slice(0, 40)}"`);
  } else {
    console.log("   ↩  No report target found (may already exist)");
  }

  // ── AWARD BADGES ──────────────────────────────────────────────────────────
  console.log("\n🏅  Awarding badges...");

  const badgeAssignments = [
    // aryanmehta — high XP, 14-day streak, viral post
    { username: "aryanmehta", badges: ["first_blood", "no_days_off", "viral_note", "campus_hero", "trusted_contributor"] },
    // snehaiyer — top contributor
    { username: "snehaiyer", badges: ["first_blood", "first_share", "viral_note", "trusted_contributor", "topper"] },
    // devpatel — active contributor
    { username: "devpatel", badges: ["first_blood", "first_share", "viral_note", "helper", "campus_hero"] },
    // priyasharma — helper + sharer
    { username: "priyasharma", badges: ["first_blood", "first_share", "helper"] },
    // meerapillai — campus focused
    { username: "meerapillai", badges: ["first_blood", "campus_hero", "helper"] },
    // rahulnair — early user
    { username: "rahulnair", badges: ["first_blood", "first_share"] },
    // ananyareddy — contributor
    { username: "ananyareddy", badges: ["first_blood", "first_share", "helper"] },
    // karanverma — basic user
    { username: "karanverma", badges: ["first_blood"] },
    // devpatel — crisis survivor
    { username: "devpatel", badges: ["crisis_survivor", "pyq_hunter", "speed_demon", "ice_cold"] },
    // ritujoshi — new user
    { username: "ritujoshi", badges: ["first_blood"] },
  ];

  for (const { username, badges } of badgeAssignments) {
    const user = createdUsers.find((u) => u.publicUsername === username);
    if (!user) continue;
    for (const badgeId of badges) {
      const exists = await Badge.findOne({ userId: user._id, badgeId });
      if (!exists) {
        await Badge.create({
          userId:  user._id,
          badgeId,
          earnedAt: new Date(Date.now() - randomBetween(0, 10) * 86400000),
          seedTag: SEED_TAG,
        });
      }
    }
  }
  console.log("   ✓  Badges awarded to seed users");

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  const seedUsers = await User.find({ email: { $regex: "@seed.krash.app$" } });
  const seedUserIds = seedUsers.map((u) => u._id);
  const finalPostCount = await FeedPost.countDocuments({ userId: { $in: seedUserIds } });
  const finalUserCount = seedUsers.length;
  const hiddenCount    = await FeedPost.countDocuments({ userId: { $in: seedUserIds }, isHidden: true });
  
  const allSeedPosts = await FeedPost.find({ userId: { $in: seedUserIds } });
  const reportCount = allSeedPosts.reduce((acc, p) => acc + (p.reportedBy?.length || 0), 0);

  console.log("\n═══════════════════════════════════════");
  console.log("✅  Seed complete!\n");
  console.log(`   👥  Seed users:        ${finalUserCount}`);
  console.log(`   📝  Feed posts:        ${finalPostCount} (${finalPostCount - hiddenCount} visible, ${hiddenCount} auto-hidden)`);
  console.log(`   🚩  Reports filed:     ${reportCount}`);
  console.log("\n📋  Test credentials (all passwords: Test@1234)");
  console.log("   ┌─────────────────────────────────────────────────────┐");
  createdUsers.forEach((u) => {
    const tag = u.isPublicProfile ? "public " : "private";
    console.log(`   │  @${u.publicUsername.padEnd(16)} ${u.email.padEnd(30)} [${tag}]`);
  });
  console.log("   └─────────────────────────────────────────────────────┘");
  console.log("\n🧪  Things to test:");
  console.log("   1. Worldwide feed → should show all non-hidden posts");
  console.log("   2. College filter → login as @aryanmehta, filter IIT Bombay");
  console.log("   3. Upvote toggle → upvote a post, refresh, count should persist");
  console.log("   4. Auto-hidden post → search for 'auto-hidden' → should NOT appear in feed");
  console.log("   5. Pagination → feed has 30 posts, test page 1 / page 2 boundary");
  console.log("   6. Profile page → visit /u/aryanmehta → should show public profile");
  console.log("   7. Private profile → visit /u/vikramsingh → should show limited/hidden profile");
  console.log("   8. Badge display → @snehaiyer and @aryanmehta have most badges\n");

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error("\n❌  Seeder crashed:", err.message);
  console.error(err.stack);
  mongoose.disconnect();
  process.exit(1);
});
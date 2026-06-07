/**
 * auth-flow-test.js
 * Tests the full authentication flow: register → login → getMe → updateProfile
 * Run: node tests/auth-flow-test.js
 */

const BASE = "http://localhost:5000/api";

// Unique email per run to avoid duplicates
const testEmail = `testuser_${Date.now()}@test.com`;
const testPassword = "Test1234!";
const testName = "Test User";

let authToken = null;

// Minimal fetch wrapper
async function api(method, path, body = null, token = null) {
    const opts = {
        method,
        headers: { "Content-Type": "application/json" },
    };
    if (token) opts.headers["Authorization"] = `Bearer ${token}`;
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${BASE}${path}`, opts);
    const data = await res.json();
    return { status: res.status, data };
}

// Test runner
let passed = 0;
let failed = 0;
const results = [];

function assert(testName, condition, detail = "") {
    if (condition) {
        passed++;
        results.push(`  ✅ PASS: ${testName}`);
    } else {
        failed++;
        results.push(`  ❌ FAIL: ${testName}${detail ? " — " + detail : ""}`);
    }
}

async function runTests() {
    console.log("═══════════════════════════════════════");
    console.log("  AUTH FLOW TESTS — Topiq");
    console.log("═══════════════════════════════════════\n");

    // ─── 1. HEALTH CHECK ──────────────────────
    console.log("🔹 1. Health Check");
    try {
        const r = await api("GET", "/../health");
        assert("Health returns 200", r.status === 200);
        assert("Health has success=true", r.data.success === true);
    } catch (e) {
        assert("Health endpoint reachable", false, e.message);
    }

    // ─── 2. REGISTER — Validation Errors ──────
    console.log("\n🔹 2. Register — Validation");
    try {
        // Missing all fields
        const r1 = await api("POST", "/auth/register", {});
        assert("Register empty body → 400", r1.status === 400);

        // Missing password
        const r2 = await api("POST", "/auth/register", { name: "X", email: "x@x.com" });
        assert("Register no password → 400", r2.status === 400);

        // Short password (should be caught by Mongoose minlength:6)
        const r3 = await api("POST", "/auth/register", { name: "X", email: "x@test.com", password: "12" });
        assert("Register short password → error", r3.status >= 400, `Got ${r3.status}: ${r3.data.message}`);
    } catch (e) {
        assert("Register validation reachable", false, e.message);
    }

    // ─── 3. REGISTER — Success ────────────────
    console.log("\n🔹 3. Register — Success");
    try {
        const r = await api("POST", "/auth/register", {
            name: testName,
            email: testEmail,
            password: testPassword,
            targetGoal: "excellent",
        });
        assert("Register returns 201", r.status === 201, `Got ${r.status}: ${r.data.message}`);
        assert("Register returns success=true", r.data.success === true, JSON.stringify(r.data));
        assert("Register returns token", !!r.data.data?.token, "No token in response");
        assert("Register returns user.name", r.data.data?.user?.name === testName);
        assert("Register returns user.email", r.data.data?.user?.email === testEmail.toLowerCase());
        assert("Register returns targetGoal", r.data.data?.user?.targetGoal === "excellent");
        if (r.data.data?.token) authToken = r.data.data.token;
    } catch (e) {
        assert("Register success flow", false, e.message);
    }

    // ─── 4. REGISTER — Duplicate Email ────────
    console.log("\n🔹 4. Register — Duplicate Email");
    try {
        const r = await api("POST", "/auth/register", {
            name: testName,
            email: testEmail,
            password: testPassword,
        });
        assert("Duplicate email → 400", r.status === 400);
        assert("Duplicate email has error message", r.data.message?.toLowerCase().includes("already"), r.data.message);
    } catch (e) {
        assert("Duplicate email test", false, e.message);
    }

    // ─── 5. LOGIN — Validation ────────────────
    console.log("\n🔹 5. Login — Validation");
    try {
        const r1 = await api("POST", "/auth/login", {});
        assert("Login empty body → 400", r1.status === 400);

        const r2 = await api("POST", "/auth/login", { email: "nonexist@x.com", password: "wrong" });
        assert("Login wrong email → 401", r2.status === 401);

        const r3 = await api("POST", "/auth/login", { email: testEmail, password: "WrongPass!" });
        assert("Login wrong password → 401", r3.status === 401);
    } catch (e) {
        assert("Login validation reachable", false, e.message);
    }

    // ─── 6. LOGIN — Success ───────────────────
    console.log("\n🔹 6. Login — Success");
    try {
        const r = await api("POST", "/auth/login", { email: testEmail, password: testPassword });
        assert("Login returns 200", r.status === 200, `Got ${r.status}: ${r.data.message}`);
        assert("Login returns success=true", r.data.success === true);
        assert("Login returns token", !!r.data.data?.token);
        assert("Login returns user.name", r.data.data?.user?.name === testName);
        if (r.data.data?.token) authToken = r.data.data.token;
    } catch (e) {
        assert("Login success flow", false, e.message);
    }

    // ─── 7. GET ME — Without Token ────────────
    console.log("\n🔹 7. Get Me — No Token");
    try {
        const r = await api("GET", "/auth/me");
        assert("No token → 401", r.status === 401);
    } catch (e) {
        assert("No token test", false, e.message);
    }

    // ─── 8. GET ME — Invalid Token ────────────
    console.log("\n🔹 8. Get Me — Invalid Token");
    try {
        const r = await api("GET", "/auth/me", null, "invalid.token.garbage");
        assert("Invalid token → 401", r.status === 401);
    } catch (e) {
        assert("Invalid token test", false, e.message);
    }

    // ─── 9. GET ME — Valid Token ──────────────
    console.log("\n🔹 9. Get Me — Valid Token");
    if (!authToken) {
        assert("Get Me (skipped — no token from login)", false, "Login failed earlier");
    } else {
        try {
            const r = await api("GET", "/auth/me", null, authToken);
            assert("GetMe returns 200", r.status === 200, `Got ${r.status}: ${r.data.message}`);
            assert("GetMe has user name", r.data.data?.name === testName);
            assert("GetMe has user email", r.data.data?.email === testEmail.toLowerCase());
            assert("GetMe has targetGoal", r.data.data?.targetGoal === "excellent");
            assert("GetMe has createdAt", !!r.data.data?.createdAt);
        } catch (e) {
            assert("GetMe success", false, e.message);
        }
    }

    // ─── 10. UPDATE PROFILE ───────────────────
    console.log("\n🔹 10. Update Profile");
    if (!authToken) {
        assert("Update Profile (skipped)", false, "No auth token");
    } else {
        try {
            // Without token
            const r1 = await api("PUT", "/auth/update-profile", { name: "New Name" });
            assert("Update without token → 401", r1.status === 401);

            // With token
            const r2 = await api("PUT", "/auth/update-profile", { name: "Updated User", targetGoal: "pass" }, authToken);
            assert("Update returns 200", r2.status === 200, `Got ${r2.status}: ${r2.data.message}`);
            assert("Update changed name", r2.data.data?.name === "Updated User");
            assert("Update changed goal", r2.data.data?.targetGoal === "pass");

            // Verify via getMe
            const r3 = await api("GET", "/auth/me", null, authToken);
            assert("GetMe reflects updated name", r3.data.data?.name === "Updated User");
            assert("GetMe reflects updated goal", r3.data.data?.targetGoal === "pass");
        } catch (e) {
            assert("Update Profile", false, e.message);
        }
    }

    // ─── 11. LOGIN WITH UPDATED CREDS ─────────
    console.log("\n🔹 11. Login After Profile Update");
    try {
        const r = await api("POST", "/auth/login", { email: testEmail, password: testPassword });
        assert("Login still works after profile update", r.status === 200);
    } catch (e) {
        assert("Login after update", false, e.message);
    }

    // ─── SUMMARY ──────────────────────────────
    console.log("\n═══════════════════════════════════════");
    console.log(`  RESULTS: ${passed} passed, ${failed} failed, ${passed + failed} total`);
    console.log("═══════════════════════════════════════\n");
    results.forEach(r => console.log(r));

    if (failed > 0) {
        console.log(`\n⚠️  ${failed} test(s) FAILED. See details above.`);
        process.exit(1);
    } else {
        console.log("\n🎉 All tests passed!");
        process.exit(0);
    }
}

runTests().catch(err => {
    console.error("Test runner crashed:", err);
    process.exit(1);
});

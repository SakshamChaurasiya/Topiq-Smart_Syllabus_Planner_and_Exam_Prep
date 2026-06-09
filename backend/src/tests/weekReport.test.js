/**
 * weekReport.test.js
 * Unit tests for getWeekReport controller.
 * Mocks Mission and Subject find queries to run in isolation.
 */

const test = require("node:test");
const assert = require("node:assert");
const Mission = require("../models/mission.model");
const Subject = require("../models/subject.model");
const { getWeekReport } = require("../controllers/weekReport.controller");

// Set up mock handlers
let mockMissionFind = null;
let mockSubjectFindById = null;

Mission.find = async (query) => {
    if (mockMissionFind) return mockMissionFind(query);
    return [];
};

Subject.findById = (id) => {
    return {
        select: async (fields) => {
            if (mockSubjectFindById) return mockSubjectFindById(id);
            return null;
        }
    };
};

const makeMockRes = () => {
    const res = {};
    res.status = (code) => {
        res.statusCode = code;
        return res;
    };
    res.json = (data) => {
        res.jsonData = data;
        return res;
    };
    return res;
};

const mockReq = {
    user: {
        _id: "user123",
        streak: 5
    }
};

test("Weekly Performance Report Tests", async (t) => {

    await t.test("Test 1: completionRate is 0 when no missions completed", async () => {
        mockMissionFind = (query) => {
            if (query.status === "completed") {
                return [];
            }
            return [
                { _id: "m1", subjectId: "sub1", dueDate: new Date() }
            ]; // 1 due mission
        };

        const res = makeMockRes();
        await getWeekReport(mockReq, res);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.jsonData.success, true);
        assert.strictEqual(res.jsonData.data.missionsCompleted, 0);
        assert.strictEqual(res.jsonData.data.missionsTotal, 1);
        assert.strictEqual(res.jsonData.data.completionRate, 0);
    });

    await t.test("Test 2: completionRate is 100 when all missions completed", async () => {
        mockMissionFind = (query) => {
            const m = { _id: "m1", subjectId: "sub1", completedAt: new Date(), dueDate: new Date(), estimatedMinutes: 30, xpReward: 10 };
            if (query.status === "completed") {
                return [m];
            }
            return [m];
        };

        const res = makeMockRes();
        await getWeekReport(mockReq, res);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.jsonData.data.missionsCompleted, 1);
        assert.strictEqual(res.jsonData.data.missionsTotal, 1);
        assert.strictEqual(res.jsonData.data.completionRate, 100);
    });

    await t.test("Test 3: hoursStudied rounds to 1 decimal correctly", async () => {
        // 90 minutes -> 1.5 hours
        mockMissionFind = (query) => {
            if (query.status === "completed") {
                return [
                    { estimatedMinutes: 60 },
                    { estimatedMinutes: 30 }
                ];
            }
            return [];
        };

        const res = makeMockRes();
        await getWeekReport(mockReq, res);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.jsonData.data.hoursStudied, 1.5);

        // 50 minutes -> 0.8 hours
        mockMissionFind = (query) => {
            if (query.status === "completed") {
                return [
                    { estimatedMinutes: 50 }
                ];
            }
            return [];
        };

        const res2 = makeMockRes();
        await getWeekReport(mockReq, res2);
        assert.strictEqual(res2.jsonData.data.hoursStudied, 0.8);
    });

    await t.test("Test 4: weekLabel format is correct (\"Mon DD – Mon DD\")", async () => {
        mockMissionFind = (query) => [];

        const res = makeMockRes();
        await getWeekReport(mockReq, res);

        const weekLabel = res.jsonData.data.weekLabel;
        assert.match(weekLabel, /^[A-Z][a-z]{2} \d{1,2} – [A-Z][a-z]{2} \d{1,2}$/);
    });

    await t.test("Test 5: xpEarnedThisWeek sums correctly from completed missions", async () => {
        mockMissionFind = (query) => {
            if (query.status === "completed") {
                return [
                    { xpReward: 15 },
                    { xpReward: 10 }
                ];
            }
            return [];
        };

        const res = makeMockRes();
        await getWeekReport(mockReq, res);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.jsonData.data.xpEarnedThisWeek, 25);
    });
});

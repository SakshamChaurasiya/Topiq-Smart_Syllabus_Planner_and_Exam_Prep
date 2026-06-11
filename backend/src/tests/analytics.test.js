/**
 * analytics.test.js
 * Unit tests for getStudyAnalytics controller.
 * Mocks Mission and Subject queries to run in isolation.
 */

const test = require("node:test");
const assert = require("node:assert");
const Mission = require("../models/mission.model");
const Subject = require("../models/subject.model");
const { getStudyAnalytics } = require("../controllers/analytics.controller");

// Mock handlers
let mockMissionFind = null;
let mockSubjectFind = null;

Mission.find = async (query) => {
    if (mockMissionFind) return mockMissionFind(query);
    return [];
};

Subject.find = async (query) => {
    if (mockSubjectFind) return mockSubjectFind(query);
    return [];
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
        _id: "user123"
    }
};

test("Study Analytics Backend Tests", async (t) => {

    await t.test("Test 1: returns empty arrays and default dailyAverage when no missions or subjects exist", async () => {
        mockMissionFind = (query) => [];
        mockSubjectFind = (query) => [];

        const res = makeMockRes();
        await getStudyAnalytics(mockReq, res);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.jsonData.success, true);
        assert.ok(Array.isArray(res.jsonData.data.activityGrid));
        assert.strictEqual(res.jsonData.data.activityGrid.length, 0);
        assert.ok(Array.isArray(res.jsonData.data.weeklyHistory));
        assert.strictEqual(res.jsonData.data.weeklyHistory.length, 8);
        assert.ok(Array.isArray(res.jsonData.data.subjectBreakdown));
        assert.strictEqual(res.jsonData.data.subjectBreakdown.length, 0);
        assert.strictEqual(res.jsonData.data.dailyAverage.avgMissionsPerDay, 0);
        assert.strictEqual(res.jsonData.data.dailyAverage.avgMinutesPerDay, 0);
        assert.strictEqual(res.jsonData.data.dailyAverage.bestDay.count, 0);
        assert.strictEqual(res.jsonData.data.dailyAverage.longestStreakInPeriod, 0);
    });

    await t.test("Test 2: aggregates activityGrid and 30-day dailyAverage correctly", async () => {
        const todayStr = new Date().toISOString().split("T")[0];

        mockMissionFind = (query) => {
            if (query.status === "completed") {
                return [
                    { completedAt: new Date(), estimatedMinutes: 45, xpReward: 10 },
                    { completedAt: new Date(), estimatedMinutes: 15, xpReward: 20 }
                ];
            }
            return [];
        };
        mockSubjectFind = (query) => [];

        const res = makeMockRes();
        await getStudyAnalytics(mockReq, res);

        assert.strictEqual(res.statusCode, 200);

        // Grid should contain 1 grouped date (today) with count = 2 and minutes = 60
        const grid = res.jsonData.data.activityGrid;
        assert.strictEqual(grid.length, 1);
        assert.strictEqual(grid[0].date, todayStr);
        assert.strictEqual(grid[0].count, 2);
        assert.strictEqual(grid[0].minutes, 60);

        // Averages for last 30 days: 2 missions / 30 = 0.1, 60 mins / 30 = 2
        assert.strictEqual(res.jsonData.data.dailyAverage.avgMissionsPerDay, 0.1);
        assert.strictEqual(res.jsonData.data.dailyAverage.avgMinutesPerDay, 2);
        assert.strictEqual(res.jsonData.data.dailyAverage.bestDay.count, 2);
        assert.strictEqual(res.jsonData.data.dailyAverage.bestDay.date, todayStr);
        assert.strictEqual(res.jsonData.data.dailyAverage.longestStreakInPeriod, 1);
    });

    await t.test("Test 3: returns subject breakdown with mode of confidence correctly", async () => {
        mockMissionFind = (query) => {
            if (query.subjectId === "sub1" && query.status === "completed") {
                return [
                    { estimatedMinutes: 30, confidence: "shaky" },
                    { estimatedMinutes: 45, confidence: "solid" },
                    { estimatedMinutes: 20, confidence: "solid" }
                ];
            }
            return [];
        };
        mockSubjectFind = (query) => [
            { _id: "sub1", name: "Mathematics" }
        ];

        const res = makeMockRes();
        await getStudyAnalytics(mockReq, res);

        assert.strictEqual(res.statusCode, 200);
        const breakdown = res.jsonData.data.subjectBreakdown;
        assert.strictEqual(breakdown.length, 1);
        assert.strictEqual(breakdown[0].subjectName, "Mathematics");
        assert.strictEqual(breakdown[0].totalCompleted, 3);
        assert.strictEqual(breakdown[0].totalMinutes, 95);
        // Mode of ["shaky", "solid", "solid"] should be "solid"
        assert.strictEqual(breakdown[0].avgConfidence, "solid");
    });
});

const test = require("node:test");
const assert = require("node:assert");
const User = require("../models/user.model");
const Mission = require("../models/mission.model");
const Subject = require("../models/subject.model");
const Badge = require("../models/badge.model");
const {
    getGlobalLeaderboard,
    getCollegeLeaderboard,
    getWeeklyLeaderboard,
    getPublicProfile,
    updatePublicProfile,
} = require("../controllers/leaderboard.controller");

// Set up mock handlers
let mockUserFind = null;
let mockUserFindOne = null;
let mockUserCountDocuments = null;
let mockUserFindById = null;
let mockMissionAggregate = null;
let mockMissionCountDocuments = null;
let mockBadgeFind = null;
let mockSubjectCountDocuments = null;

User.find = () => {
    return {
        select: (fields) => {
            return {
                sort: (sortObj) => {
                    return {
                        limit: async (limitNum) => {
                            if (mockUserFind) return mockUserFind();
                            return [];
                        }
                    }
                }
            }
        }
    };
};

User.findOne = (query) => {
    const result = mockUserFindOne ? mockUserFindOne(query) : null;
    return {
        then: (resolve) => resolve(result),
        select: async (fields) => result,
    };
};

User.countDocuments = async (query) => {
    if (mockUserCountDocuments) return mockUserCountDocuments(query);
    return 0;
};

User.findById = (id) => {
    const result = mockUserFindById ? mockUserFindById(id) : null;
    return {
        then: (resolve) => resolve(result),
        select: async (fields) => result,
    };
};

Mission.aggregate = async (pipeline) => {
    if (mockMissionAggregate) return mockMissionAggregate(pipeline);
    return [];
};

Mission.countDocuments = async (query) => {
    if (mockMissionCountDocuments) return mockMissionCountDocuments(query);
    return 0;
};

Badge.find = async (query) => {
    if (mockBadgeFind) return mockBadgeFind(query);
    return [];
};

Subject.countDocuments = async (query) => {
    if (mockSubjectCountDocuments) return mockSubjectCountDocuments(query);
    return 0;
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

test("Leaderboard and Public Profile Tests", async (t) => {

    await t.test("getGlobalLeaderboard returns ranks correctly", async () => {
        mockUserFind = () => [
            { _id: "u1", name: "Alice", level: 5, xp: 100, streak: 3, isPublicProfile: true },
            { _id: "u2", name: "Bob", level: 3, xp: 50, streak: 1, isPublicProfile: false },
        ];
        mockUserCountDocuments = () => 2;

        const req = { user: { _id: "u2" } };
        const res = makeMockRes();

        await getGlobalLeaderboard(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.jsonData.success, true);
        assert.strictEqual(res.jsonData.data.leaderboard.length, 2);
        assert.strictEqual(res.jsonData.data.leaderboard[0].name, "Alice");
        assert.strictEqual(res.jsonData.data.leaderboard[0].rank, 1);
        assert.strictEqual(res.jsonData.data.myRank, 2);
        assert.strictEqual(res.jsonData.data.total, 2);
    });

    await t.test("getCollegeLeaderboard checks for missing institution parameter", async () => {
        const req = { query: {} };
        const res = makeMockRes();

        await getCollegeLeaderboard(req, res);

        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.jsonData.success, false);
        assert.strictEqual(res.jsonData.message, "institution query param required");
    });

    await t.test("getCollegeLeaderboard filters and retrieves ranks correctly", async () => {
        mockUserFind = () => [
            { _id: "u1", name: "Alice", level: 5, xp: 100, streak: 3, institution: "Stanford", isPublicProfile: true },
        ];
        mockUserCountDocuments = () => 1;

        const req = { query: { institution: "Stanford" }, user: { _id: "u3" } };
        const res = makeMockRes();

        await getCollegeLeaderboard(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.jsonData.data.leaderboard[0].name, "Alice");
        assert.strictEqual(res.jsonData.data.myRank, null);
    });

    await t.test("getPublicProfile fails gracefully on private profile", async () => {
        mockUserFindOne = () => ({
            _id: "u2",
            name: "Bob",
            isPublicProfile: false,
        });

        const req = { params: { username: "bob" } };
        const res = makeMockRes();

        await getPublicProfile(req, res);

        assert.strictEqual(res.statusCode, 404);
        assert.strictEqual(res.jsonData.success, false);
        assert.strictEqual(res.jsonData.message, "Profile not found or is private.");
    });

    await t.test("getPublicProfile returns correct badges and stats", async () => {
        mockUserFindOne = () => ({
            _id: "u1",
            name: "Alice",
            publicUsername: "alice",
            level: 5,
            xp: 100,
            streak: 3,
            isPublicProfile: true,
            createdAt: new Date(),
        });
        mockBadgeFind = () => [
            { badgeId: "first_mission", earnedAt: new Date() },
        ];
        mockMissionCountDocuments = () => 10;
        mockSubjectCountDocuments = () => 3;

        const req = { params: { username: "alice" } };
        const res = makeMockRes();

        await getPublicProfile(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.jsonData.success, true);
        assert.strictEqual(res.jsonData.data.name, "Alice");
        assert.strictEqual(res.jsonData.data.badges.length, 1);
        assert.strictEqual(res.jsonData.data.badges[0].badgeId, "first_mission");
        assert.strictEqual(res.jsonData.data.stats.totalMissionsCompleted, 10);
        assert.strictEqual(res.jsonData.data.stats.subjectsCount, 3);
    });

    await t.test("updatePublicProfile validates username format and saves settings", async () => {
        let saved = false;
        const mockUser = {
            _id: "u1",
            isPublicProfile: false,
            publicUsername: null,
            save: async () => { saved = true; }
        };

        const req = {
            user: mockUser,
            body: {
                isPublicProfile: true,
                publicUsername: "alice-123",
            }
        };
        const res = makeMockRes();

        mockUserFindOne = () => null; // username not taken

        await updatePublicProfile(req, res);

        assert.strictEqual(res.statusCode, 200);
        assert.strictEqual(res.jsonData.success, true);
        assert.strictEqual(saved, true);
        assert.strictEqual(mockUser.publicUsername, "alice-123");
        assert.strictEqual(mockUser.isPublicProfile, true);
    });

    await t.test("updatePublicProfile rejects invalid username characters", async () => {
        const req = {
            user: { _id: "u1" },
            body: {
                publicUsername: "alice!!!",
            }
        };
        const res = makeMockRes();

        await updatePublicProfile(req, res);

        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.jsonData.success, false);
        assert.strictEqual(res.jsonData.message, "Username must be 3-20 chars, letters/numbers/underscore/hyphen only.");
    });

    await t.test("updatePublicProfile rejects changing username once it is set", async () => {
        const req = {
            user: {
                _id: "u1",
                publicUsername: "alice-123",
            },
            body: {
                publicUsername: "bob-456",
            }
        };
        const res = makeMockRes();

        await updatePublicProfile(req, res);

        assert.strictEqual(res.statusCode, 400);
        assert.strictEqual(res.jsonData.success, false);
        assert.strictEqual(res.jsonData.message, "Username cannot be changed once set.");
    });
});

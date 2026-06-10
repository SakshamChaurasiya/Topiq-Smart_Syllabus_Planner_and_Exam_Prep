/**
 * weekReport.controller.js
 * Computes weekly performance analytics for the current week.
 */

const Mission = require("../models/mission.model");
const Subject = require("../models/subject.model");
const { sendSuccess, sendError } = require("../utils/responseHelper");

// IST offset — matches analytics.controller.js
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

// Get YYYY-MM-DD string in IST for any UTC date
const toISTDateStr = (utcDate) => {
    const ist = new Date(utcDate.getTime() + IST_OFFSET_MS);
    const y = ist.getUTCFullYear();
    const m = String(ist.getUTCMonth() + 1).padStart(2, '0');
    const d = String(ist.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

// IST midnight (00:00 IST) as UTC Date — for use in MongoDB $gte/$lte queries
const istMidnightUTC = (istDateStr) => {
    const [y, m, d] = istDateStr.split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d) - IST_OFFSET_MS);
};

// Returns UTC Date of Monday 00:00:00 IST of the week containing now
const getStartOfWeek = () => {
    const todayISTStr = toISTDateStr(new Date());
    const [y, m, d] = todayISTStr.split('-').map(Number);
    const jsDay = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun
    const diffToMon = jsDay === 0 ? -6 : 1 - jsDay;
    const monDate = new Date(Date.UTC(y, m - 1, d + diffToMon));
    const monY = monDate.getUTCFullYear();
    const monM = String(monDate.getUTCMonth() + 1).padStart(2, '0');
    const monD = String(monDate.getUTCDate()).padStart(2, '0');
    const monISTStr = `${monY}-${monM}-${monD}`;
    return istMidnightUTC(monISTStr); // UTC Date for Monday 00:00 IST
};

const formatWeekLabel = (startUTC) => {
    // Convert Monday UTC back to IST for display
    const monISTStr = toISTDateStr(startUTC);
    const [y, m, d] = monISTStr.split('-').map(Number);
    const sunDate = new Date(Date.UTC(y, m - 1, d + 6));
    const sunY = sunDate.getUTCFullYear();
    const sunM = sunDate.getUTCMonth() + 1;
    const sunD = sunDate.getUTCDate();
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${months[m - 1]} ${d} – ${months[sunM - 1]} ${sunD}`;
};

const getWeekReport = async (req, res) => {
    try {
        const startOfWeek = getStartOfWeek();
        const now = new Date();

        // 1. Query missions completed this week
        const completedMissions = await Mission.find({
            userId: req.user._id,
            status: "completed",
            completedAt: { $gte: startOfWeek, $lte: now }
        });

        // 2. Query all missions due this week
        const dueMissions = await Mission.find({
            userId: req.user._id,
            dueDate: { $gte: startOfWeek, $lte: now }
        });

        // 3. Compute stats
        const missionsCompleted = completedMissions.length;
        const missionsTotal = dueMissions.length;
        const completionRate = missionsTotal > 0 ? Math.round((missionsCompleted / missionsTotal) * 100) : 0;

        const totalMinutes = completedMissions.reduce((sum, m) => sum + (m.estimatedMinutes || 0), 0);
        const hoursStudied = Math.round((totalMinutes / 60) * 10) / 10;

        // Topics completed: count of unique topicNames from completed study missions this week
        const studyMissions = completedMissions.filter(m => m.type === "study" && m.topicName);
        const uniqueTopics = new Set(studyMissions.map(m => m.topicName.trim().toLowerCase()));
        const topicsCompleted = uniqueTopics.size;

        const currentStreak = req.user.streak || 0;
        const xpEarnedThisWeek = completedMissions.reduce((sum, m) => sum + (m.xpReward || 0), 0);
        const weekLabel = formatWeekLabel(startOfWeek);

        // strongestSubject: subjectId with most completed missions this week
        const completedCounts = {};
        completedMissions.forEach(m => {
            const subId = m.subjectId?.toString();
            if (subId) {
                completedCounts[subId] = (completedCounts[subId] || 0) + 1;
            }
        });

        let strongestSubjectId = null;
        let maxCompleted = 0;
        for (const subId in completedCounts) {
            if (completedCounts[subId] > maxCompleted) {
                maxCompleted = completedCounts[subId];
                strongestSubjectId = subId;
            }
        }

        // weakestSubject: subject with missions due but 0 completed
        const dueSubjectIds = new Set();
        dueMissions.forEach(m => {
            const subId = m.subjectId?.toString();
            if (subId) {
                dueSubjectIds.add(subId);
            }
        });

        let weakestSubjectId = null;
        for (const subId of dueSubjectIds) {
            const completedCount = completedCounts[subId] || 0;
            if (completedCount === 0) {
                weakestSubjectId = subId;
                break;
            }
        }

        // Populate names
        let strongestSubject = null;
        if (strongestSubjectId) {
            const sub = await Subject.findById(strongestSubjectId).select("name");
            if (sub) {
                strongestSubject = { _id: sub._id, name: sub.name };
            }
        }

        let weakestSubject = null;
        if (weakestSubjectId) {
            const sub = await Subject.findById(weakestSubjectId).select("name");
            if (sub) {
                weakestSubject = { _id: sub._id, name: sub.name };
            }
        }

        const report = {
            missionsCompleted,
            missionsTotal,
            completionRate,
            hoursStudied,
            topicsCompleted,
            strongestSubject,
            weakestSubject,
            currentStreak,
            xpEarnedThisWeek,
            weekLabel
        };

        return sendSuccess(res, 200, "Weekly performance report fetched.", report);
    } catch (error) {
        console.error("[WeekReport] Error computing report:", error.message);
        return sendError(res, 500, "Failed to calculate weekly performance report.");
    }
};

module.exports = { getWeekReport };

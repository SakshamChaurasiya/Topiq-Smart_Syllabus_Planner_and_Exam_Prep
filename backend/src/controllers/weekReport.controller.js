/**
 * weekReport.controller.js
 * Computes weekly performance analytics for the current week.
 */

const Mission = require("../models/mission.model");
const Subject = require("../models/subject.model");
const { sendSuccess, sendError } = require("../utils/responseHelper");

const getStartOfWeek = (date = new Date()) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d;
};

const formatWeekLabel = (start) => {
    const s = new Date(start);
    const e = new Date(start);
    e.setDate(start.getDate() + 6);
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[s.getMonth()]} ${s.getDate()} – ${months[e.getMonth()]} ${e.getDate()}`;
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

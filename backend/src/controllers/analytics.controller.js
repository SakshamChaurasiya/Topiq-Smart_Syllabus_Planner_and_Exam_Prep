/**
 * analytics.controller.js
 * Computes study analytics: activity grid, weekly history, subject breakdown, daily averages.
 * All date groupings use IST (UTC+5:30) so the grid matches the user's local calendar.
 */

const Mission = require("../models/mission.model");
const Subject = require("../models/subject.model");
const Syllabus = require("../models/syllabus.model");
const StudyPlan = require("../models/studyPlan.model");
const { sendSuccess, sendError } = require("../utils/responseHelper");

// IST offset in milliseconds (UTC+5:30)
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

/**
 * Convert any UTC Date to its YYYY-MM-DD string in IST.
 * e.g. 2026-06-09T00:00:00Z → "2026-06-09" in IST (actually 05:30 IST = still June 9)
 *      2026-06-08T20:00:00Z → "2026-06-09" in IST (02:30 IST next day)
 */
const toISTDateStr = (utcDate) => {
    const ist = new Date(utcDate.getTime() + IST_OFFSET_MS);
    const y = ist.getUTCFullYear();
    const m = String(ist.getUTCMonth() + 1).padStart(2, "0");
    const d = String(ist.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
};

/**
 * IST start-of-day (00:00:00 IST) as a UTC Date for a given YYYY-MM-DD IST string.
 */
const istDateStrToUTC = (istDateStr) => {
    const [y, m, d] = istDateStr.split("-").map(Number);
    // Midnight IST = UTC midnight minus 5h30m
    return new Date(Date.UTC(y, m - 1, d) - IST_OFFSET_MS);
};

/**
 * Get IST "today" as a YYYY-MM-DD string.
 */
const todayIST = () => toISTDateStr(new Date());

/**
 * Get UTC Monday of the week containing a given IST date string.
 * Works in IST calendar space then converts back.
 */
const getISTStartOfWeek = (istDateStr) => {
    const [y, m, d] = istDateStr.split("-").map(Number);
    const jsDay = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0=Sun
    const diffToMon = jsDay === 0 ? -6 : 1 - jsDay;
    const monDate = new Date(Date.UTC(y, m - 1, d + diffToMon));
    const monY = monDate.getUTCFullYear();
    const monM = String(monDate.getUTCMonth() + 1).padStart(2, "0");
    const monD = String(monDate.getUTCDate()).padStart(2, "0");
    return `${monY}-${monM}-${monD}`; // IST date string for Monday
};

/** Format "Jun 2 – Jun 8" label from IST date strings */
const formatWeekLabel = (monIST, sunIST) => {
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const [sy, sm, sd] = monIST.split("-").map(Number);
    const [ey, em, ed] = sunIST.split("-").map(Number);
    return `${months[sm - 1]} ${sd} – ${months[em - 1]} ${ed}`;
};

/** Add N days to an IST date string */
const addDays = (istDateStr, n) => {
    const [y, m, d] = istDateStr.split("-").map(Number);
    const result = new Date(Date.UTC(y, m - 1, d + n));
    const ry = result.getUTCFullYear();
    const rm = String(result.getUTCMonth() + 1).padStart(2, "0");
    const rd = String(result.getUTCDate()).padStart(2, "0");
    return `${ry}-${rm}-${rd}`;
};

const getConfidenceMode = (missions) => {
    const counts = { shaky: 0, okay: 0, solid: 0 };
    let hasConfidence = false;
    missions.forEach((m) => {
        if (m.confidence && counts[m.confidence] !== undefined) {
            counts[m.confidence]++;
            hasConfidence = true;
        }
    });
    if (!hasConfidence) return null;
    let mode = null;
    let maxCount = -1;
    ["solid", "okay", "shaky"].forEach((k) => {
        if (counts[k] > maxCount) { maxCount = counts[k]; mode = k; }
    });
    return mode;
};

const getStudyAnalytics = async (req, res) => {
    try {
        const userId = req.user._id;

        // -----------------------------------------------------------
        // A. ACTIVITY GRID — last 84 IST calendar days (today - 83d)
        // -----------------------------------------------------------
        const todayStr = todayIST();
        const gridEndStr = todayStr;
        const gridStartStr = addDays(todayStr, -83);

        // Convert IST day boundaries → UTC for MongoDB queries
        const gridStartUTC = istDateStrToUTC(gridStartStr);                          // 00:00 IST start day
        const gridEndUTC = new Date(istDateStrToUTC(gridEndStr).getTime()
            + 24 * 60 * 60 * 1000 - 1);                                             // 23:59:59.999 IST end day

        // Build activityMap: IST dateStr → { count, minutes }
        const activityMap = {};
        const ensureDay = (dateStr) => {
            if (!activityMap[dateStr]) activityMap[dateStr] = { date: dateStr, count: 0, minutes: 0 };
        };

        // 1. Completed missions
        const completedMissions = await Mission.find({
            userId,
            status: "completed",
            completedAt: { $gte: gridStartUTC, $lte: gridEndUTC },
        });
        completedMissions.forEach((m) => {
            if (m.completedAt) {
                const ds = toISTDateStr(m.completedAt);
                ensureDay(ds);
                activityMap[ds].count += 1;
                activityMap[ds].minutes += (m.estimatedMinutes || 0);
            }
        });

        // 2. Topic completions from syllabus.topicProgress.lastStudiedAt
        const syllabi = await Syllabus.find({ userId });
        syllabi.forEach((syl) => {
            (syl.topicProgress || []).forEach((tp) => {
                if (tp.lastStudiedAt) {
                    const ds = toISTDateStr(tp.lastStudiedAt);
                    if (ds >= gridStartStr && ds <= gridEndStr) {
                        ensureDay(ds);
                        activityMap[ds].count += 1;
                        // Estimate: 60 min per topic if no estimatedHours available
                        activityMap[ds].minutes += 60;
                    }
                }
            });
        });

        // 3. Planner day completions — credit the planned day.date (in IST)
        const studyPlans = await StudyPlan.find({ userId });
        studyPlans.forEach((plan) => {
            (plan.dailyPlans || []).forEach((day) => {
                if (day.isCompleted && day.date) {
                    const ds = toISTDateStr(day.date);
                    if (ds >= gridStartStr && ds <= gridEndStr) {
                        ensureDay(ds);
                        activityMap[ds].count += 1;
                        activityMap[ds].minutes += Math.round((day.plannedHours || 1) * 60);
                    }
                }
            });
        });

        const activityGrid = Object.values(activityMap);

        // -----------------------------------------------------------
        // B. WEEKLY HISTORY — last 8 ISO weeks (Mon–Sun in IST)
        // -----------------------------------------------------------
        const currentWeekMon = getISTStartOfWeek(todayStr);
        const weeklyHistory = [];

        for (let i = 0; i < 8; i++) {
            const weekMonIST = addDays(currentWeekMon, -i * 7);
            const weekSunIST = addDays(weekMonIST, 6);

            const weekStartUTC = istDateStrToUTC(weekMonIST);
            const weekEndUTC = new Date(istDateStrToUTC(weekSunIST).getTime() + 24 * 60 * 60 * 1000 - 1);

            const completed = await Mission.find({
                userId,
                status: "completed",
                completedAt: { $gte: weekStartUTC, $lte: weekEndUTC },
            });
            const due = await Mission.find({
                userId,
                dueDate: { $gte: weekStartUTC, $lte: weekEndUTC },
            });

            const missionsCompleted = completed.length;
            const missionsTotal = due.length;
            const completionRate = missionsTotal > 0
                ? Math.round((missionsCompleted / missionsTotal) * 100)
                : 0;
            const totalMinutes = completed.reduce((s, m) => s + (m.estimatedMinutes || 0), 0);
            const hoursStudied = Math.round((totalMinutes / 60) * 10) / 10;
            const xpEarned = completed.reduce((s, m) => s + (m.xpReward || 0), 0);
            const weekLabel = formatWeekLabel(weekMonIST, weekSunIST);

            weeklyHistory.push({
                weekStart: weekStartUTC,
                weekEnd: weekEndUTC,
                missionsCompleted,
                missionsTotal,
                completionRate,
                hoursStudied,
                xpEarned,
                weekLabel,
                isCurrentWeek: i === 0,
                isGenerated: missionsTotal > 0 || missionsCompleted > 0,
            });
        }

        // -----------------------------------------------------------
        // C. SUBJECT BREAKDOWN (all-time)
        // -----------------------------------------------------------
        const subjects = await Subject.find({ userId });
        const subjectBreakdown = [];
        for (const subject of subjects) {
            const completedMissionsSub = await Mission.find({
                userId,
                subjectId: subject._id,
                status: "completed",
            });
            subjectBreakdown.push({
                subjectName: subject.name,
                totalCompleted: completedMissionsSub.length,
                totalMinutes: completedMissionsSub.reduce((s, m) => s + (m.estimatedMinutes || 0), 0),
                avgConfidence: getConfidenceMode(completedMissionsSub),
            });
        }
        subjectBreakdown.sort((a, b) => b.totalCompleted - a.totalCompleted);

        // -----------------------------------------------------------
        // D. DAILY AVERAGE — last 30 IST calendar days
        // dailyCounts30 is built from activityMap (all 3 sources)
        // so streak and bestDay match exactly what the grid shows.
        // -----------------------------------------------------------
        const thirtyStartStr = addDays(todayStr, -29);

        // Build dailyCounts30 from activityMap (missions + topics + planner)
        const dailyCounts30 = {};
        for (const [dateStr, val] of Object.entries(activityMap)) {
            if (dateStr >= thirtyStartStr && dateStr <= todayStr) {
                dailyCounts30[dateStr] = val.count;
            }
        }

        // completed30 still needed for hours/minutes averages
        const thirtyStartUTC = istDateStrToUTC(thirtyStartStr);
        const thirtyEndUTC = new Date(
            istDateStrToUTC(todayStr).getTime() + 24 * 60 * 60 * 1000 - 1
        );
        const completed30 = await Mission.find({
            userId,
            status: "completed",
            completedAt: { $gte: thirtyStartUTC, $lte: thirtyEndUTC },
        });

        const avgMissionsPerDay =
            Math.round((completed30.length / 30) * 10) / 10;
        const totalMins30 = completed30.reduce(
            (s, m) => s + (m.estimatedMinutes || 0), 0
        );
        const avgMinutesPerDay = Math.round(totalMins30 / 30);

        // bestDay: day with highest combined activity count in last 30 days
        let bestDate = null;
        let maxCount = 0;
        for (const ds in dailyCounts30) {
            if (dailyCounts30[ds] > maxCount) {
                maxCount = dailyCounts30[ds];
                bestDate = ds;
            }
        }

        // longestStreak: longest consecutive days with any activity
        // Uses dailyCounts30 (all sources) so it matches the grid
        let longestStreak = 0;
        let runningStreak = 0;
        let ongoingCalculatedStreak = 0;
        for (let i = 0; i < 30; i++) {
            const ds = addDays(thirtyStartStr, i);
            if ((dailyCounts30[ds] || 0) > 0) {
                runningStreak++;
                if (i === 28 || i === 29) {
                    ongoingCalculatedStreak = Math.max(ongoingCalculatedStreak, runningStreak);
                }
                longestStreak = Math.max(longestStreak, runningStreak);
            } else {
                runningStreak = 0;
            }
        }

        // Align the calculated ongoing streak with user's actual database streak
        // (to resolve planned vs actual date drift from completed planner days)
        const userStreak = req.user.streak || 0;
        if (userStreak > 0 && ongoingCalculatedStreak > 0) {
            let historicalMax = 0;
            let temp = 0;
            for (let i = 0; i < 28; i++) {
                const ds = addDays(thirtyStartStr, i);
                if ((dailyCounts30[ds] || 0) > 0) {
                    temp++;
                    historicalMax = Math.max(historicalMax, temp);
                } else {
                    temp = 0;
                }
            }
            longestStreak = Math.max(historicalMax, userStreak);
        }

        const maxCompleted = maxCount;

        return sendSuccess(res, 200, "Study analytics fetched successfully.", {
            activityGrid,
            weeklyHistory,
            subjectBreakdown,
            dailyAverage: {
                avgMissionsPerDay,
                avgMinutesPerDay,
                bestDay: { date: bestDate, count: maxCompleted },
                longestStreakInPeriod: longestStreak,
            },
        });
    } catch (error) {
        console.error("[Analytics] getStudyAnalytics error:", error.message);
        return sendError(res, 500, "Failed to fetch study analytics.");
    }
};

module.exports = { getStudyAnalytics };

/**
 * dashboard.controller.js
 * Aggregates all data needed for the main dashboard in a single API call.
 */

const Subject = require("../models/subject.model");
const Mission = require("../models/mission.model");
const StudyPlan = require("../models/studyPlan.model");
const Notification = require("../models/notification.model");
const { sendSuccess, sendError } = require("../utils/responseHelper");
const { syncExamNotifications } = require("../utils/examNotifications");
const { syncRevisionMissions } = require("../utils/spacedRepetition");

// -------------------------------------------
// @route   GET /api/dashboard
// @desc    Get complete dashboard data
// @access  Protected
// -------------------------------------------
const getDashboard = async (req, res) => {
    try {
        const user = req.user;
        const userId = user._id;

        // Sync exam countdown notifications on dashboard view
        await syncExamNotifications(userId);
        // Sync spaced repetition revision missions
        await syncRevisionMissions(userId);

        const today = new Date();
        const todayStart = new Date(today.setHours(0, 0, 0, 0));
        const todayEnd = new Date(today.setHours(23, 59, 59, 999));

        // Run all queries in parallel for speed
        const [subjects, todayMissions, recentPlans, unreadNotifications] = await Promise.all([
            // All subjects with progress
            Subject.find({ userId }).sort({ examDate: 1, createdAt: -1 }),

            // Today's missions
            Mission.find({
                userId,
                dueDate: { $gte: todayStart, $lte: todayEnd },
            })
                .populate("subjectId", "name color")
                .sort({ priority: -1 })
                .limit(10),

            // Active study plans
            StudyPlan.find({ userId, isActive: true, mode: "normal" })
                .populate("subjectId", "name color examDate")
                .select("subjectId examDate daysRemaining completionPercentage mode targetGoal"),

            // Unread notifications count
            Notification.countDocuments({ userId, isRead: false }),
        ]);

        // Calculate upcoming exams (within next 30 days)
        const now = new Date();
        const upcomingExams = subjects
            .filter((s) => s.examDate && new Date(s.examDate) >= now)
            .map((s) => {
                const daysLeft = Math.ceil((new Date(s.examDate) - now) / (1000 * 60 * 60 * 24));
                return {
                    subjectId: s._id,
                    name: s.name,
                    examDate: s.examDate,
                    daysLeft,
                    color: s.color,
                    progress: s.progress,
                };
            })
            .sort((a, b) => a.daysLeft - b.daysLeft)
            .slice(0, 5); // Top 5 nearest exams

        // Today's mission stats
        const totalToday = todayMissions.length;
        const completedToday = todayMissions.filter((m) => m.status === "completed").length;
        const todayCompletionRate = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

        // Dynamic daysRemaining for active plans
        const todayDay = new Date();
        todayDay.setHours(0, 0, 0, 0);
        const processedActivePlans = recentPlans.map(plan => {
            const planObj = plan.toObject();
            const exam = new Date(planObj.examDate);
            exam.setHours(0, 0, 0, 0);
            planObj.daysRemaining = Math.max(0, Math.ceil((exam - todayDay) / (1000 * 60 * 60 * 24)));
            return planObj;
        });

        // Overall subject progress
        const totalSubjects = subjects.length;
        const subjectsWithSyllabus = subjects.filter((s) => s.hasSyllabus).length;
        const avgProgress = totalSubjects > 0
            ? Math.round(subjects.reduce((sum, s) => sum + (s.progress || 0), 0) / totalSubjects)
            : 0;

        // Weak subjects — those with less than 30% progress and an exam date
        const weakSubjects = subjects
            .filter((s) => s.progress < 30 && s.examDate && new Date(s.examDate) >= now)
            .map((s) => ({
                id: s._id,
                name: s.name,
                progress: s.progress,
                color: s.color,
                examDate: s.examDate,
            }));

        return sendSuccess(res, 200, "Dashboard data fetched.", {
            user: {
                name: user.name,
                targetGoal: user.targetGoal,
                xp: user.xp,
                level: user.level,
                streak: user.streak,
                targetXP: user.level * 250,
            },
            overview: {
                totalSubjects,
                subjectsWithSyllabus,
                avgProgress,
                unreadNotifications,
            },
            todayStats: {
                total: totalToday,
                completed: completedToday,
                pending: totalToday - completedToday,
                completionRate: todayCompletionRate,
            },
            todayMissions,
            upcomingExams,
            weakSubjects,
            activePlans: processedActivePlans,
            subjects: subjects.slice(0, 6), // Show first 6 subjects on dashboard
        });
    } catch (error) {
        console.error("[Dashboard] GetDashboard error:", error.message);
        return sendError(res, 500, "Failed to load dashboard.");
    }
};

module.exports = { getDashboard };

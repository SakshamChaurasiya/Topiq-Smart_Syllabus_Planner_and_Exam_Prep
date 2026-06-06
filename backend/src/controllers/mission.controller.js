/**
 * mission.controller.js
 * Handles mission retrieval and status updates.
 */

const Mission = require("../models/mission.model");
const Subject = require("../models/subject.model");
const Syllabus = require("../models/syllabus.model");
const { sendSuccess, sendError } = require("../utils/responseHelper");
const { syncRevisionMissions, calculateSpacedRepetition } = require("../utils/spacedRepetition");

// -------------------------------------------
// @route   GET /api/missions
// @desc    Get all missions (with optional filters)
// @access  Protected
// -------------------------------------------
const getMissions = async (req, res) => {
    try {
        await syncRevisionMissions(req.user._id);
        const { subjectId, status, date } = req.query;
        const filter = { userId: req.user._id };

        if (subjectId) filter.subjectId = subjectId;
        if (status) filter.status = status;

        // Filter by a specific date (full day range)
        if (date) {
            const start = new Date(date);
            start.setHours(0, 0, 0, 0);
            const end = new Date(date);
            end.setHours(23, 59, 59, 999);
            filter.dueDate = { $gte: start, $lte: end };
        }

        const missions = await Mission.find(filter)
            .populate("subjectId", "name color")
            .sort({ dueDate: 1, priority: -1 });

        return sendSuccess(res, 200, "Missions fetched.", missions);
    } catch (error) {
        console.error("[Mission] GetAll error:", error.message);
        return sendError(res, 500, "Failed to fetch missions.");
    }
};

// -------------------------------------------
// @route   GET /api/missions/today
// @desc    Get all missions due today
// @access  Protected
// -------------------------------------------
const getTodayMissions = async (req, res) => {
    try {
        await syncRevisionMissions(req.user._id);
        const today = new Date();
        const start = new Date(today.setHours(0, 0, 0, 0));
        const end = new Date(today.setHours(23, 59, 59, 999));

        const missions = await Mission.find({
            userId: req.user._id,
            dueDate: { $gte: start, $lte: end },
        })
            .populate("subjectId", "name color")
            .sort({ priority: -1, type: 1 });

        // Group missions by subject
        const grouped = {};
        for (const mission of missions) {
            const subjectName = mission.subjectId?.name || "Unknown";
            if (!grouped[subjectName]) {
                grouped[subjectName] = {
                    subject: mission.subjectId,
                    missions: [],
                };
            }
            grouped[subjectName].missions.push(mission);
        }

        // Stats
        const total = missions.length;
        const completed = missions.filter((m) => m.status === "completed").length;
        const pending = missions.filter((m) => m.status === "pending").length;

        return sendSuccess(res, 200, "Today's missions fetched.", {
            stats: { total, completed, pending, completionRate: total > 0 ? Math.round((completed / total) * 100) : 0 },
            grouped: Object.values(grouped),
            missions,
        });
    } catch (error) {
        console.error("[Mission] GetToday error:", error.message);
        return sendError(res, 500, "Failed to fetch today's missions.");
    }
};

// -------------------------------------------
// @route   PUT /api/missions/:id/status
// @desc    Update mission status (complete/skip/in-progress)
// @access  Protected
// -------------------------------------------
const updateMissionStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ["pending", "in-progress", "completed", "skipped"];

        if (!validStatuses.includes(status)) {
            return sendError(res, 400, `Invalid status. Must be one of: ${validStatuses.join(", ")}`);
        }

        const mission = await Mission.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!mission) return sendError(res, 404, "Mission not found.");

        mission.status = status;

        // Set completion timestamp
        let xpEarned = 0;
        const user = req.user;
        if (status === "completed") {
            mission.completedAt = new Date();
            xpEarned = mission.xpReward || 10;

            // 1. Award XP to User
            user.xp += xpEarned;

            // 2. Check Level Up
            const getTargetXP = (lvl) => lvl * 250;
            let leveledUp = false;
            while (user.xp >= getTargetXP(user.level)) {
                user.xp -= getTargetXP(user.level);
                user.level += 1;
                leveledUp = true;
            }

            // 3. Update last active date
            user.lastActiveDate = new Date();
            await user.save();

            // 4. Update Spaced Repetition Progress
            if ((mission.type === "study" || mission.type === "revision") && mission.topicName) {
                const syllabus = await Syllabus.findOne({ subjectId: mission.subjectId, userId: user._id });
                if (syllabus) {
                    const rating = req.body.rating || "got-it"; // 'got-it' | 'shaky' | 'no-idea'
                    
                    let progressEntry = syllabus.topicProgress.find(
                        tp => tp.topicName.toLowerCase().trim() === mission.topicName.toLowerCase().trim()
                    );
                    
                    const currentInterval = progressEntry ? progressEntry.intervalIndex : 0;
                    const calculated = calculateSpacedRepetition(currentInterval, rating);
                    
                    if (!progressEntry) {
                        syllabus.topicProgress.push({
                            topicName: mission.topicName,
                            lastStudiedAt: new Date(),
                            nextReviewDate: calculated.nextReviewDate,
                            intervalIndex: calculated.intervalIndex,
                            rating: rating
                        });
                    } else {
                        progressEntry.lastStudiedAt = new Date();
                        progressEntry.nextReviewDate = calculated.nextReviewDate;
                        progressEntry.intervalIndex = calculated.intervalIndex;
                        progressEntry.rating = rating;
                    }
                    await syllabus.save();
                }
            }

            // Update subject's completed topics count when a study mission is done
            if (mission.type === "study" && mission.topicName) {
                const subject = await Subject.findById(mission.subjectId);
                if (subject) {
                    subject.completedTopics = Math.min(
                        subject.completedTopics + 1,
                        subject.totalTopics
                    );
                    await subject.save();
                }
            }
        } else if (status !== "completed") {
            mission.completedAt = null;
        }

        await mission.save();

        return sendSuccess(res, 200, `Mission marked as ${status}.`, {
            missionId: mission._id,
            status: mission.status,
            completedAt: mission.completedAt,
            xpEarned: status === "completed" ? xpEarned : 0,
            user: {
                xp: user.xp,
                level: user.level,
                streak: user.streak,
                targetXP: user.level * 250,
            },
        });
    } catch (error) {
        console.error("[Mission] UpdateStatus error:", error.message);
        return sendError(res, 500, "Failed to update mission status.");
    }
};

// -------------------------------------------
// @route   GET /api/missions/stats
// @desc    Get mission stats for the user
// @access  Protected
// -------------------------------------------
const getMissionStats = async (req, res) => {
    try {
        const userId = req.user._id;

        const [total, completed, skipped, pending] = await Promise.all([
            Mission.countDocuments({ userId }),
            Mission.countDocuments({ userId, status: "completed" }),
            Mission.countDocuments({ userId, status: "skipped" }),
            Mission.countDocuments({ userId, status: "pending" }),
        ]);

        const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

        return sendSuccess(res, 200, "Mission stats fetched.", {
            total,
            completed,
            skipped,
            pending,
            completionRate,
        });
    } catch (error) {
        console.error("[Mission] GetStats error:", error.message);
        return sendError(res, 500, "Failed to fetch mission stats.");
    }
};

module.exports = { getMissions, getTodayMissions, updateMissionStatus, getMissionStats };

/**
 * planner.controller.js
 * Generates AI-powered study plans and cheat code survival plans.
 */

const StudyPlan = require("../models/studyPlan.model");
const Syllabus = require("../models/syllabus.model");
const Subject = require("../models/subject.model");
const Mission = require("../models/mission.model");
const Notification = require("../models/notification.model");
const aiService = require("../services/ai.service");
const { sendSuccess, sendError } = require("../utils/responseHelper");

// -------------------------------------------
// Helper: Auto-generate missions from a study plan
// -------------------------------------------
const generateMissionsFromPlan = async (plan, userId, subjectId) => {
    const missions = [];

    for (const day of plan.dailyPlans) {
        for (const topic of day.topics) {
            // Mission 1: Study the topic
            missions.push({
                userId,
                subjectId,
                studyPlanId: plan._id,
                title: `Study: ${topic.topicName}`,
                description: `Complete your study session for "${topic.topicName}" from ${topic.unitName}. Focus on understanding core concepts.`,
                type: "study",
                priority: topic.importance === "critical" ? "critical" : topic.importance === "high" ? "high" : "medium",
                status: "pending",
                dueDate: day.date,
                estimatedMinutes: Math.round((topic.estimatedHours || 1) * 60),
                topicName: topic.topicName,
                unitName: topic.unitName,
                xpReward: topic.importance === "critical" ? 25 : topic.importance === "high" ? 20 : 15,
            });

            // Mission 2: Quick revision (only for high-importance topics)
            if (topic.importance === "critical" || topic.importance === "high") {
                missions.push({
                    userId,
                    subjectId,
                    studyPlanId: plan._id,
                    title: `Revise: ${topic.topicName}`,
                    description: `Do a 15-minute quick revision of "${topic.topicName}". Write down 3 key points from memory.`,
                    type: "revision",
                    priority: "medium",
                    status: "pending",
                    dueDate: day.date,
                    estimatedMinutes: 15,
                    topicName: topic.topicName,
                    unitName: topic.unitName,
                    xpReward: 10,
                });
            }
        }

        // Add a daily summary mission
        if (day.topics.length > 0) {
            missions.push({
                userId,
                subjectId,
                studyPlanId: plan._id,
                title: `End-of-Day Summary`,
                description: `Write a quick summary of everything you studied today. This takes 10 minutes and doubles retention.`,
                type: "summary",
                priority: "medium",
                status: "pending",
                dueDate: day.date,
                estimatedMinutes: 10,
                topicName: "All Topics",
                unitName: "All Units",
                xpReward: 5,
                isBonus: false,
            });
        }
    }

    // Bulk insert all missions
    if (missions.length > 0) {
        await Mission.insertMany(missions);
    }

    return missions.length;
};

// -------------------------------------------
// @route   POST /api/planner/generate
// @desc    Generate a personalized study plan
// @access  Protected
// -------------------------------------------
const generatePlan = async (req, res) => {
    try {
        const { subjectId, examDate, availableHoursPerDay, targetGoal } = req.body;

        // Validation
        if (!subjectId || !examDate || !availableHoursPerDay || !targetGoal) {
            return sendError(res, 400, "Please provide subjectId, examDate, availableHoursPerDay, and targetGoal.");
        }

        // Check subject
        const subject = await Subject.findOne({ _id: subjectId, userId: req.user._id });
        if (!subject) return sendError(res, 404, "Subject not found.");

        // Check syllabus exists and is analyzed
        const syllabus = await Syllabus.findOne({ subjectId, userId: req.user._id });
        if (!syllabus) return sendError(res, 404, "No syllabus found. Please upload and analyze a syllabus first.");
        if (!syllabus.isAnalyzed) return sendError(res, 400, "Syllabus not yet analyzed. Please run AI analysis first.");

        // Calculate days remaining
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const exam = new Date(examDate);
        exam.setHours(0, 0, 0, 0);
        const daysRemaining = Math.max(1, Math.ceil((exam - today) / (1000 * 60 * 60 * 24)));

        // Call AI to generate plan
        const aiResult = await aiService.generateStudyPlan({
            subjectName: subject.name,
            syllabusUnits: syllabus.units,
            examDate: exam,
            availableHoursPerDay: Number(availableHoursPerDay),
            targetGoal,
            daysRemaining,
            institution: req.user.institution || "",
        });

        // Build daily plans with actual dates
        const dailyPlans = (aiResult.dailyPlans || []).map((day, idx) => {
            const planDate = new Date(today);
            planDate.setDate(today.getDate() + idx);
            return {
                date: planDate,
                dayLabel: day.dayLabel || `Day ${idx + 1}`,
                topics: day.topics || [],
                plannedHours: day.plannedHours || Number(availableHoursPerDay),
                isCompleted: false,
                studyTip: day.studyTip || "",
            };
        });

        // Deactivate any existing plan for this subject
        await StudyPlan.updateMany({ subjectId, userId: req.user._id }, { isActive: false });

        // Save new plan
        const plan = await StudyPlan.create({
            userId: req.user._id,
            subjectId,
            syllabusId: syllabus._id,
            examDate: exam,
            availableHoursPerDay: Number(availableHoursPerDay),
            targetGoal,
            mode: "normal",
            daysRemaining,
            dailyPlans,
            priorityTopics: aiResult.priorityTopics || [],
            mustStudyTopics: aiResult.mustStudyTopics || [],
            survivalStrategy: aiResult.survivalStrategy || "",
            planSummary: aiResult.planSummary || "",
            isActive: true,
        });

        // Update exam date on subject
        await Subject.findByIdAndUpdate(subjectId, { examDate: exam });

        // Delete old missions and generate new ones
        await Mission.deleteMany({ subjectId, userId: req.user._id });
        const missionCount = await generateMissionsFromPlan(plan, req.user._id, subjectId);

        // Create a notification
        await Notification.create({
            userId: req.user._id,
            title: "Study Plan Generated! 🎯",
            message: `Your ${daysRemaining}-day study plan for ${subject.name} is ready. ${missionCount} missions created.`,
            type: "plan-generated",
            subjectId,
        });

        return sendSuccess(res, 201, "Study plan generated successfully!", {
            plan,
            missionsCreated: missionCount,
            daysRemaining,
        });
    } catch (error) {
        console.error("[Planner] Generate error:", error.message);
        return sendError(res, 500, "Failed to generate study plan. Please try again.");
    }
};

// -------------------------------------------
// @route   POST /api/planner/cheatcode
// @desc    Generate survival cheat code plan
// @access  Protected
// -------------------------------------------
const generateCheatCode = async (req, res) => {
    try {
        const { subjectId, daysRemaining, targetGoal, availableHoursPerDay } = req.body;

        if (!subjectId || !daysRemaining) {
            return sendError(res, 400, "Please provide subjectId and daysRemaining.");
        }

        const subject = await Subject.findOne({ _id: subjectId, userId: req.user._id });
        if (!subject) return sendError(res, 404, "Subject not found.");

        const syllabus = await Syllabus.findOne({ subjectId, userId: req.user._id });
        if (!syllabus) return sendError(res, 404, "No syllabus found. Please upload a syllabus first.");
        if (!syllabus.isAnalyzed) return sendError(res, 400, "Syllabus not analyzed yet. Please run AI analysis first.");

        // Determine mode
        const days = Number(daysRemaining);
        let mode = "custom";
        if (days === 1) mode = "1day";
        else if (days <= 3) mode = "3day";
        else if (days <= 7) mode = "7day";
        else if (days <= 15) mode = "15day";

        const aiResult = await aiService.generateCheatCode({
            subjectName: subject.name,
            syllabusUnits: syllabus.units,
            daysRemaining: days,
            targetGoal: targetGoal || "pass",
            availableHoursPerDay: Number(availableHoursPerDay) || 6,
            institution: req.user.institution || "",
        });

        // Save as a study plan with cheat code mode
        const today = new Date();
        const examDate = new Date(today);
        examDate.setDate(today.getDate() + days);

        // Deactivate previous plan
        await StudyPlan.updateMany({ subjectId, userId: req.user._id }, { isActive: false });

        const plan = await StudyPlan.create({
            userId: req.user._id,
            subjectId,
            syllabusId: syllabus._id,
            examDate,
            availableHoursPerDay: Number(availableHoursPerDay) || 6,
            targetGoal: targetGoal || "pass",
            mode,
            daysRemaining: days,
            dailyPlans: [],
            mustStudyTopics: (aiResult.mustStudyNow || []).map((t) => t.topic),
            survivalStrategy: aiResult.survivalStrategy || "",
            planSummary: aiResult.message || "",
            isActive: true,
        });

        // Notification
        await Notification.create({
            userId: req.user._id,
            title: `⚡ Cheat Code Activated — ${mode.toUpperCase()}`,
            message: `${days} day(s) left for ${subject.name}. Your survival plan is ready. Focus only on must-study topics.`,
            type: "plan-generated",
            subjectId,
        });

        return sendSuccess(res, 201, `Cheat Code (${mode}) activated!`, {
            mode,
            daysRemaining: days,
            cheatCode: aiResult,
            planId: plan._id,
        });
    } catch (error) {
        console.error("[Planner] CheatCode error:", error.message);
        return sendError(res, 500, "Failed to generate cheat code.");
    }
};

// -------------------------------------------
// @route   GET /api/planner/:subjectId
// @desc    Get active study plan for a subject
// @access  Protected
// -------------------------------------------
const getPlan = async (req, res) => {
    try {
        const plan = await StudyPlan.findOne({
            subjectId: req.params.subjectId,
            userId: req.user._id,
            isActive: true,
        });

        if (!plan) return sendError(res, 404, "No active study plan found for this subject.");

        return sendSuccess(res, 200, "Study plan fetched.", plan);
    } catch (error) {
        console.error("[Planner] GetPlan error:", error.message);
        return sendError(res, 500, "Failed to fetch study plan.");
    }
};

// -------------------------------------------
// @route   PUT /api/planner/day/:planId/:dayIndex/complete
// @desc    Mark a full day as completed
// @access  Protected
// -------------------------------------------
const markDayComplete = async (req, res) => {
    try {
        const { planId, dayIndex } = req.params;
        const plan = await StudyPlan.findOne({ _id: planId, userId: req.user._id });
        if (!plan) return sendError(res, 404, "Plan not found.");

        const idx = Number(dayIndex);
        if (idx < 0 || idx >= plan.dailyPlans.length) {
            return sendError(res, 400, "Invalid day index.");
        }

        plan.dailyPlans[idx].isCompleted = true;

        // Recalculate completion percentage
        const completedDays = plan.dailyPlans.filter((d) => d.isCompleted).length;
        plan.completionPercentage = Math.round((completedDays / plan.dailyPlans.length) * 100);

        await plan.save();

        return sendSuccess(res, 200, "Day marked as complete!", {
            completionPercentage: plan.completionPercentage,
        });
    } catch (error) {
        console.error("[Planner] MarkDayComplete error:", error.message);
        return sendError(res, 500, "Failed to mark day complete.");
    }
};

module.exports = { generatePlan, generateCheatCode, getPlan, markDayComplete };

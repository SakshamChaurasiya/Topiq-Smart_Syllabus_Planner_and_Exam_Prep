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
        await StudyPlan.updateMany({ subjectId, userId: req.user._id, mode: "normal" }, { isActive: false });

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
        await StudyPlan.updateMany({ subjectId, userId: req.user._id, mode: { $ne: "normal" } }, { isActive: false });

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
            cheatCodeData: aiResult,
        });

        // Notification
        await Notification.create({
            userId: req.user._id,
            title: `⚡ Cheat Code Activated — ${mode.toUpperCase()}`,
            message: `${days} day(s) left for ${subject.name}. Your survival plan is ready. Focus only on must-study topics.`,
            type: "plan-generated",
            subjectId,
        });

        // Award badge
        try {
            const { awardBadge } = require("../utils/badges");
            await awardBadge(req.user._id, "crisis_survivor");
        } catch (badgeErr) {
            console.error("[Planner] Error awarding crisis_survivor badge:", badgeErr);
        }

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
        const { mode } = req.query;
        const query = {
            subjectId: req.params.subjectId,
            userId: req.user._id,
            isActive: true,
        };
        if (mode === "normal") {
            query.mode = "normal";
        } else if (mode === "cheat") {
            query.mode = { $ne: "normal" };
        }

        const plan = await StudyPlan.findOne(query);

        if (!plan) return sendError(res, 404, "No active study plan found for this subject.");

        const planObj = plan.toObject();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const exam = new Date(planObj.examDate);
        exam.setHours(0, 0, 0, 0);
        planObj.daysRemaining = Math.max(0, Math.ceil((exam - today) / (1000 * 60 * 60 * 24)));

        return sendSuccess(res, 200, "Study plan fetched.", planObj);
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

// -------------------------------------------
// @route   GET /api/study-plan/:planId/export/ics
// @desc    Export a study plan as an .ics calendar file
// @access  Protected
// -------------------------------------------
const exportStudyPlanToIcs = async (req, res) => {
    try {
        const { planId } = req.params;
        const plan = await StudyPlan.findById(planId).populate("subjectId");

        if (!plan) {
            return sendError(res, 404, "Study plan not found.");
        }

        // Verify ownership
        if (plan.userId.toString() !== req.user._id.toString()) {
            return sendError(res, 403, "Not authorized to export this study plan.");
        }

        const subjectName = plan.subjectId ? plan.subjectId.name : "Subject";
        const sanitizedSubjectName = subjectName.replace(/[^a-zA-Z0-9-_]/g, "_");
        const filename = `${sanitizedSubjectName}-study-plan.ics`;

        const now = new Date();
        const dtstamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

        const escapeIcsText = (str) => {
            if (!str) return '';
            return str
                .replace(/\\/g, '\\\\')
                .replace(/;/g, '\\;')
                .replace(/,/g, '\\,')
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '');
        };

        const formatDuration = (hours) => {
            const h = Math.floor(hours);
            const m = Math.round((hours - h) * 60);
            if (h > 0 && m > 0) {
                return `PT${h}H${m}M`;
            } else if (h > 0) {
                return `PT${h}H`;
            } else if (m > 0) {
                return `PT${m}M`;
            } else {
                return `PT1H`;
            }
        };

        const foldLine = (line) => {
            if (line.length <= 75) return line;
            let result = '';
            let curr = line;
            while (curr.length > 75) {
                result += curr.substring(0, 75) + '\r\n ';
                curr = curr.substring(75);
            }
            result += curr;
            return result;
        };

        let icsLines = [
            "BEGIN:VCALENDAR",
            "VERSION:2.0",
            "PRODID:-//Topiq//Topiq//EN",
            "CALSCALE:GREGORIAN",
            "METHOD:PUBLISH"
        ];

        // Process daily plans
        if (plan.dailyPlans && plan.dailyPlans.length > 0) {
            plan.dailyPlans.forEach((day, index) => {
                const dayDate = new Date(day.date);
                const year = dayDate.getUTCFullYear();
                const month = String(dayDate.getUTCMonth() + 1).padStart(2, '0');
                const dateVal = String(dayDate.getUTCDate()).padStart(2, '0');
                const dtstart = `${year}${month}${dateVal}T090000Z`;

                let summary = `Study: ${subjectName}`;
                if (day.topics && day.topics.length > 0) {
                    const firstTopic = day.topics[0].topicName;
                    if (day.topics.length === 1) {
                        summary = `Study: ${subjectName} — ${firstTopic}`;
                    } else {
                        summary = `Study: ${subjectName} — ${firstTopic} + ${day.topics.length - 1} more topics`;
                    }
                }

                let descParts = [];
                if (day.topics && day.topics.length > 0) {
                    descParts.push("Topics to study:");
                    day.topics.forEach((t) => {
                        descParts.push(`- ${t.topicName} (${t.unitName}) — ${t.estimatedHours || 0} hrs`);
                    });
                }
                descParts.push(`Planned study hours for today: ${day.plannedHours || 0} hrs`);
                if (day.studyTip) {
                    descParts.push(`Daily Tip: ${day.studyTip}`);
                }
                descParts.push("\n* Note: Time is set to 9:00 AM UTC. Please adjust manually after importing if necessary.");

                const description = descParts.join("\n");
                const uid = `${plan._id}-day-${index}@topiq.com`;
                const duration = formatDuration(day.plannedHours || 1);

                const eventLines = [
                    "BEGIN:VEVENT",
                    `UID:${uid}`,
                    `DTSTAMP:${dtstamp}`,
                    `DTSTART:${dtstart}`,
                    `DURATION:${duration}`,
                    `SUMMARY:${escapeIcsText(summary)}`,
                    `DESCRIPTION:${escapeIcsText(description)}`,
                    "BEGIN:VALARM",
                    "TRIGGER:-PT60M",
                    "ACTION:DISPLAY",
                    "DESCRIPTION:Reminder",
                    "END:VALARM",
                    "END:VEVENT"
                ];

                icsLines.push(...eventLines);
            });
        }

        // Add exam event if examDate exists
        if (plan.examDate) {
            const examDateObj = new Date(plan.examDate);
            const examYear = examDateObj.getUTCFullYear();
            const examMonth = String(examDateObj.getUTCMonth() + 1).padStart(2, '0');
            const examDateVal = String(examDateObj.getUTCDate()).padStart(2, '0');
            const examDtStart = `${examYear}${examMonth}${examDateVal}T090000Z`;
            const examUid = `${plan._id}-exam@topiq.com`;

            const examEventLines = [
                "BEGIN:VEVENT",
                `UID:${examUid}`,
                `DTSTAMP:${dtstamp}`,
                `DTSTART:${examDtStart}`,
                `DURATION:PT3H`,
                `SUMMARY:EXAM: ${escapeIcsText(subjectName)}`,
                "TRANSP:OPAQUE",
                "CATEGORIES:EXAM",
                "END:VEVENT"
            ];
            icsLines.push(...examEventLines);
        }

        icsLines.push("END:VCALENDAR");

        // Format and fold all lines
        const icsContent = icsLines.map(foldLine).join("\r\n");

        res.setHeader("Content-Type", "text/calendar; charset=utf-8");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        return res.status(200).send(icsContent);

    } catch (error) {
        console.error("[Planner] Export ICS error:", error.message);
        return sendError(res, 500, "Failed to export study plan to calendar.");
    }
};

// -------------------------------------------
// @route   POST /api/study-plan/:planId/reschedule
// @desc    Reschedule uncompleted topics from missed days across remaining days
// @access  Protected
// -------------------------------------------
const rescheduleMissedDays = async (req, res) => {
    try {
        const { planId } = req.params;
        const plan = await StudyPlan.findOne({ _id: planId, userId: req.user._id });
        if (!plan) {
            return sendError(res, 404, "Study plan not found.");
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Filter missed days (past days that are not completed / not already rescheduled)
        const missedDays = plan.dailyPlans.filter(day => {
            const dayDate = new Date(day.date);
            dayDate.setHours(0, 0, 0, 0);
            return dayDate < today && !day.isCompleted;
        });

        const remainingDays = plan.dailyPlans.filter(day => {
            const dayDate = new Date(day.date);
            dayDate.setHours(0, 0, 0, 0);
            return dayDate >= today && !day.isCompleted;
        });

        if (missedDays.length === 0) {
            return sendSuccess(res, 200, "No missed days detected.", {
                rescheduledTopicCount: 0,
                affectedDays: []
            });
        }

        if (remainingDays.length === 0) {
            return sendError(res, 400, "No remaining days to reschedule into. Consider activating Crisis Mode.");
        }

        // ── IDEMPOTENCY GUARD ────────────────────────────────────────────────
        // Build a set of all topic names already present in future days.
        // If a missed topic already appears in a future day, skip it — don't duplicate.
        const topicsAlreadyInFuture = new Set(
            remainingDays.flatMap(day => day.topics.map(t => t.topicName))
        );

        // Only collect topics that are NOT already redistributed
        const missedTopics = missedDays
            .flatMap(day => (day.topics || []))
            .filter(topic => !topicsAlreadyInFuture.has(topic.topicName));

        if (missedTopics.length === 0) {
            // All missed topics already exist in future days — already rescheduled
            // Mark missed days as completed/rescheduled without adding duplicates
            missedDays.forEach(day => {
                day.isCompleted = true;
                day.rescheduled = true;
            });
            const completedDaysCount = plan.dailyPlans.filter(d => d.isCompleted).length;
            plan.completionPercentage = Math.round((completedDaysCount / plan.dailyPlans.length) * 100);
            await plan.save();
            return sendSuccess(res, 200, "Already rescheduled — no duplicates added.", {
                rescheduledTopicCount: 0,
                affectedDays: []
            });
        }
        // ── END IDEMPOTENCY GUARD ────────────────────────────────────────────

        const affectedDaysSet = new Set();

        // Distribute missed topics round-robin across remaining days
        let remainingIdx = 0;
        missedTopics.forEach(topic => {
            const targetDay = remainingDays[remainingIdx];

            targetDay.topics.push({
                topicName: topic.topicName,
                unitName: topic.unitName,
                estimatedHours: topic.estimatedHours,
                importance: topic.importance
            });

            // Update estimated hours (plannedHours)
            targetDay.plannedHours = targetDay.topics.reduce((sum, t) => sum + (t.estimatedHours || 0), 0);

            // Add note to day tip
            const note = "⚠ Includes rescheduled topics from missed days.";
            if (!targetDay.studyTip) {
                targetDay.studyTip = note;
            } else if (!targetDay.studyTip.includes(note)) {
                targetDay.studyTip = `${targetDay.studyTip.trim()} ${note}`;
            }

            affectedDaysSet.add(targetDay.date.toISOString());

            // Move to next remaining day round-robin
            remainingIdx = (remainingIdx + 1) % remainingDays.length;
        });

        // Mark missed days as completed and rescheduled
        missedDays.forEach(day => {
            day.isCompleted = true;
            day.rescheduled = true;
        });

        // Recalculate completion percentage
        const completedDaysCount = plan.dailyPlans.filter((d) => d.isCompleted).length;
        plan.completionPercentage = Math.round((completedDaysCount / plan.dailyPlans.length) * 100);

        await plan.save();

        return sendSuccess(res, 200, "Missed days rescheduled successfully.", {
            rescheduledTopicCount: missedTopics.length,
            affectedDays: Array.from(affectedDaysSet)
        });

    } catch (error) {
        console.error("[Planner] Reschedule error:", error.message);
        return sendError(res, 500, "Failed to reschedule missed days.");
    }
};

module.exports = { generatePlan, generateCheatCode, getPlan, markDayComplete, exportStudyPlanToIcs, rescheduleMissedDays };

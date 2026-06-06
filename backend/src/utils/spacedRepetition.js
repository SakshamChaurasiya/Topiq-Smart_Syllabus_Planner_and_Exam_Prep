const Syllabus = require("../models/syllabus.model");
const Mission = require("../models/mission.model");
const StudyPlan = require("../models/studyPlan.model");

/**
 * calculateSpacedRepetition(currentIntervalIndex, rating)
 * Returns the next review date and the new interval index based on SM-2 intervals (1 -> 3 -> 7 -> 14 -> 30 days).
 *
 * @param {number} currentIntervalIndex 
 * @param {string} rating - 'got-it' | 'shaky' | 'no-idea'
 * @returns {{ nextReviewDate: Date, intervalIndex: number }}
 */
const calculateSpacedRepetition = (currentIntervalIndex = 0, rating = 'got-it') => {
    const intervals = [1, 3, 7, 14, 30];
    let nextIntervalIndex = currentIntervalIndex;

    if (rating === 'got-it') {
        nextIntervalIndex = Math.min(currentIntervalIndex + 1, intervals.length - 1);
    } else if (rating === 'shaky') {
        nextIntervalIndex = Math.max(0, currentIntervalIndex);
    } else {
        // 'no-idea' resets to start
        nextIntervalIndex = 0;
    }

    const daysToAdd = intervals[nextIntervalIndex];
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + daysToAdd);
    nextReviewDate.setHours(0, 0, 0, 0);

    return {
        nextReviewDate,
        intervalIndex: nextIntervalIndex
    };
};

/**
 * syncRevisionMissions(userId)
 * Identifies syllabus topics due for revision and generates revision missions for them.
 *
 * @param {string} userId
 */
const syncRevisionMissions = async (userId) => {
    try {
        const syllabuses = await Syllabus.find({ userId });
        const now = new Date();
        now.setHours(23, 59, 59, 999); // Check if due by end of today

        for (const syllabus of syllabuses) {
            if (!syllabus.topicProgress || syllabus.topicProgress.length === 0) continue;

            // Find the active study plan for this subject (needed for studyPlanId)
            const activePlan = await StudyPlan.findOne({
                userId,
                subjectId: syllabus.subjectId,
                isActive: true
            });

            if (!activePlan) continue;

            const dueTopics = syllabus.topicProgress.filter(tp => {
                return tp.nextReviewDate && new Date(tp.nextReviewDate) <= now;
            });

            for (const progress of dueTopics) {
                // Check if a pending or in-progress revision mission already exists for this topic
                const existing = await Mission.findOne({
                    userId,
                    subjectId: syllabus.subjectId,
                    topicName: progress.topicName,
                    type: "revision",
                    status: { $in: ["pending", "in-progress"] }
                });

                if (!existing) {
                    await Mission.create({
                        userId,
                        subjectId: syllabus.subjectId,
                        studyPlanId: activePlan._id,
                        title: `Revise: ${progress.topicName}`,
                        description: `Spaced repetition revision session for "${progress.topicName}". Rate your recall upon completion to schedule the next review.`,
                        type: "revision",
                        priority: "medium",
                        status: "pending",
                        dueDate: new Date(),
                        estimatedMinutes: 15,
                        topicName: progress.topicName,
                        xpReward: 15,
                    });
                }
            }
        }
    } catch (error) {
        console.error("[SpacedRepetition] Error syncing revision missions:", error.message);
    }
};

module.exports = {
    calculateSpacedRepetition,
    syncRevisionMissions
};

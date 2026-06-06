const Subject = require("../models/subject.model");
const Notification = require("../models/notification.model");

/**
 * syncExamNotifications(userId)
 * Calculates the countdown to each subject's exam and generates a notification if a milestone is reached.
 * Milestones: 30, 15, 7, 3, 1, 0 days remaining.
 *
 * @param {string} userId - ID of the student
 */
const syncExamNotifications = async (userId) => {
    try {
        const subjects = await Subject.find({ userId });
        const now = new Date();
        now.setHours(0, 0, 0, 0);

        for (const subject of subjects) {
            if (!subject.examDate) continue;

            const exam = new Date(subject.examDate);
            exam.setHours(0, 0, 0, 0);

            const diffTime = exam.getTime() - now.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            const milestones = [30, 15, 7, 3, 1, 0];
            if (milestones.includes(diffDays)) {
                const milestoneTitle = diffDays === 0
                    ? `Exam Today: ${subject.name}`
                    : `${subject.name} Exam in ${diffDays} day${diffDays > 1 ? 's' : ''}!`;

                // Check if already created to prevent spam
                const existing = await Notification.findOne({
                    userId,
                    subjectId: subject._id,
                    type: 'exam-reminder',
                    title: milestoneTitle
                });

                if (!existing) {
                    const message = diffDays === 0
                        ? `Good luck! Your ${subject.name} (${subject.code || ''}) exam is today.`
                        : `Your ${subject.name} (${subject.code || ''}) exam is scheduled in ${diffDays} day${diffDays > 1 ? 's' : ''} on ${exam.toLocaleDateString()}. Keep studying!`;

                    await Notification.create({
                        userId,
                        subjectId: subject._id,
                        title: milestoneTitle,
                        message,
                        type: 'exam-reminder',
                        actionUrl: `/subject/${subject._id}`
                    });
                }
            }
        }
    } catch (error) {
        console.error("[ExamNotifications] Error syncing countdown notifications:", error.message);
    }
};

module.exports = { syncExamNotifications };

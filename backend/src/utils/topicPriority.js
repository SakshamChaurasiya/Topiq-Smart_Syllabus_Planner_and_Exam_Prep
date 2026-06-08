/**
 * topicPriority.js
 * Utility to update topic importance (priority) based on student confidence ratings.
 */

const Syllabus = require("../models/syllabus.model");

/**
 * Updates a topic's priority (importance field) in the associated subject's syllabus.
 * @param {string|ObjectId} subjectId - The subject ID
 * @param {string} topicName - The name of the topic to search for
 * @param {string} confidence - The student's rated confidence: 'shaky' | 'okay' | 'solid'
 */
const updateTopicPriority = async (subjectId, topicName, confidence) => {
    if (!subjectId || !topicName || !confidence) return;
    if (confidence !== "shaky" && confidence !== "solid") return; // 'okay' or invalid - no changes

    const syllabus = await Syllabus.findOne({ subjectId });
    if (!syllabus) return;

    let modified = false;
    for (const unit of syllabus.units) {
        for (const topic of unit.topics) {
            if (topic.name.toLowerCase().trim() === topicName.toLowerCase().trim()) {
                if (confidence === "shaky") {
                    topic.importance = "critical";
                } else if (confidence === "solid") {
                    topic.importance = "low";
                }
                modified = true;
            }
        }
    }

    if (modified) {
        await syllabus.save();
    }
};

module.exports = {
    updateTopicPriority,
};

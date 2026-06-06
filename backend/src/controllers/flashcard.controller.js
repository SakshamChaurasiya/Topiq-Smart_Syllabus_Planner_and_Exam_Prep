/**
 * flashcard.controller.js
 * Controller for Flashcards generation, sharing, and public access.
 */

const FlashcardSet = require("../models/flashcardSet.model");
const Syllabus = require("../models/syllabus.model");
const aiService = require("../services/ai.service");
const crypto = require("crypto");
const { sendSuccess, sendError } = require("../utils/responseHelper");

// @route   POST /api/syllabus/:syllabusId/flashcards/generate
// @desc    Generate AI flashcards from syllabus (critical + high topics only)
// @access  Protected
const generateFlashcards = async (req, res) => {
    try {
        const { syllabusId } = req.params;
        const syllabus = await Syllabus.findOne({ _id: syllabusId, userId: req.user._id });
        if (!syllabus) {
            return sendError(res, 404, "Syllabus not found.");
        }

        // Extract topics (importance === "critical" || "high" only)
        const topics = [];
        syllabus.units.forEach(unit => {
            unit.topics.forEach(topic => {
                if (topic.importance === "critical" || topic.importance === "high") {
                    topics.push({
                        topicName: topic.name,
                        unitName: unit.unitName,
                        importance: topic.importance,
                        difficulty: topic.difficulty,
                        summary: topic.summary || ""
                    });
                }
            });
        });

        if (topics.length === 0) {
            return sendError(res, 400, "No critical or high importance topics found in this syllabus. Cannot generate flashcards.");
        }

        // Call AI generator
        let cards = [];
        const aiResult = await aiService.generateFlashcards(topics);

        if (aiResult && aiResult.flashcards && aiResult.flashcards.length > 0) {
            cards = aiResult.flashcards;
        } else {
            // Graceful degradation: generate basic cards using existing data
            console.log("[Flashcard Controller] AI generation failed or returned empty. Using fallback basic cards.");
            cards = topics.map(t => {
                const question = `What is the core concept of "${t.topicName}"?`;
                const answer = t.summary 
                    ? t.summary 
                    : `Review key concepts, definitions, and exam priorities for ${t.topicName} in ${t.unitName || 'the syllabus'}.`;
                return {
                    front: question,
                    back: answer,
                    importance: t.importance,
                    difficulty: t.difficulty
                };
            });
        }

        // Upsert FlashcardSet
        let flashcardSet = await FlashcardSet.findOne({ syllabusId });
        if (flashcardSet) {
            flashcardSet.cards = cards;
            await flashcardSet.save();
        } else {
            flashcardSet = await FlashcardSet.create({
                userId: req.user._id,
                subjectId: syllabus.subjectId,
                syllabusId,
                cards,
                isShareable: false,
                shareTitle: "",
                shareToken: null
            });
        }

        return sendSuccess(res, 200, "Flashcards generated successfully.", flashcardSet);

    } catch (error) {
        console.error("[Flashcard Controller] Generate error:", error.message);
        return sendError(res, 500, "Failed to generate flashcards. Please try again.");
    }
};

// @route   GET /api/syllabus/:syllabusId/flashcards
// @desc    Get flashcard set for a syllabus
// @access  Protected
const getFlashcardSet = async (req, res) => {
    try {
        const { syllabusId } = req.params;
        const flashcardSet = await FlashcardSet.findOne({ syllabusId, userId: req.user._id });
        
        if (!flashcardSet) {
            return sendSuccess(res, 200, "No flashcard set found.", null);
        }

        return sendSuccess(res, 200, "Flashcard set fetched.", flashcardSet);

    } catch (error) {
        console.error("[Flashcard Controller] Get error:", error.message);
        return sendError(res, 500, "Failed to fetch flashcard set.");
    }
};

// @route   POST /api/flashcards/:setId/share
// @desc    Enable sharing and get a public share link
// @access  Protected
const shareFlashcards = async (req, res) => {
    try {
        const { setId } = req.params;
        const { shareTitle } = req.body;

        const flashcardSet = await FlashcardSet.findOne({ _id: setId, userId: req.user._id });
        if (!flashcardSet) {
            return sendError(res, 404, "Flashcard set not found.");
        }

        // Generate unique shareToken if it doesn't exist yet
        if (!flashcardSet.shareToken) {
            flashcardSet.shareToken = crypto.randomBytes(8).toString("hex");
        }

        flashcardSet.isShareable = true;
        flashcardSet.shareTitle = shareTitle || "OS Exam — Last Minute Guide";
        await flashcardSet.save();

        const shareUrl = `/shared/cheatnote/${flashcardSet.shareToken}`;
        return sendSuccess(res, 200, "Flashcard share link generated.", { shareUrl });

    } catch (error) {
        console.error("[Flashcard Controller] Share error:", error.message);
        return sendError(res, 500, "Failed to share flashcards.");
    }
};

// @route   GET /api/public/cheatnote/:shareToken
// @desc    Get a public shared flashcard cheat note
// @access  Public (No Auth)
const getPublicCheatNote = async (req, res) => {
    try {
        const { shareToken } = req.params;

        const flashcardSet = await FlashcardSet.findOne({ shareToken, isShareable: true })
            .populate("subjectId", "name code");

        if (!flashcardSet) {
            return sendError(res, 404, "Shared cheat note not found or is no longer public.");
        }

        return sendSuccess(res, 200, "Shared cheat note fetched.", {
            cards: flashcardSet.cards,
            shareTitle: flashcardSet.shareTitle,
            subjectName: flashcardSet.subjectId ? flashcardSet.subjectId.name : "Subject",
            subjectCode: flashcardSet.subjectId ? flashcardSet.subjectId.code : ""
        });

    } catch (error) {
        console.error("[Flashcard Controller] Public fetch error:", error.message);
        return sendError(res, 500, "Failed to fetch shared cheat note.");
    }
};

module.exports = {
    generateFlashcards,
    getFlashcardSet,
    shareFlashcards,
    getPublicCheatNote
};

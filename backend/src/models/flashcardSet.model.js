const mongoose = require("mongoose");

const flashcardSetSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        subjectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Subject",
            required: true,
        },
        syllabusId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Syllabus",
            required: true,
        },
        cards: [
            {
                front: {
                    type: String,
                    required: true,
                },
                back: {
                    type: String,
                    required: true,
                },
                importance: {
                    type: String,
                    enum: ["critical", "high", "medium", "low"],
                    default: "medium",
                },
                difficulty: {
                    type: String,
                    enum: ["easy", "medium", "hard"],
                    default: "medium",
                },
            },
        ],
        shareToken: {
            type: String,
            default: null,
            index: true,
        },
        isShareable: {
            type: Boolean,
            default: false,
        },
        shareTitle: {
            type: String,
            default: "",
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model("FlashcardSet", flashcardSetSchema);

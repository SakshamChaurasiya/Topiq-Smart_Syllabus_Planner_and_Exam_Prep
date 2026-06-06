/**
 * flashcard.routes.js
 * Route definitions for flashcard generation, sharing, and public retrieval.
 */

const express = require("express");
const router = express.Router();
const {
    generateFlashcards,
    getFlashcardSet,
    shareFlashcards,
    getPublicCheatNote
} = require("../controllers/flashcard.controller");
const { protect } = require("../middleware/auth.middleware");

// Get flashcards set for owner
router.get("/syllabus/:syllabusId/flashcards", protect, getFlashcardSet);

// Generate flashcard set
router.post("/syllabus/:syllabusId/flashcards/generate", protect, generateFlashcards);

// Enable sharing
router.post("/flashcards/:setId/share", protect, shareFlashcards);

// Public unauthenticated access to shared cheat notes
router.get("/public/cheatnote/:shareToken", getPublicCheatNote);

module.exports = router;

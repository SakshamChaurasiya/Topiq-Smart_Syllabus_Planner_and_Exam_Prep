/**
 * syllabus.controller.js
 * Handles syllabus upload (PDF/image/text), text extraction, and AI analysis.
 */

const fs = require("fs");
const path = require("path");
const Syllabus = require("../models/syllabus.model");
const Subject = require("../models/subject.model");
const aiService = require("../services/ai.service");
const { sendSuccess, sendError } = require("../utils/responseHelper");

// -------------------------------------------
// Helper: Extract text from PDF using pdf-parse
// -------------------------------------------
const extractPdfText = async (filePath) => {
    try {
        const pdfParse = require("pdf-parse");
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        return data.text || "";
    } catch (error) {
        console.error("[Syllabus] PDF extraction error:", error.message);
        return "";
    }
};

// -------------------------------------------
// @route   POST /api/syllabus/upload
// @desc    Upload PDF or image syllabus file
// @access  Protected
// -------------------------------------------
const uploadSyllabus = async (req, res) => {
    try {
        const { subjectId } = req.body;

        // Validate subject exists and belongs to user
        const subject = await Subject.findOne({ _id: subjectId, userId: req.user._id });
        if (!subject) {
            // Clean up uploaded file if subject not found
            if (req.file) fs.unlinkSync(req.file.path);
            return sendError(res, 404, "Subject not found.");
        }

        if (!req.file) {
            return sendError(res, 400, "Please upload a file.");
        }

        const fileExt = path.extname(req.file.originalname).toLowerCase();
        const isPdf = fileExt === ".pdf" || req.file.mimetype === "application/pdf";
        const inputType = isPdf ? "pdf" : "image";

        // Extract text from PDF
        let rawContent = "";
        if (isPdf) {
            rawContent = await extractPdfText(req.file.path);
        } else {
            // For images — store the file path; AI analysis will use Vision API
            rawContent = `[Image file uploaded: ${req.file.originalname}. Text extraction requires AI analysis.]`;
        }

        // Remove existing syllabus for this subject if any
        await Syllabus.deleteOne({ subjectId, userId: req.user._id });

        // Save the syllabus
        const syllabus = await Syllabus.create({
            userId: req.user._id,
            subjectId,
            inputType,
            rawContent,
            filePath: req.file.path,
            originalFileName: req.file.originalname,
            isAnalyzed: false,
        });

        // Update subject to mark that it has a syllabus
        await Subject.findByIdAndUpdate(subjectId, { hasSyllabus: true });

        return sendSuccess(res, 201, "Syllabus uploaded successfully. Run AI analysis to extract topics.", {
            syllabusId: syllabus._id,
            inputType,
            fileName: req.file.originalname,
            textExtracted: rawContent.length > 50,
            rawContentPreview: rawContent.substring(0, 200),
        });
    } catch (error) {
        console.error("[Syllabus] Upload error:", error.message);
        return sendError(res, 500, "Failed to upload syllabus.");
    }
};

// -------------------------------------------
// @route   POST /api/syllabus/text
// @desc    Submit syllabus as plain text
// @access  Protected
// -------------------------------------------
const submitTextSyllabus = async (req, res) => {
    try {
        const { subjectId, rawContent } = req.body;

        if (!subjectId || !rawContent) {
            return sendError(res, 400, "Subject ID and syllabus text are required.");
        }

        if (rawContent.trim().length < 20) {
            return sendError(res, 400, "Syllabus text is too short. Please provide more content.");
        }

        // Validate subject
        const subject = await Subject.findOne({ _id: subjectId, userId: req.user._id });
        if (!subject) {
            return sendError(res, 404, "Subject not found.");
        }

        // Remove existing syllabus for this subject
        await Syllabus.deleteOne({ subjectId, userId: req.user._id });

        const syllabus = await Syllabus.create({
            userId: req.user._id,
            subjectId,
            inputType: "text",
            rawContent: rawContent.trim(),
            isAnalyzed: false,
        });

        await Subject.findByIdAndUpdate(subjectId, { hasSyllabus: true });

        return sendSuccess(res, 201, "Syllabus text saved successfully. Run AI analysis to extract topics.", {
            syllabusId: syllabus._id,
            inputType: "text",
            wordCount: rawContent.trim().split(/\s+/).length,
        });
    } catch (error) {
        console.error("[Syllabus] Text submit error:", error.message);
        return sendError(res, 500, "Failed to save syllabus text.");
    }
};

// -------------------------------------------
// @route   POST /api/syllabus/:id/analyze
// @desc    Run AI analysis on a syllabus
// @access  Protected
// -------------------------------------------
const analyzeSyllabus = async (req, res) => {
    try {
        const syllabus = await Syllabus.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!syllabus) {
            return sendError(res, 404, "Syllabus not found.");
        }

        // Get the subject name for context
        const subject = await Subject.findById(syllabus.subjectId);
        if (!subject) {
            return sendError(res, 404, "Associated subject not found.");
        }

        if (!syllabus.rawContent || syllabus.rawContent.trim().length < 10) {
            return sendError(res, 400, "Syllabus content is empty. Cannot analyze.");
        }

        // --- CACHE CHECK ---
        const forceRerun = req.body?.forceRerun === true;

        if (syllabus.isAnalyzed && syllabus.units?.length > 0 && !forceRerun) {
            // Return cached result without calling Gemini
            console.log("[Syllabus] Returning cached analysis for syllabus:", syllabus._id);

            const aiAnalysisObj = syllabus.aiAnalysis?.toObject
                ? syllabus.aiAnalysis.toObject()
                : { ...syllabus.aiAnalysis };

            aiAnalysisObj.aiSuggestedFocusAreas = aiAnalysisObj.examLikelyTopics || [];
            delete aiAnalysisObj.examLikelyTopics;

            return sendSuccess(res, 200, "Returning saved analysis. Use forceRerun: true to re-analyze.", {
                syllabusId: syllabus._id,
                totalUnits: syllabus.units.length,
                totalTopics: syllabus.totalTopics,
                aiAnalysis: aiAnalysisObj,
                units: syllabus.units,
                fromCache: true,
            });
        }
        // --- END CACHE CHECK ---

        // Call AI service for analysis
        const analysisResult = await aiService.analyzeSyllabus(
            syllabus.rawContent,
            subject.name,
            req.user.institution || ""
        );

        // Build units array from AI response
        const units = (analysisResult.units || []).map((unit, idx) => ({
            unitNumber: unit.unitNumber || idx + 1,
            unitName: unit.unitName,
            topics: (unit.topics || []).map((topic) => ({
                name: topic.name,
                importance: topic.importance || "medium",
                difficulty: topic.difficulty || "medium",
                estimatedHours: topic.estimatedHours || 1,
                marksWeightage: topic.marksWeightage || 0,
                summary: topic.summary || "",
                isCompleted: false,
            })),
            totalTopics: (unit.topics || []).length,
            completedTopics: 0,
        }));

        // Calculate total topics
        const totalTopics = units.reduce((sum, unit) => sum + unit.topics.length, 0);

        // Save analysis results to syllabus
        syllabus.units = units;
        syllabus.isAnalyzed = true;
        syllabus.totalTopics = totalTopics;
        syllabus.aiAnalysis = {
            summary: analysisResult.summary || "",
            totalEstimatedHours: analysisResult.totalEstimatedHours || 0,
            topPriorityTopics: analysisResult.topPriorityTopics || [],
            overallDifficulty: analysisResult.overallDifficulty || "medium",
            difficultyBreakdown: analysisResult.difficultyBreakdown || { easy: 33, medium: 34, hard: 33 },
            examLikelyTopics: analysisResult.examLikelyTopics || [],
            studyStrategy: analysisResult.studyStrategy || "",
        };

        await syllabus.save();

        // Update subject with topic counts
        await Subject.findByIdAndUpdate(syllabus.subjectId, {
            totalTopics,
            completedTopics: 0,
            progress: 0,
        });

        const aiAnalysisObj = syllabus.aiAnalysis.toObject();
        aiAnalysisObj.aiSuggestedFocusAreas = aiAnalysisObj.examLikelyTopics || [];
        delete aiAnalysisObj.examLikelyTopics;

        return sendSuccess(res, 200, "AI analysis complete! Topics and units extracted.", {
            syllabusId: syllabus._id,
            totalUnits: units.length,
            totalTopics,
            aiAnalysis: aiAnalysisObj,
            units: syllabus.units,
        });
    } catch (error) {
        console.error("[Syllabus] Analyze error:", error.message);
        return sendError(res, 500, "AI analysis failed. Please try again.");
    }
};

// -------------------------------------------
// @route   GET /api/syllabus/:subjectId
// @desc    Get syllabus for a subject
// @access  Protected
// -------------------------------------------
const getSyllabus = async (req, res) => {
    try {
        const syllabus = await Syllabus.findOne({
            subjectId: req.params.subjectId,
            userId: req.user._id,
        });

        if (!syllabus) {
            return sendError(res, 404, "No syllabus found for this subject.");
        }

        const syllabusObj = syllabus.toObject();
        if (syllabusObj.aiAnalysis) {
            syllabusObj.aiAnalysis.aiSuggestedFocusAreas = syllabusObj.aiAnalysis.examLikelyTopics || [];
            delete syllabusObj.aiAnalysis.examLikelyTopics;
        }

        return sendSuccess(res, 200, "Syllabus fetched successfully.", syllabusObj);
    } catch (error) {
        console.error("[Syllabus] GetBySubject error:", error.message);
        return sendError(res, 500, "Failed to fetch syllabus.");
    }
};

// -------------------------------------------
// @route   PUT /api/syllabus/:syllabusId/topic/:topicId/complete
// @desc    Mark a topic as completed
// @access  Protected
// -------------------------------------------
const markTopicComplete = async (req, res) => {
    try {
        const { syllabusId, topicId } = req.params;
        const { isCompleted } = req.body;

        const syllabus = await Syllabus.findOne({
            _id: syllabusId,
            userId: req.user._id,
        });

        if (!syllabus) {
            return sendError(res, 404, "Syllabus not found.");
        }

        // Find and update the topic inside nested units
        let topicFound = false;
        for (const unit of syllabus.units) {
            const topic = unit.topics.id(topicId);
            if (topic) {
                topic.isCompleted = isCompleted;
                topicFound = true;

                // Recalculate unit completion
                unit.completedTopics = unit.topics.filter((t) => t.isCompleted).length;
                break;
            }
        }

        if (!topicFound) {
            return sendError(res, 404, "Topic not found.");
        }

        await syllabus.save();

        // Recalculate subject progress
        const totalCompleted = syllabus.units.reduce((sum, u) => sum + u.completedTopics, 0);
        const subject = await Subject.findById(syllabus.subjectId);
        if (subject) {
            subject.completedTopics = totalCompleted;
            await subject.save();
        }

        return sendSuccess(res, 200, `Topic marked as ${isCompleted ? "completed" : "incomplete"}.`, {
            completedTopics: totalCompleted,
            totalTopics: syllabus.totalTopics,
        });
    } catch (error) {
        console.error("[Syllabus] MarkTopicComplete error:", error.message);
        return sendError(res, 500, "Failed to update topic status.");
    }
};

// -------------------------------------------
// @route   POST /api/syllabus/:syllabusId/pyq-upload
// @desc    Upload past year question paper PDF and analyze
// @access  Protected
// -------------------------------------------
const uploadPYQ = async (req, res) => {
    try {
        const { syllabusId } = req.params;

        const syllabus = await Syllabus.findOne({ _id: syllabusId, userId: req.user._id });
        if (!syllabus) {
            if (req.file) {
                try {
                    fs.unlinkSync(req.file.path);
                } catch (unlinkErr) { }
            }
            return sendError(res, 404, "Syllabus not found.");
        }

        if (!syllabus.isAnalyzed) {
            if (req.file) {
                try {
                    fs.unlinkSync(req.file.path);
                } catch (unlinkErr) { }
            }
            return sendError(res, 400, "Please analyze your syllabus first before uploading past year papers.");
        }

        if (!req.file) {
            return sendError(res, 400, "Please upload a past year question paper PDF.");
        }

        const fileExt = path.extname(req.file.originalname).toLowerCase();
        const isPdf = fileExt === ".pdf" || req.file.mimetype === "application/pdf";
        if (!isPdf) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkErr) { }
            return sendError(res, 400, "Only PDF files are supported for past year question papers.");
        }

        // Read PDF file as buffer for Gemini Vision
        const pdfBuffer = fs.readFileSync(req.file.path);

        // Clean up temp file immediately after reading
        try {
            fs.unlinkSync(req.file.path);
        } catch (unlinkError) {
            console.error("[Syllabus] Failed to delete temp PYQ file:", unlinkError.message);
        }

        // Get existing syllabus topics to cross-reference
        const existingTopics = syllabus.units.flatMap(u => u.topics.map(t => t.name));

        if (existingTopics.length === 0) {
            return sendError(res, 400, "No topics found in syllabus. Please re-run AI analysis first.");
        }

        // Send PDF directly to Gemini Vision — works for both text and scanned PDFs
        const analysisResult = await aiService.analyzePYQFromFile(pdfBuffer, existingTopics);

        // Handle unreadable PDF gracefully
        if (analysisResult.unreadable) {
            return sendError(res, 422,
                `Could not extract questions from this PDF. Reason: ${analysisResult.readabilityNote}. ` +
                `Please try a clearer scan or a text-based PDF.`
            );
        }

        const pyqSuggestedTopics = (analysisResult.pyqSuggestedTopics || []).map(topicObj => ({
            topic: topicObj.topic,
            frequency: topicObj.frequency || 1,
            yearsAppeared: topicObj.yearsAppeared || [],
            estimatedMarks: topicObj.estimatedMarks || 0,
        }));

        const aiTopics = existingTopics;
        const pyqTopics = pyqSuggestedTopics.map(t => t.topic);

        const aiTopicsLower = aiTopics.map(t => t.toLowerCase().trim());
        const pyqTopicsLower = pyqTopics.map(t => t.toLowerCase().trim());

        const overlapTopics = [];
        const pyqOnlyTopics = [];
        const aiOnlyTopics = [];

        // Identify overlaps and ai-only topics (using case-insensitive comparison but keeping original casing from the database)
        aiTopics.forEach(t => {
            const tLower = t.toLowerCase().trim();
            if (pyqTopicsLower.includes(tLower)) {
                overlapTopics.push(t);
            } else {
                aiOnlyTopics.push(t);
            }
        });

        // Identify pyq-only topics
        pyqSuggestedTopics.forEach(pt => {
            const ptLower = pt.topic.toLowerCase().trim();
            if (!aiTopicsLower.includes(ptLower)) {
                pyqOnlyTopics.push(pt.topic);
            }
        });

        // Update syllabus with the PYQ analysis
        syllabus.pyqAnalysis = {
            uploadedAt: new Date(),
            pyqSuggestedTopics,
            overlapTopics,
            pyqOnlyTopics,
            aiOnlyTopics,
        };

        await syllabus.save();

        return sendSuccess(res, 200, "PYQ analysis completed successfully.", syllabus.pyqAnalysis);
    } catch (error) {
        console.error("[Syllabus] PYQ upload/analysis error:", error.message);
        if (req.file && fs.existsSync(req.file.path)) {
            try {
                fs.unlinkSync(req.file.path);
            } catch (unlinkError) { }
        }
        return sendError(res, 500, "Failed to analyze PYQs. Please try again.");
    }
};

module.exports = {
    uploadSyllabus,
    submitTextSyllabus,
    analyzeSyllabus,
    getSyllabus,
    markTopicComplete,
    uploadPYQ,
};

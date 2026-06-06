/**
 * ai.service.js
 * Google Gemini API wrapper for all AI-powered features.
 * Handles: syllabus analysis, study plan generation, cheat codes.
 *
 * GRACEFUL DEGRADATION:
 * If no API key is set, functions return mock/placeholder responses
 * so the rest of the app still works during development.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini client only if API key exists
let genAI = null;
if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "your-gemini-api-key-here") {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

// Helper to call Gemini chat completion
const callAI = async (systemPrompt, userPrompt) => {
    if (!genAI) {
        console.warn("[AI Service] Gemini key not configured — returning mock response.");
        return null; // Caller handles null = mock mode
    }

    const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash", // Fast and cost-effective model
        systemInstruction: systemPrompt,
        generationConfig: {
            responseMimeType: "application/json", // Always return valid JSON
            temperature: 0.7,
        },
    });

    const result = await model.generateContent(userPrompt);
    return result.response.text();
};

// ============================================================
// 1. ANALYZE SYLLABUS
// Takes raw syllabus text and returns structured units/topics
// ============================================================
const analyzeSyllabus = async (syllabusText, subjectName, institution = "") => {
    try {
        const systemPrompt = `You are an expert academic advisor and syllabus analyzer.
Your job is to analyze a student's syllabus and extract structured information.
Always respond in valid JSON format exactly matching the schema provided.`;

        let contextPrompt = "";
        if (institution) {
            contextPrompt = `\n[Context: The student is enrolled at "${institution}". Tailor the study tips, priorities, and exam likely topics using any known patterns, standard curricula, or expectations for this college/university if applicable.]\n`;
        }

        const userPrompt = `Analyze this syllabus for the subject "${subjectName}" and return a JSON object with this exact structure:

{
  "summary": "Brief 2-3 sentence overview of the subject",
  "overallDifficulty": "easy|medium|hard|very-hard",
  "totalEstimatedHours": <number - total hours to study entire syllabus>,
  "studyStrategy": "Recommended approach for studying this subject",
  "difficultyBreakdown": { "easy": <percent>, "medium": <percent>, "hard": <percent> },
  "units": [
    {
      "unitNumber": 1,
      "unitName": "Unit name",
      "topics": [
        {
          "name": "Topic name",
          "importance": "critical|high|medium|low",
          "difficulty": "easy|medium|hard",
          "estimatedHours": <number>,
          "marksWeightage": <estimated marks out of 100>,
          "summary": "One sentence about what to focus on in this topic"
        }
      ]
    }
  ],
  "topPriorityTopics": ["Topic 1", "Topic 2", "Topic 3"],
  "examLikelyTopics": ["Topic A", "Topic B"],
  "studyTips": ["Tip 1", "Tip 2", "Tip 3"]
}
${contextPrompt}
Syllabus content:
${syllabusText}`;

        const result = await callAI(systemPrompt, userPrompt);

        if (!result) {
            // MOCK response when no API key
            return getMockSyllabusAnalysis(subjectName);
        }

        return JSON.parse(result);
    } catch (error) {
        console.warn("[AI Service] analyzeSyllabus failed — returning mock response. Error:", error.message);
        return getMockSyllabusAnalysis(subjectName);
    }
};

// ============================================================
// 2. GENERATE SMART STUDY PLAN
// Creates a day-by-day study plan based on syllabus + exam date
// ============================================================
const generateStudyPlan = async ({
    subjectName,
    syllabusUnits,
    examDate,
    availableHoursPerDay,
    targetGoal,
    daysRemaining,
    institution = "",
}) => {
    try {
        const systemPrompt = `You are a smart academic planner AI. 
Create realistic, achievable study plans that maximize student performance.
Always prioritize high-importance topics. Return valid JSON only.`;

        const topicsStr = syllabusUnits
            .map((u) =>
                `Unit ${u.unitNumber}: ${u.unitName}\n` +
                u.topics.map((t) => `  - ${t.name} (${t.importance}, ${t.estimatedHours}h)`).join("\n")
            )
            .join("\n");

        let contextPrompt = "";
        if (institution) {
            contextPrompt = `Student's College/University: ${institution} (incorporate standard study/exam patterns and pacing suitable for this institution)\n`;
        }

        const userPrompt = `Create a personalized study plan for a student.

Subject: ${subjectName}
${contextPrompt}Days Remaining: ${daysRemaining} days
Available Study Hours/Day: ${availableHoursPerDay} hours
Target Goal: ${targetGoal} (pass=40%, good=65%, excellent=85%+)

Syllabus:
${topicsStr}

Return a JSON object with this exact structure:
{
  "planSummary": "2-3 sentence overview of the plan",
  "priorityTopics": ["Most important topic", "Second most important"],
  "mustStudyTopics": ["Absolutely must study topic 1", "Topic 2"],
  "survivalStrategy": "Key advice for the student",
  "dailyPlans": [
    {
      "dayNumber": 1,
      "dayLabel": "Day 1 - Foundation",
      "topics": [
        {
          "topicName": "Topic name",
          "unitName": "Unit name",
          "estimatedHours": 1.5,
          "importance": "critical|high|medium|low"
        }
      ],
      "plannedHours": <total hours for the day>,
      "studyTip": "Specific tip for this day"
    }
  ]
}

Create exactly ${Math.min(daysRemaining, 30)} daily plans. Ensure total hours fit within ${availableHoursPerDay} hours/day.`;

        const result = await callAI(systemPrompt, userPrompt);

        if (!result) {
            return getMockStudyPlan(daysRemaining, availableHoursPerDay, syllabusUnits);
        }

        return JSON.parse(result);
    } catch (error) {
        console.warn("[AI Service] generateStudyPlan failed — returning mock response. Error:", error.message);
        return getMockStudyPlan(daysRemaining, availableHoursPerDay, syllabusUnits);
    }
};

// ============================================================
// 3. CHEAT CODE SYSTEM
// Generates a survival strategy for limited-time scenarios
// ============================================================
const generateCheatCode = async ({
    subjectName,
    syllabusUnits,
    daysRemaining,
    targetGoal,
    availableHoursPerDay,
    institution = "",
}) => {
    try {
        const systemPrompt = `You are an exam survival expert AI.
Students come to you desperate — they have very little time before their exam.
Your job is to tell them EXACTLY what to study to maximize their marks.
Be ruthless about prioritization. Be specific. Be honest. Return valid JSON only.`;

        const allTopics = syllabusUnits.flatMap((u) =>
            u.topics.map((t) => ({
                topic: t.name,
                unit: u.unitName,
                importance: t.importance,
                difficulty: t.difficulty,
                hours: t.estimatedHours,
                marks: t.marksWeightage,
            }))
        );

        let contextPrompt = "";
        if (institution) {
            contextPrompt = `Student's College/University: ${institution} (consider its typical exam patterns, high-priority areas, and question styles)\n`;
        }

        const userPrompt = `A student has ${daysRemaining} day(s) left before their ${subjectName} exam.
${contextPrompt}They can study ${availableHoursPerDay} hours/day. Target: ${targetGoal}.

All topics:
${JSON.stringify(allTopics, null, 2)}

Create an EXAM SURVIVAL CHEAT CODE. Return JSON:
{
  "mode": "${daysRemaining === 1 ? "1day" : daysRemaining <= 3 ? "3day" : daysRemaining <= 7 ? "7day" : "15day"}",
  "message": "Motivational but honest message to the student",
  "survivalStrategy": "The overall strategy in 2-3 sentences",
  "mustStudyNow": [
    {
      "topic": "Topic name",
      "unit": "Unit name",
      "reason": "Why this topic is critical",
      "estimatedMarks": <marks this can fetch>,
      "studyTime": "<time needed e.g. 2 hours>"
    }
  ],
  "skipTopics": [
    {
      "topic": "Topic to skip",
      "reason": "Why it's safe to skip now"
    }
  ],
  "hourlySchedule": [
    {
      "timeSlot": "9:00 AM - 11:00 AM",
      "task": "What to do",
      "topic": "Topic name"
    }
  ],
  "lastMinuteTips": ["Tip 1", "Tip 2", "Tip 3"],
  "expectedScore": {
    "minimum": <realistic minimum marks>,
    "expected": <realistic expected marks>,
    "maximum": <best case marks>
  }
}`;

        const result = await callAI(systemPrompt, userPrompt);

        if (!result) {
            return getMockCheatCode(daysRemaining, subjectName);
        }

        return JSON.parse(result);
    } catch (error) {
        console.warn("[AI Service] generateCheatCode failed — returning mock response. Error:", error.message);
        return getMockCheatCode(daysRemaining, subjectName);
    }
};

// ============================================================
// 4. ANALYZE PYQ (Past Year Question Papers)
// Identifies high-frequency topics from past exam papers
// ============================================================
const analyzePYQ = async (pyqText, existingTopics = []) => {
    try {
        const systemPrompt = `You are an expert academic exam pattern analyzer.
Your job is to analyze past year question papers and identify which topics/concepts appear most frequently.
Be specific about topic names. Match them to syllabus topics when possible. Return valid JSON only.`;

        const userPrompt = `Analyze the following past year question paper(s) and identify the most frequently tested topics/concepts.

Known syllabus topics for reference:
${JSON.stringify(existingTopics, null, 2)}

Past Year Question Papers:
${pyqText}

Return a JSON object with this exact structure:
{
  "pyqSuggestedTopics": [
    {
      "topic": "Topic/concept name (use syllabus topic names when they match)",
      "frequency": <number of papers this topic appeared in>,
      "yearsAppeared": ["2024", "2023", "2022"],
      "estimatedMarks": <estimated total marks across appearances>
    }
  ]
}

Rules:
- Identify at least 5 and at most 15 topics
- Sort by frequency (highest first)
- Use the exact syllabus topic name if the PYQ topic matches one
- If a year/paper identifier is visible, include it in yearsAppeared
- If marks are visible on questions, sum them for estimatedMarks
- Be conservative — only include topics you are reasonably confident about`;

        const result = await callAI(systemPrompt, userPrompt);

        if (!result) {
            return getMockPYQAnalysis();
        }

        return JSON.parse(result);
    } catch (error) {
        console.warn("[AI Service] analyzePYQ failed — returning mock response. Error:", error.message);
        return getMockPYQAnalysis();
    }
};

// ============================================================
// MOCK RESPONSES — Used when Gemini key is not configured
// ============================================================

const getMockSyllabusAnalysis = (subjectName) => ({
    summary: `${subjectName} is a comprehensive subject covering fundamental concepts and advanced applications. This syllabus is designed to build strong theoretical and practical knowledge.`,
    overallDifficulty: "medium",
    totalEstimatedHours: 40,
    studyStrategy: "Start with foundational units, then move to complex topics. Practice problems regularly.",
    difficultyBreakdown: { easy: 30, medium: 50, hard: 20 },
    units: [
        {
            unitNumber: 1,
            unitName: "Introduction and Fundamentals",
            topics: [
                { name: "Basic Concepts", importance: "high", difficulty: "easy", estimatedHours: 2, marksWeightage: 10, summary: "Core definitions and principles" },
                { name: "Historical Overview", importance: "medium", difficulty: "easy", estimatedHours: 1, marksWeightage: 5, summary: "Background and evolution" },
            ],
        },
        {
            unitNumber: 2,
            unitName: "Core Principles",
            topics: [
                { name: "Primary Algorithms", importance: "critical", difficulty: "hard", estimatedHours: 5, marksWeightage: 20, summary: "Most important — likely exam question" },
                { name: "Applied Methods", importance: "high", difficulty: "medium", estimatedHours: 4, marksWeightage: 15, summary: "Practical applications" },
            ],
        },
    ],
    topPriorityTopics: ["Primary Algorithms", "Applied Methods", "Basic Concepts"],
    examLikelyTopics: ["Primary Algorithms", "Core Principles"],
    studyTips: [
        "Focus on high-importance topics first",
        "Solve past exam papers",
        "Create mind maps for complex topics",
    ],
});

const getMockStudyPlan = (daysRemaining, hoursPerDay, units) => ({
    planSummary: `Your personalized ${daysRemaining}-day study plan has been created. Focus on high-priority topics first and ensure daily revision.`,
    priorityTopics: ["Primary Algorithms", "Core Principles", "Applied Methods"],
    mustStudyTopics: ["Primary Algorithms", "Core Principles"],
    survivalStrategy: "Begin with the most important topics, spend more time on difficult areas, and revise every evening.",
    dailyPlans: Array.from({ length: Math.min(daysRemaining, 7) }, (_, i) => ({
        dayNumber: i + 1,
        dayLabel: `Day ${i + 1}`,
        topics: units.slice(0, 2).flatMap((u) =>
            u.topics.slice(0, 1).map((t) => ({
                topicName: t.name,
                unitName: u.unitName,
                estimatedHours: Math.min(t.estimatedHours, hoursPerDay / 2),
                importance: t.importance,
            }))
        ),
        plannedHours: hoursPerDay,
        studyTip: `Day ${i + 1}: Stay focused and take short breaks every 45 minutes.`,
    })),
});

const getMockCheatCode = (daysRemaining, subjectName) => ({
    mode: daysRemaining === 1 ? "1day" : daysRemaining <= 3 ? "3day" : "7day",
    message: `You have ${daysRemaining} day(s) left. Don't panic — focus and you can do this!`,
    survivalStrategy: "Cover only the highest-weightage topics. Skip anything with less than 5% exam probability.",
    mustStudyNow: [
        { topic: "Core Algorithms", unit: "Unit 2", reason: "Highest exam weightage", estimatedMarks: 20, studyTime: "3 hours" },
        { topic: "Fundamental Concepts", unit: "Unit 1", reason: "Foundation for all other topics", estimatedMarks: 15, studyTime: "2 hours" },
    ],
    skipTopics: [
        { topic: "Historical Overview", reason: "Low weightage, time not worth it" },
    ],
    hourlySchedule: [
        { timeSlot: "9:00 AM - 11:00 AM", task: "Study Core Algorithms", topic: "Core Algorithms" },
        { timeSlot: "11:30 AM - 1:00 PM", task: "Study Fundamental Concepts", topic: "Fundamental Concepts" },
        { timeSlot: "2:00 PM - 4:00 PM", task: "Revision + Practice Problems", topic: "All Topics" },
        { timeSlot: "4:30 PM - 6:00 PM", task: "Formula Sheet + Quick Notes", topic: "All Topics" },
    ],
    lastMinuteTips: [
        "Write key formulas on a single page",
        "Focus on definitions — they carry easy marks",
        "Attempt all questions — partial marks count",
    ],
    expectedScore: { minimum: 35, expected: 55, maximum: 75 },
});

const getMockPYQAnalysis = () => ({
    pyqSuggestedTopics: [
        { topic: "Primary Algorithms", frequency: 4, yearsAppeared: ["2024", "2023", "2022", "2021"], estimatedMarks: 20 },
        { topic: "Data Structures", frequency: 3, yearsAppeared: ["2024", "2023", "2022"], estimatedMarks: 15 },
        { topic: "Applied Methods", frequency: 3, yearsAppeared: ["2024", "2022", "2021"], estimatedMarks: 12 },
        { topic: "Complexity Analysis", frequency: 2, yearsAppeared: ["2023", "2021"], estimatedMarks: 10 },
    ],
});

module.exports = { analyzeSyllabus, generateStudyPlan, generateCheatCode, analyzePYQ };

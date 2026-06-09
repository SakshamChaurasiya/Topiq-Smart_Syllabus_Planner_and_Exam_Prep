/**
 * ai.service.js
 * Google Gemini API wrapper for all AI-powered features.
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

let genAI = null;
if (
    process.env.GEMINI_API_KEY &&
    process.env.GEMINI_API_KEY !== "your-gemini-api-key-here"
) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
}

const Groq = require("groq-sdk");

let groqClient = null;
if (
    process.env.GROQ_API_KEY &&
    process.env.GROQ_API_KEY !== "your-groq-api-key-here"
) {
    groqClient = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

const GROQ_MODEL = "llama-3.3-70b-versatile";

const callGroq = async (systemPrompt, userPrompt) => {
    if (!groqClient) {
        console.warn("[AI Service] Groq key not configured — skipping Groq fallback.");
        return null;
    }
    try {
        const completion = await groqClient.chat.completions.create({
            model: GROQ_MODEL,
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt },
            ],
            temperature: 0.7,
        });
        const text = completion.choices[0]?.message?.content || null;
        if (!text) return null;

        // Strip markdown fences same as Gemini cleanup
        const cleaned = text
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();
        return cleaned;
    } catch (error) {
        console.error("[AI Service] callGroq error:", error?.message);
        return null;
    }
};

const callAI = async (systemPrompt, userPrompt) => {
    if (!genAI) {
        console.warn("[AI Service] Gemini key not configured — returning mock response.");
        return null;
    }


    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-3.5-flash",
            systemInstruction: systemPrompt,
            generationConfig: {
                temperature: 0.7,
            },
        });

        const result = await model.generateContent(userPrompt);
        const text = result.response.text();

        // Strip markdown fences if Gemini wraps response despite JSON mode
        const cleaned = text
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

        return cleaned;

    } catch (error) {
        const status = error?.status;
        const isGeminiOverloaded = status === 503 || status === 429;

        if (isGeminiOverloaded) {
            console.warn(`[AI Service] Gemini returned ${status} — switching to Groq fallback.`);
            return await callGroq(systemPrompt, userPrompt);
        }

        console.error("[AI Service] callAI error:", error);
        return null;
    }
};

// ============================================================
// 1. ANALYZE SYLLABUS
// ============================================================
const analyzeSyllabus = async (
    syllabusText,
    subjectName,
    institution = ""
) => {
    try {
        const systemPrompt = `You are a strict syllabus parser. Your only job is to extract and structure 
information that is explicitly written in the syllabus text provided by the user.

STRICT RULES — violating any of these makes your response useless:
- Do NOT invent, assume, or add any topic, unit, or concept that is not explicitly 
  written in the syllabus text.
- Do NOT rename topics. Use the exact words from the syllabus.
- Do NOT add topics from your general knowledge of the subject.
- If the syllabus mentions "Unit 1: Process Management" with sub-topics "Scheduling, 
  Deadlocks", those are the ONLY topics for Unit 1. Do not add more.
- estimatedHours must be your honest estimate for a student to study that topic 
  properly — not a placeholder.
- marksWeightage must add up to 100 across all topics combined.
- importance must reflect how much space and emphasis the syllabus itself gives 
  to the topic — more topics in a unit = more likely higher weightage per topic.
- Return valid JSON only. No explanation text outside the JSON.`;

        const institutionLine = institution
            ? `Institution: ${institution} — use this only to calibrate study tips and difficulty estimates, 
not to add topics.`
            : "";

        const userPrompt = `Parse this syllabus for subject "${subjectName}".
${institutionLine}

IMPORTANT: Extract ONLY the units and topics written below. Do not add anything else.

Return this exact JSON structure:
{
  "summary": "2-3 sentences describing the subject based only on what the syllabus says",
  "overallDifficulty": "easy|medium|hard|very-hard",
  "totalEstimatedHours": <sum of all topic estimatedHours>,
  "studyStrategy": "Recommended approach based on this specific syllabus structure",
  "difficultyBreakdown": { "easy": <percent>, "medium": <percent>, "hard": <percent> },
  "units": [
    {
      "unitNumber": <number as written in syllabus>,
      "unitName": "<exact unit name from syllabus>",
      "topics": [
        {
          "name": "<exact topic name from syllabus>",
          "importance": "critical|high|medium|low",
          "difficulty": "easy|medium|hard",
          "estimatedHours": <realistic hours to study this topic>,
          "marksWeightage": <estimated marks this topic carries out of 100 total>,
          "summary": "One sentence on what to focus on — based only on this topic's content"
        }
      ]
    }
  ],
  "topPriorityTopics": [
    "<topic name exactly as written above — pick the highest marksWeightage ones>"
  ],
  "examLikelyTopics": [
    "<topic name exactly as written above — pick based on weightage and importance only, 
    do NOT guess based on general subject knowledge>"
  ],
  "studyTips": ["<specific tip based on this syllabus structure>"]
}

SYLLABUS TEXT STARTS HERE:
---
${syllabusText}
---
SYLLABUS TEXT ENDS HERE.

Parse only what is above. Do not add anything that is not in that text.`;

        const result = await callAI(systemPrompt, userPrompt);
        if (!result) return getMockSyllabusAnalysis(subjectName);
        return JSON.parse(result);
    } catch (error) {
        console.warn(
            "[AI Service] analyzeSyllabus failed — returning mock. Error:",
            error.message
        );
        return getMockSyllabusAnalysis(subjectName);
    }
};

// ============================================================
// 1b. ANALYZE SYLLABUS FROM IMAGE / SCANNED PDF (Gemini Vision)
// ============================================================
/**
 * analyzeSyllabusFromImage(imageBuffer, mimeType, subjectName, institution)
 * Uses Gemini Vision multimodal API to extract + analyze a syllabus from an
 * image file (JPG, PNG, WEBP) or a scanned/image-based PDF.
 *
 * @param {Buffer} imageBuffer - raw file buffer
 * @param {string} mimeType    - 'image/jpeg' | 'image/png' | 'image/webp' | 'application/pdf'
 * @param {string} subjectName
 * @param {string} institution
 */
const analyzeSyllabusFromImage = async (
    imageBuffer,
    mimeType,
    subjectName,
    institution = ""
) => {
    try {
        if (!genAI) return getMockSyllabusAnalysis(subjectName);

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: { temperature: 0.2 },
        });

        const institutionLine = institution
            ? `Institution context (for difficulty calibration only, do NOT add topics from general knowledge): ${institution}`
            : "";

        const prompt = `You are analyzing a syllabus document provided as an image or scanned PDF.

${institutionLine}

VISION INSTRUCTIONS:
1. Read ALL visible text in the image carefully, including headers, sub-headings, and bullet points.
2. Identify unit headings, topic names, sub-topics, and any marks/weightage visible.
3. If text is partially cut off at edges, infer only if the meaning is unambiguous.
4. If the image quality is poor, extract what is legible and set imageReadability to "poor".
5. Do NOT add any topic that is not visibly written in the image.

STRICT RULES:
- Extract ONLY units and topics visible in this image. Do NOT use general knowledge of "${subjectName}".
- Use exact text as written in the image for topic names.
- estimatedHours = realistic study time per topic for a student.
- marksWeightage must sum to 100 across ALL topics combined.
- Return valid raw JSON only (no markdown fences).

Return this exact JSON:
{
  "summary": "2-3 sentences describing the subject based only on what is visible in the image",
  "overallDifficulty": "easy|medium|hard|very-hard",
  "totalEstimatedHours": <sum of all topic estimatedHours>,
  "studyStrategy": "Approach based on this specific syllabus structure",
  "difficultyBreakdown": { "easy": <percent>, "medium": <percent>, "hard": <percent> },
  "imageReadability": "clear|partial|poor",
  "units": [
    {
      "unitNumber": <number>,
      "unitName": "<exact name visible in image>",
      "topics": [
        {
          "name": "<exact topic name from image>",
          "importance": "critical|high|medium|low",
          "difficulty": "easy|medium|hard",
          "estimatedHours": <number>,
          "marksWeightage": <number>,
          "summary": "One sentence on what to focus on"
        }
      ]
    }
  ],
  "topPriorityTopics": ["<exact topic names>"],
  "examLikelyTopics": ["<exact topic names>"],
  "studyTips": ["<specific tip based on this syllabus>"]
}

Subject name: "${subjectName}"`;

        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: mimeType,
                                data: imageBuffer.toString("base64"),
                            },
                        },
                    ],
                },
            ],
        });

        const text = result.response.text();
        

        const cleaned = text
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

        const parsed = JSON.parse(cleaned);

        if (parsed.imageReadability === "poor") {
            console.warn("[AI Service] Image syllabus: poor readability reported by Gemini");
        }

        return parsed;

    } catch (error) {
        console.error("[AI Service] analyzeSyllabusFromImage failed:", error?.message);
        return getMockSyllabusAnalysis(subjectName);
    }
};

// ============================================================
// 2. GENERATE SMART STUDY PLAN
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
        const systemPrompt = `You are a strict academic study planner. You create day-by-day study schedules.

STRICT RULES:
- You may ONLY schedule topics that are explicitly listed in the syllabus units provided.
- Do NOT invent new topics or subtopics.
- Do NOT exceed ${availableHoursPerDay} planned hours on any single day.
- Every topic in the plan must come from the exact topic names in the syllabus units given.
- The targetGoal changes which topics get priority:
    pass (40%+): schedule only "critical" and "high" importance topics. Skip "low".
    good (65%+): schedule "critical", "high", and "medium" importance topics. Minimize "low".
    excellent (85%+): schedule all topics. Give more hours to "critical" and "hard" ones.
- Distribute topics so that critical topics appear in earlier days.
- If daysRemaining is less than the total estimated hours needed, prioritize by importance 
  and cut lower-importance topics — do not compress hours per topic to impossible levels.
- plannedHours for each day must equal the sum of estimatedHours of topics scheduled 
  that day and must not exceed ${availableHoursPerDay}.
- Return valid JSON only.`;

        // Build a structured topic list with all metadata so Gemini works from facts not memory
        const topicInventory = syllabusUnits.flatMap((u) =>
            u.topics.map((t) => ({
                unitNumber: u.unitNumber,
                unitName: u.unitName,
                topicName: t.name,
                importance: t.importance,
                difficulty: t.difficulty,
                estimatedHours: t.estimatedHours,
                marksWeightage: t.marksWeightage,
            }))
        );

        const totalTopicHours = topicInventory.reduce(
            (sum, t) => sum + t.estimatedHours,
            0
        );
        const totalAvailableHours = daysRemaining * availableHoursPerDay;
        const institutionLine = institution
            ? `Institution: ${institution}`
            : "";

        const userPrompt = `Create a study plan for the following student and subject.

Subject: ${subjectName}
${institutionLine}
Days remaining until exam: ${daysRemaining}
Hours available per day: ${availableHoursPerDay}
Target goal: ${targetGoal}
Total hours available: ${totalAvailableHours}
Total hours needed to cover full syllabus: ${totalTopicHours}

COMPLETE TOPIC LIST (use ONLY these topics — exact names, units, and hours):
${JSON.stringify(topicInventory, null, 2)}

Goal-based filtering rule for this plan (targetGoal = "${targetGoal}"):
${targetGoal === "pass"
                ? '- Include ONLY topics with importance "critical" or "high". Skip "medium" and "low".'
                : targetGoal === "good"
                    ? '- Include topics with importance "critical", "high", and "medium". Minimize "low" importance topics.'
                    : '- Include ALL topics. Give extra time to "critical" and "hard" topics.'
            }

${totalTopicHours > totalAvailableHours
                ? `WARNING: Total syllabus hours (${totalTopicHours}h) exceed available time (${totalAvailableHours}h). 
Apply goal-based filtering strictly to cut lower-priority topics. 
Do NOT compress a topic's estimatedHours below what is listed above.`
                : ""
            }

Return this exact JSON:
{
  "planSummary": "2-3 sentences describing this specific plan based on the topics above",
  "priorityTopics": ["<exact topic names from the list above, ordered by importance>"],
  "mustStudyTopics": ["<exact topic names marked critical or high from list above>"],
  "survivalStrategy": "Specific advice for this subject and goal combination",
  "dailyPlans": [
    {
      "dayNumber": 1,
      "dayLabel": "Day 1 — <short label based on units/topics scheduled>",
      "topics": [
        {
          "topicName": "<exact name from topic list above>",
          "unitName": "<exact unit name from topic list above>",
          "estimatedHours": <use the exact estimatedHours from the topic list above>,
          "importance": "<exact importance from topic list above>"
        }
      ],
      "plannedHours": <sum of topic estimatedHours for this day, max ${availableHoursPerDay}>,
      "studyTip": "Specific tip relevant to the topics scheduled for this day"
    }
  ]
}

Create exactly ${Math.min(daysRemaining, 30)} daily plan entries.
plannedHours on any day must not exceed ${availableHoursPerDay}.
Do not repeat the same topic on multiple days unless it is explicitly marked 
"critical" and has more than 3 estimatedHours — in that case split it across days 
and note the split in the studyTip.`;

        const result = await callAI(systemPrompt, userPrompt);
       
        if (!result)
            return getMockStudyPlan(daysRemaining, availableHoursPerDay, syllabusUnits);
        return JSON.parse(result);
    } catch (error) {
        console.warn(
            "[AI Service] generateStudyPlan failed — returning mock. Error:",
            error.message
        );
        return getMockStudyPlan(daysRemaining, availableHoursPerDay, syllabusUnits);
    }
};

// ============================================================
// 3. CHEAT CODE — CRISIS MODE
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
        const systemPrompt = `You are an exam crisis planner. A student has very little time before their exam.
Your job is to tell them exactly what to study from their specific syllabus to maximize marks.

STRICT RULES:
- Only recommend topics that are in the syllabus topic list provided by the user.
- Do NOT suggest generic advice like "study algorithms" if that is not a topic in their syllabus.
- mustStudyNow must contain only topics from the list provided, using exact names.
- skipTopics must contain only topics from the list provided, using exact names.
- The hourlySchedule must fit within ${availableHoursPerDay} hours total for the day.
- Time slots in hourlySchedule must be realistic and add up to no more than ${availableHoursPerDay} hours.
- estimatedMarks in mustStudyNow must use the marksWeightage values from the topic list.
- expectedScore must be a rough honest estimate — not optimistic fiction.
- Return valid JSON only.`;

        const allTopics = syllabusUnits.flatMap((u) =>
            u.topics.map((t) => ({
                topicName: t.name,
                unitName: u.unitName,
                importance: t.importance,
                difficulty: t.difficulty,
                estimatedHours: t.estimatedHours,
                marksWeightage: t.marksWeightage,
            }))
        );

        const totalMarks = allTopics.reduce((s, t) => s + (t.marksWeightage || 0), 0);
        const institutionLine = institution ? `Institution: ${institution}` : "";

        const userPrompt = `A student has ${daysRemaining} day(s) left before their ${subjectName} exam.
${institutionLine}
Study hours available today: ${availableHoursPerDay} hours
Target: ${targetGoal}

COMPLETE TOPIC LIST (only recommend from this list — use exact topic names):
${JSON.stringify(allTopics, null, 2)}

Total marks across all topics: ${totalMarks}

Decision rules for this crisis mode:
- mustStudyNow: topics with importance "critical" first, then "high". 
  If ${daysRemaining} === 1, only "critical". If <= 3, "critical" + "high". 
  If <= 7, all except "low" difficulty topics with low importance.
- skipTopics: topics with importance "low", or topics that are "hard" difficulty 
  AND "medium" importance when time is severely limited.
- hourlySchedule: create time slots starting from 9:00 AM. 
  Each slot is 1.5-2 hours. Total slots must not exceed ${availableHoursPerDay} hours.
  Assign only mustStudyNow topics to slots. Last slot = revision.

Return this exact JSON:
{
  "mode": "${daysRemaining === 1
                ? "1day"
                : daysRemaining <= 3
                    ? "3day"
                    : daysRemaining <= 7
                        ? "7day"
                        : "15day"
            }",
  "message": "Honest, direct message — no false hope, no panic",
  "survivalStrategy": "Specific strategy for this subject with this much time",
  "mustStudyNow": [
    {
      "topic": "<exact topic name from the list above>",
      "unit": "<exact unit name from the list above>",
      "reason": "Why this specific topic is critical for this exam",
      "estimatedMarks": <marksWeightage value from list above>,
      "studyTime": "<realistic time e.g. '2 hours'>"
    }
  ],
  "skipTopics": [
    {
      "topic": "<exact topic name from the list above>",
      "reason": "Specific reason why this can be skipped given time constraint"
    }
  ],
  "hourlySchedule": [
    {
      "timeSlot": "9:00 AM - 10:30 AM",
      "task": "What exactly to do in this slot",
      "topic": "<exact topic name from list above>"
    }
  ],
  "lastMinuteTips": [
    "<specific tip for this subject, not generic advice>"
  ],
  "expectedScore": {
    "minimum": <lowest realistic marks if student studies mustStudyNow only>,
    "expected": <expected marks with focused effort on mustStudyNow>,
    "maximum": <best case if everything goes well>
  }
}`;

        const result = await callAI(systemPrompt, userPrompt);
        if (!result) return getMockCheatCode(daysRemaining, subjectName);
        return JSON.parse(result);
    } catch (error) {
        console.warn(
            "[AI Service] generateCheatCode failed — returning mock. Error:",
            error.message
        );
        return getMockCheatCode(daysRemaining, subjectName);
    }
};

// ============================================================
// 4. ANALYZE PYQ
// ============================================================
const analyzePYQ = async (pyqText, existingTopics = []) => {
    try {
        const systemPrompt = `You are a strict past year question paper analyzer.
Your job is to cross-reference questions found in exam papers against 
a known syllabus topic list provided by the student.

STRICT RULES:
- You may ONLY return topics that appear in the "Known Syllabus Topics" list below.
- Do NOT invent new topic names or use synonyms. Use the exact topic name from the list.
- If a question in the PYQ clearly maps to a syllabus topic, include it.
- If a question does not clearly map to any syllabus topic, ignore it.
- frequency = number of separate papers/years the topic appeared in, not number of questions.
- estimatedMarks = sum of marks visible on those questions across all papers. 
  If marks are not visible, estimate based on question count × typical marks per question.
- Return valid JSON only.`;

        // Format the syllabus topic list clearly so Gemini can match against it
        const topicList = existingTopics.map((t, i) => `${i + 1}. "${t}"`).join("\n");

        const userPrompt = `Cross-reference the following past year question papers against this syllabus topic list.

KNOWN SYLLABUS TOPICS (you may ONLY return topics from this list, using exact names):
${topicList}

PAST YEAR QUESTION PAPERS TEXT:
---
${pyqText}
---

Instructions:
1. Read each question in the papers above.
2. Identify which syllabus topic from the list above each question belongs to.
3. If a question does not match any topic in the list, ignore it completely.
4. Count how many different papers/years each syllabus topic appeared in.
5. Note visible year/paper identifiers if present (e.g. "2023", "Paper 1").
6. Sum up marks for each topic where marks are visible.

Return this exact JSON:
{
  "pyqSuggestedTopics": [
    {
      "topic": "<exact topic name from the syllabus list above — no synonyms>",
      "frequency": <number of different papers this topic appeared in>,
      "yearsAppeared": ["<year or paper label if visible>"],
      "estimatedMarks": <total marks from all appearances, or 0 if not visible>
    }
  ]
}

Sort pyqSuggestedTopics by frequency descending.
Only include topics that actually appeared in the papers above.
Minimum 1 topic, maximum equal to the number of topics in the syllabus list.
Do not include topics with frequency 0.`;

        const result = await callAI(systemPrompt, userPrompt);
        if (!result) return getMockPYQAnalysis();
        return JSON.parse(result);
    } catch (error) {
        console.warn(
            "[AI Service] analyzePYQ failed — returning mock. Error:",
            error.message
        );
        return getMockPYQAnalysis();
    }
};

// ============================================================
// MOCK RESPONSES
// ============================================================

const getMockSyllabusAnalysis = (subjectName) => ({
    summary: `${subjectName} covers fundamental concepts and applied techniques. This mock response appears because no Gemini API key is configured.`,
    overallDifficulty: "medium",
    totalEstimatedHours: 40,
    studyStrategy: "Configure your Gemini API key to get a real analysis.",
    difficultyBreakdown: { easy: 30, medium: 50, hard: 20 },
    units: [
        {
            unitNumber: 1,
            unitName: "Sample Unit (Mock)",
            topics: [
                {
                    name: "Sample Topic 1",
                    importance: "high",
                    difficulty: "easy",
                    estimatedHours: 2,
                    marksWeightage: 10,
                    summary: "This is mock data — add your Gemini API key.",
                },
                {
                    name: "Sample Topic 2",
                    importance: "critical",
                    difficulty: "hard",
                    estimatedHours: 4,
                    marksWeightage: 20,
                    summary: "This is mock data — add your Gemini API key.",
                },
            ],
        },
    ],
    topPriorityTopics: ["Sample Topic 2", "Sample Topic 1"],
    examLikelyTopics: ["Sample Topic 2"],
    studyTips: ["Add your Gemini API key in .env to get real study tips."],
});

const getMockStudyPlan = (daysRemaining, hoursPerDay, units) => ({
    planSummary: `Mock ${daysRemaining}-day plan. Configure Gemini API key for a real personalized plan.`,
    priorityTopics: ["Sample Topic 2", "Sample Topic 1"],
    mustStudyTopics: ["Sample Topic 2"],
    survivalStrategy: "Add your Gemini API key to get a real strategy.",
    dailyPlans: Array.from({ length: Math.min(daysRemaining, 7) }, (_, i) => ({
        dayNumber: i + 1,
        dayLabel: `Day ${i + 1} (Mock)`,
        topics: units.slice(0, 1).flatMap((u) =>
            u.topics.slice(0, 1).map((t) => ({
                topicName: t.name,
                unitName: u.unitName,
                estimatedHours: Math.min(t.estimatedHours, hoursPerDay),
                importance: t.importance,
            }))
        ),
        plannedHours: hoursPerDay,
        studyTip: `Day ${i + 1} mock tip — configure Gemini for real tips.`,
    })),
});

const getMockCheatCode = (daysRemaining, subjectName) => ({
    mode:
        daysRemaining === 1
            ? "1day"
            : daysRemaining <= 3
                ? "3day"
                : "7day",
    message: `Mock cheat code for ${subjectName}. Add Gemini API key for real crisis planning.`,
    survivalStrategy: "Configure your Gemini API key to get a real survival strategy.",
    mustStudyNow: [
        {
            topic: "Sample Topic 2",
            unit: "Sample Unit (Mock)",
            reason: "Mock data — highest weightage topic",
            estimatedMarks: 20,
            studyTime: "3 hours",
        },
    ],
    skipTopics: [
        {
            topic: "Sample Topic 1",
            reason: "Mock data — lower weightage",
        },
    ],
    hourlySchedule: [
        {
            timeSlot: "9:00 AM - 12:00 PM",
            task: "Study highest priority topic",
            topic: "Sample Topic 2",
        },
        {
            timeSlot: "1:00 PM - 3:00 PM",
            task: "Quick revision",
            topic: "Sample Topic 2",
        },
    ],
    lastMinuteTips: ["Configure Gemini API key for subject-specific tips."],
    expectedScore: { minimum: 35, expected: 50, maximum: 70 },
});

const getMockPYQAnalysis = () => ({
    pyqSuggestedTopics: [
        {
            topic: "Sample Topic 2",
            frequency: 3,
            yearsAppeared: ["2024", "2023", "2022"],
            estimatedMarks: 20,
        },
        {
            topic: "Sample Topic 1",
            frequency: 2,
            yearsAppeared: ["2024", "2023"],
            estimatedMarks: 10,
        },
    ],
});

// ============================================================
// 5. GENERATE FLASHCARDS
// ============================================================
const generateFlashcards = async (topics) => {
    try {
        const systemPrompt = `You are a strict, concise academic flashcard generator.
Your job is to generate study questions and answers based ONLY on the topic details provided.
You must return valid JSON only.`;

        const userPrompt = `Generate one flashcard for each topic in the list below.
Each card must have:
- "front": A concise, clear question about the topic (e.g., "What is [topic]?" or "Explain the main differences in [topic]").
- "back": A high-yield, concise 2-3 line answer explaining the key concepts a student needs for their exam.
- "importance": The original topic importance.
- "difficulty": The original topic difficulty.

Topics:
${JSON.stringify(topics, null, 2)}

Return this exact JSON format:
{
  "flashcards": [
    {
      "front": "What is...",
      "back": "Key concepts...",
      "importance": "critical|high",
      "difficulty": "easy|medium|hard"
    }
  ]
}
`;
        const result = await callAI(systemPrompt, userPrompt);
        console.log("[DEBUG] analyzeSyllabus callAI returned:", result === null ? "NULL" : result?.slice(0, 100));
        if (!result) return null;
        return JSON.parse(result);
    } catch (error) {
        console.warn("[AI Service] generateFlashcards failed:", error.message);
        return null;
    }
};

const analyzePYQFromFile = async (pdfBuffer, existingTopics = []) => {
    try {
        if (!genAI) return getMockPYQAnalysis();

        console.log("[DEBUG] PYQ topics received:", existingTopics.length, existingTopics.slice(0, 3));

        const topicList = existingTopics.map((t, i) => `${i + 1}. "${t}"`).join("\n");

        const prompt = `You are analyzing a past year exam question paper. This PDF may be:
- A scanned image with no text layer (use vision to read it)
- Low quality or blurry (do your best to read questions)
- In Hindi, English, or a mix of both languages

IMPORTANT READING INSTRUCTIONS:
1. This is a VISUAL task. Read the document as an image, not as text.
2. If text is blurry, infer the most likely question topic from context.
3. If the paper is in Hindi, translate questions mentally to match the English topic names below.
4. If the paper mixes Hindi and English, handle both.
5. Do NOT give up if quality is poor — make your best match attempt.

KNOWN SYLLABUS TOPICS (return ONLY topics from this exact list, using exact names):
${topicList}

MATCHING RULES:
- Match each visible/inferable question to the closest topic in the list above.
- For Hindi papers: mentally translate the question, then match to the English topic name.
- For blurry text: use surrounding context (unit numbers, keywords) to infer the topic.
- If a question is completely unreadable and uninferable, skip it.
- If a question partially matches a topic, include it with frequency 1.
- Use EXACT topic names from the list — no synonyms, no translations in output.

Return this exact JSON (raw JSON only, no markdown, no explanation):
{
  "pyqSuggestedTopics": [
    {
      "topic": "<exact topic name from syllabus list above>",
      "frequency": <number of papers/years this appeared>,
      "yearsAppeared": ["<year if visible, else 'Unknown'>"],
      "estimatedMarks": <marks if visible, else 0>
    }
  ],
  "readabilityNote": "<one line — was the PDF clear, blurry, Hindi, scanned, etc.>"
}

Sort by frequency descending.
Only include topics that actually appear in this document.
If you could not read anything at all, return: { "pyqSuggestedTopics": [], "readabilityNote": "Could not read document" }`;

        const model = genAI.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: 0.1,
            },
        });

        const result = await model.generateContent({
            contents: [
                {
                    role: "user",
                    parts: [
                        { text: prompt },
                        {
                            inlineData: {
                                mimeType: "application/pdf",
                                data: pdfBuffer.toString("base64"),
                            },
                        },
                    ],
                },
            ],
        });

        const text = result.response.text();
       

        const cleaned = text
            .replace(/^```(?:json)?\s*/i, "")
            .replace(/\s*```$/i, "")
            .trim();

        const parsed = JSON.parse(cleaned);

        

        // If Gemini explicitly said it couldn't read anything
        if (!parsed.pyqSuggestedTopics || parsed.pyqSuggestedTopics.length === 0) {
            console.warn("[AI Service] PYQ returned 0 topics — poor quality or unreadable PDF");
            // Return a special response so frontend can show a helpful message
            return {
                pyqSuggestedTopics: [],
                readabilityNote: parsed.readabilityNote || "Could not extract questions from this PDF",
                unreadable: true,
            };
        }

        return parsed;

    } catch (error) {
        console.error("[AI Service] analyzePYQFromFile failed:", error?.message);
        console.error("[AI Service] Full PYQ error:", JSON.stringify(error, null, 2));
        return getMockPYQAnalysis();
    }
};

module.exports = {
    analyzeSyllabus,
    analyzeSyllabusFromImage,
    generateStudyPlan,
    generateCheatCode,
    analyzePYQ,
    generateFlashcards,
    analyzePYQFromFile,
};
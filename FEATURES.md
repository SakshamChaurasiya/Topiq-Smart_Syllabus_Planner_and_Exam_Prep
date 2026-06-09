# Topiq — Feature Documentation

> AI-powered exam preparation for students who want results, not routines.

---

## Overview
Topiq is an AI-powered exam preparation platform designed specifically for college and university students facing dense academic curricula and tight deadlines. By transforming raw, unstructured syllabus documents into organized study schedules and active learning materials, the application helps students plan their revision systematically. Unlike generic study trackers that require manual task input and offer no guidance on content prioritization, Topiq uses Google Gemini AI to analyze course structures, prioritize high-value exam topics, and construct daily structured goals. This approach reduces scheduling overhead and aligns study efforts directly with past exam trends and exam weighting.

---

## Feature List

### 1. Secure Authentication & Student Profiles
**Category:** Core
**Status:** Implemented

#### What it does
Students register and authenticate securely to save their academic profile and personal preferences. The student profile tracks metrics like active study goals, institutions, levels, streaks, and experience points (XP).

#### Key capabilities
- Standard user signup and login with secure credential validation.
- Profile storage for name, email, college or university, and study preferences.
- Academic goal selection (Pass, Score, or Topper Mode) that directly structures subsequent AI-generated materials.
- Interactive profile dashboard tracking gamification status, current streaks, and experience metrics.

#### Technical implementation
Authentication is powered by JSON Web Tokens (JWT) for session persistence, with password hashing performed via `bcryptjs` on a MongoDB backend using Mongoose models.

---

### 2. Subject Management
**Category:** Core
**Status:** Implemented

#### What it does
Students create and organize their college subjects within a centralized list. Each subject tracks its exam date, credit hours, and styling preferences, displaying a visual ring representing completed coursework.

#### Key capabilities
- Create, view, update, and delete subjects with unique subject names, course codes, and theme colors.
- Visual per-subject progress rings implemented using native SVG to track overall syllabus coverage.
- Cascade-deletion logic that removes all associated data including syllabus files, generated plans, and daily missions.

#### Technical implementation
Subject records are stored in MongoDB, with standard RESTful routes handling CRUD operations and Mongoose middleware managing cascading deletions.

---

### 3. AI Syllabus Analysis
**Category:** AI-Powered
**Status:** Implemented

#### What it does
Students upload their course syllabus to receive a structured breakdown of units, topics, and study suggestions. The system analyzes the syllabus content to categorize topics by importance and difficulty.

#### Key capabilities
- Support for multi-format uploads including PDF documents, images (JPG, PNG, WEBP), and raw text copy-paste.
- Automated extraction of units, topics, marks weightage, estimated hours, difficulty, and study tips.
- Factual extraction settings to prevent the AI from generating nonexistent topics or course contents.
- Graceful fallback mechanism to structured mock data if the external AI service is unreachable.

#### Technical implementation
Text extraction utilizes `pdf-parse` for digital PDFs and Gemini Vision APIs via the Google Gemini SDK for scanned PDFs or images, running at a temperature of 0.1 for deterministic outputs.

---

### 4. Smart Study Planner
**Category:** Planning
**Status:** Implemented

#### What it does
Generates a custom, day-by-day study roadmap from the current date leading up to the subject's exam date. The planner automatically distributes topic coverage based on the student's daily hour availability and chosen target academic goal.

#### Key capabilities
- Formulates a custom daily calendar roadmap capped at a maximum of 30 days.
- Filters topic scheduling dynamically based on target goals: 'pass' schedules only critical and high-importance topics, 'good' includes medium-importance, and 'excellent' schedules all topics.
- Respects exact estimated study hours extracted during syllabus analysis.
- Automated redistribution of missed study days' topics across remaining calendar days.
- Calendar subscription export creating an .ics file compatible with major calendar clients.

#### Technical implementation
The calendar logic maps out available days using `date-fns`, computes scheduling limits in Node.js, and uses `ics` file generation formats to export standard RFC 5545 calendar files.

---

### 5. Crisis Mode — Exam Survival
**Category:** Planning
**Status:** Implemented

#### What it does
Helps students prepare for exams under extreme time constraints by trimming down study materials to absolute essentials. It offers short timeline presets, schedules study hours, and provides an estimated score simulator.

#### Key capabilities
- Rigid timeline preparation presets ranging from 1 day, 3 days, 7 days, 15 days, or user-defined custom intervals.
- "Must Study Now" lists that highlight only critical-importance topics and their corresponding marks weights.
- "Skip Topics" recommendation list identifying low-priority topics safe to ignore to optimize limited preparation time.
- Hourly study slot timetables starting at 9 AM, capped by the student's daily available hour limit.
- Simulated exam score output displaying minimum, expected, and maximum scores alongside explicit disclaimer banners.

#### Technical implementation
The crisis schedule and score simulator are built using custom system prompts processed by Gemini AI (`gemini-2.0-flash`), which returns structured JSON schedules and estimates based on syllabus weightings.

---

### 6. PYQ Analysis — Past Year Paper Alignment
**Category:** AI-Powered
**Status:** Implemented

#### What it does
Students upload previous year question papers to find overlapping patterns and gaps between the actual syllabus list and actual exam trends.

#### Key capabilities
- Multi-page past year question paper PDF analysis, supporting both scanned images and text-layer documents.
- Cross-references parsed question concepts against the existing extracted syllabus topic database.
- Computes a triple-alignment categorization: Overlap Topics (high priority), PYQ-Only Topics (syllabus gaps), and AI-Only Topics (lower priority).
- Extracts frequency metrics, list of years appeared, and marks weightage per topic.

#### Technical implementation
Files are sent to Gemini Vision APIs using inline base64 data to process scanned contents, and concepts are matched against syllabus records via standard string matching algorithms in Node.js.

---

### 7. Gamification — XP, Levels, Streaks & Streak Freezes
**Category:** Gamification
**Status:** Implemented

#### What it does
Motivates students through reward points, level progressions, consecutive study streaks, and protects user progress with Streak Freeze Tokens if they miss active study days.

#### Key capabilities
- Grants Experience Points (XP) dynamically upon successful completion of daily study tasks.
- Automated level calculation utilizing a standardized progression threshold formula.
- Continuous consecutive-day streak counter that increments on active days.
- **Streak Freeze Protection**: Automatically consumes a Streak Freeze Token if a student misses a calendar day, preserving their consecutive-day streak.
- **Default Provisioning**: Every new student account is created with **3 free Streak Freeze Tokens** by default to protect initial progress.
- **Automatic Milestone Awards**:
  - **Weekly Milestones**: Awards 1 Streak Freeze Token on streak counts that are multiples of 7.
  - **Level Milestones**: Awards 1 Streak Freeze Token upon reaching any level that is a multiple of 5 (e.g. level 5, 10, 15...).
  - **30-Day Streak Milestone**: Awards 1 extra token upon reaching a 30-day streak count.
  - **100-Day Streak Milestone**: Awards 2 extra tokens upon reaching a 100-day streak count.
- **Visual Status Badges**: Displays a protective ice badge (`🧊`) with an interactive, hoverable tooltip showing active token counts next to the streak flame.

#### Technical implementation
- Streak validation and level calculations are managed by backend Mongoose hooks and middleware (`streakSync.js`) evaluating update timestamps, with level boundaries recalculated as `Level * 250 XP`.
- Streak protection logic intercepts reset operations, decrementing token counts and setting `streakFreezeUsedAt = now` to shield the active streak.
- Milestone logic in `mission.controller.js` triggers direct internal token awards and schedules corresponding dashboard alert notifications.

---

### 8. Daily Missions
**Category:** Gamification
**Status:** Implemented

#### What it does
Breaks down active study plans into individual daily tasks known as missions. Completing these missions guides active study habits and directly feeds into gamification metrics.

#### Key capabilities
- Generates three distinct task types: Study Sessions, Spaced Revisions, and End-of-Day Summaries.
- Supports tracking, updating, skipping, or completing tasks through the central dashboard.
- Automatically updates streak indicators and awards XP on task completion.
- Consolidated mission agenda showing tasks due today across all enrolled subjects.

#### Technical implementation
Missions are modeled as distinct documents linked to the user and subject, with state updates handled via REST API endpoints and verified by date helper functions.

---

### 9. AI Flashcards & Shareable Cheat Notes
**Category:** Sharing
**Status:** Implemented

#### What it does
Generates study resources from syllabus documents and allows students to publish them as public web links for peers. It includes a 3D flashcard interface with filtering and navigation utilities.

#### Key capabilities
- Automated creation of interactive questions and answers for critical and high importance syllabus topics.
- Interactive 3D CSS card flip interface supporting keyboard accessibility controls (Arrow keys for navigation, Spacebar for flip).
- Generates persistent shareable URLs accessible to external viewers without requiring an account.
- Public viewport displaying a read-only list of flashcards alongside registration prompts.

#### Technical implementation
The public routing uses token-based MongoDB query structures, while the deck interface utilizes native CSS 3D transforms (`preserve-3d`, `rotateY`) and standard browser event listeners.

---

### 10. Notification Center
**Category:** Core
**Status:** Implemented

#### What it does
Collects and displays in-app notifications and alerts regarding plan generations, exam reminders, and system updates.

#### Key capabilities
- Centralized in-app notification inbox showing alerts categorized by urgency and source type.
- Tracking of read and unread states for individual notification items.
- Actions to mark individual notifications as read or clear the entire inbox list.
- Real-time notification badge indicating new unseen items.

#### Technical implementation
Notifications are stored as user-linked MongoDB documents, fetched on page load, and managed via Express routes.

---

### 11. Rate Limiting & AI Request Caching
**Category:** Core
**Status:** Implemented

#### What it does
Protects external API resources and improves performance by preventing excessive requests and serving cached AI results when possible.

#### Key capabilities
- Restricts syllabus analysis actions to a maximum of 3 requests per hour per student.
- Limits past paper analysis to a maximum of 5 file uploads per hour per student.
- Automatically skips external Gemini AI calls if the syllabus file remains unchanged, returning a cached breakdown.
- Offers override headers to force a remote update when required.

#### Technical implementation
Rate limiting is managed in-memory via Node.js Map structures, returning HTTP 429 status codes with time-to-reset metadata, and cache validation utilizes MD5 hashes of file buffers.

---

### 12. Central Dashboard
**Category:** Core
**Status:** Implemented

#### What it does
Provides a unified overview of all subjects, outstanding missions, progress levels, and exam deadlines.

#### Key capabilities
- Readiness meter showing overall study progress calculated across all subjects.
- Urgency indicators showing days remaining until upcoming exams.
- Revision radar highlighting subjects with upcoming exams and progress below 30%.
- Contextual next-step recommendations that adapt to the student's current state.

#### Technical implementation
The dashboard aggregates subject, plan, and mission collections using MongoDB aggregation queries to compute overall completion percentages.

---

### 13. Confidence Rating Per Topic
**Category:** Gamification
**Status:** Implemented

#### What it does
Enables students to rate their understanding of a topic when completing daily study missions, checking off units/topics, or reviewing their roadmap. The self-assessment dynamically updates topic study priorities, recalculates spaced repetition intervals, and awards gamification bonus points.

#### Key capabilities
- **Three-tiered feedback**: Students choose between *Shaky*, *Okay*, or *Solid* confidence ratings.
- **Bonus rewards**: Completed tasks/missions grant additional XP based on self-reflection (+15 XP for Shaky, +5 XP for Solid).
- **Dynamic priority reallocation**: Flags *Shaky* topics by elevating their importance to `critical` in the syllabus, and sets *Solid* topics to `low` priority to direct future study cycles.
- **Cross-page visibility and integration**: Available seamlessly across three key user interfaces:
  * **Dashboard**: Opens inline beneath active study missions.
  * **Syllabus Page**: Renders inline when marking unit-wise topics completed directly in the course syllabus.
  * **Planner Page**: Renders inline when completing topics within the day-by-day study roadmap.
- **Unified Completion State**: Toggling topic completion on the Planner or Syllabus pages updates both views instantly, keeping the student's progress perfectly synchronized.

#### Technical implementation
- Modified the Mongoose `Mission` schema to save confidence enums.
- Implemented the `updateTopicPriority` utility to perform in-place updates of subdocument properties inside the Syllabus model.
- Designed a custom React component leveraging Vite build systems and Vanilla CSS transitions.

---

## User Workflow

1. **Signup & Setup**: The student registers an account and sets up a student profile, selecting a primary academic target goal (Pass Mode, Score Mode, or Topper Mode) that serves as the default configuration for study materials.
2. **Add Subjects**: The student populates their list of subjects, entering course codes, credit hours, exam dates, and matching color themes.
3. **Upload Syllabus**: For each subject, the student uploads a syllabus document via text copy-paste, digital PDF upload, or scanned document images.
4. **Run Analysis**: The student initiates AI analysis. The system parses the document, creating a structured list of units and topics marked by importance and difficulty.
5. **Upload Past Papers (Optional)**: To align their preparation with actual exam patterns, the student uploads past year question papers. The system cross-references papers against the syllabus to isolate high-frequency overlap areas and curriculum gaps.
6. **Generate Study Plan**: The student enters their daily study hour limits and generates a customized study plan. The system creates a calendar roadmap leading to the exam date, scheduling only the topics that correspond to the student's target academic goal.
7. **Export Calendar**: The student exports their generated study plan as an `.ics` file and imports it into external calendar applications (Google Calendar, Apple Calendar, or Outlook).
8. **Engage Crisis Mode (Alternative)**: Under severe time limitations, the student activates Crisis Mode. The system schedules a high-density, hour-by-hour study plan focusing exclusively on critical topics and displaying simulated test-score estimates.
9. **Complete Daily Missions**: The student tracks daily study tasks on the dashboard, marking missions as completed to earn experience points (XP) and maintain consecutive-day streaks.
10. **Study Flashcards**: The student generates interactive revision cards for key topics, studying them using the keyboard-controlled 3D interface.
11. **Share Cheat Notes**: The student publishes a set of flashcards as a persistent, public web link, sharing it with classmates for group study sessions.

---

## Tech Stack

### Backend
| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Runtime & Framework** | Node.js, Express.js | Core server environment and REST API routes handling |
| **Database & ORM** | MongoDB, Mongoose | Persistent storage, document schemas, and cascading relational cleanup |
| **AI Integration** | Google Gemini SDK (`@google/generative-ai`) | Core AI orchestrator utilizing the `gemini-2.0-flash` model for analysis and simulation |
| **Scanned Document AI** | Gemini Vision API | Directly analyzes scanned documents and images through base64 inline buffers |
| **Text Extraction** | pdf-parse | Parses and extracts plain text from digital text-layer PDF files |
| **Security** | bcryptjs, jsonwebtoken | Secure password hashing and token-based state authorization |
| **File Processing** | multer | Middleware handling file uploads and multi-part form data requests |
| **Utilities** | date-fns, crypto | Date arithmetic operations and secure unique token generation |

### Frontend
| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Framework** | React (Vite) | Main client runtime, modular building blocks, and dev server bundler |
| **Routing** | React Router DOM | Single-page application client routing and protected layouts |
| **State Management** | React Context API | Global authentication state, light/dark themes, and notification caches |
| **Styling** | Vanilla CSS | Custom properties, flat layout tokens, and bento styling definitions |
| **Iconography** | lucide-react | Vector iconography for headers, buttons, and status labels |
| **Utilities** | date-fns | Formats client calendar dates and calculates relative distance timeframes |
| **Notifications** | react-hot-toast | Non-blocking visual feedback overlays for system events |
| **Interactive UI** | CSS 3D Transforms | Hardware-accelerated 3D flashcard flip logic |
| **Typography** | Syne + DM Sans | Custom display and body fonts imported from Google Fonts |

---

## Architecture Notes

- **AI Prompt System & Temperature Calibration**: AI extraction runs at a temperature of 0.1, ensuring high determinism and eliminating hallucinated coursework topics. Prompts enforce strict output formatting rules, ensuring the AI behaves solely as an extraction parser grounded strictly in the user's uploaded syllabus content.
- **Graceful Failure & Mock Service Layer**: If the Google Gemini API is unresponsive or rate limits are reached, the system falls back to a mock data generation module. This allows the student to continue testing and generating structural planning elements without frontend errors.
- **In-Memory Rate Limiting**: Request limits are evaluated using a lightweight, sliding-window rate-limiter built in-memory via Node.js Maps. This limits resource consumption on a per-user basis without adding external dependency overheads like Redis.
- **Dual PDF Extraction Architecture**: The application separates digital and scanned documents. Standard digital PDFs run through `pdf-parse` to extract text quickly and cheaply, whereas scanned PDFs or images are sent directly to the Gemini Vision API for optical recognition.
- **Deterministic Syllabus & PYQ Alignment**: The triple-alignment calculation (isolating overlap topics, syllabus gaps, and paper-only concepts) is computed locally in the Node.js backend using exact string-matching and similarity indexing rather than delegating calculations to Gemini, ensuring absolute factual consistency and consistency of output structure.

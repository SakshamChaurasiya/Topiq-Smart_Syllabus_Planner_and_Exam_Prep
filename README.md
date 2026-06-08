# Topiq

AI-powered exam preparation platform for college students.

Topiq transforms unstructured college syllabuses into daily study roadmaps, gamified missions, and past-paper concepts using Google Gemini AI. The project demonstrates a solution to unstructured parsing, deterministic content mapping, and API fault-tolerance within a full-stack context.

## The Problem It Solves

Students have syllabuses but no structured way to extract priority information from them. Generic AI prompts produce hallucinated study plans not grounded in actual syllabus content. Topiq solves this by combining strict Gemini prompt engineering (temperature 0.1, extraction-only constraints) with PYQ cross-referencing to produce evidence-grounded study plans.

## Features

| Feature | Description |
| :--- | :--- |
| Secure Authentication | JSON Web Token authorization and student profiles |
| Subject Management | Create and delete course records with SVG progress indicators |
| AI Syllabus Analysis | Parse syllabus documents using Google Gemini Vision and pdf-parse |
| Smart Study Planner | Construct day-by-day roadmaps customized to study limits |
| Crisis Mode | Dense timetables and score simulations for emergency prep |
| PYQ Analysis | Map syllabus topics against past exam papers using Gemini |
| Gamification | User levels, experience points, study streak tracking, and Streak Freeze Token protection |
| Daily Missions | Automate study calendar tasks into dashboard items |
| AI Flashcards | Keyboard-accessible deck flips and public share links |
| Notification Center | Centralized system logs for notifications and alerts |
| Rate Limiting & Cache | File-hash cache and local rate limiting middleware |
| Central Dashboard | Dynamic analytics interface showing current progress metrics |

Full feature documentation is available in FEATURES.md.

## Tech Stack

### Backend

| Technology | Version | Role |
| :--- | :--- | :--- |
| Node.js | N/A | Server runtime environment |
| Express.js | ^5.2.1 | API routing framework |
| MongoDB + Mongoose | ^9.6.3 | Schema modeling and datastore persistence |
| @google/generative-ai | ^0.24.1 | Google Gemini AI orchestrator |
| pdf-parse | ^2.4.5 | Text extraction layer for digital files |
| multer | ^2.1.1 | Upload payload file middleware |
| bcryptjs | ^3.0.3 | Secure hashing algorithms for credentials |
| jsonwebtoken | ^9.0.3 | Token validation and stateless auth |
| dotenv | ^17.4.2 | Server configuration environment loader |

### Frontend

| Technology | Version | Role |
| :--- | :--- | :--- |
| React + Vite | N/A | Client application runtime and dev server |
| React Router DOM | N/A | Client router mapping for protected views |
| Vanilla CSS | N/A | Custom layout properties and bento grid styling |
| lucide-react | N/A | Responsive client-side vector icons |
| date-fns | N/A | Client calendar arithmetic |
| react-hot-toast | N/A | Floating alert status overlays |

## Project Structure

```text
backend/
  src/
    config/
      db.js
    controllers/
      auth.controller.js
      dashboard.controller.js
      flashcard.controller.js
      mission.controller.js
      notification.controller.js
      planner.controller.js
      subject.controller.js
      syllabus.controller.js
    middleware/
      auth.middleware.js
      upload.middleware.js
      aiRateLimit.middleware.js
    models/
      User.js
      Subject.js
      Syllabus.js
      StudyPlan.js
      Mission.js
      Notification.js
      FlashcardSet.js
    routes/
      auth.routes.js
      dashboard.routes.js
      flashcard.routes.js
      mission.routes.js
      notification.routes.js
      planner.routes.js
      subject.routes.js
      syllabus.routes.js
    services/
      ai.service.js
    utils/
      responseHelper.js
    index.js
  .env.example
  package.json

frontend/
  src/
    api/
      auth.api.js
      dashboard.api.js
      flashcard.api.js
      mission.api.js
      notification.api.js
      planner.api.js
      subject.api.js
      syllabus.api.js
    components/
      ui/
      gamification/
    context/
      AuthContext.jsx
      ThemeContext.jsx
      NotificationContext.jsx
    pages/
      Landing.jsx
      Login.jsx
      Register.jsx
      Dashboard.jsx
      Subjects.jsx
      SyllabusPage.jsx
      PlannerPage.jsx
      CheatCodePage.jsx
      MissionsPage.jsx
      NotificationsPage.jsx
      ProfilePage.jsx
      SharedCheatNote.jsx
    styles/
      variables.css
      animations.css
      components/
    App.jsx
    main.jsx
  index.html
  package.json
```

## Local Setup

1. Ensure prerequisites are installed: Node.js 18+ and a running local MongoDB instance or Atlas connection URI.
2. Clone the repository.
3. Set up the backend server:
   - Navigate to the backend folder: `cd backend`
   - Install dependencies: `npm install`
   - Copy the configuration template: `cp .env.example .env`
   - Populate the environment variables shown below.
   - Start the development server: `npm run dev`
4. Set up the frontend application:
   - Navigate to the frontend folder: `cd frontend`
   - Install dependencies: `npm install`
   - Start the development server: `npm run dev`
5. Access the user interface at `http://localhost:5173`.

### Environment Variables

Configure the `.env` file in the `backend` directory using the following keys:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key_from_aistudio.google.com
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Note: Get a free Gemini API key at aistudio.google.com/app/apikey. The app runs in mock/demo mode if GEMINI_API_KEY is not set — all AI features return structured placeholder data.

## API Reference

| Method | Endpoint | Description | Auth |
| :--- | :--- | :--- | :--- |
| POST | /api/auth/register | Register new student account | No |
| POST | /api/auth/login | Login and receive JWT token | No |
| GET | /api/dashboard | Fetch full dashboard data | Yes |
| GET | /api/subjects | List all subjects for user | Yes |
| POST | /api/subjects | Create a subject | Yes |
| POST | /api/syllabus/upload | Upload PDF or image syllabus | Yes |
| POST | /api/syllabus/text | Submit plain text syllabus | Yes |
| POST | /api/syllabus/:id/analyze | Run Gemini AI analysis | Yes |
| POST | /api/syllabus/:id/pyq-upload | Upload and analyze PYQ PDFs | Yes |
| POST | /api/planner/:id/generate | Generate AI study plan | Yes |
| GET | /api/planner/:id/export/ics | Export study plan as .ics file | Yes |
| POST | /api/planner/:id/reschedule | Reschedule missed study days | Yes |
| POST | /api/flashcards/generate | Generate AI flashcards | Yes |
| POST | /api/flashcards/:id/share | Create public share link | Yes |
| GET | /api/public/cheatnote/:token | View shared cheat note | No |
| GET | /api/streak-freeze | Get streak freeze tokens for user | Yes |
| POST | /api/streak-freeze/award | Award one streak freeze token to user | Yes |

All protected routes require Authorization: Bearer <token> header.

## Key Technical Decisions

1. **Gemini temperature set to 0.1 for syllabus extraction** — This guarantees highly deterministic topic extractions and prevents the AI model from hallucinating nonexistent topics.
2. **PYQ analysis uses Gemini Vision (inline base64) instead of pdf-parse** — This enables optical character recognition directly on scanned past papers or image-only exam sheets.
3. **Triple alignment calculated in Node.js, not by Gemini** — This prevents structural inconsistencies and guarantees matching accuracy by executing the overlap checks algorithmically on the backend.
4. **Rate limiting uses in-memory Map instead of Redis** — This keeps the project lightweight and simple to deploy, avoiding external database dependencies for basic api request limits.
5. **Graceful degradation returns structured mock data instead of errors** — This maintains user usability and testability when external AI servers or rate limits are reached.

## Known Limitations

- Push notifications not implemented (notification center is in-app only).
- Share links do not expire (no TTL on FlashcardSet shareToken).
- Rate limiting resets on server restart (in-memory, not persistent).
- No mobile app — web only, responsive design in progress.
- PYQ analysis accuracy depends on Gemini Vision's ability to read the specific PDF format — very low quality scans may produce incomplete results.
- Score simulator produces rough estimates only — explicitly disclaimed in UI.

## Roadmap

| Feature | Status | Priority |
| :--- | :--- | :--- |
| WhatsApp bot for daily reminders | Planned | High |
| PWA / offline support | Planned | High |
| Institution PYQ data aggregation | Planned | High |
| Pomodoro timer integrated with daily plan | Planned | Medium |
| Share link expiry (configurable TTL) | Planned | Medium |
| Spaced repetition algorithm for flashcards | Planned | Medium |
| Mobile app (React Native) | Considering | Low |

## License

Private repository. All rights reserved.

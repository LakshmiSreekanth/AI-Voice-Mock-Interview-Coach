# IntervAI — AI-Powered Voice & Technical Interview Coach

> **IntervAI** is a modern, flat-design web application where candidates practice job interviews with an AI coach. Paste any job description to generate 8 targeted interview questions, answer via live microphone speech or typing, and receive instant multi-signal scoring across **Content Quality**, **STAR Structure**, and **Communication Delivery**.

---

## 🌟 Key Highlights & Problem Solved

- **Personal Story**: Built because I needed interview practice myself — my score went from **4.2 to 7.1** in five practice sessions.
- **Job Description to 8 Questions**: Paste any job description or select an industry preset (**Junior Frontend Developer**, **Junior Full Stack Developer**, Senior Full Stack, Frontend React, Backend Systems, AI Engineer). Gemini AI dynamically generates 8 tailored questions spanning core concepts, architecture, debugging, and behavioral scenarios.
- **Voice & Speech Recognition**: Live browser microphone recording via Web Speech API (`webkitSpeechRecognition`), real-time waveform audio visualizer, transcript stream, and words-per-minute (WPM) tracking.
- **Multi-Signal Scoring Engine (Out of 10)**:
  1. **Content Scoring (45%)**: Evaluated by Gemini AI for technical depth, correctness, domain terminology, and trade-offs.
  2. **STAR Structure Scoring (35%)**: Rule-based & semantic detector checking Situation (S), Task (T), Action (A), and Measurable Result (R) with quantitative metric extraction (%, latency, $, users).
  3. **Communication Scoring (20%)**: Live filler word counter (&ldquo;um&rdquo;, &ldquo;uh&rdquo;, &ldquo;like&rdquo;, &ldquo;you know&rdquo;, &ldquo;actually&rdquo;, &ldquo;basically&rdquo;) combined with speech pace evaluation against the 130–160 WPM conversational benchmark.
- **Immediate Feedback Loop**: After every answer, review detected strengths, areas for improvement, STAR breakdown, and a high-scoring **Model Answer**.
- **Full Report Card**: Comprehensive end-of-interview report card diagnosing your primary **Weakest Area** with actionable coaching recommendations.
- **Progress Tracking Dashboard**: Interactive SVG trend chart visualizing score progression over time across all completed sessions.
- **Recruiter-Ready Code**: Pure React, custom CSS flat design system, Node.js, Express.js, SQLite, and 14 clean REST APIs without Vite or Tailwind.

---

## 📐 Scoring Formula & Engine Architecture

$$\text{Final Score} = (\text{Content} \times 0.45) + (\text{Structure} \times 0.35) + (\text{Communication} \times 0.20)$$

```
                                      [ Candidate Answer ]
                                       (Voice or Typed)
                                              │
                      ┌───────────────────────┼───────────────────────┐
                      ▼                       ▼                       ▼
            ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
            │ Gemini Flash AI  │    │  STAR Framework  │    │ Speech & Delivery│
            │  Content Scorer  │    │     Detector     │    │     Analyzer     │
            └─────────┬────────┘    └─────────┬────────┘    └─────────┬────────┘
                      │                       │                       │
               Content Score           Structure Score         Communication
                 (45% wt)                 (35% wt)             Score (20% wt)
                      │                       │                       │
                      └───────────────────────┼───────────────────────┘
                                              ▼
                                   [ Weighted Final Score ]
                                        (1.0 to 10.0)
```

---

## 🗄️ Database Architecture (SQLite 4-Table Schema)

The database (`server/intervai.db`) is structured with 4 relational tables:

1. **`users`**:
   - `id`, `name`, `email`, `password_hash`, `target_role`, `created_at`
2. **`sessions`**:
   - `id`, `user_id`, `job_title`, `job_description`, `experience_level`, `status`, `total_score`, `content_score`, `communication_score`, `structure_score`, `total_fillers`, `avg_wpm`, `weakest_area`, `summary_notes`, `created_at`, `completed_at`
3. **`questions_answers`**:
   - `id`, `session_id`, `question_index` (1–8), `question_text`, `question_category`, `expected_points`, `answer_text`, `audio_duration_seconds`, `word_count`, `wpm`, `filler_count`, `filler_breakdown_json`, `star_breakdown_json`, `content_score`, `communication_score`, `structure_score`, `final_score`, `strengths_json`, `weaknesses_json`, `model_answer`, `answered_at`
4. **`user_metrics`**:
   - `id`, `user_id`, `session_id`, `session_number`, `final_score`, `content_score`, `communication_score`, `structure_score`, `filler_count`, `avg_wpm`, `weakest_area`, `recorded_at`

---

## 🌐 14 RESTful APIs

| # | Method | Endpoint | Description |
|---|---|---|---|
| 1 | `POST` | `/api/auth/register` | Create candidate account (bcrypt hashed) |
| 2 | `POST` | `/api/auth/login` | Authenticate user & return JWT token |
| 3 | `GET` | `/api/auth/me` | Fetch active profile and demo status |
| 4 | `POST` | `/api/sessions/create` | Generate 8 questions from job description via Gemini |
| 5 | `GET` | `/api/sessions` | List candidate's interview sessions |
| 6 | `GET` | `/api/sessions/:id` | Fetch session details and question states |
| 7 | `POST` | `/api/sessions/:id/submit-answer` | Evaluate candidate answer across 3 scoring pillars |
| 8 | `POST` | `/api/sessions/:id/complete` | Finalize session, compute aggregates & weakest area |
| 9 | `GET` | `/api/sessions/:id/report` | Fetch full session report card and model answers |
| 10 | `GET` | `/api/dashboard/stats` | Aggregate dashboard statistics & progression trends |
| 11 | `GET` | `/api/dashboard/history` | Historical session summary list |
| 12 | `POST` | `/api/scoring/analyze-preview` | Interactive scoring engine test lab |
| 13 | `GET` | `/api/presets` | Preloaded industry job descriptions |
| 14 | `DELETE`| `/api/sessions/:id` | Delete an interview session |

---

## 🚀 Quickstart Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Build Frontend (Webpack Production Build)
```bash
npm run build
```

### 3. Start Full-Stack Server
```bash
npm start
```
Open **`http://localhost:5000`** in your browser.

### 4. Concurrent Development Mode (Server + Webpack Dev Server)
```bash
npm run dev
```

---

## 🎯 How to Explain This Project to Recruiters

When asked: *"Walk me through your favorite project"*:
> *"I built **IntervAI** because I needed realistic interview practice myself—my score improved from 4.2 to 7.1 across five sessions. Instead of just wrapping an LLM, I built an end-to-end full-stack platform using React, Node.js, Express, and SQLite with a custom multi-signal scoring engine.
>
> When a user pastes a job description, Gemini generates 8 tailored questions. The user answers via microphone with real-time speech recognition. The backend scores the transcript across three independent signals:
> 1. A filler word and speech pace engine that detects hesitations and calculates WPM.
> 2. A STAR structure engine that parses Situation, Task, Action, and quantifiable Results with numerical metrics.
> 3. Gemini Flash AI that evaluates technical depth, trade-offs, and generates a model answer.
>
> Those signals combine via a weighted formula into a final score out of 10. The candidate gets a full report card pinpointing their weakest area and an interactive dashboard tracking their progression over time."*

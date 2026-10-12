const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'intervai.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  // 1. users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      target_role TEXT DEFAULT 'Full Stack Software Engineer',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 2. sessions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      job_title TEXT NOT NULL,
      job_description TEXT NOT NULL,
      experience_level TEXT DEFAULT 'Mid-to-Senior',
      status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed'
      total_score REAL DEFAULT 0.0,
      content_score REAL DEFAULT 0.0,
      communication_score REAL DEFAULT 0.0,
      structure_score REAL DEFAULT 0.0,
      total_fillers INTEGER DEFAULT 0,
      avg_wpm REAL DEFAULT 0.0,
      weakest_area TEXT DEFAULT '',
      summary_notes TEXT DEFAULT '',
      resume_text TEXT DEFAULT '',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_at DATETIME,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
  `);

  // Safe migration for resume_text if table already exists
  try {
    db.exec(`ALTER TABLE sessions ADD COLUMN resume_text TEXT DEFAULT '';`);
  } catch (e) {
    // Column already exists
  }

  // 3. questions_answers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS questions_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id INTEGER NOT NULL,
      question_index INTEGER NOT NULL, -- 1 through 8
      question_text TEXT NOT NULL,
      question_category TEXT NOT NULL, -- 'Technical', 'Behavioral', 'System Design', 'Situational', etc.
      expected_points TEXT,
      answer_text TEXT DEFAULT '',
      audio_duration_seconds REAL DEFAULT 0.0,
      word_count INTEGER DEFAULT 0,
      wpm REAL DEFAULT 0.0,
      filler_count INTEGER DEFAULT 0,
      filler_breakdown_json TEXT DEFAULT '{}',
      star_breakdown_json TEXT DEFAULT '{}',
      content_score REAL DEFAULT 0.0,
      communication_score REAL DEFAULT 0.0,
      structure_score REAL DEFAULT 0.0,
      final_score REAL DEFAULT 0.0,
      strengths_json TEXT DEFAULT '[]',
      weaknesses_json TEXT DEFAULT '[]',
      model_answer TEXT DEFAULT '',
      answered_at DATETIME,
      FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );
  `);

  // 4. user_metrics table
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      session_id INTEGER NOT NULL,
      session_number INTEGER NOT NULL,
      final_score REAL NOT NULL,
      content_score REAL NOT NULL,
      communication_score REAL NOT NULL,
      structure_score REAL NOT NULL,
      filler_count INTEGER NOT NULL,
      avg_wpm REAL NOT NULL,
      weakest_area TEXT NOT NULL,
      recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY(session_id) REFERENCES sessions(id) ON DELETE CASCADE
    );
  `);

  seedDefaultData();
}

function seedDefaultData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount === 0) {
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('demo1234', salt);

    const userStmt = db.prepare(`
      INSERT INTO users (name, email, password_hash, target_role, created_at)
      VALUES (?, ?, ?, ?, datetime('now', '-14 days'))
    `);
    const userResult = userStmt.run('Alex Morgan', 'demo@intervai.dev', passwordHash, 'Senior Full Stack Engineer');
    const userId = userResult.lastInsertRowid;

    // Seed 4 progressive interview sessions (4.2 -> 5.1 -> 6.2 -> 7.1)
    const seedSessions = [
      {
        jobTitle: 'Frontend React Developer',
        jobDesc: 'Looking for a React developer proficient in hooks, performance optimization, state management, and modern CSS.',
        totalScore: 4.2,
        contentScore: 5.0,
        commScore: 3.5,
        structScore: 4.1,
        fillers: 28,
        wpm: 182,
        weakest: 'Filler Words & Speech Pace',
        dateOffset: '-12 days',
        notes: 'High filler word density ("um", "like") and speaking too fast under pressure.'
      },
      {
        jobTitle: 'Full Stack JavaScript Engineer',
        jobDesc: 'Node.js, Express, React, PostgreSQL/SQLite, REST APIs, Microservices architecture and clean code principles.',
        totalScore: 4.9,
        contentScore: 5.5,
        commScore: 4.6,
        structScore: 4.5,
        fillers: 21,
        wpm: 168,
        weakest: 'STAR Framework Structure',
        dateOffset: '-9 days',
        notes: 'Answers lacked distinct Measurable Results in the STAR structure.'
      },
      {
        jobTitle: 'Senior React & Node Engineer',
        jobDesc: 'Building scalable web applications, API design, database schemas, performance profiling and code reviews.',
        totalScore: 6.2,
        contentScore: 6.8,
        commScore: 6.0,
        structScore: 5.7,
        fillers: 12,
        wpm: 145,
        weakest: 'STAR Measurable Impact',
        dateOffset: '-5 days',
        notes: 'Pacing drastically improved. Need stronger quantifiable metrics for business impact.'
      },
      {
        jobTitle: 'Lead Software Engineer',
        jobDesc: 'Lead architecture decisions, mentor team members, design resilient RESTful APIs, and deliver high-impact user experiences.',
        totalScore: 7.1,
        contentScore: 7.6,
        commScore: 7.2,
        structScore: 6.5,
        fillers: 7,
        wpm: 138,
        weakest: 'Task Framing Precision',
        dateOffset: '-2 days',
        notes: 'Confident pacing, minimal fillers, clear action descriptions and compelling tech depth.'
      }
    ];

    const sessionInsert = db.prepare(`
      INSERT INTO sessions (
        user_id, job_title, job_description, status,
        total_score, content_score, communication_score, structure_score,
        total_fillers, avg_wpm, weakest_area, summary_notes, created_at, completed_at
      ) VALUES (?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?), datetime('now', ?))
    `);

    const metricInsert = db.prepare(`
      INSERT INTO user_metrics (
        user_id, session_id, session_number,
        final_score, content_score, communication_score, structure_score,
        filler_count, avg_wpm, weakest_area, recorded_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
    `);

    const qaInsert = db.prepare(`
      INSERT INTO questions_answers (
        session_id, question_index, question_text, question_category, expected_points,
        answer_text, audio_duration_seconds, word_count, wpm, filler_count,
        filler_breakdown_json, star_breakdown_json,
        content_score, communication_score, structure_score, final_score,
        strengths_json, weaknesses_json, model_answer, answered_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
    `);

    seedSessions.forEach((s, idx) => {
      const sessRes = sessionInsert.run(
        userId, s.jobTitle, s.jobDesc,
        s.totalScore, s.contentScore, s.commScore, s.structScore,
        s.fillers, s.wpm, s.weakest, s.notes, s.dateOffset, s.dateOffset
      );
      const sessId = sessRes.lastInsertRowid;

      metricInsert.run(
        userId, sessId, idx + 1,
        s.totalScore, s.contentScore, s.commScore, s.structScore,
        s.fillers, s.wpm, s.weakest, s.dateOffset
      );

      // Add a couple of questions for each completed session
      qaInsert.run(
        sessId, 1,
        'Can you describe a time when you optimized the performance of a slow React application?',
        'Technical & Behavioral',
        'Profiler tools, memoization, bundle splitting, virtualization, quantifiable metrics',
        'In my previous role at a SaaS platform, our dashboard took over 4 seconds to render. I profiled components using Chrome DevTools and React DevTools Profiler, discovered redundant re-renders in our main data grid, and implemented window virtual scrolling and useMemo. This dropped render latency from 4.2s to 650ms.',
        55.0, 52, s.wpm, Math.floor(s.fillers / 4),
        JSON.stringify({ "um": Math.floor(s.fillers / 6), "like": 1 }),
        JSON.stringify({ situation: true, task: true, action: true, result: true }),
        s.contentScore, s.commScore, s.structScore, s.totalScore,
        JSON.stringify(['Mentioned specific profiling tools (Chrome DevTools, React Profiler)', 'Quantified result with clear metrics (4.2s to 650ms)', 'Clear technical explanation of virtual scrolling']),
        JSON.stringify(['Could explain how bundle size or network payloads were affected', 'Pacing could have small pauses for emphasis']),
        'In my last position, our enterprise dashboard experienced severe lag with 1,000+ items rendered simultaneously. As lead frontend dev, I took ownership of diagnosing the bottleneck. Using React DevTools Profiler, I discovered unnecessary re-renders in table cells. I replaced full DOM rendering with react-window virtualization and wrapped expensive sorting routines in useMemo. As a result, initial load dropped by 84% from 4.2s to 650ms, improving user satisfaction scores by 35%.',
        s.dateOffset
      );
    });
  }
}

initDatabase();

module.exports = db;

const express = require('express');
const router = express.Router();
const db = require('../database');
const authMiddleware = require('../middleware/authMiddleware');
const { generateInterviewQuestions } = require('../services/gemini');
const { evaluateAnswer } = require('../services/scoringEngine');

const { PDFParse } = require('pdf-parse');

async function extractTextFromPdfBuffer(buffer) {
  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    await parser.destroy();
    if (result && result.text) {
      return result.text
        .replace(/--\s*\d+\s*of\s*\d+\s*--/gi, '')
        .replace(/\r\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    }
  } catch (err) {
    console.warn('[PDF] Parser error:', err.message);
  }
  return '';
}

// 0. POST /api/sessions/parse-resume - Extract clean text from PDF or text resume file
router.post('/parse-resume', authMiddleware, async (req, res) => {
  try {
    const { fileBase64, fileName } = req.body;
    if (!fileBase64) {
      return res.status(400).json({ error: 'No file content provided' });
    }

    const buffer = Buffer.from(fileBase64, 'base64');
    let text = '';

    const isPdf = (fileName && fileName.toLowerCase().endsWith('.pdf')) || buffer.slice(0, 5).toString('latin1').includes('%PDF');

    if (isPdf) {
      text = await extractTextFromPdfBuffer(buffer);
    } else {
      text = buffer.toString('utf8');
    }

    if (!text || text.trim().length < 15) {
      return res.status(400).json({
        error: 'Unable to extract text from this file. If it is an image or scanned PDF, please copy and paste your resume text directly.'
      });
    }

    return res.json({
      text: text.trim(),
      wordCount: text.trim().split(/\s+/).length,
      fileName
    });
  } catch (err) {
    console.error('Failed to parse resume:', err);
    return res.status(500).json({ error: 'Failed to extract text from resume: ' + err.message });
  }
});

// 4. POST /api/sessions/create
router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { jobTitle, jobDescription, experienceLevel, resumeText } = req.body;

    if (!jobDescription || jobDescription.trim().length < 15) {
      return res.status(400).json({ error: 'Please provide a realistic job description.' });
    }

    const title = (jobTitle || 'Software Engineer').trim();
    const desc = jobDescription.trim();
    const level = experienceLevel || 'Mid-to-Senior';
    let resume = (resumeText || '').trim();

    // Auto-detect and parse if raw PDF binary was submitted
    if (resume.startsWith('%PDF-') || resume.slice(0, 100).includes('%PDF-')) {
      try {
        const buf = Buffer.from(resume, 'binary');
        const parsedText = await extractTextFromPdfBuffer(buf);
        if (parsedText && parsedText.length > 20) {
          resume = parsedText;
          console.log('[Resume] Auto-extracted text from raw binary PDF upload, length:', resume.length);
        }
      } catch (e) {
        console.warn('Could not auto-extract binary PDF string:', e.message);
      }
    }

    // Insert session into SQLite
    const insertSession = db.prepare(`
      INSERT INTO sessions (user_id, job_title, job_description, experience_level, resume_text, status)
      VALUES (?, ?, ?, ?, ?, 'in_progress')
    `);
    const sessionResult = insertSession.run(req.user.id, title, desc, level, resume);
    const sessionId = sessionResult.lastInsertRowid;

    // Generate 8 tailored interview questions using Gemini AI matching resume and job description
    const questions = await generateInterviewQuestions(title, desc, level, resume);

    // Insert 8 questions into questions_answers table
    const insertQA = db.prepare(`
      INSERT INTO questions_answers (
        session_id, question_index, question_text, question_category, expected_points
      ) VALUES (?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((qList) => {
      for (const q of qList) {
        insertQA.run(sessionId, q.index, q.question, q.category, q.expectedPoints);
      }
    });

    insertMany(questions);

    // Retrieve full session with questions
    const createdSession = db.prepare('SELECT * FROM sessions WHERE id = ?').get(sessionId);
    const createdQuestions = db.prepare('SELECT * FROM questions_answers WHERE session_id = ? ORDER BY question_index ASC').all(sessionId);

    return res.status(201).json({
      message: 'Interview session created successfully with 8 questions',
      session: createdSession,
      questions: createdQuestions
    });
  } catch (err) {
    console.error('Session create error:', err);
    return res.status(500).json({ error: 'Failed to create interview session: ' + err.message });
  }
});

// 5. GET /api/sessions
router.get('/', authMiddleware, (req, res) => {
  try {
    const sessions = db.prepare(`
      SELECT id, job_title, status, total_score, content_score, communication_score, structure_score,
             total_fillers, avg_wpm, weakest_area, created_at, completed_at
      FROM sessions
      WHERE user_id = ?
      ORDER BY id DESC
    `).all(req.user.id);

    return res.json({ sessions });
  } catch (err) {
    console.error('Fetch sessions error:', err);
    return res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// 6. GET /api/sessions/:id
router.get('/:id', authMiddleware, (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = db.prepare('SELECT * FROM sessions WHERE id = ? AND user_id = ?').get(sessionId, req.user.id);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const rawQuestions = db.prepare('SELECT * FROM questions_answers WHERE session_id = ? ORDER BY question_index ASC').all(sessionId);

    const questions = rawQuestions.map(q => ({
      ...q,
      filler_breakdown: JSON.parse(q.filler_breakdown_json || '{}'),
      star_breakdown: JSON.parse(q.star_breakdown_json || '{}'),
      strengths: JSON.parse(q.strengths_json || '[]'),
      weaknesses: JSON.parse(q.weaknesses_json || '[]')
    }));

    return res.json({ session, questions });
  } catch (err) {
    console.error('Get session detail error:', err);
    return res.status(500).json({ error: 'Failed to load session details' });
  }
});

// 7. POST /api/sessions/:id/submit-answer
router.post('/:id/submit-answer', authMiddleware, async (req, res) => {
  try {
    const sessionId = req.params.id;
    const { questionIndex, answerText, audioDurationSeconds } = req.body;

    if (!answerText || answerText.trim().length === 0) {
      return res.status(400).json({ error: 'Answer text is required.' });
    }

    const session = db.prepare('SELECT * FROM sessions WHERE id = ? AND user_id = ?').get(sessionId, req.user.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    const question = db.prepare(`
      SELECT * FROM questions_answers
      WHERE session_id = ? AND question_index = ?
    `).get(sessionId, questionIndex);

    if (!question) {
      return res.status(404).json({ error: 'Question not found for this session.' });
    }

    // Run our 3-pillar scoring engine (Content by Gemini, STAR structure by detector, Communication by fillers & pace)
    const evaluation = await evaluateAnswer({
      questionText: question.question_text,
      answerText,
      audioDurationSeconds: Number(audioDurationSeconds || 0),
      jobTitle: session.job_title,
      jobDescription: session.job_description,
      resumeText: session.resume_text || ''
    });

    // Update question in database
    const updateQA = db.prepare(`
      UPDATE questions_answers
      SET answer_text = ?,
          audio_duration_seconds = ?,
          word_count = ?,
          wpm = ?,
          filler_count = ?,
          filler_breakdown_json = ?,
          star_breakdown_json = ?,
          content_score = ?,
          communication_score = ?,
          structure_score = ?,
          final_score = ?,
          strengths_json = ?,
          weaknesses_json = ?,
          model_answer = ?,
          answered_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);

    updateQA.run(
      answerText.trim(),
      evaluation.durationSeconds,
      evaluation.wordCount,
      evaluation.wpm,
      evaluation.fillerCount,
      JSON.stringify(evaluation.fillerBreakdown),
      JSON.stringify(evaluation.starBreakdown),
      evaluation.contentScore,
      evaluation.communicationScore,
      evaluation.structureScore,
      evaluation.finalScore,
      JSON.stringify(evaluation.strengths),
      JSON.stringify(evaluation.weaknesses),
      evaluation.modelAnswer,
      question.id
    );

    return res.json({
      message: 'Answer scored and saved successfully',
      questionIndex,
      evaluation
    });
  } catch (err) {
    console.error('Submit answer error:', err);
    return res.status(500).json({ error: 'Evaluation failed: ' + err.message });
  }
});

// 8. POST /api/sessions/:id/complete
router.post('/:id/complete', authMiddleware, (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = db.prepare('SELECT * FROM sessions WHERE id = ? AND user_id = ?').get(sessionId, req.user.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found.' });
    }

    // Calculate aggregated metrics across answered questions
    const answered = db.prepare(`
      SELECT * FROM questions_answers
      WHERE session_id = ? AND answer_text != ''
      ORDER BY question_index ASC
    `).all(sessionId);

    if (answered.length === 0) {
      return res.status(400).json({ error: 'No answers recorded in this session.' });
    }

    let sumFinal = 0;
    let sumContent = 0;
    let sumComm = 0;
    let sumStruct = 0;
    let sumWpm = 0;
    let totalFillers = 0;

    for (const q of answered) {
      sumFinal += q.final_score;
      sumContent += q.content_score;
      sumComm += q.communication_score;
      sumStruct += q.structure_score;
      sumWpm += q.wpm;
      totalFillers += q.filler_count;
    }

    const n = answered.length;
    const avgFinal = Number((sumFinal / n).toFixed(1));
    const avgContent = Number((sumContent / n).toFixed(1));
    const avgComm = Number((sumComm / n).toFixed(1));
    const avgStruct = Number((sumStruct / n).toFixed(1));
    const avgWpm = Number((sumWpm / n).toFixed(0));

    // Determine weakest area
    const pillarAverages = [
      { name: 'Content Depth & Precision', score: avgContent, tip: 'Deepen technical specificity. Name exact frameworks, architectural patterns, and engineering trade-offs.' },
      { name: 'STAR Framework Structure', score: avgStruct, tip: 'Structure every behavioral answer strictly into Situation -> Task -> Action -> Measurable Result with quantitative numbers.' },
      { name: 'Filler Words & Speech Delivery', score: avgComm, tip: 'Reduce fillers ("um", "like") by taking a 1-second pause to think before speaking. Aim for 130-160 WPM.' }
    ];
    pillarAverages.sort((a, b) => a.score - b.score);
    const weakest = pillarAverages[0];

    const notes = `Completed ${n} questions. Overall Score: ${avgFinal}/10. Weakest area identified: ${weakest.name} (${weakest.score}/10). ${weakest.tip}`;

    // Update session record
    db.prepare(`
      UPDATE sessions
      SET status = 'completed',
          total_score = ?,
          content_score = ?,
          communication_score = ?,
          structure_score = ?,
          total_fillers = ?,
          avg_wpm = ?,
          weakest_area = ?,
          summary_notes = ?,
          completed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(avgFinal, avgContent, avgComm, avgStruct, totalFillers, avgWpm, weakest.name, notes, sessionId);

    // Record into user_metrics table for historical tracking
    const pastCount = db.prepare('SELECT COUNT(*) as count FROM user_metrics WHERE user_id = ?').get(req.user.id).count;
    db.prepare(`
      INSERT INTO user_metrics (
        user_id, session_id, session_number,
        final_score, content_score, communication_score, structure_score,
        filler_count, avg_wpm, weakest_area
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(req.user.id, sessionId, pastCount + 1, avgFinal, avgContent, avgComm, avgStruct, totalFillers, avgWpm, weakest.name);

    return res.json({
      message: 'Interview session completed',
      reportCard: {
        sessionId,
        jobTitle: session.job_title,
        questionsAnswered: n,
        totalScore: avgFinal,
        contentScore: avgContent,
        communicationScore: avgComm,
        structureScore: avgStruct,
        totalFillers,
        avgWpm,
        weakestArea: weakest.name,
        weakestTip: weakest.tip,
        summaryNotes: notes
      }
    });
  } catch (err) {
    console.error('Complete session error:', err);
    return res.status(500).json({ error: 'Failed to finalize session' });
  }
});

// 9. GET /api/sessions/:id/report
router.get('/:id/report', authMiddleware, (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = db.prepare('SELECT * FROM sessions WHERE id = ? AND user_id = ?').get(sessionId, req.user.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    const rawQuestions = db.prepare('SELECT * FROM questions_answers WHERE session_id = ? ORDER BY question_index ASC').all(sessionId);
    const questions = rawQuestions.map(q => ({
      ...q,
      filler_breakdown: JSON.parse(q.filler_breakdown_json || '{}'),
      star_breakdown: JSON.parse(q.star_breakdown_json || '{}'),
      strengths: JSON.parse(q.strengths_json || '[]'),
      weaknesses: JSON.parse(q.weaknesses_json || '[]')
    }));

    return res.json({
      session,
      questions,
      summary: {
        totalScore: session.total_score,
        contentScore: session.content_score,
        communicationScore: session.communication_score,
        structureScore: session.structure_score,
        totalFillers: session.total_fillers,
        avgWpm: session.avg_wpm,
        weakestArea: session.weakest_area,
        summaryNotes: session.summary_notes
      }
    });
  } catch (err) {
    console.error('Report error:', err);
    return res.status(500).json({ error: 'Failed to retrieve report' });
  }
});

// 14. DELETE /api/sessions/:id
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const sessionId = req.params.id;
    const session = db.prepare('SELECT id FROM sessions WHERE id = ? AND user_id = ?').get(sessionId, req.user.id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    db.prepare('DELETE FROM sessions WHERE id = ?').run(sessionId);
    return res.json({ message: 'Session deleted successfully' });
  } catch (err) {
    console.error('Delete session error:', err);
    return res.status(500).json({ error: 'Failed to delete session' });
  }
});

module.exports = router;

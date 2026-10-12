const express = require('express');
const router = express.Router();
const db = require('../database');
const authMiddleware = require('../middleware/authMiddleware');

// 10. GET /api/dashboard/stats
router.get('/stats', authMiddleware, (req, res) => {
  try {
    const userId = req.user.id;

    const completedSessions = db.prepare(`
      SELECT id, job_title, total_score, content_score, communication_score, structure_score,
             total_fillers, avg_wpm, weakest_area, created_at, completed_at
      FROM sessions
      WHERE user_id = ? AND status = 'completed'
      ORDER BY id ASC
    `).all(userId);

    const totalQuestions = db.prepare(`
      SELECT COUNT(*) as count
      FROM questions_answers qa
      JOIN sessions s ON qa.session_id = s.id
      WHERE s.user_id = ? AND qa.answer_text != ''
    `).get(userId).count;

    if (completedSessions.length === 0) {
      return res.json({
        totalSessions: 0,
        totalQuestions: 0,
        averageScore: 0.0,
        bestScore: 0.0,
        startingScore: 0.0,
        latestScore: 0.0,
        scoreDelta: 0.0,
        avgContent: 0.0,
        avgCommunication: 0.0,
        avgStructure: 0.0,
        avgWpm: 0,
        totalFillers: 0,
        trends: [],
        weakestAreaStats: {},
        topFillers: []
      });
    }

    let sumTotal = 0;
    let sumContent = 0;
    let sumComm = 0;
    let sumStruct = 0;
    let sumWpm = 0;
    let totalFillers = 0;
    let bestScore = 0;

    const weakestCounts = {};

    completedSessions.forEach((s) => {
      sumTotal += s.total_score;
      sumContent += s.content_score;
      sumComm += s.communication_score;
      sumStruct += s.structure_score;
      sumWpm += s.avg_wpm;
      totalFillers += s.total_fillers;

      if (s.total_score > bestScore) {
        bestScore = s.total_score;
      }

      if (s.weakest_area) {
        weakestCounts[s.weakest_area] = (weakestCounts[s.weakest_area] || 0) + 1;
      }
    });

    const count = completedSessions.length;
    const startingScore = completedSessions[0].total_score;
    const latestScore = completedSessions[count - 1].total_score;
    const scoreDelta = Number((latestScore - startingScore).toFixed(1));

    const trends = completedSessions.map((s, idx) => ({
      sessionNumber: idx + 1,
      sessionId: s.id,
      jobTitle: s.job_title,
      totalScore: s.total_score,
      contentScore: s.content_score,
      communicationScore: s.communication_score,
      structureScore: s.structure_score,
      date: s.completed_at || s.created_at
    }));

    return res.json({
      totalSessions: count,
      totalQuestions,
      averageScore: Number((sumTotal / count).toFixed(1)),
      bestScore: Number(bestScore.toFixed(1)),
      startingScore: Number(startingScore.toFixed(1)),
      latestScore: Number(latestScore.toFixed(1)),
      scoreDelta,
      avgContent: Number((sumContent / count).toFixed(1)),
      avgCommunication: Number((sumComm / count).toFixed(1)),
      avgStructure: Number((sumStruct / count).toFixed(1)),
      avgWpm: Number((sumWpm / count).toFixed(0)),
      totalFillers,
      trends,
      weakestAreaStats: weakestCounts
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    return res.status(500).json({ error: 'Failed to calculate stats' });
  }
});

// 11. GET /api/dashboard/history
router.get('/history', authMiddleware, (req, res) => {
  try {
    const history = db.prepare(`
      SELECT id, job_title, experience_level, status, total_score,
             content_score, communication_score, structure_score,
             total_fillers, avg_wpm, weakest_area, created_at, completed_at
      FROM sessions
      WHERE user_id = ?
      ORDER BY id DESC
    `).all(req.user.id);

    return res.json({ history });
  } catch (err) {
    console.error('History error:', err);
    return res.status(500).json({ error: 'Failed to fetch history' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { evaluateAnswer } = require('../services/scoringEngine');

// 12. POST /api/scoring/analyze-preview
// Instant evaluation endpoint for testing and live demonstrations
router.post('/analyze-preview', async (req, res) => {
  try {
    const { questionText, answerText, audioDurationSeconds, jobTitle, jobDescription } = req.body;

    if (!answerText || answerText.trim().length === 0) {
      return res.status(400).json({ error: 'Please enter an answer to analyze.' });
    }

    const evaluation = await evaluateAnswer({
      questionText: questionText || 'Tell me about a challenging technical project you led.',
      answerText,
      audioDurationSeconds: Number(audioDurationSeconds || 0),
      jobTitle: jobTitle || 'Full Stack Software Engineer',
      jobDescription: jobDescription || 'Building scalable web applications, API design, and system architecture.'
    });

    return res.json({
      success: true,
      evaluation
    });
  } catch (err) {
    console.error('Scoring preview error:', err);
    return res.status(500).json({ error: 'Scoring engine evaluation failed: ' + err.message });
  }
});

module.exports = router;

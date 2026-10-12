/**
 * Speech Pace Calculator
 * Analyzes speech rate in words per minute (WPM), compares against
 * optimal interview benchmarks (130-160 WPM), and scores delivery.
 */

function calculateSpeechPace(text, durationSeconds) {
  if (!text || typeof text !== 'string') {
    return {
      wordCount: 0,
      durationSeconds: 0,
      wpm: 0,
      paceStatus: 'No Speech',
      paceScore: 5.0,
      feedback: 'No transcript recorded.'
    };
  }

  const words = text.trim().split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  // If duration is not provided or zero, estimate duration assuming average 140 WPM
  const effectiveDuration = durationSeconds && durationSeconds > 0
    ? durationSeconds
    : (wordCount / 140) * 60;

  const minutes = effectiveDuration / 60;
  const rawWpm = minutes > 0 ? wordCount / minutes : 0;
  const wpm = Number(rawWpm.toFixed(0));

  let paceStatus = 'Optimal';
  let paceScore = 10.0;
  let feedback = '';

  if (wpm < 90) {
    paceStatus = 'Very Slow';
    paceScore = 6.0;
    feedback = `Pace is ${wpm} WPM (ideal is 130-160 WPM). You may appear hesitant or unsure; aim for a more energetic rhythm.`;
  } else if (wpm < 120) {
    paceStatus = 'Slightly Slow';
    paceScore = 8.0;
    feedback = `Pace is ${wpm} WPM. Clear articulation, but slightly slow for dynamic technical discussions.`;
  } else if (wpm <= 165) {
    paceStatus = 'Optimal';
    paceScore = 10.0;
    feedback = `Excellent pacing at ${wpm} WPM! Well-balanced, professional, and easy to follow.`;
  } else if (wpm <= 190) {
    paceStatus = 'Slightly Fast';
    paceScore = 8.0;
    feedback = `Pace is ${wpm} WPM. High energy, but remember to pause between ideas so the interviewer can digest details.`;
  } else {
    paceStatus = 'Too Fast';
    paceScore = 6.0;
    feedback = `Rapid pace at ${wpm} WPM (ideal is 130-160 WPM). Slow down and breathe to project authority and calm confidence.`;
  }

  return {
    wordCount,
    durationSeconds: Number(effectiveDuration.toFixed(1)),
    wpm,
    paceStatus,
    paceScore: Number(paceScore.toFixed(1)),
    feedback
  };
}

module.exports = {
  calculateSpeechPace
};

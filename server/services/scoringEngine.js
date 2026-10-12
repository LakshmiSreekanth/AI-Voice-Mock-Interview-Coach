/**
 * Comprehensive Scoring Engine
 * Combines 3 Pillars:
 *  1. Content Quality (Gemini AI: technical accuracy, depth, relevance) - 45%
 *  2. Structure (STAR Detector: Situation, Task, Action, Result) - 35%
 *  3. Communication (Filler Word Density & Speech Pace WPM) - 20%
 */

const { analyzeFillers } = require('./fillerDetector');
const { calculateSpeechPace } = require('./speechPace');
const { analyzeStarStructure } = require('./starDetector');
const { scoreAnswerContent } = require('./gemini');

async function evaluateAnswer({
  questionText,
  answerText,
  audioDurationSeconds = 0,
  jobTitle = 'Software Engineer',
  jobDescription = '',
  resumeText = ''
}) {
  const text = (answerText || '').trim();

  // 1. Communication Analysis: Fillers & Pace
  const fillerAnalysis = analyzeFillers(text);
  const paceAnalysis = calculateSpeechPace(text, audioDurationSeconds);

  // Communication score combines filler density (70%) and pace adherence (30%)
  const commScoreRaw = (fillerAnalysis.fillerScore * 0.70) + (paceAnalysis.paceScore * 0.30);
  const communicationScore = Number(Math.min(10, Math.max(1, commScoreRaw)).toFixed(1));

  // 2. Structure Analysis: STAR Framework
  const starAnalysis = analyzeStarStructure(text);
  const structureScore = Number(Math.min(10, Math.max(1, starAnalysis.score)).toFixed(1));

  // 3. Content Analysis: Gemini AI Evaluation
  const contentResult = await scoreAnswerContent(questionText, text, jobTitle, jobDescription, resumeText);
  const contentScore = Number(Math.min(10, Math.max(1, contentResult.contentScore)).toFixed(1));

  // 4. Final Weighted Formula
  // Content: 45%, Structure: 35%, Communication: 20%
  const finalRaw = (contentScore * 0.45) + (structureScore * 0.35) + (communicationScore * 0.20);
  const finalScore = Number(Math.min(10, Math.max(1, finalRaw)).toFixed(1));

  // Determine weakest pillar for this answer
  const pillars = [
    { name: 'Content Depth', score: contentScore },
    { name: 'STAR Structure', score: structureScore },
    { name: 'Communication & Pacing', score: communicationScore }
  ];
  pillars.sort((a, b) => a.score - b.score);
  const answerWeakestPillar = pillars[0].name;

  return {
    finalScore,
    contentScore,
    communicationScore,
    structureScore,
    weakestPillar: answerWeakestPillar,
    wordCount: fillerAnalysis.wordCount,
    durationSeconds: paceAnalysis.durationSeconds,
    wpm: paceAnalysis.wpm,
    paceStatus: paceAnalysis.paceStatus,
    fillerCount: fillerAnalysis.totalCount,
    fillerBreakdown: fillerAnalysis.breakdown,
    fillerDensity: fillerAnalysis.densityPercent,
    fillerFeedback: fillerAnalysis.feedback,
    paceFeedback: paceAnalysis.feedback,
    starBreakdown: starAnalysis.breakdown,
    starComponentsCount: starAnalysis.componentsCount,
    hasMetrics: starAnalysis.hasMetrics,
    starFeedback: starAnalysis.feedback,
    strengths: contentResult.strengths,
    weaknesses: contentResult.weaknesses,
    modelAnswer: contentResult.modelAnswer
  };
}

module.exports = {
  evaluateAnswer
};

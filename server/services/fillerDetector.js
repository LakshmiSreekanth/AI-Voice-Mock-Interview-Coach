/**
 * Filler Word Detector
 * Scans interview answer transcripts for common filler words & hesitations,
 * calculates filler density, and evaluates communication impact.
 */

const FILLER_PATTERNS = [
  { word: 'um', regex: /\b(um+)\b/gi },
  { word: 'uh', regex: /\b(uh+)\b/gi },
  { word: 'er', regex: /\b(er+)\b/gi },
  { word: 'ah', regex: /\b(ah+)\b/gi },
  { word: 'like', regex: /\b(like)\b/gi },
  { word: 'you know', regex: /\b(you know)\b/gi },
  { word: 'actually', regex: /\b(actually)\b/gi },
  { word: 'basically', regex: /\b(basically)\b/gi },
  { word: 'literally', regex: /\b(literally)\b/gi },
  { word: 'honestly', regex: /\b(honestly)\b/gi },
  { word: 'sort of', regex: /\b(sort of)\b/gi },
  { word: 'kind of', regex: /\b(kind of)\b/gi },
  { word: 'i mean', regex: /\b(i mean)\b/gi },
  { word: 'right?', regex: /\b(right)\?/gi }
];

function analyzeFillers(text) {
  if (!text || typeof text !== 'string') {
    return {
      totalCount: 0,
      breakdown: {},
      densityPercent: 0,
      score: 10.0,
      feedback: 'No answer provided to analyze.'
    };
  }

  const cleanText = text.trim();
  const words = cleanText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  if (wordCount === 0) {
    return {
      totalCount: 0,
      breakdown: {},
      densityPercent: 0,
      score: 0.0,
      feedback: 'Empty response.'
    };
  }

  let totalCount = 0;
  const breakdown = {};

  // For multi-word fillers like "you know"
  let workingText = cleanText.toLowerCase();

  for (const item of FILLER_PATTERNS) {
    const matches = workingText.match(item.regex);
    if (matches && matches.length > 0) {
      const count = matches.length;
      breakdown[item.word] = count;
      totalCount += count;
    }
  }

  // Filler density per 100 words
  const densityPercent = Number(((totalCount / wordCount) * 100).toFixed(1));

  // Base communication score purely from fillers (0 to 10)
  // 0-1% -> 9.5-10
  // 1-3% -> 8.0-9.4
  // 3-6% -> 6.5-7.9
  // 6-10% -> 4.5-6.4
  // >10% -> 2.0-4.0
  let fillerScore = 10.0;
  let feedback = '';

  if (totalCount === 0) {
    fillerScore = 10.0;
    feedback = 'Outstanding clarity! Zero filler words detected.';
  } else if (densityPercent <= 1.5) {
    fillerScore = Math.max(9.0, 10.0 - densityPercent * 0.5);
    feedback = `Great composure. Only ${totalCount} filler word(s) (${densityPercent}% density).`;
  } else if (densityPercent <= 3.5) {
    fillerScore = Math.max(7.5, 9.0 - (densityPercent - 1.5) * 0.75);
    feedback = `Good delivery with minor hesitations (${totalCount} fillers, ${densityPercent}% density).`;
  } else if (densityPercent <= 6.0) {
    fillerScore = Math.max(5.5, 7.5 - (densityPercent - 3.5) * 0.8);
    feedback = `Noticeable filler word repetition (${totalCount} fillers). Practice replacing "um/like" with deliberate 1-second pauses.`;
  } else {
    fillerScore = Math.max(2.5, 5.5 - (densityPercent - 6.0) * 0.5);
    feedback = `High filler density (${totalCount} fillers, ${densityPercent}%). Try taking a breath before formulating your next point.`;
  }

  return {
    totalCount,
    breakdown,
    densityPercent,
    wordCount,
    fillerScore: Number(fillerScore.toFixed(1)),
    feedback
  };
}

module.exports = {
  analyzeFillers,
  FILLER_PATTERNS
};

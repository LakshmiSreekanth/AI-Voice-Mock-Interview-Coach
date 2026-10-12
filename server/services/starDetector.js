/**
 * STAR Structure Detector
 * Evaluates candidate responses for Situation, Task, Action, and Result (STAR) framework.
 * Identifies component presence, extracts key phrases, and scores structural discipline.
 */

const SITUATION_PATTERNS = [
  /\b(at my (previous|last|current) (company|job|role|team))\b/i,
  /\b(when i was (working|at|leading|managing))\b/i,
  /\b(during (our|a|the) (project|sprint|migration|hackathon|release|quarter|q[1-4]))\b/i,
  /\b(in (my|our) (previous|recent|last) (role|project|team))\b/i,
  /\b(we were (building|facing|dealing with|working on|migrating))\b/i,
  /\b(the (system|application|codebase|platform|product) was (slow|failing|struggling|experiencing|legacy))\b/i,
  /\b(back in \d{4}|a couple of (months|years) ago)\b/i
];

const TASK_PATTERNS = [
  /\b(my (task|responsibility|role|goal|objective|assignment) was)\b/i,
  /\b(i was (tasked with|responsible for|assigned to|asked to|in charge of))\b/i,
  /\b(we needed to (improve|reduce|build|redesign|fix|scale|migrate|optimize))\b/i,
  /\b(the (challenge|goal|target|requirement) was to)\b/i,
  /\b(i had to (ensure|deliver|resolve|lead|design))\b/i
];

const ACTION_PATTERNS = [
  /\b(i (decided to|implemented|developed|designed|architected|built|refactored|optimized))\b/i,
  /\b(i (created|wrote|conducted|initiated|introduced|configured|set up|deployed))\b/i,
  /\b(first,? i\b|then,? i\b|next,? i\b|specifically,? i\b)/i,
  /\b(i (analyzed|profiled|researched|benchmarked|investigated|audited))\b/i,
  /\b(i (collaborated with|partnered with|led the team|proposed|convinced))\b/i,
  /\b(to solve this,? i|my approach was to)\b/i
];

const RESULT_PATTERNS = [
  /\b(as a result|consequently|the outcome was|ultimately|in the end)\b/i,
  /\b(this (reduced|improved|increased|decreased|saved|accelerated|boosted))\b/i,
  /\b(which led to|resulting in|this allowed us to)\b/i,
  /\b(\d+%\s*(reduction|increase|improvement|drop|growth|faster|savings))\b/i,
  /\b(dropped from \d+.* to \d+|decreased by \d+|increased by \d+)\b/i,
  /\b(successfully (shipped|delivered|launched|deployed|scaled))\b/i,
  /\b(the team was able to|stakeholders were|the client was)\b/i
];

function analyzeStarStructure(text) {
  if (!text || typeof text !== 'string') {
    return {
      score: 0.0,
      hasSituation: false,
      hasTask: false,
      hasAction: false,
      hasResult: false,
      hasMetrics: false,
      breakdown: {
        situation: { present: false, excerpt: '' },
        task: { present: false, excerpt: '' },
        action: { present: false, excerpt: '' },
        result: { present: false, excerpt: '' }
      },
      feedback: 'No answer provided to analyze.'
    };
  }

  const cleanText = text.trim();
  const sentences = cleanText.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);

  let situationFound = false;
  let situationExcerpt = '';

  let taskFound = false;
  let taskExcerpt = '';

  let actionFound = false;
  let actionExcerpt = '';

  let resultFound = false;
  let resultExcerpt = '';

  // Scan sentences
  for (const sentence of sentences) {
    if (!situationFound) {
      for (const p of SITUATION_PATTERNS) {
        if (p.test(sentence)) {
          situationFound = true;
          situationExcerpt = sentence;
          break;
        }
      }
    }

    if (!taskFound) {
      for (const p of TASK_PATTERNS) {
        if (p.test(sentence)) {
          taskFound = true;
          taskExcerpt = sentence;
          break;
        }
      }
    }

    if (!actionFound) {
      for (const p of ACTION_PATTERNS) {
        if (p.test(sentence)) {
          actionFound = true;
          actionExcerpt = sentence;
          break;
        }
      }
    }

    if (!resultFound) {
      for (const p of RESULT_PATTERNS) {
        if (p.test(sentence)) {
          resultFound = true;
          resultExcerpt = sentence;
          break;
        }
      }
    }
  }

  // Check for quantifiable metrics (e.g. 40%, 200ms, $50k, 2x, 10,000 users)
  const metricRegex = /\b(\d+%\s*|\d+(\.\d+)?\s*(ms|seconds|minutes|hours|days|weeks|x|fold)|(\$|€|£)\s*\d+|\d+\s*(users|customers|requests|qps|rps|errors))\b/i;
  const hasMetrics = metricRegex.test(cleanText);

  // If text is rich but didn't hit strict patterns, do semantic heuristic backup
  const lower = cleanText.toLowerCase();
  if (!situationFound && (lower.includes('project') || lower.includes('client') || lower.includes('company') || lower.includes('system was') || lower.includes('we were working'))) {
    situationFound = true;
    situationExcerpt = 'Context & background established.';
  }

  if (!taskFound && (lower.includes('goal was') || lower.includes('needed to') || lower.includes('challenge was') || lower.includes('had to'))) {
    taskFound = true;
    taskExcerpt = 'Problem and objective framed.';
  }

  if (!actionFound && (lower.includes('i built') || lower.includes('i created') || lower.includes('i used') || lower.includes('i led') || lower.includes('i wrote') || lower.includes('we implemented'))) {
    actionFound = true;
    actionExcerpt = 'Implementation steps described.';
  }

  if (!resultFound && (lower.includes('result') || lower.includes('outcome') || lower.includes('improved') || lower.includes('launched') || lower.includes('finished') || hasMetrics)) {
    resultFound = true;
    resultExcerpt = 'Outcome or impact communicated.';
  }

  // Count detected STAR components
  const componentsPresent = [situationFound, taskFound, actionFound, resultFound].filter(Boolean).length;

  let score = 2.0; // Base score
  let feedback = '';

  if (componentsPresent === 4) {
    score = hasMetrics ? 9.8 : 9.0;
    feedback = hasMetrics
      ? 'Flawless STAR response! Complete Situation, Task, Action, and quantifiable Results with concrete metrics.'
      : 'Complete STAR structure! Situation, Task, Action, and Result are all present. Add quantifiable numbers for maximum impact.';
  } else if (componentsPresent === 3) {
    score = hasMetrics ? 8.2 : 7.6;
    const missing = !situationFound ? 'Situation' : !taskFound ? 'Task' : !actionFound ? 'Action' : 'Result';
    feedback = `Strong structure with 3 of 4 STAR pillars. Missing clear ${missing}. Adding this will elevate your answer to top tier.`;
  } else if (componentsPresent === 2) {
    score = 5.8;
    feedback = 'Partial STAR alignment. Ensure you clearly state the specific Task and measurable Result at the end.';
  } else if (componentsPresent === 1) {
    score = 4.0;
    feedback = 'Unstructured response. Interviewers look for structured stories: Situation -> Task -> Action -> Result.';
  } else {
    score = 2.5;
    feedback = 'Lacks STAR structure. Structure your answer by setting the context, stating your goal, detailing your steps, and sharing the outcome.';
  }

  return {
    score: Number(score.toFixed(1)),
    hasSituation: situationFound,
    hasTask: taskFound,
    hasAction: actionFound,
    hasResult: resultFound,
    hasMetrics,
    componentsCount: componentsPresent,
    breakdown: {
      situation: { present: situationFound, excerpt: situationExcerpt || 'Missing explicit context or background setting' },
      task: { present: taskFound, excerpt: taskExcerpt || 'Missing clear definition of your specific challenge or objective' },
      action: { present: actionFound, excerpt: actionExcerpt || 'Missing concrete details on what YOU specifically engineered or decided' },
      result: { present: resultFound, excerpt: resultExcerpt || 'Missing quantifiable outcome or business impact' }
    },
    feedback
  };
}

module.exports = {
  analyzeStarStructure
};

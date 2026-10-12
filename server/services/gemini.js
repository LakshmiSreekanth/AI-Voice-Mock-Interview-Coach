const https = require('https');
const config = require('../config');

/**
 * Call Google Gemini API with fallback across configured models
 */
async function callGemini(prompt, systemInstruction = '') {
  const models = config.GEMINI_MODELS;
  let lastError = null;

  for (const model of models) {
    try {
      const response = await requestGemini(model, prompt, systemInstruction);
      if (response && response.text) {
        console.log(`[Gemini] Successfully generated response using model: ${model}`);
        return response.text;
      }
    } catch (err) {
      console.warn(`[Gemini] Model ${model} attempt failed: ${err.message}. Trying next model...`);
      lastError = err;
    }
  }

  throw lastError || new Error('All Gemini models failed');
}

async function requestGemini(model, prompt, systemInstruction) {
  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt }]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 8192,
      responseMimeType: 'application/json',
      topP: 0.95
    }
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${config.GEMINI_API_KEY}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(45000)
  });

  const bodyText = await res.text();

  if (!res.ok) {
    throw new Error(`Gemini API error (Status ${res.status}): ${bodyText.slice(0, 300)}`);
  }

  const parsed = JSON.parse(bodyText);
  const candidate = parsed.candidates && parsed.candidates[0];
  const textPart = candidate && candidate.content && candidate.content.parts && candidate.content.parts[0];

  if (textPart && textPart.text) {
    return { text: textPart.text };
  }

  throw new Error('Invalid candidate format in Gemini response');
}

/**
 * Clean and parse JSON from markdown code blocks or raw JSON
 */
function cleanJsonText(rawText) {
  if (!rawText || typeof rawText !== 'string') return '';
  let cleaned = rawText.trim();

  // Strip markdown fences if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '').trim();
  }

  // Extract from first '[' to last ']' for arrays
  const firstBracket = cleaned.indexOf('[');
  const lastBracket = cleaned.lastIndexOf(']');
  if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
    return cleaned.slice(firstBracket, lastBracket + 1);
  }

  // Extract from first '{' to last '}' for objects
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return cleaned.slice(firstBrace, lastBrace + 1);
  }

  return cleaned;
}

/**
 * Generate 8 interview questions from a job description and candidate resume
 */
async function generateInterviewQuestions(jobTitle, jobDescription, experienceLevel = 'Mid-to-Senior', resumeText = '') {
  const hasResume = resumeText && resumeText.trim().length > 20;

  const prompt = `
You are an expert technical interviewer and hiring manager at a top-tier tech firm.
Generate exactly 8 realistic, high-impact interview questions tailored to the following role, job description, ${hasResume ? 'and CANDIDATE RESUME' : ''}:

Role Title: ${jobTitle || 'Software Engineer'}
Target Level: ${experienceLevel}
Job Description:
${jobDescription}

${hasResume ? `
==============================
CANDIDATE'S RESUME / BACKGROUND:
${resumeText.trim()}
==============================

CRITICAL INSTRUCTION - RESUME-TAILORED QUESTIONS:
You have the candidate's actual resume above. Generate personalized interview questions that DIRECTLY BRIDGE their listed projects, skills, and past experiences with the target Job Description!
- Include questions that specifically reference a project, tool, or achievement from their resume (e.g., "On your resume you mentioned building [Project X] using [Tech Y]...").
- Probe their actual architectural decisions, technical trade-offs, and challenges in those projects.
- Ask how their past work prepares them for this specific role's responsibilities.
` : ''}

Generate exactly 8 questions covering a balanced mix:
1. Technical Foundation / Core Competency (HTML/CSS/JS or core runtime)
2. Resume Project Deep-Dive or Hands-on Application
3. Performance, Architecture, or Debugging Scenario
4. API Integration & Asynchronous Data Flow
5. Behavioral: Challenging Project, Bug, or Obstacle (STAR format)
6. Behavioral: Teamwork, Learning New Tech, or Feedback (STAR format)
7. Technical Choices & Trade-offs (e.g. state vs props, SQL vs NoSQL, architectural decisions)
8. Practical Scenario: Handling Errors, Edge Cases, or Production Issues

NOTE: If the candidate is a JUNIOR (e.g. Junior Frontend Developer or Junior Full Stack Developer), calibrate questions strictly to realistic junior expectations (fundamental concepts, component props/state, basic Express/SQL, DOM/CSS, clear learning attitude) rather than complex high-scale distributed architectures.

You MUST return ONLY a valid JSON array of 8 objects without markdown fences, matching this structure:
[
  {
    "index": 1,
    "question": "Clear question text...",
    "category": "${hasResume ? 'Resume Project Deep-Dive' : 'Technical Foundation'}",
    "expectedPoints": "Key principles, terminology, and concepts candidate should mention"
  },
  ...
]
`;

  try {
    const raw = await callGemini(prompt, 'You are an elite technical interviewer. Output valid JSON array only.');
    const cleaned = cleanJsonText(raw);
    const questions = JSON.parse(cleaned);

    if (Array.isArray(questions) && questions.length >= 6) {
      return questions.slice(0, 8).map((q, idx) => ({
        index: idx + 1,
        question: q.question || `Question ${idx + 1}`,
        category: q.category || 'Technical Assessment',
        expectedPoints: q.expectedPoints || 'Technical knowledge and clear structured reasoning'
      }));
    }
  } catch (err) {
    console.warn('[Gemini] Question generation error or fallback:', err.message);
  }

  // Robust fallback question generator tailored to the role
  return generateFallbackQuestions(jobTitle, jobDescription, resumeText);
}

/**
 * Score content depth, strengths, weaknesses, and model answer
 */
async function scoreAnswerContent(questionText, answerText, jobTitle = 'Software Engineer', jobDescription = '', resumeText = '') {
  if (!answerText || answerText.trim().length < 5) {
    return {
      contentScore: 1.0,
      strengths: ['Answer attempted'],
      weaknesses: ['Response is too brief or incomplete to evaluate technical depth.'],
      modelAnswer: `A comprehensive answer should directly address "${questionText}" using concrete technical details, structured implementation steps, and quantifiable outcomes.`
    };
  }

  const hasResume = resumeText && resumeText.trim().length > 20;

  const prompt = `
You are an expert technical interviewer evaluating a candidate's answer for the position of "${jobTitle}".

QUESTION:
"${questionText}"

CANDIDATE ANSWER:
"${answerText}"

CONTEXT / JOB DESCRIPTION:
"${jobDescription.slice(0, 500)}"

${hasResume ? `CANDIDATE'S RESUME CONTEXT:
"${resumeText.slice(0, 600)}"
` : ''}

Evaluate the CANDIDATE's answer on CONTENT QUALITY alone (0.0 to 10.0):
- Technical correctness and depth
- Completeness in addressing the question
- Mention of relevant tools, trade-offs, and concepts
- Practical engineering realism and alignment with their experience

Return ONLY a valid JSON object matching this exact schema:
{
  "contentScore": 7.5,
  "strengths": [
    "Specific positive observation 1",
    "Specific positive observation 2"
  ],
  "weaknesses": [
    "Specific constructive critique 1",
    "Specific constructive critique 2"
  ],
  "modelAnswer": "A benchmark high-scoring model answer (3-5 sentences) demonstrating depth, STAR structure, and technical precision."
}
`;

  try {
    const raw = await callGemini(prompt, 'You are a rigorous technical interviewer. Output valid JSON object only.');
    const cleaned = cleanJsonText(raw);
    const parsed = JSON.parse(cleaned);

    return {
      contentScore: Math.min(10, Math.max(1, Number(Number(parsed.contentScore || 7.0).toFixed(1)))),
      strengths: Array.isArray(parsed.strengths) && parsed.strengths.length > 0 ? parsed.strengths : ['Clear intent and relevance to the question'],
      weaknesses: Array.isArray(parsed.weaknesses) && parsed.weaknesses.length > 0 ? parsed.weaknesses : ['Could incorporate deeper architectural rationale'],
      modelAnswer: parsed.modelAnswer || 'In an ideal answer, describe the system context, your concrete technical choices, the trade-offs evaluated, and the final measurable impact.'
    };
  } catch (err) {
    console.warn('[Gemini] Content scoring fallback:', err.message);
    return generateFallbackContentScore(questionText, answerText);
  }
}

/**
 * Fallback question generator when API is unreachable
 */
/**
 * Fallback question generator when API is unreachable
 * Dynamically extracts skills, frameworks, and projects from the JD and Resume
 */
function generateFallbackQuestions(jobTitle, jobDescription, resumeText = '') {
  const combined = `${jobTitle} ${jobDescription} ${resumeText}`.toLowerCase();
  const isJunior = /junior|entry|intern|associate|trainee/i.test(jobTitle + ' ' + jobDescription);
  const title = jobTitle || 'Software Engineer';

  // Extract candidate's mentioned technologies and projects
  const techPool = [
    'react', 'next.js', 'vue', 'angular', 'javascript', 'typescript', 'html', 'css',
    'node.js', 'express', 'python', 'django', 'fastapi', 'flask', 'java', 'spring',
    'sql', 'sqlite', 'postgresql', 'mongodb', 'redis', 'graphql', 'rest api',
    'docker', 'kubernetes', 'aws', 'git', 'pytorch', 'tensorflow', 'flutter', 'swift'
  ];
  const detectedTech = techPool.filter(t => combined.includes(t));
  const primaryTech1 = detectedTech[0] ? detectedTech[0].toUpperCase() : 'JavaScript';
  const primaryTech2 = detectedTech[1] ? detectedTech[1].toUpperCase() : 'React';
  const primaryTech3 = detectedTech[2] ? detectedTech[2].toUpperCase() : 'REST APIs';

  // Extract potential project mentions from resume
  let projectContext = '';
  if (resumeText) {
    const lines = resumeText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
    const projectLine = lines.find(l => /project|built|developed|created|implemented|engineered/i.test(l));
    if (projectLine) {
      projectContext = projectLine.replace(/^[-*•\d.]+\s*/, '').slice(0, 120);
    }
  }

  // If candidate is a junior frontend
  if (isJunior && /frontend|react|ui|web/i.test(combined) && !/full stack|backend|database/i.test(jobTitle)) {
    return [
      {
        index: 1,
        question: `Can you explain the difference between 'let', 'const', and 'var', and how variable hoisting works in ${primaryTech1}?`,
        category: "Technical Foundation",
        expectedPoints: "Block scope vs function scope, temporal dead zone, immutability with const, execution context"
      },
      {
        index: 2,
        question: `What is the core difference between component 'state' and 'props' in ${primaryTech2}, and how do you update state immutably?`,
        category: "Component Architecture",
        expectedPoints: "Props are read-only from parent; state is local; setState/useState updater functions, immutability"
      },
      {
        index: 3,
        question: `How does the useEffect hook or lifecycle work in ${primaryTech2}, and when should you provide an empty dependency array versus dependencies?`,
        category: "Lifecycle & Hooks",
        expectedPoints: "Mounting, dependency array triggers, cleanup functions for timers/listeners"
      },
      {
        index: 4,
        question: "How do you build a responsive layout using modern CSS Flexbox and media queries that transitions seamlessly from mobile to desktop?",
        category: "CSS & Responsive Design",
        expectedPoints: "Flexbox container properties, mobile-first breakpoints, viewport units, accessible touch targets"
      },
      {
        index: 5,
        question: projectContext 
          ? `On your resume you highlighted: "${projectContext}". Walk me through how you planned and built this using the STAR method.`
          : "Describe a web application or feature you built from scratch. Walk me through your design and implementation using the STAR format.",
        category: "STAR Project Walkthrough",
        expectedPoints: "Situation (project objective), Task (responsibilities), Action (tools, coding steps), Result (working deliverable and feedback)"
      },
      {
        index: 6,
        question: `Tell me about a tricky bug or layout issue you faced while working with ${primaryTech1} or ${primaryTech2}. How did you debug and resolve it?`,
        category: "STAR Problem Solving",
        expectedPoints: "DevTools inspection, error diagnosis, console debugging, verified fix, key takeaway"
      },
      {
        index: 7,
        question: `How do you handle asynchronous data fetching from a ${primaryTech3} in your frontend, including loading spinners and error states?`,
        category: "API Integration",
        expectedPoints: "async/await, try/catch, loading boolean flags, conditional rendering of error notices"
      },
      {
        index: 8,
        question: "If a user reports that clicking a button does nothing in production, what are your first three debugging steps in the browser?",
        category: "Practical Debugging",
        expectedPoints: "Console error logs, Network tab response status, event listener bindings and form preventDefault"
      }
    ];
  }

  // If candidate is a junior full stack
  if (isJunior && /full stack|fullstack|node|express|backend/i.test(combined)) {
    return [
      {
        index: 1,
        question: `Walk me through what happens under the hood when a user submits a form in the frontend until that data is saved in your ${primaryTech2 || 'Express'} backend database.`,
        category: "Full Stack Architecture",
        expectedPoints: "Event handling, JSON HTTP POST payload, routing middleware, SQL/database execution, response status, client state update"
      },
      {
        index: 2,
        question: `What are the core HTTP methods (GET, POST, PUT, DELETE) and status codes (200, 201, 400, 404, 500) you use when building ${primaryTech3 || 'RESTful APIs'}?`,
        category: "RESTful API Design",
        expectedPoints: "Idempotent vs non-idempotent methods, standard status code conventions, JSON error responses"
      },
      {
        index: 3,
        question: "Can you explain the difference between a primary key and a foreign key in relational databases, and how you join tables with SQL?",
        category: "Database Fundamentals",
        expectedPoints: "Unique identification, establishing relationships, INNER JOIN vs LEFT JOIN queries"
      },
      {
        index: 4,
        question: "How do you handle user authentication in a full stack application? Why must passwords never be stored in plain text, and how does JWT work?",
        category: "Authentication & Security",
        expectedPoints: "Hashing with bcrypt/salt, JSON Web Tokens header/payload/signature, Bearer token verification middleware"
      },
      {
        index: 5,
        question: projectContext
          ? `In your background you worked on: "${projectContext}". Walk me through the full stack architecture and challenges using the STAR format.`
          : "Tell me about a full stack application you built. What was your tech stack and what was the final outcome? Use the STAR format.",
        category: "STAR Project Walkthrough",
        expectedPoints: "Situation context, Task ownership, Action (frontend + backend implementation), Result (deployed project, measurable outcome)"
      },
      {
        index: 6,
        question: "Describe a situation where your frontend and backend failed to communicate properly (e.g., CORS error, 404, or undefined data). How did you fix it?",
        category: "STAR Debugging",
        expectedPoints: "Inspecting headers, CORS configuration, payload structure, network tab diagnostics, successful resolution"
      },
      {
        index: 7,
        question: `How do you structure component state and handle form submissions in ${primaryTech1} to ensure clean data validation before API calls?`,
        category: "Frontend Data Management",
        expectedPoints: "Controlled inputs, lifting state up, client-side validation schema, error feedback"
      },
      {
        index: 8,
        question: "How do you use Git and GitHub when collaborating on a team project? Walk me through branching, committing, and opening a Pull Request.",
        category: "Version Control & Workflow",
        expectedPoints: "Feature branching, clear commit messages, PR reviews, resolving merge conflicts"
      }
    ];
  }

  // Dynamic Senior / Mid / Specialized Role (e.g. Data Scientist, DevOps, Mobile, Python, etc.)
  return [
    {
      index: 1,
      question: `For a ${title} role, how do you architect core systems using ${primaryTech1} and ${primaryTech2} to ensure high performance and maintainability?`,
      category: "Technical Foundation",
      expectedPoints: `Deep understanding of ${primaryTech1} core engine, modular structure, performance considerations`
    },
    {
      index: 2,
      question: `How do you structure data flow, caching, and state management when integrating ${primaryTech3} into a large-scale application?`,
      category: "Architecture & System Design",
      expectedPoints: "Caching layers, normalization, network efficiency, latency reduction"
    },
    {
      index: 3,
      question: `Tell me about a time when you diagnosed and resolved a severe performance or reliability bottleneck involving ${primaryTech1}.`,
      category: "Performance & Debugging",
      expectedPoints: "Profiling tools, root cause analysis, measurable optimization metrics"
    },
    {
      index: 4,
      question: `How do you handle race conditions, error boundaries, and asynchronous failures when building critical services in ${primaryTech2}?`,
      category: "Resilience & Concurrency",
      expectedPoints: "Idempotency, rollback mechanisms, retry policies, robust error handling"
    },
    {
      index: 5,
      question: projectContext
        ? `Regarding your experience: "${projectContext}". Walk me through your architectural choices and biggest technical hurdle using the STAR format.`
        : `Describe a complex project you spearheaded as a ${title}. Walk me through the situation, technical hurdles, and impact using the STAR format.`,
      category: "STAR Project Walkthrough",
      expectedPoints: "Situation, Task, Action with deep technical specifics, Result with quantifiable impact"
    },
    {
      index: 6,
      question: "Can you share an experience where you had a strong technical disagreement with a team member or stakeholder? How did you align on the solution?",
      category: "STAR Collaboration",
      expectedPoints: "Data-driven trade-off analysis, empathy, constructive consensus, business alignment"
    },
    {
      index: 7,
      question: `What are the most critical architectural trade-offs you evaluate when choosing between different technologies in the ${primaryTech1} ecosystem?`,
      category: "Technical Trade-offs",
      expectedPoints: "Developer velocity vs runtime efficiency, horizontal vs vertical scaling, operational overhead"
    },
    {
      index: 8,
      question: "Imagine a critical production incident occurs where user requests are intermittently failing. Walk me through your step-by-step diagnostic and incident response protocol.",
      category: "Production Incident Management",
      expectedPoints: "Log aggregation, health check metrics, isolating affected components, rollback vs canary hotfix, post-mortem"
    }
  ];
}

/**
 * Fallback content score based on keyword depth, length, and technical signals
 */
function generateFallbackContentScore(questionText, answerText) {
  const wordCount = answerText.trim().split(/\s+/).length;
  let score = 5.0;

  if (wordCount > 70) score += 2.0;
  else if (wordCount > 35) score += 1.0;
  else if (wordCount < 15) score -= 1.5;

  const techTerms = ['architecture', 'performance', 'database', 'latency', 'component', 'api', 'state', 'cache', 'profiler', 'scale', 'async', 'index', 'testing', 'metric', 'reduced', 'optimized'];
  const matches = techTerms.filter(t => answerText.toLowerCase().includes(t)).length;
  score += Math.min(2.5, matches * 0.5);

  score = Math.min(9.5, Math.max(3.0, Number(score.toFixed(1))));

  return {
    contentScore: score,
    strengths: [
      'Directly tackled the core premise of the question',
      'Demonstrated practical problem solving awareness'
    ],
    weaknesses: [
      'Could incorporate more specific technical metrics or trade-off analysis',
      'Elaborate on edge cases and failure handling strategies'
    ],
    modelAnswer: 'A high-impact response clearly defines the problem, articulates the technical trade-offs evaluated, details the exact tools and architectural patterns employed, and concludes with quantifiable improvements in performance, reliability, or business metrics.'
  };
}

module.exports = {
  generateInterviewQuestions,
  scoreAnswerContent
};

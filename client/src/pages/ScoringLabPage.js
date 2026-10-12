import React, { useState } from 'react';
import { Cpu, Send, Sparkles, CheckCircle, AlertTriangle, BookOpen, Volume2, Loader2 } from 'lucide-react';
import StarFeedback from '../components/StarFeedback';
import { api } from '../services/api';

export default function ScoringLabPage() {
  const [question, setQuestion] = useState('Tell me about a time you resolved a major production bug or system performance bottleneck.');
  const [answer, setAnswer] = useState(
    'Um, so at my previous company, our user dashboard API was taking like 3.5 seconds to load. My task was to investigate and reduce latency below 500ms. I analyzed the query execution plan using EXPLAIN, discovered an unindexed foreign key in our transactions table, and created a composite index while also caching repeated results in Redis. As a result, the query response time dropped by 85% to 320ms, and our server CPU load decreased significantly.'
  );
  const [duration, setDuration] = useState(28);
  const [loading, setLoading] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [error, setError] = useState('');

  const samplePresets = [
    {
      label: '🌱 Junior Frontend: React State & Fetch (7.8/10)',
      q: 'How do you fetch data from a REST API in React using fetch, and how do you display loading and error states to the user?',
      a: 'In my portfolio movie browser project, I fetched data from an external REST API using useEffect and async/await. My goal was to provide a smooth user experience without blank screens. I created three state variables using useState: data, isLoading set to true initially, and error set to null. Inside a try/catch block, I called fetch, verified res.ok, and stored the parsed JSON in state. In the JSX, I conditionally rendered a spinner while isLoading was true, and displayed a retry button if an error occurred. As a result, users always had clear visual feedback during API latency.',
      dur: 30
    },
    {
      label: '🌱 Junior Full Stack: React to Express & SQL (8.2/10)',
      q: 'Can you walk me through what happens when a user submits a form in React to an Express backend and SQLite database?',
      a: 'In a task tracker application I built, when the user clicks submit, the React onSubmit handler prevents the default page reload with e.preventDefault(). Next, a fetch POST request sends a JSON payload with the task title to our Express backend route /api/tasks. The Express body-parser middleware parses the request, and the route handler validates the title. Then, a parameterized SQL INSERT query runs against our SQLite database to prevent SQL injection. Finally, the server responds with a 201 Created status and the new task object, which React appends to state to update the UI instantly.',
      dur: 34
    },
    {
      label: 'Senior STAR Answer: DB & Latency (8.7/10)',
      q: 'Tell me about a time you resolved a major production bug or system performance bottleneck.',
      a: 'Um, so at my previous company, our user dashboard API was taking like 3.5 seconds to load. My task was to investigate and reduce latency below 500ms. I analyzed the query execution plan using EXPLAIN, discovered an unindexed foreign key in our transactions table, and created a composite index while also caching repeated results in Redis. As a result, the query response time dropped by 85% to 320ms, and our server CPU load decreased significantly.',
      dur: 28
    },
    {
      label: 'Filler-Heavy & Missing STAR (4.2/10)',
      q: 'Tell me about a time you resolved a major production bug or system performance bottleneck.',
      a: 'Um, well, like, there was this one time when our site was, you know, really slow. And basically everyone was complaining. So I, like, went into the code and tried a few things, you know? Actually we just changed some database settings and restarted the server. It was okay after that I think.',
      dur: 24
    }
  ];

  const handleTest = async () => {
    if (!answer.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.analyzePreview(question, answer, duration, 'Senior Software Engineer');
      setEvaluation(res.evaluation);
    } catch (err) {
      setError('Scoring failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <span className="badge badge-primary" style={{ marginBottom: '8px' }}>
          Interactive Showcase
        </span>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Scoring Engine Lab</h1>
        <p style={{ color: 'var(--text-secondary)', maxWidth: '720px' }}>
          Inspect how the 3 core algorithmic signals—<strong>Gemini Content Scorer</strong>, <strong>STAR Structure Detector</strong>, and <strong>Filler Word / Speech Pace Counter</strong>—combine via the weighted formula:
          <code style={{ display: 'block', background: 'var(--bg-card)', padding: '6px 12px', borderRadius: '6px', marginTop: '6px', color: 'var(--accent-cyan)' }}>
            Final Score = (Content × 0.45) + (STAR Structure × 0.35) + (Communication × 0.20)
          </code>
        </p>
      </div>

      {/* Preset Pickers */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>
          Load Pre-configured Test Answers:
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {samplePresets.map((p, idx) => (
            <button
              key={idx}
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setQuestion(p.q);
                setAnswer(p.a);
                setDuration(p.dur);
                setEvaluation(null);
              }}
            >
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Form */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <div className="form-group">
          <label className="form-label">Interview Question</label>
          <input
            type="text"
            className="form-input"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Candidate Answer Transcript</label>
          <textarea
            className="form-textarea"
            style={{ minHeight: '140px' }}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Speech Duration (seconds):
            </label>
            <input
              type="number"
              className="form-input"
              style={{ width: '90px', padding: '6px 10px' }}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </div>

          <button
            className="btn btn-primary btn-lg"
            onClick={handleTest}
            disabled={loading}
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Loader2 size={18} className="spinning" />
                <span>Running Scoring Engine...</span>
              </div>
            ) : (
              <>
                <Cpu size={18} />
                <span>Run Complete Evaluation</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid var(--accent-rose)',
          color: 'var(--accent-rose)',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px'
        }}>
          {error}
        </div>
      )}

      {/* Results View */}
      {evaluation && (
        <div className="card" style={{ border: '1px solid var(--border-focus)' }}>
          <div className="card-header">
            <div>
              <span className="badge badge-emerald" style={{ marginBottom: '6px' }}>
                Engine Output
              </span>
              <h2 className="card-title">Multi-Signal Evaluation Result</h2>
            </div>
            <div className="score-large-badge" style={{ fontSize: '1.6rem', padding: '6px 18px' }}>
              Final: {evaluation.finalScore} / 10
            </div>
          </div>

          {/* 3 Pillars */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>
            <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Pillar 1: Content (45%)
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--primary-light)', fontFamily: 'var(--font-mono)' }}>
                {evaluation.contentScore} / 10
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                Evaluated by Gemini AI
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Pillar 2: Structure (35%)
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>
                {evaluation.structureScore} / 10
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {evaluation.starComponentsCount} of 4 STAR elements
              </div>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Pillar 3: Communication (20%)
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                {evaluation.communicationScore} / 10
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                {evaluation.wpm} WPM • {evaluation.fillerCount} fillers
              </div>
            </div>
          </div>

          {/* Fillers breakdown chips */}
          <div style={{ background: 'var(--bg-surface)', padding: '16px', borderRadius: 'var(--radius-md)', marginBottom: '24px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '8px' }}>
              Filler Words & Delivery Signals:
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {evaluation.fillerCount === 0 ? (
                <span className="badge badge-emerald">Zero filler words detected!</span>
              ) : (
                Object.entries(evaluation.fillerBreakdown || {}).map(([word, cnt]) => (
                  <span key={word} className="filler-chip">
                    &ldquo;{word}&rdquo; × {cnt}
                  </span>
                ))
              )}
              <span className="badge badge-cyan" style={{ marginLeft: '8px' }}>
                {evaluation.wpm} WPM ({evaluation.paceStatus})
              </span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
              {evaluation.fillerFeedback} {evaluation.paceFeedback}
            </p>
          </div>

          {/* STAR Framework */}
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>
              STAR Framework Breakdown:
            </h3>
            <StarFeedback breakdown={evaluation.starBreakdown} />
          </div>

          {/* Strengths & Weaknesses */}
          <div className="critique-grid">
            <div className="critique-column">
              <div className="critique-title" style={{ color: 'var(--accent-emerald)' }}>
                <CheckCircle size={16} />
                <span>Strengths</span>
              </div>
              <ul className="critique-list">
                {(evaluation.strengths || []).map((s, i) => (
                  <li key={i} className="critique-item">{s}</li>
                ))}
              </ul>
            </div>

            <div className="critique-column">
              <div className="critique-title" style={{ color: 'var(--accent-amber)' }}>
                <AlertTriangle size={16} />
                <span>Areas for Improvement</span>
              </div>
              <ul className="critique-list">
                {(evaluation.weaknesses || []).map((w, i) => (
                  <li key={i} className="critique-item">{w}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Model Answer */}
          {evaluation.modelAnswer && (
            <div className="model-answer-box" style={{ marginTop: '20px' }}>
              <div className="model-answer-title">
                <BookOpen size={16} />
                <span>AI Generated Benchmark Model Answer</span>
              </div>
              <p className="model-answer-text">{evaluation.modelAnswer}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

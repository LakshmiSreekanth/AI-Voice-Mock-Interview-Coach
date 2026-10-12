import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Award, CheckCircle, AlertTriangle, ArrowRight, ChevronDown,
  ChevronUp, RotateCcw, Volume2, BookOpen, Sparkles
} from 'lucide-react';
import StarFeedback from '../components/StarFeedback';
import { api } from '../services/api';

export default function ReportCardPage({ sessionId, onRestart, onGoDashboard }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedQ, setExpandedQ] = useState({});

  useEffect(() => {
    loadReport();
  }, [sessionId]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const res = await api.getReport(sessionId);
      setData(res);

      if (res.summary && res.summary.totalScore >= 6.5) {
        try {
          const runConfetti = typeof confetti === 'function' ? confetti : confetti?.default;
          if (typeof runConfetti === 'function') {
            runConfetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 }
            });
          }
        } catch (confettiErr) {
          console.warn('Confetti animation bypassed:', confettiErr);
        }
      }
    } catch (err) {
      console.error('Failed to load report:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (idx) => {
    setExpandedQ(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <h2>Generating your comprehensive interview report card...</h2>
      </div>
    );
  }

  const { session = {}, questions = [], summary = {} } = data || {};
  const totalScore = summary.totalScore || session.total_score || 0;
  const contentScore = summary.contentScore || session.content_score || 0;
  const commScore = summary.communicationScore || session.communication_score || 0;
  const structScore = summary.structureScore || session.structure_score || 0;
  const weakest = summary.weakestArea || session.weakest_area || 'STAR Framework Structure';

  return (
    <div>
      {/* Hero Header */}
      <div className="report-hero">
        <span className="badge badge-emerald" style={{ marginBottom: '12px' }}>
          Session Complete
        </span>
        <h1>Interview Report Card</h1>
        <p>
          Role: <strong>{session.job_title}</strong> • Completed {questions.length} questions
        </p>
      </div>

      {/* Main Score Banner */}
      <div className="report-score-banner">
        <div className="report-main-score">
          <div style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
            Overall Performance Score
          </div>
          <div className="report-main-num">{totalScore}</div>
          <div style={{ fontSize: '1rem', fontWeight: 700, color: totalScore >= 7.0 ? 'var(--accent-emerald)' : 'var(--accent-amber)' }}>
            {totalScore >= 8.5
              ? '🌟 Exceptional Candidate (Strong Hire)'
              : totalScore >= 7.0
              ? '✅ Offer-Ready Score'
              : totalScore >= 5.0
              ? '⚠️ Competent with Notable Improvement Areas'
              : '❗ Needs Additional Preparation'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '32px' }}>
          <div className="pillar-box">
            <span className="pillar-box-score text-indigo" style={{ fontSize: '2rem' }}>{contentScore}</span>
            <span className="pillar-box-label">Content (Gemini AI)</span>
          </div>
          <div className="pillar-box">
            <span className="pillar-box-score text-emerald" style={{ fontSize: '2rem' }}>{structScore}</span>
            <span className="pillar-box-label">STAR Structure</span>
          </div>
          <div className="pillar-box">
            <span className="pillar-box-score text-cyan" style={{ fontSize: '2rem' }}>{commScore}</span>
            <span className="pillar-box-label">Communication</span>
          </div>
        </div>
      </div>

      {/* Weakest Area Spotlight Box */}
      <div className="report-weakest-box">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
          <AlertTriangle size={20} color="var(--accent-rose)" />
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--accent-rose)' }}>
            Primary Area for Growth: {weakest}
          </h2>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.98rem', lineHeight: 1.6 }}>
          {session.summary_notes || `Your responses scored lowest in ${weakest}. To improve, focus on structuring behavioral questions explicitly with Situation -> Task -> Action -> Result, eliminating conversational filler words, and citing concrete numbers and latency metrics.`}
        </p>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '40px' }}>
        <button className="btn btn-primary btn-lg" onClick={onRestart}>
          <RotateCcw size={18} />
          <span>Practice Another Role</span>
        </button>
        <button className="btn btn-secondary btn-lg" onClick={onGoDashboard}>
          <span>View Progress in Dashboard</span>
          <ArrowRight size={18} />
        </button>
      </div>

      {/* Question by Question Review Accordion */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Question Breakdown & Model Answers ({questions.length})</h2>
        </div>

        <div className="qa-accordion">
          {questions.map((q, idx) => {
            const isExpanded = !!expandedQ[idx];
            return (
              <div key={q.id || idx} className="qa-item">
                <div className="qa-item-header" onClick={() => toggleExpand(idx)}>
                  <div>
                    <span className="badge badge-primary" style={{ marginRight: '8px', fontSize: '0.72rem' }}>
                      Q{idx + 1} • {q.question_category}
                    </span>
                    <span className="qa-question-text">{q.question_text}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span className="score-large-badge" style={{ fontSize: '1rem', padding: '2px 8px' }}>
                      {q.final_score ? `${q.final_score}/10` : 'Not answered'}
                    </span>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {isExpanded && (
                  <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)' }}>
                    {/* Candidate Answer */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '4px' }}>
                        Your Answer
                      </div>
                      <p style={{ background: 'var(--bg-surface)', padding: '12px 16px', borderRadius: 'var(--radius-md)', fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                        &ldquo;{q.answer_text || 'No answer recorded'}&rdquo;
                      </p>
                    </div>

                    {/* Pillar scores */}
                    <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
                      <span className="badge badge-primary">Content: {q.content_score}/10</span>
                      <span className="badge badge-emerald">STAR: {q.structure_score}/10</span>
                      <span className="badge badge-cyan">Comm: {q.communication_score}/10 ({q.wpm} WPM, {q.filler_count} fillers)</span>
                    </div>

                    {/* STAR Breakdown */}
                    <div style={{ marginBottom: '16px' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '6px' }}>
                        STAR Framework Check
                      </div>
                      <StarFeedback breakdown={q.star_breakdown} />
                    </div>

                    {/* Strengths & Weaknesses */}
                    <div className="critique-grid" style={{ marginBottom: '16px' }}>
                      <div className="critique-column">
                        <div className="critique-title" style={{ color: 'var(--accent-emerald)' }}>
                          <CheckCircle size={14} />
                          <span>Strengths</span>
                        </div>
                        <ul className="critique-list">
                          {(q.strengths || []).map((s, i) => (
                            <li key={i} className="critique-item">{s}</li>
                          ))}
                        </ul>
                      </div>

                      <div className="critique-column">
                        <div className="critique-title" style={{ color: 'var(--accent-amber)' }}>
                          <AlertTriangle size={14} />
                          <span>Areas for Improvement</span>
                        </div>
                        <ul className="critique-list">
                          {(q.weaknesses || []).map((w, i) => (
                            <li key={i} className="critique-item">{w}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Model Answer */}
                    {q.model_answer && (
                      <div className="model-answer-box">
                        <div className="model-answer-title">
                          <BookOpen size={16} />
                          <span>Ideal Model Answer</span>
                        </div>
                        <p className="model-answer-text">{q.model_answer}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

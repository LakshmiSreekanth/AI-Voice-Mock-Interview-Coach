import React from 'react';
import { CheckCircle, AlertTriangle, ArrowRight, BookOpen, Volume2, Award } from 'lucide-react';
import StarFeedback from './StarFeedback';

export default function FeedbackModal({ evaluation, questionNumber, totalQuestions, onNext, isLast }) {
  if (!evaluation) return null;

  const {
    finalScore = 0,
    contentScore = 0,
    structureScore = 0,
    communicationScore = 0,
    fillerCount = 0,
    wpm = 0,
    paceStatus = '',
    starBreakdown = {},
    strengths = [],
    weaknesses = [],
    modelAnswer = ''
  } = evaluation;

  return (
    <div className="modal-overlay">
      <div className="feedback-card">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div>
            <span className="badge badge-primary" style={{ marginBottom: '6px' }}>
              Question {questionNumber} of {totalQuestions} Evaluated
            </span>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Answer Feedback</h2>
          </div>
          <button className="btn btn-primary" onClick={onNext}>
            <span>{isLast ? 'Complete & View Report' : 'Next Question'}</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {/* Hero Score Display */}
        <div className="score-hero-display">
          <div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
              Answer Score
            </div>
            <div className="final-score-callout">
              <span className="final-num">{finalScore}</span>
              <span className="final-denom">/ 10</span>
            </div>
            <div style={{ fontSize: '0.85rem', color: finalScore >= 7.0 ? 'var(--accent-emerald)' : 'var(--accent-amber)', fontWeight: 600 }}>
              {finalScore >= 8.5
                ? '🌟 Exceptional - Top Tier Candidate'
                : finalScore >= 7.0
                ? '✅ Strong - Hiring Bar Cleared'
                : finalScore >= 5.0
                ? '⚠️ Needs Polish - Good Foundations'
                : '❗ Needs Structural Improvement'}
            </div>
          </div>

          <div className="pillar-mini-scores">
            <div className="pillar-box">
              <span className="pillar-box-score text-indigo">{contentScore}</span>
              <span className="pillar-box-label">Content (AI)</span>
            </div>
            <div className="pillar-box">
              <span className="pillar-box-score text-emerald">{structureScore}</span>
              <span className="pillar-box-label">STAR Structure</span>
            </div>
            <div className="pillar-box">
              <span className="pillar-box-score text-cyan">{communicationScore}</span>
              <span className="pillar-box-label">Communication</span>
            </div>
          </div>
        </div>

        {/* Speech & Fillers Metrics Strip */}
        <div style={{
          display: 'flex',
          gap: '16px',
          padding: '12px 18px',
          background: 'var(--bg-muted)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px',
          alignItems: 'center',
          fontSize: '0.88rem'
        }}>
          <Volume2 size={18} color="var(--accent-cyan)" />
          <div>
            <strong>Speech Delivery:</strong> {wpm} WPM ({paceStatus}) • {fillerCount} filler word(s) detected
          </div>
        </div>

        {/* STAR Structure Breakdown */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '12px' }}>
            STAR Method Breakdown
          </h3>
          <StarFeedback breakdown={starBreakdown} />
        </div>

        {/* Strengths & Weaknesses */}
        <div className="critique-grid">
          <div className="critique-column">
            <div className="critique-title" style={{ color: 'var(--accent-emerald)' }}>
              <CheckCircle size={16} />
              <span>Strengths</span>
            </div>
            <ul className="critique-list">
              {strengths.map((s, i) => (
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
              {weaknesses.map((w, i) => (
                <li key={i} className="critique-item">{w}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Model Answer */}
        {modelAnswer && (
          <div className="model-answer-box">
            <div className="model-answer-title">
              <BookOpen size={16} />
              <span>High-Scoring Model Answer</span>
            </div>
            <p className="model-answer-text">{modelAnswer}</p>
          </div>
        )}

        {/* Bottom CTA */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button className="btn btn-primary btn-lg" onClick={onNext} style={{ width: '100%' }}>
            <span>{isLast ? 'Finalize Session & View Report Card' : `Proceed to Question ${questionNumber + 1}`}</span>
            <ArrowRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

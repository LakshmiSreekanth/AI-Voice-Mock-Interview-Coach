import React, { useEffect, useState } from 'react';
import { ArrowUpRight, TrendingUp, Award, Clock, AlertTriangle, Play, CheckCircle2, Mic } from 'lucide-react';
import ProgressionChart from '../components/ProgressionChart';
import { api } from '../services/api';

export default function DashboardPage({ onStartInterview, onOpenSessionReport, user }) {
  const [stats, setStats] = useState(null);
  const [recentSessions, setRecentSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, historyRes] = await Promise.all([
        api.getDashboardStats(),
        api.getHistory()
      ]);
      setStats(statsRes);
      setRecentSessions(historyRes.history || []);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '100px 0' }}>
        <div style={{ fontSize: '1.2rem', color: 'var(--text-secondary)' }}>
          Loading your interview metrics and AI coaching history...
        </div>
      </div>
    );
  }

  const hasSessions = stats && stats.totalSessions > 0;

  return (
    <div>
      {/* Hero */}
      <div className="dashboard-hero">
        <div className="hero-text">
          <h1>Welcome back, {user?.name || 'Candidate'}</h1>
          <p className="hero-subtitle">
            Practice realistic interviews tailored to any job description. IntervAI evaluates your technical depth, STAR structure, and communication delivery.
          </p>
        </div>
        <button className="btn btn-primary btn-lg" onClick={onStartInterview}>
          <Mic size={18} />
          <span>Start New Interview</span>
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="stats-grid">
        <div className="stat-card emerald">
          <span className="stat-label">Current Final Score</span>
          <div className="stat-value">
            <span>{hasSessions ? stats.latestScore : '--'}</span>
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 10</span>
          </div>
          <div className="stat-subtext">
            {hasSessions && stats.scoreDelta > 0 ? (
              <span className="delta-badge">
                <TrendingUp size={12} style={{ display: 'inline', marginRight: '4px' }} />
                +{stats.scoreDelta} pts progression
              </span>
            ) : (
              'Benchmark: 7.0 for offer readiness'
            )}
          </div>
        </div>

        <div className="stat-card cyan">
          <span className="stat-label">Starting Score</span>
          <div className="stat-value">
            <span>{hasSessions ? stats.startingScore : '--'}</span>
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>/ 10</span>
          </div>
          <div className="stat-subtext">
            Baseline from Session #1
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-label">Sessions Completed</span>
          <div className="stat-value">
            <span>{hasSessions ? stats.totalSessions : '0'}</span>
          </div>
          <div className="stat-subtext">
            {stats?.totalQuestions || 0} questions answered
          </div>
        </div>

        <div className="stat-card amber">
          <span className="stat-label">Speech Delivery</span>
          <div className="stat-value">
            <span>{hasSessions ? stats.avgWpm : '--'}</span>
            <span style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>WPM</span>
          </div>
          <div className="stat-subtext">
            Optimal target: 130–160 WPM
          </div>
        </div>
      </div>

      {/* Progression Chart */}
      <div className="chart-panel">
        <div className="chart-header">
          <div className="chart-title-area">
            <h2>Score Progression Over Time</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Tracking interview score trajectory across sessions (demonstrating growth from 4.2 to 7.1+)
            </p>
          </div>
          <div className="chart-legend">
            <div className="legend-item">
              <span className="legend-color" style={{ background: '#6366f1' }} />
              <span>Overall Score</span>
            </div>
            <div className="legend-item">
              <span className="legend-color" style={{ background: '#10b981' }} />
              <span>7.0 Offer Ready</span>
            </div>
          </div>
        </div>
        <ProgressionChart trends={stats?.trends || []} />
      </div>

      {/* 3 Pillars Breakdown Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title text-indigo">
              <span>Content Quality (Gemini AI)</span>
            </span>
            <span className="badge badge-primary">{stats?.avgContent || 0} / 10</span>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Evaluates technical accuracy, domain vocabulary, problem solving depth, and relevance to the target job description.
          </p>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title text-emerald">
              <span>STAR Structure Scoring</span>
            </span>
            <span className="badge badge-emerald">{stats?.avgStructure || 0} / 10</span>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Detects Situation context, Task framing, Action specifics, and quantifiable Measurable Results (%, $, latency, metrics).
          </p>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title text-cyan">
              <span>Communication Delivery</span>
            </span>
            <span className="badge badge-cyan">{stats?.avgCommunication || 0} / 10</span>
          </div>
          <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
            Measures filler word density (&ldquo;um&rdquo;, &ldquo;like&rdquo;, &ldquo;you know&rdquo;) and calculates words per minute against conversational benchmarks.
          </p>
        </div>
      </div>

      {/* Weakest Area Spotlight */}
      {stats && stats.weakestAreaStats && Object.keys(stats.weakestAreaStats).length > 0 && (
        <div className="spotlight-card">
          <div className="spotlight-content">
            <h3>
              <AlertTriangle size={18} />
              <span>Priority Coaching Focus: {Object.keys(stats.weakestAreaStats)[0]}</span>
            </h3>
            <p>
              Your recent practice shows the largest room for score gains in <strong>{Object.keys(stats.weakestAreaStats)[0]}</strong>. Practice structuring your answers with explicit quantifiable outcomes and concise 1-second pauses before formulating thoughts.
            </p>
          </div>
          <button className="btn btn-secondary" onClick={onStartInterview}>
            <span>Practice Weakest Area</span>
            <ArrowUpRight size={16} />
          </button>
        </div>
      )}

      {/* Recent Sessions */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Recent Interview Sessions</h2>
          <button className="btn btn-secondary btn-sm" onClick={onStartInterview}>
            <span>New Session</span>
          </button>
        </div>

        {recentSessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
            No interview sessions yet. Click "Start New Interview" above!
          </div>
        ) : (
          <div className="sessions-list">
            {recentSessions.slice(0, 5).map((s) => (
              <div
                key={s.id}
                className="session-row"
                onClick={() => onOpenSessionReport(s.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="session-meta">
                  <div className="session-title">{s.job_title}</div>
                  <div className="session-date">
                    {new Date(s.created_at).toLocaleDateString()} • {s.status === 'completed' ? 'Completed (8 Questions)' : 'In Progress'}
                  </div>
                </div>

                <div className="session-scores-row">
                  <div className="score-pill-group">
                    <span className="badge badge-primary">Content: {s.content_score || '--'}</span>
                    <span className="badge badge-emerald">STAR: {s.structure_score || '--'}</span>
                    <span className="badge badge-cyan">Comm: {s.communication_score || '--'}</span>
                  </div>

                  <div className="score-large-badge">
                    {s.total_score ? `${s.total_score} / 10` : 'In Prog'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

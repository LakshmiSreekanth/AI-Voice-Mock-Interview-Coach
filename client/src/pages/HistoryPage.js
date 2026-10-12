import React, { useState, useEffect } from 'react';
import { History, Trash2, ArrowRight, Award, Clock, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

export default function HistoryPage({ onOpenSessionReport, onStartNew }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const res = await api.getHistory();
      setSessions(res.history || []);
    } catch (err) {
      setError('Failed to load session history');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    try {
      await api.deleteSession(id);
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '32px' }}>
        <div>
          <span className="badge badge-primary" style={{ marginBottom: '8px' }}>
            Session Archive
          </span>
          <h1 style={{ fontSize: '2.2rem', fontWeight: 800 }}>Interview History</h1>
          <p style={{ color: 'var(--text-secondary)' }}>
            Review past mock interviews, track score improvements, and re-read AI model answers.
          </p>
        </div>
        <button className="btn btn-primary" onClick={onStartNew}>
          <span>Practice New Role</span>
        </button>
      </div>

      {error && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid var(--accent-rose)',
          color: 'var(--accent-rose)',
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '20px'
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-secondary)' }}>
          Loading your session history...
        </div>
      ) : sessions.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <History size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h3>No interview sessions recorded yet</h3>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
            Paste a job description and practice your first AI mock interview.
          </p>
          <button className="btn btn-primary" onClick={onStartNew}>
            <span>Start Practice Session</span>
          </button>
        </div>
      ) : (
        <div className="sessions-list">
          {sessions.map((s, idx) => (
            <div
              key={s.id}
              className="session-row"
              onClick={() => onOpenSessionReport(s.id)}
              style={{ cursor: 'pointer', padding: '20px' }}
            >
              <div className="session-meta" style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span className="session-title" style={{ fontSize: '1.15rem' }}>{s.job_title}</span>
                  <span className="badge badge-primary">{s.experience_level || 'Mid-Level'}</span>
                  {s.status === 'completed' ? (
                    <span className="badge badge-emerald">Completed</span>
                  ) : (
                    <span className="badge badge-amber">In Progress</span>
                  )}
                </div>
                <div className="session-date" style={{ marginTop: '4px' }}>
                  Recorded on {new Date(s.created_at).toLocaleDateString()} • {s.total_fillers || 0} filler words • {s.avg_wpm || 0} WPM
                </div>
                {s.weakest_area && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent-rose)', marginTop: '4px' }}>
                    Weakest Area: {s.weakest_area}
                  </div>
                )}
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

                <button
                  className="btn btn-secondary btn-sm"
                  onClick={(e) => handleDelete(s.id, e)}
                  title="Delete Session"
                  style={{ color: 'var(--accent-rose)', padding: '8px' }}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

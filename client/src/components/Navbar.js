import React from 'react';
import { Sparkles, BarChart2, Mic, History, Cpu, User } from 'lucide-react';

export default function Navbar({ currentView, setCurrentView, user, onAuthClick }) {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <div className="brand-logo" onClick={() => setCurrentView('dashboard')}>
          <div className="brand-icon-box">
            <Sparkles size={20} />
          </div>
          <span>IntervAI</span>
          <span className="brand-tag">AI Coach</span>
        </div>

        <div className="nav-links">
          <button
            className={`nav-btn ${currentView === 'dashboard' ? 'active' : ''}`}
            onClick={() => setCurrentView('dashboard')}
          >
            <BarChart2 size={16} />
            <span>Dashboard</span>
          </button>

          <button
            className={`nav-btn ${currentView === 'new-interview' ? 'active' : ''}`}
            onClick={() => setCurrentView('new-interview')}
          >
            <Mic size={16} />
            <span>Practice</span>
          </button>

          <button
            className={`nav-btn ${currentView === 'history' ? 'active' : ''}`}
            onClick={() => setCurrentView('history')}
          >
            <History size={16} />
            <span>History</span>
          </button>

          <button
            className={`nav-btn ${currentView === 'scoring-lab' ? 'active' : ''}`}
            onClick={() => setCurrentView('scoring-lab')}
          >
            <Cpu size={16} />
            <span>Scoring Engine</span>
          </button>
        </div>

        <div className="nav-user-chip" onClick={onAuthClick} style={{ cursor: 'pointer' }}>
          <div className="user-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
          </div>
          <span style={{ fontWeight: 600 }}>{user?.name || 'Alex Morgan'}</span>
          {user?.isDemo && <span className="badge badge-primary" style={{ padding: '1px 6px', fontSize: '0.68rem' }}>Demo</span>}
        </div>
      </div>
    </nav>
  );
}

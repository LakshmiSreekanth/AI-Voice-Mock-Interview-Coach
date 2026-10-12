import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import DashboardPage from './pages/DashboardPage';
import NewInterviewPage from './pages/NewInterviewPage';
import InterviewRoomPage from './pages/InterviewRoomPage';
import ReportCardPage from './pages/ReportCardPage';
import HistoryPage from './pages/HistoryPage';
import ScoringLabPage from './pages/ScoringLabPage';
import { api } from './services/api';
import './App.css';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [user, setUser] = useState(null);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  useEffect(() => {
    initUser();
  }, []);

  const initUser = async () => {
    try {
      const me = await api.getMe();
      if (me && me.user) {
        setUser(me.user);
      }
    } catch (err) {
      // Default fallback demo user
      setUser({
        name: 'Alex Morgan',
        email: 'demo@intervai.dev',
        targetRole: 'Senior Full Stack Engineer',
        isDemo: true
      });
    }
  };

  const handleStartInterview = () => {
    setCurrentView('new-interview');
  };

  const handleInterviewCreated = (sessionId) => {
    setActiveSessionId(sessionId);
    setCurrentView('interview-room');
  };

  const handleFinishInterview = (sessionId) => {
    setActiveSessionId(sessionId);
    setCurrentView('report-card');
  };

  const handleOpenSessionReport = (sessionId) => {
    setActiveSessionId(sessionId);
    setCurrentView('report-card');
  };

  return (
    <div className="app-container">
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        user={user}
        onAuthClick={() => setIsAuthOpen(true)}
      />

      <main className="main-content">
        {currentView === 'dashboard' && (
          <DashboardPage
            user={user}
            onStartInterview={handleStartInterview}
            onOpenSessionReport={handleOpenSessionReport}
          />
        )}

        {currentView === 'new-interview' && (
          <NewInterviewPage
            onInterviewCreated={handleInterviewCreated}
          />
        )}

        {currentView === 'interview-room' && activeSessionId && (
          <InterviewRoomPage
            sessionId={activeSessionId}
            onFinishInterview={handleFinishInterview}
            onBackToDashboard={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'report-card' && activeSessionId && (
          <ReportCardPage
            sessionId={activeSessionId}
            onRestart={handleStartInterview}
            onGoDashboard={() => setCurrentView('dashboard')}
          />
        )}

        {currentView === 'history' && (
          <HistoryPage
            onOpenSessionReport={handleOpenSessionReport}
            onStartNew={handleStartInterview}
          />
        )}

        {currentView === 'scoring-lab' && (
          <ScoringLabPage />
        )}
      </main>

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(u) => setUser(u)}
      />
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import {
  Mic, MicOff, Type, Send, Volume2, Sparkles, AlertCircle,
  CheckCircle, ArrowRight, CornerDownLeft, Loader2, Play
} from 'lucide-react';
import AudioVisualizer from '../components/AudioVisualizer';
import FeedbackModal from '../components/FeedbackModal';
import { api } from '../services/api';

export default function InterviewRoomPage({ sessionId, onFinishInterview, onBackToDashboard }) {
  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0); // 0 to 7
  const [answerText, setAnswerText] = useState('');
  const [inputMode, setInputMode] = useState('voice'); // 'voice' or 'text'
  const [isRecording, setIsRecording] = useState(false);
  const [durationSeconds, setDurationSeconds] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [error, setError] = useState('');
  const [micSupported, setMicSupported] = useState(true);

  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    loadSession();
    setupSpeechRecognition();

    return () => {
      stopRecording();
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [sessionId]);

  const loadSession = async () => {
    try {
      const res = await api.getSession(sessionId);
      setSession(res.session);
      setQuestions(res.questions || []);

      // If user is returning to a session, find the first unanswered question
      const firstUnanswered = (res.questions || []).findIndex(q => !q.answer_text);
      if (firstUnanswered !== -1) {
        setCurrentIndex(firstUnanswered);
      }
    } catch (err) {
      setError('Failed to load interview session: ' + err.message);
    }
  };

  const setupSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicSupported(false);
      setInputMode('text');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let fullTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        fullTranscript += event.results[i][0].transcript + ' ';
      }
      setAnswerText(fullTranscript.trim());
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone access was denied. You can switch to typing mode below.');
        setIsRecording(false);
      }
    };

    recognition.onend = () => {
      // Don't auto-reset state if user is intentionally still recording
    };

    recognitionRef.current = recognition;
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    setError('');
    if (!recognitionRef.current) {
      setError('Speech recognition is not supported in this browser. Please type your answer.');
      return;
    }

    try {
      recognitionRef.current.start();
      setIsRecording(true);
      setDurationSeconds(0);

      timerRef.current = setInterval(() => {
        setDurationSeconds(prev => prev + 1);
      }, 1000);
    } catch (err) {
      console.warn('Could not start recognition:', err);
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isRecording) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }
    setIsRecording(false);
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  // Live filler calculations
  const countLiveFillers = (text) => {
    if (!text) return { total: 0, items: [] };
    const patterns = ['um', 'uh', 'like', 'you know', 'actually', 'basically'];
    const found = [];
    let count = 0;
    const lower = text.toLowerCase();
    patterns.forEach(p => {
      const regex = new RegExp(`\\b${p}\\b`, 'gi');
      const matches = lower.match(regex);
      if (matches) {
        count += matches.length;
        found.push({ word: p, count: matches.length });
      }
    });
    return { total: count, items: found };
  };

  const currentFillers = countLiveFillers(answerText);
  const wordsCount = answerText.trim() ? answerText.trim().split(/\s+/).length : 0;
  const currentWpm = durationSeconds > 3 ? Math.round((wordsCount / (durationSeconds / 60))) : 0;

  const currentQ = questions[currentIndex] || {
    question_text: 'Loading question...',
    question_category: 'Technical',
    expected_points: ''
  };

  const handleSubmitAnswer = async () => {
    if (!answerText.trim()) {
      setError('Please provide an answer by speaking into your mic or typing.');
      return;
    }

    stopRecording();
    setSubmitting(true);
    setError('');

    try {
      const qIndex = currentIndex + 1;
      const res = await api.submitAnswer(sessionId, qIndex, answerText, durationSeconds);

      // Update question list locally
      const updated = [...questions];
      updated[currentIndex] = {
        ...updated[currentIndex],
        answer_text: answerText,
        final_score: res.evaluation.finalScore,
        content_score: res.evaluation.contentScore,
        structure_score: res.evaluation.structureScore,
        communication_score: res.evaluation.communicationScore
      };
      setQuestions(updated);

      // Open feedback modal
      setCurrentEvaluation(res.evaluation);
    } catch (err) {
      setError('Evaluation error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNextQuestion = async () => {
    setCurrentEvaluation(null);
    setAnswerText('');
    setDurationSeconds(0);

    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      // All 8 questions answered! Finalize interview
      try {
        await api.completeSession(sessionId);
        onFinishInterview(sessionId);
      } catch (err) {
        console.error('Finalize session error:', err);
        onFinishInterview(sessionId);
      }
    }
  };

  return (
    <div>
      {/* Top Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <span className="badge badge-primary" style={{ marginBottom: '6px' }}>
            Live Mock Interview
          </span>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800 }}>
            {session?.job_title || 'Target Role'} Practice
          </h1>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={onBackToDashboard}>
          <span>Save & Return to Dashboard</span>
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

      {/* Main Interview Grid */}
      <div className="interview-layout">
        {/* Left Sidebar: 8-Question Stepper */}
        <div className="stepper-panel">
          <div className="stepper-header">
            <span>Interview Progress</span>
            <span>{questions.filter(q => q.answer_text).length} / {questions.length} Answered</span>
          </div>

          <div className="question-steps">
            {questions.map((q, idx) => {
              const isAnswered = Boolean(q.answer_text);
              const isActive = idx === currentIndex;

              return (
                <button
                  key={q.id || idx}
                  className={`question-step-item ${isActive ? 'active' : ''} ${isAnswered ? 'answered' : ''}`}
                  onClick={() => {
                    if (isRecording) stopRecording();
                    setCurrentIndex(idx);
                    setAnswerText(q.answer_text || '');
                  }}
                >
                  <div className="step-number">
                    {isAnswered ? '✓' : idx + 1}
                  </div>
                  <div className="step-details">
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      Q{idx + 1}: {q.question_category}
                    </div>
                    {isAnswered && (
                      <div className="step-score">
                        Score: {q.final_score ? `${q.final_score}/10` : 'Done'}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Workspace: Question Card & Recording Area */}
        <div>
          {/* Active Question Prompt */}
          <div className="question-card">
            <div className="question-meta-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span className="badge badge-cyan">
                  Question {currentIndex + 1} of {questions.length} • {currentQ.question_category}
                </span>
                {(currentQ.question_category?.toLowerCase().includes('resume') || session?.resume_text) && (
                  <span className="badge badge-emerald">
                    📄 Resume + JD Match
                  </span>
                )}
              </div>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Target: 1.5–2 min response
              </span>
            </div>

            <div className="question-prompt">
              &ldquo;{currentQ.question_text}&rdquo;
            </div>

            {currentQ.expected_points && (
              <div className="question-hint-box">
                <Sparkles size={16} color="var(--primary-light)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Key Areas Interviewer Expects:</strong> {currentQ.expected_points}
                </div>
              </div>
            )}
          </div>

          {/* Answer Workspace */}
          <div className="answer-workspace">
            {/* Input Mode Selector */}
            <div className="input-mode-tabs">
              <button
                className={`mode-tab ${inputMode === 'voice' ? 'active' : ''}`}
                onClick={() => setInputMode('voice')}
              >
                <Mic size={16} />
                <span>Voice Answer (Recommended)</span>
              </button>

              <button
                className={`mode-tab ${inputMode === 'text' ? 'active' : ''}`}
                onClick={() => {
                  stopRecording();
                  setInputMode('text');
                }}
              >
                <Type size={16} />
                <span>Type Answer</span>
              </button>
            </div>

            {/* Voice Recording Controls */}
            {inputMode === 'voice' && (
              <div className="recording-bar">
                <button
                  type="button"
                  className={`mic-toggle-btn ${isRecording ? 'recording' : ''}`}
                  onClick={toggleRecording}
                  title={isRecording ? 'Stop Recording' : 'Start Speaking'}
                >
                  {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
                </button>

                <AudioVisualizer isRecording={isRecording} />

                <div className="live-metrics-strip">
                  <div className="metric-strip-item">
                    <span className="metric-strip-label">Time</span>
                    <span className="metric-strip-val">
                      {Math.floor(durationSeconds / 60)}:{(durationSeconds % 60).toString().padStart(2, '0')}
                    </span>
                  </div>

                  <div className="metric-strip-item">
                    <span className="metric-strip-label">Words</span>
                    <span className="metric-strip-val">{wordsCount}</span>
                  </div>

                  <div className="metric-strip-item">
                    <span className="metric-strip-label">Pace</span>
                    <span className="metric-strip-val">{currentWpm} WPM</span>
                  </div>
                </div>
              </div>
            )}

            {/* Live Filler Words Chips */}
            {currentFillers.total > 0 && (
              <div className="live-fillers-bar">
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Filler Words Detected:
                </span>
                {currentFillers.items.map((f, i) => (
                  <span key={i} className="filler-chip">
                    &ldquo;{f.word}&rdquo; × {f.count}
                  </span>
                ))}
              </div>
            )}

            {/* Live Transcript / Input Textarea */}
            <textarea
              className="answer-textarea"
              placeholder={
                inputMode === 'voice'
                  ? 'Click the microphone above and speak clearly into your mic. Your transcript will appear here in real time...'
                  : 'Type your answer here. Include context, specific technical actions, and measurable results (STAR format)...'
              }
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
            />

            {/* Bottom Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {wordsCount} words • {currentFillers.total} filler words • {durationSeconds}s
              </div>

              <button
                className="btn btn-primary btn-lg"
                onClick={handleSubmitAnswer}
                disabled={submitting || !answerText.trim()}
              >
                {submitting ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Loader2 size={18} className="spinning" />
                    <span>Evaluating with Gemini & Scoring Engine...</span>
                  </div>
                ) : (
                  <>
                    <Send size={18} />
                    <span>Score Answer</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Post-Answer Feedback Modal */}
      {currentEvaluation && (
        <FeedbackModal
          evaluation={currentEvaluation}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
          onNext={handleNextQuestion}
          isLast={currentIndex === questions.length - 1}
        />
      )}
    </div>
  );
}

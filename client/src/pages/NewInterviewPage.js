import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles, ArrowRight, Briefcase, FileText, CheckCircle,
  Loader2, Upload, FileCode, Check, X, FileCheck
} from 'lucide-react';
import { api } from '../services/api';

export default function NewInterviewPage({ onInterviewCreated }) {
  const [jobTitle, setJobTitle] = useState('Junior Frontend Developer');
  const [experienceLevel, setExperienceLevel] = useState('Junior');
  const [jobDescription, setJobDescription] = useState('');
  const [resumeText, setResumeText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [presets, setPresets] = useState([]);
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      const res = await api.getPresets();
      if (res.presets && res.presets.length > 0) {
        setPresets(res.presets);
        // Default to first preset (Junior Frontend)
        applyPreset(res.presets[0]);
      }
    } catch (err) {
      console.warn('Could not load presets:', err);
    }
  };

  const applyPreset = (p) => {
    setSelectedPresetId(p.id);
    setJobTitle(p.title);
    setExperienceLevel(p.level);
    setJobDescription(p.description);
  };

  // Sample Resumes for quick 1-click candidate demonstration
  const sampleJuniorFrontendResume = `ALEX MORGAN
Junior Frontend Developer | alex@intervai.dev | github.com/alex-dev

EDUCATION:
B.S. in Computer Science - 2024

SKILLS:
- Languages: JavaScript (ES6+), HTML5, CSS3, TypeScript
- Frontend: React.js, React Hooks (useState, useEffect, useMemo), Redux Toolkit, React Router
- Styling: Responsive Web Design, Flexbox, CSS Grid, Tailwind CSS, SASS
- Tools: Git, GitHub, Vite, Webpack, Chrome DevTools, Postman, Jest

PROJECTS:
1. Movie Browser & Streaming Explorer (React, REST APIs, CSS Grid):
- Built a responsive single-page application fetching data from The Movie Database (TMDB) API.
- Implemented real-time search debouncing, infinite scroll pagination, and genre filtering using React hooks.
- Handled loading spinners and graceful network error alerts, improving user retention by 25%.

2. Interactive Quiz & Flashcard App (React, LocalStorage):
- Designed a stateful interactive quiz platform with timer countdowns and score progress tracking.
- Stored quiz progress and user high scores in browser LocalStorage.`;

  const sampleJuniorFullStackResume = `JORDAN LEE
Junior Full Stack Developer | jordan@devmail.com | github.com/jordan-code

EDUCATION:
Full Stack Web Development - 2024

SKILLS:
- Frontend: React.js, React Hooks, JavaScript (ES6+), HTML5/CSS3, Responsive UI
- Backend: Node.js, Express.js, RESTful API Design, Middleware, JWT Authentication, bcrypt
- Databases: SQLite, PostgreSQL, SQL CRUD queries, Table Relationships (One-to-Many)
- Version Control & DevOps: Git, GitHub, cURL, Postman

PROJECTS:
1. Team Task & Sprint Tracker (Full Stack React + Node.js + SQLite):
- Developed full-stack task management web app with user signup, login, and JWT protected routes.
- Built RESTful API endpoints in Express (GET, POST, PUT, DELETE) managing tasks with parameterized SQL queries.
- Connected React frontend to backend using fetch with error handling and real-time task status updates.

2. E-Commerce Product Catalog API (Node.js, Express, SQLite):
- Architected REST API supporting category filtering, product pagination, and transaction logs.
- Wrote relational SQL schemas with foreign keys linking categories to products.`;

  const [parsingResume, setParsingResume] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setError('');

    // If it's a plain text or markdown file, read directly
    if (file.name.endsWith('.txt') || file.name.endsWith('.md')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setResumeText(event.target.result || '');
      };
      reader.readAsText(file);
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    // For PDF files or other formats, extract clean text via server
    setParsingResume(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const arrayBuffer = event.target.result;
        // Chunked safe conversion to base64
        let binary = '';
        const bytes = new Uint8Array(arrayBuffer);
        const chunkSize = 8192;
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.subarray(i, i + chunkSize);
          binary += String.fromCharCode.apply(null, chunk);
        }
        const base64 = btoa(binary);

        const res = await api.parseResume(base64, file.name);
        if (res && res.text) {
          setResumeText(res.text);
        } else {
          setError('Could not extract text from this PDF. Please paste your resume text directly into the box.');
        }
      } catch (err) {
        console.error('PDF extraction failed:', err);
        setError('Could not extract text from PDF (' + (err.message || 'Error') + '). Please copy and paste your resume text directly into the box below.');
      } finally {
        setParsingResume(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.onerror = () => {
      setError('Could not read file from your device.');
      setParsingResume(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsArrayBuffer(file);
  };

  const handleStart = async (e) => {
    e.preventDefault();
    if (!jobDescription.trim()) {
      setError('Please provide a job description or select one of the presets above.');
      return;
    }

    setError('');
    setLoading(true);

    const hasResume = resumeText.trim().length > 20;

    setLoadingStep(
      hasResume
        ? 'Analyzing your Resume against the Job Description with Gemini AI...'
        : 'Calling Gemini AI to analyze job description...'
    );

    try {
      setTimeout(() => {
        setLoadingStep(
          hasResume
            ? 'Bridging your past projects with target role requirements...'
            : 'Crafting 8 targeted questions (Technical, Architecture & STAR Behavioral)...'
        );
      }, 1500);

      const res = await api.createSession(jobTitle, jobDescription, experienceLevel, resumeText);
      onInterviewCreated(res.session.id);
    } catch (err) {
      setError(err.message || 'Failed to create interview session');
      setLoading(false);
    }
  };

  const resumeWordCount = resumeText.trim() ? resumeText.trim().split(/\s+/).length : 0;

  return (
    <div className="setup-container">
      <div className="setup-header">
        <span className="badge badge-primary" style={{ marginBottom: '12px' }}>
          Step 1: Configure Your Interview
        </span>
        <h1>Target Any Job Role</h1>
        <p>
          Paste any job posting or select an industry preset. You can also upload or paste your <strong>Resume</strong> so Gemini AI generates questions tailored specifically to your projects and experience!
        </p>
      </div>

      {error && (
        <div style={{
          background: 'rgba(244, 63, 94, 0.1)',
          border: '1px solid var(--accent-rose)',
          color: 'var(--accent-rose)',
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px'
        }}>
          {error}
        </div>
      )}

      {/* Preset Pickers */}
      <div className="presets-container">
        <div className="presets-title">
          <span>Target Role Presets (1-Click Load)</span>
        </div>
        <div className="preset-chips">
          {presets.map((p) => {
            const isJuniorRole = p.level === 'Junior';
            return (
              <button
                key={p.id}
                type="button"
                className={`preset-chip ${selectedPresetId === p.id ? 'active' : ''}`}
                onClick={() => applyPreset(p)}
                style={isJuniorRole ? { borderLeft: '3px solid var(--accent-emerald)' } : {}}
              >
                <span>{p.title}</span>
                {isJuniorRole ? (
                  <span className="badge badge-emerald" style={{ padding: '2px 6px', fontSize: '0.7rem' }}>
                    Junior
                  </span>
                ) : (
                  <span style={{ opacity: 0.6, fontSize: '0.78rem' }}>({p.level})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleStart} className="card">
        {/* Role Title & Seniority */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '20px' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              <Briefcase size={16} style={{ display: 'inline', marginRight: '6px' }} />
              Role Title
            </label>
            <input
              type="text"
              required
              className="form-input"
              value={jobTitle}
              onChange={(e) => {
                setJobTitle(e.target.value);
                setSelectedPresetId('');
              }}
              placeholder="e.g. Junior Frontend Developer"
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Seniority Level</label>
            <select
              className="form-select"
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
            >
              <option value="Junior">Junior (0-2 yrs)</option>
              <option value="Mid-Level">Mid-Level (3-5 yrs)</option>
              <option value="Senior">Senior (5-8 yrs)</option>
              <option value="Lead / Staff">Lead / Staff (8+ yrs)</option>
            </select>
          </div>
        </div>

        {/* Job Description */}
        <div className="form-group">
          <label className="form-label">
            <FileText size={16} style={{ display: 'inline', marginRight: '6px' }} />
            Job Description & Responsibilities
          </label>
          <textarea
            required
            className="form-textarea"
            style={{ minHeight: '160px' }}
            value={jobDescription}
            onChange={(e) => {
              setJobDescription(e.target.value);
              setSelectedPresetId('');
            }}
            placeholder="Paste responsibilities, requirements, and tech stack from LinkedIn, Indeed, or company careers page..."
          />
        </div>

        {/* Candidate Resume Section */}
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <label className="form-label" style={{ marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileCode size={18} color="var(--primary-light)" />
                <span>Your Resume / Background (Optional but Recommended)</span>
                {resumeText.trim() && (
                  <span className="badge badge-emerald" style={{ fontSize: '0.72rem' }}>
                    <Check size={12} /> Active ({resumeWordCount} words)
                  </span>
                )}
              </label>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Upload or paste your resume to generate questions probing your actual projects and past tech stack.
              </p>
            </div>

            {/* Quick Sample Resume Pickers */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setResumeText(sampleJuniorFrontendResume);
                  setUploadedFileName('Sample_Junior_Frontend_Resume.txt');
                }}
                title="Load sample Junior Frontend resume with React projects"
              >
                <span>Sample Junior Frontend</span>
              </button>

              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  setResumeText(sampleJuniorFullStackResume);
                  setUploadedFileName('Sample_Junior_FullStack_Resume.txt');
                }}
                title="Load sample Junior Full Stack resume with React/Node/SQLite"
              >
                <span>Sample Junior Full Stack</span>
              </button>

              {resumeText.trim() && (
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => {
                    setResumeText('');
                    setUploadedFileName('');
                  }}
                  title="Clear resume"
                  style={{ color: 'var(--accent-rose)' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* File Upload Trigger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept=".txt,.md,.doc,.docx,.pdf"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={parsingResume}
            >
              {parsingResume ? (
                <>
                  <Loader2 size={14} className="spin" />
                  <span>Extracting Text from PDF...</span>
                </>
              ) : (
                <>
                  <Upload size={14} />
                  <span>Upload Resume (.pdf, .txt, .md)</span>
                </>
              )}
            </button>
            {uploadedFileName && !parsingResume && (
              <span style={{ fontSize: '0.82rem', color: 'var(--accent-cyan)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FileCheck size={14} /> {uploadedFileName}
              </span>
            )}
            {parsingResume && (
              <span style={{ fontSize: '0.82rem', color: 'var(--primary-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Loader2 size={14} className="spin" /> Parsing {uploadedFileName}...
              </span>
            )}
          </div>

          <textarea
            className="form-textarea"
            style={{ minHeight: '130px', fontSize: '0.88rem' }}
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume, projects, experience, or skills here (or click one of the sample buttons above)..."
          />

          {resumeText.trim() && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 'var(--radius-md)',
              padding: '10px 14px',
              fontSize: '0.82rem',
              color: 'var(--accent-emerald)',
              marginTop: '10px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <CheckCircle size={16} />
              <span>
                <strong>Resume Matching Active:</strong> Questions will directly reference your projects, tech stack, and experience against this Job Description!
              </span>
            </div>
          )}
        </div>

        <button
          type="submit"
          className="btn btn-primary btn-lg"
          style={{ width: '100%' }}
          disabled={loading}
        >
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Loader2 size={20} className="spinning" />
              <span>{loadingStep || 'Generating Questions with Gemini AI...'}</span>
            </div>
          ) : (
            <>
              <Sparkles size={18} />
              <span>
                {resumeText.trim()
                  ? 'Generate 8 Questions Matching Resume + Job Description'
                  : 'Generate 8 Interview Questions with Gemini AI'}
              </span>
              <ArrowRight size={18} />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

import React from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';
import App from './App';

class RootErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('IntervAI Root Error caught:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#090d16',
          color: '#f8fafc',
          padding: '40px',
          fontFamily: 'system-ui, -apple-system, sans-serif'
        }}>
          <div style={{
            maxWidth: '640px',
            margin: '0 auto',
            background: '#162032',
            border: '1px solid #334460',
            borderRadius: '12px',
            padding: '32px'
          }}>
            <h2 style={{ color: '#f43f5e', marginBottom: '12px' }}>
              IntervAI Encountered a Render Error
            </h2>
            <p style={{ color: '#94a3b8', marginBottom: '16px', fontSize: '14px' }}>
              {this.state.error ? this.state.error.toString() : 'An unexpected error occurred.'}
            </p>
            {this.state.errorInfo && (
              <pre style={{
                background: '#090d16',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '12px',
                color: '#64748b',
                overflowX: 'auto',
                marginBottom: '20px'
              }}>
                {this.state.errorInfo.componentStack}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              style={{
                background: '#4f46e5',
                color: '#fff',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function mountApp() {
  const container = document.getElementById('root');
  if (!container) {
    console.warn('#root element not found yet, retrying in 20ms...');
    setTimeout(mountApp, 20);
    return;
  }

  try {
    const root = createRoot(container);
    root.render(
      <RootErrorBoundary>
        <App />
      </RootErrorBoundary>
    );
    console.log('✅ IntervAI React mounted successfully');
  } catch (err) {
    console.error('Fatal mount error:', err);
    container.innerHTML = `
      <div style="min-height:100vh;background:#090d16;color:#f8fafc;padding:40px;font-family:sans-serif;">
        <h2 style="color:#f43f5e">Startup Error: ${err.message}</h2>
        <button onclick="location.reload()" style="background:#4f46e5;color:white;padding:10px 20px;border:none;border-radius:6px;cursor:pointer;margin-top:20px">Retry</button>
      </div>
    `;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mountApp);
} else {
  mountApp();
}

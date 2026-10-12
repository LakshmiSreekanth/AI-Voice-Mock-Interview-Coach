const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');

// Initialize SQLite database
require('./database');

const app = express();

// Standard middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// REST API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/scoring', require('./routes/scoring'));
app.use('/api/presets', require('./routes/presets'));

// API status ping
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    appName: 'IntervAI',
    timestamp: new Date().toISOString(),
    geminiKeyConfigured: !!config.GEMINI_API_KEY
  });
});

// Serve frontend build if present
const clientDistPath = path.join(__dirname, '../dist');
app.use(express.static(clientDistPath));

// Express 5 wildcard catch-all for SPA client routing
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint not found' });
  }
  res.sendFile(path.join(clientDistPath, 'index.html'), (err) => {
    if (err) {
      res.status(200).send(`
        <!DOCTYPE html>
        <html>
          <head><title>IntervAI Server</title></head>
          <body style="font-family:sans-serif;padding:40px;text-align:center;">
            <h2>IntervAI Backend is running on port ${config.PORT}</h2>
            <p>API endpoints ready at <code>/api/*</code></p>
          </body>
        </html>
      `);
    }
  });
});

app.listen(config.PORT, () => {
  console.log(`🚀 IntervAI server running on http://localhost:${config.PORT}`);
});

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../database');
const config = require('../config');
const authMiddleware = require('../middleware/authMiddleware');

// 1. POST /api/auth/register
router.post('/register', (req, res) => {
  try {
    const { name, email, password, targetRole } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(cleanEmail);
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    const stmt = db.prepare(`
      INSERT INTO users (name, email, password_hash, target_role)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(name.trim(), cleanEmail, passwordHash, targetRole || 'Full Stack Software Engineer');
    const userId = result.lastInsertRowid;

    const token = jwt.sign(
      { id: userId, name: name.trim(), email: cleanEmail, targetRole: targetRole || 'Full Stack Software Engineer' },
      config.JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: userId,
        name: name.trim(),
        email: cleanEmail,
        targetRole: targetRole || 'Full Stack Software Engineer'
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Server error during registration' });
  }
});

// 2. POST /api/auth/login
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(cleanEmail);

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isValid = bcrypt.compareSync(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email, targetRole: user.target_role },
      config.JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        targetRole: user.target_role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login' });
  }
});

// 3. GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  try {
    const user = db.prepare('SELECT id, name, email, target_role, created_at FROM users WHERE id = ?').get(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        targetRole: user.target_role,
        createdAt: user.created_at,
        isDemo: !!req.user.isDemo
      }
    });
  } catch (err) {
    console.error('Auth me error:', err);
    return res.status(500).json({ error: 'Server error fetching user profile' });
  }
});

module.exports = router;

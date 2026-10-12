const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../database');

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  let token = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (token) {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {
      console.warn('[Auth] Token invalid or expired:', err.message);
    }
  }

  // Graceful fallback to demo user if not logged in (Alex Morgan, id: 1)
  const defaultUser = db.prepare('SELECT id, name, email, target_role FROM users LIMIT 1').get();
  if (defaultUser) {
    req.user = {
      id: defaultUser.id,
      name: defaultUser.name,
      email: defaultUser.email,
      targetRole: defaultUser.target_role,
      isDemo: true
    };
    return next();
  }

  return res.status(401).json({ error: 'Unauthorized. Please sign in.' });
}

module.exports = authMiddleware;

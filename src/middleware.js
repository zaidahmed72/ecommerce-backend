const jwt = require('jsonwebtoken');

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function authenticate(req, res, next) {
  const [scheme, token] = (req.get('authorization') || '').split(' ');
  if (scheme !== 'Bearer' || !token) return res.status(401).json({ error: 'Authentication required' });
  try { req.auth = jwt.verify(token, process.env.JWT_SECRET); next(); }
  catch { return res.status(401).json({ error: 'Invalid or expired token' }); }
}

function authorize(...roles) {
  return (req, res, next) => roles.includes(req.auth?.role) ? next() : res.status(403).json({ error: 'Insufficient permissions' });
}

function errors(err, req, res, next) {
  if (res.headersSent) return next(err);
  if (err.name === 'ValidationError' || err.name === 'CastError') return res.status(400).json({ error: 'Invalid request', details: err.message });
  if (err.code === 11000) return res.status(409).json({ error: 'A record with that value already exists' });
  console.error(err);
  return res.status(err.status || 500).json({ error: err.status ? err.message : 'Internal server error' });
}

module.exports = { asyncRoute, authenticate, authorize, errors };

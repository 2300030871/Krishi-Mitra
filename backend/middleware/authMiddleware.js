const jwt = require('jsonwebtoken');

const requireAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: 'Authorization token is required.' });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev-jwt-secret');
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

const requireRole = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ message: `Forbidden: ${role} role required.` });
  }

  return next();
};

const requireAnyRole = (roles = []) => (req, res, next) => {
  const normalized = Array.isArray(roles) ? roles : [];

  if (!req.user || !normalized.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden: insufficient role permissions.' });
  }

  return next();
};

module.exports = {
  requireAuth,
  requireRole,
  requireAnyRole,
};

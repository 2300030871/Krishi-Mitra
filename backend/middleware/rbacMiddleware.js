const { ROLE_LEVEL, SYSTEM_ROLES } = require('../constants/roles');

const normalizeRole = (role) => String(role || '').toLowerCase();

const getUserRole = (req) => normalizeRole(req.user?.role);

const ensureKnownRole = (req, res) => {
  const role = getUserRole(req);

  if (!SYSTEM_ROLES.includes(role)) {
    res.status(403).json({ message: 'Forbidden: unknown or unsupported role.' });
    return null;
  }

  return role;
};

const requireRoles = (allowedRoles = []) => {
  const normalizedAllowed = Array.isArray(allowedRoles) ? allowedRoles.map(normalizeRole) : [];

  return (req, res, next) => {
    const role = ensureKnownRole(req, res);
    if (!role) return;

    if (!normalizedAllowed.includes(role)) {
      return res.status(403).json({ message: 'Forbidden: insufficient role permissions.' });
    }

    return next();
  };
};

const requireMinRole = (minimumRole) => {
  const normalizedMinimum = normalizeRole(minimumRole);

  return (req, res, next) => {
    const role = ensureKnownRole(req, res);
    if (!role) return;

    const userLevel = ROLE_LEVEL[role];
    const minimumLevel = ROLE_LEVEL[normalizedMinimum];

    if (minimumLevel === undefined) {
      return res.status(500).json({ message: 'RBAC configuration error: invalid minimum role.' });
    }

    if (userLevel < minimumLevel) {
      return res.status(403).json({ message: 'Forbidden: insufficient role hierarchy level.' });
    }

    return next();
  };
};

module.exports = {
  requireRoles,
  requireMinRole,
};

const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Superadmin always passes
    if (req.user.role === 'superadmin') {
      return next();
    }

    // Viewer: allow GET only on admin routes
    if (req.user.role === 'viewer') {
      if (req.method === 'GET' && allowedRoles.includes('admin')) {
        return next();
      }
      if (!allowedRoles.includes('viewer')) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      return next();
    }

    // Admin passes for all except /superadmin-restricted routes
    if (req.user.role === 'admin' && allowedRoles.includes('admin')) {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

module.exports = authorize;

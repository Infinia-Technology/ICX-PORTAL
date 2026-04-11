const { verifyToken } = require('../services/jwt.service');
const User = require('../models/User');

const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = header.split(' ')[1];

  try {
    const payload = verifyToken(token);
    const user = await User.findById(payload.userId).select('-__v');

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Account deactivated or not found' });
    }

    req.user = {
      userId: user._id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authenticate;

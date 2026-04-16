const { verifyToken } = require('../services/jwt.service');
const prisma = require('../config/prisma');

const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const token = header.split(' ')[1];

  try {
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Account deactivated or not found' });
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      kyc_status: user.kyc_status,
      organization_id: user.organization_id,
    };

    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authenticate;

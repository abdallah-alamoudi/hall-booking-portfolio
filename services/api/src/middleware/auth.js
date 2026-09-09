const { HttpError } = require('../common/http-error');
const { verifyAccessToken } = require('../utils/jwt');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [type, token] = header.split(' ');

  if (type !== 'Bearer' || !token) {
    return next(new HttpError(401, 'UNAUTHENTICATED', 'Missing or invalid Authorization header'));
  }

  const payload = verifyAccessToken(token.trim());

  req.user = {
    userId: payload.userId,
    role: payload.role,
    fullName: payload.fullName
  };

  return next();
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return next(new HttpError(403, 'FORBIDDEN', 'Insufficient permissions'));
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };

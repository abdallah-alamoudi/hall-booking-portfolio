const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { HttpError } = require('../common/http-error');

const DEFAULT_EXPIRES_IN = '7d';

function ensureJwtSecret() {
  if (!env.jwtSecret) {
    throw new HttpError(500, 'CONFIG_ERROR', 'JWT secret is not configured');
  }
}

function signAccessToken(payload, options = {}) {
  ensureJwtSecret();
  return jwt.sign(payload, env.jwtSecret, {
    expiresIn: options.expiresIn || DEFAULT_EXPIRES_IN
  });
}

function verifyAccessToken(token) {
  ensureJwtSecret();
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch (error) {
    throw new HttpError(401, 'UNAUTHENTICATED', 'Invalid or expired token');
  }
}

module.exports = {
  signAccessToken,
  verifyAccessToken
};

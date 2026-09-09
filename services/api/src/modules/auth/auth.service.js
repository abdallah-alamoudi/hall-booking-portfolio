const bcrypt = require('bcryptjs');
const { Roles, AuthRules } = require('@hall-booking/contracts');
const { HttpError } = require('../../common/http-error');
const { signAccessToken } = require('../../utils/jwt');
const usersRepository = require('../users/users.repository');

const PASSWORD_MIN_LENGTH = AuthRules?.MIN_PASSWORD_LENGTH || 8;

function normalizeEmail(value) {
  if (!value) return null;
  const trimmed = String(value).trim().toLowerCase();
  return trimmed || null;
}

function normalizePhone(value) {
  if (!value) return null;
  const trimmed = String(value).trim();
  const normalized = trimmed.replace(/[^\d+]/g, '');
  return normalized || null;
}

function resolveRole(value) {
  if (!value) return Roles.CUSTOMER;
  const normalized = String(value).trim().toUpperCase();

  if (normalized === Roles.OWNER) return Roles.OWNER;
  if (normalized === Roles.CUSTOMER) return Roles.CUSTOMER;

  return null;
}

function buildUserResponse(user) {
  return {
    id: user.id,
    role: user.role,
    fullName: user.fullName
  };
}

async function register(input = {}) {
  const fullName = String(input.fullName || '').trim();
  const email = normalizeEmail(input.email);
  const phone = normalizePhone(input.phone);
  const password = String(input.password || '').trim();
  const role = resolveRole(input.role);

  if (!fullName) {
    throw new HttpError(400, 'INVALID_REQUEST', 'Full name is required');
  }

  if (!email && !phone) {
    throw new HttpError(400, 'INVALID_REQUEST', 'Email or phone is required');
  }

  if (!password) {
    throw new HttpError(400, 'INVALID_REQUEST', 'Password is required');
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    throw new HttpError(400, 'INVALID_PASSWORD', `Password must be at least ${PASSWORD_MIN_LENGTH} characters`);
  }

  if (!role) {
    throw new HttpError(400, 'INVALID_ROLE', 'Role must be CUSTOMER or OWNER');
  }

  const existingUser = await usersRepository.findByEmailOrPhone({ email, phone });
  if (existingUser) {
    throw new HttpError(409, 'USER_EXISTS', 'User already exists');
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await usersRepository.createUser({
    fullName,
    email,
    phone,
    role,
    passwordHash,
    isActive: true
  });

  const token = signAccessToken({
    userId: user.id,
    role: user.role,
    fullName: user.fullName
  });

  return {
    user: buildUserResponse(user),
    token
  };
}

async function login(input = {}) {
  const identifier = String(input.identifier || '').trim();
  const password = String(input.password || '').trim();

  if (!identifier || !password) {
    throw new HttpError(400, 'INVALID_REQUEST', 'Identifier and password are required');
  }

  const isEmail = identifier.includes('@');
  const email = isEmail ? normalizeEmail(identifier) : null;
  const phone = isEmail ? null : normalizePhone(identifier);

  const user = await usersRepository.findByEmailOrPhone({ email, phone });
  if (!user) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid credentials');
  }

  if (!user.isActive) {
    throw new HttpError(403, 'USER_INACTIVE', 'User is inactive');
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    throw new HttpError(401, 'INVALID_CREDENTIALS', 'Invalid credentials');
  }

  const token = signAccessToken({
    userId: user.id,
    role: user.role,
    fullName: user.fullName
  });

  return {
    user: buildUserResponse(user),
    token
  };
}

module.exports = { register, login };
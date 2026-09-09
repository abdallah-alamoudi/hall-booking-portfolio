const path = require('path');
const dotenv = require('dotenv');
const request = require('supertest');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
process.env.CORS_ORIGIN = '*';

const app = require('../src/app');

const uniqueId = () =>
  `${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;

const buildRegisterPayload = (overrides = {}) => ({
  fullName: 'Test User',
  email: `user_${uniqueId()}@example.com`,
  password: 'password123',
  ...overrides
});

const buildLoginPayload = (overrides = {}) => ({
  identifier: overrides.identifier || 'user@example.com',
  password: overrides.password || 'password123'
});

describe('Auth API', () => {
  it('returns 400 when identifier or password is missing', async () => {
    const response = await request(app)
      .post('/v1/auth/login')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body).toEqual({
      error: {
        code: 'INVALID_REQUEST',
        message: 'Identifier and password are required',
        details: {}
      }
    });
  });

  it('registers a customer with email and returns a token', async () => {
    const response = await request(app)
      .post('/v1/auth/register')
      .send(buildRegisterPayload());

    expect(response.status).toBe(201);
    expect(response.body.token).toBeTruthy();
    expect(response.body.user.role).toBe('CUSTOMER');
  });

  it('registers an owner when role is OWNER', async () => {
    const response = await request(app)
      .post('/v1/auth/register')
      .send(buildRegisterPayload({ role: 'OWNER' }));

    expect(response.status).toBe(201);
    expect(response.body.user.role).toBe('OWNER');
  });

  it('rejects short passwords', async () => {
    const response = await request(app)
      .post('/v1/auth/register')
      .send(buildRegisterPayload({ password: 'short' }));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_PASSWORD');
  });

  it('rejects missing email and phone', async () => {
    const response = await request(app)
      .post('/v1/auth/register')
      .send(buildRegisterPayload({ email: undefined, phone: undefined }));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_REQUEST');
  });

  it('rejects admin role at signup', async () => {
    const response = await request(app)
      .post('/v1/auth/register')
      .send(buildRegisterPayload({ role: 'ADMIN' }));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('INVALID_ROLE');
  });

  it('rejects duplicate email', async () => {
    const payload = buildRegisterPayload();

    await request(app)
      .post('/v1/auth/register')
      .send(payload);

    const response = await request(app)
      .post('/v1/auth/register')
      .send(payload);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('USER_EXISTS');
  });

  it('logs in with email after registration', async () => {
    const payload = buildRegisterPayload();

    await request(app)
      .post('/v1/auth/register')
      .send(payload);

    const response = await request(app)
      .post('/v1/auth/login')
      .send(buildLoginPayload({ identifier: payload.email, password: payload.password }));

    expect(response.status).toBe(200);
    expect(response.body.token).toBeTruthy();
    expect(response.body.user.role).toBe('CUSTOMER');
  });

  it('rejects invalid credentials', async () => {
    const payload = buildRegisterPayload();

    await request(app)
      .post('/v1/auth/register')
      .send(payload);

    const response = await request(app)
      .post('/v1/auth/login')
      .send(buildLoginPayload({ identifier: payload.email, password: 'wrongpass' }));

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });
});

describe('Users API', () => {
  it('rejects unauthenticated requests', async () => {
    const response = await request(app)
      .get('/v1/users/me');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('returns the current user for a valid token', async () => {
    const payload = buildRegisterPayload();

    await request(app)
      .post('/v1/auth/register')
      .send(payload);

    const loginResponse = await request(app)
      .post('/v1/auth/login')
      .send(buildLoginPayload({ identifier: payload.email, password: payload.password }));

    const response = await request(app)
      .get('/v1/users/me')
      .set('Authorization', `Bearer ${loginResponse.body.token}`);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      id: response.body.id,
      role: 'CUSTOMER',
      fullName: 'Test User'
    });
  });
});
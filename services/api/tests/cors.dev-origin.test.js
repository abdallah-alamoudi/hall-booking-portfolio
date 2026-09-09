const request = require('supertest');

describe('CORS behavior in development', () => {
  let app;

  beforeAll(() => {
    process.env.NODE_ENV = 'development';
    process.env.CORS_ORIGIN = 'http://localhost:5173';
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

    jest.resetModules();
    app = require('../src/app');
  });

  it('allows localhost with a different dev port', async () => {
    const origin = 'http://localhost:5176';

    const response = await request(app)
      .get('/v1/health')
      .set('Origin', origin);

    expect(response.status).toBe(200);
    expect(response.headers['access-control-allow-origin']).toBe(origin);
  });
});

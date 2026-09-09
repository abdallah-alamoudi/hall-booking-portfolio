const path = require('path');
const dotenv = require('dotenv');
const request = require('supertest');
const { signAccessToken } = require('../src/utils/jwt');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
process.env.CORS_ORIGIN = '*';

const app = require('../src/app');

describe('Uploads API', () => {
  it('rejects unauthenticated upload requests', async () => {
    const response = await request(app)
      .post('/v1/uploads');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('rejects owner uploads when file is missing', async () => {
    const token = signAccessToken({ userId: 'owner-1', role: 'OWNER', fullName: 'Owner' });

    const response = await request(app)
      .post('/v1/uploads')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('FILE_REQUIRED');
  });
});

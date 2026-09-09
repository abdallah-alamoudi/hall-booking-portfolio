const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');
const { signAccessToken } = require('../src/utils/jwt');

const prisma = new PrismaClient();

async function resetDb() {
  await prisma.receipt.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.availabilityBlock.deleteMany();
  await prisma.hallBankAccount.deleteMany();
  await prisma.daytimePrice.deleteMany();
  await prisma.hallPhoto.deleteMany();
  await prisma.hallServiceMap.deleteMany();
  await prisma.hall.deleteMany();
  await prisma.user.deleteMany();
}

describe('Owner Hall Create Validation', () => {
  let owner;
  let ownerToken;

  beforeAll(async () => {
    await resetDb();
    owner = await prisma.user.create({
      data: {
        fullName: 'Owner Validation',
        email: 'owner-validation@test.com',
        role: 'OWNER',
        passwordHash: 'hash',
        phone: '700200001'
      }
    });
    ownerToken = signAccessToken({ userId: owner.id, role: owner.role, fullName: owner.fullName });
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  it('accepts numeric strings from clients and creates hall', async () => {
    const res = await request(app)
      .post('/v1/owner/halls')
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        name: 'Hall With String Numbers',
        city: 'Sanaa',
        capacity: '200',
        depositAmount: '50000',
        currency: 'YER',
        photos: [],
        serviceIds: [],
        daytimePrices: [
          { daytime: 'MORNING', price: '100000' },
          { daytime: 'EVENING', price: '150000' },
          { daytime: 'FULL_DAY', price: '200000' }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.capacity).toBe(200);
    expect(res.body.depositAmount).toBe(50000);
  });

  it('returns 400 (not 500) for invalid numeric inputs', async () => {
    const owner2 = await prisma.user.create({
      data: {
        fullName: 'Owner Validation Two',
        email: 'owner-validation-2@test.com',
        role: 'OWNER',
        passwordHash: 'hash',
        phone: '700200002'
      }
    });
    const owner2Token = signAccessToken({ userId: owner2.id, role: owner2.role, fullName: owner2.fullName });

    const res = await request(app)
      .post('/v1/owner/halls')
      .set('Authorization', `Bearer ${owner2Token}`)
      .send({
        name: 'Hall Invalid Capacity',
        city: 'Sanaa',
        capacity: 'abc',
        depositAmount: '50000',
        currency: 'YER',
        daytimePrices: [
          { daytime: 'MORNING', price: '100000' }
        ]
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });
});

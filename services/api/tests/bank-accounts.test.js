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

describe('Owner Bank Accounts', () => {
  let owner;
  let otherOwner;
  let ownerToken;
  let otherOwnerToken;
  let hall;
  let account;

  beforeAll(async () => {
    await resetDb();

    owner = await prisma.user.create({
      data: {
        fullName: 'Owner One',
        email: 'bank-owner1@test.com',
        role: 'OWNER',
        passwordHash: 'hash',
        phone: '700100001'
      }
    });

    otherOwner = await prisma.user.create({
      data: {
        fullName: 'Owner Two',
        email: 'bank-owner2@test.com',
        role: 'OWNER',
        passwordHash: 'hash',
        phone: '700100002'
      }
    });

    ownerToken = signAccessToken({ userId: owner.id, role: owner.role, fullName: owner.fullName });
    otherOwnerToken = signAccessToken({ userId: otherOwner.id, role: otherOwner.role, fullName: otherOwner.fullName });

    hall = await prisma.hall.create({
      data: {
        ownerId: owner.id,
        name: 'Owner Hall',
        city: 'Sanaa',
        capacity: 200,
        depositAmount: 50000,
        currency: 'YER',
        status: 'ACTIVE'
      }
    });

    account = await prisma.hallBankAccount.create({
      data: {
        hallId: hall.id,
        bankCode: 'kuraimy',
        accountHolder: 'Owner One',
        accountNumber: '111122223333'
      }
    });
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  it('updates bank account for hall owner', async () => {
    const res = await request(app)
      .patch(`/v1/owner/halls/${hall.id}/bank-accounts/${account.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        bankCode: 'omgy',
        accountHolder: 'Owner One Updated',
        accountNumber: '999900001111'
      });

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(account.id);
    expect(res.body.bankCode).toBe('omgy');
    expect(res.body.accountHolder).toBe('Owner One Updated');
    expect(res.body.accountNumber).toBe('999900001111');
  });

  it('rejects invalid bank code when updating', async () => {
    const res = await request(app)
      .patch(`/v1/owner/halls/${hall.id}/bank-accounts/${account.id}`)
      .set('Authorization', `Bearer ${ownerToken}`)
      .send({
        bankCode: 'invalid-bank',
        accountHolder: 'Owner One',
        accountNumber: '12345'
      });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_BANK_CODE');
  });

  it('forbids updating bank account from another owner', async () => {
    const res = await request(app)
      .patch(`/v1/owner/halls/${hall.id}/bank-accounts/${account.id}`)
      .set('Authorization', `Bearer ${otherOwnerToken}`)
      .send({
        bankCode: 'omgy',
        accountHolder: 'Owner One',
        accountNumber: '12345'
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('FORBIDDEN');
  });
});


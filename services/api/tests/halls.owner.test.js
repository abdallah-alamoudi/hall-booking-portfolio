const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');
const { signAccessToken } = require('../src/utils/jwt');
const { BookingStatus, Daytime } = require('@hall-booking/contracts');

const prisma = new PrismaClient();

function utcDateWithOffset(days) {
  const date = new Date();
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCDate(date.getUTCDate() + days);
  return date;
}

async function resetDb() {
  await prisma.receipt.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.availabilityBlock.deleteMany();
  await prisma.hallBankAccount.deleteMany();
  await prisma.daytimePrice.deleteMany();
  await prisma.hallPhoto.deleteMany();
  await prisma.hallServiceMap.deleteMany();
  await prisma.hall.deleteMany();
  await prisma.hallService.deleteMany();
  await prisma.user.deleteMany();
}

function buildCreatePayload(serviceId, overrides = {}) {
  return {
    name: 'My New Hall',
    city: 'Sanaa',
    area: 'Hadda',
    capacity: 200,
    depositAmount: 50000,
    currency: 'YER',
    serviceIds: [serviceId],
    photos: [{ url: 'http://img.com/1.jpg', isCover: true }],
    daytimePrices: [
      { daytime: Daytime.MORNING, price: 100000 },
      { daytime: Daytime.EVENING, price: 150000 },
      { daytime: Daytime.FULL_DAY, price: 200000 }
    ],
    ...overrides
  };
}

async function createHallDirect(ownerId, overrides = {}) {
  return prisma.hall.create({
    data: {
      ownerId,
      ownerActiveKey: ownerId,
      name: 'Owned Hall',
      city: 'Sanaa',
      capacity: 120,
      depositAmount: 30000,
      currency: 'YER',
      status: 'ACTIVE',
      daytimePrices: {
        create: [
          { daytime: Daytime.MORNING, price: 90000 },
          { daytime: Daytime.EVENING, price: 120000 },
          { daytime: Daytime.FULL_DAY, price: 180000 }
        ]
      },
      ...overrides
    }
  });
}

describe('Owner Hall Management', () => {
  let owner;
  let otherOwner;
  let customer;
  let ownerToken;
  let otherOwnerToken;
  let customerToken;
  let service1;

  beforeEach(async () => {
    await resetDb();

    owner = await prisma.user.create({
      data: {
        fullName: 'Owner One',
        email: 'owner1@test.com',
        role: 'OWNER',
        passwordHash: 'hash',
        phone: '111111'
      }
    });
    ownerToken = signAccessToken({ userId: owner.id, role: 'OWNER', fullName: owner.fullName });

    otherOwner = await prisma.user.create({
      data: {
        fullName: 'Owner Two',
        email: 'owner2@test.com',
        role: 'OWNER',
        passwordHash: 'hash',
        phone: '222222'
      }
    });
    otherOwnerToken = signAccessToken({ userId: otherOwner.id, role: 'OWNER', fullName: otherOwner.fullName });

    customer = await prisma.user.create({
      data: {
        fullName: 'Customer One',
        email: 'cust1@test.com',
        role: 'CUSTOMER',
        passwordHash: 'hash',
        phone: '333333'
      }
    });
    customerToken = signAccessToken({ userId: customer.id, role: 'CUSTOMER', fullName: customer.fullName });

    service1 = await prisma.hallService.create({ data: { name: 'WiFi' } });
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  describe('POST /v1/owner/halls', () => {
    it('creates first hall for owner', async () => {
      const res = await request(app)
        .post('/v1/owner/halls')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(buildCreatePayload(service1.id));

      expect(res.status).toBe(201);
      expect(res.body.name).toBe('My New Hall');
      expect(res.body.owner.id).toBe(owner.id);
    });

    it('returns 409 when owner already has an active hall', async () => {
      const first = await request(app)
        .post('/v1/owner/halls')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(buildCreatePayload(service1.id, { name: 'First Hall' }));

      expect(first.status).toBe(201);

      const second = await request(app)
        .post('/v1/owner/halls')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(buildCreatePayload(service1.id, { name: 'Second Hall' }));

      expect(second.status).toBe(409);
      expect(second.body.error.code).toBe('OWNER_ALREADY_HAS_HALL');
    });

    it('allows concurrent create requests to resolve as one success and one conflict', async () => {
      const payload = buildCreatePayload(service1.id, { name: 'Race Hall' });

      const [resA, resB] = await Promise.all([
        request(app).post('/v1/owner/halls').set('Authorization', `Bearer ${ownerToken}`).send(payload),
        request(app).post('/v1/owner/halls').set('Authorization', `Bearer ${ownerToken}`).send(payload)
      ]);

      const statuses = [resA.status, resB.status].sort((a, b) => a - b);
      expect(statuses).toEqual([201, 409]);
    });

    it('forbids non-owner role', async () => {
      const res = await request(app)
        .post('/v1/owner/halls')
        .set('Authorization', `Bearer ${customerToken}`)
        .send(buildCreatePayload(service1.id));

      expect(res.status).toBe(403);
    });
  });

  describe('GET /v1/owner/halls', () => {
    it('lists only my halls', async () => {
      await createHallDirect(owner.id, { name: 'My Hall' });
      await createHallDirect(otherOwner.id, { name: 'Other Hall', ownerActiveKey: otherOwner.id });

      const res = await request(app)
        .get('/v1/owner/halls')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('My Hall');
    });
  });

  describe('PATCH /v1/owner/halls/:id', () => {
    it('updates my hall', async () => {
      const hall = await createHallDirect(owner.id);

      const res = await request(app)
        .patch(`/v1/owner/halls/${hall.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ name: 'Updated Name', city: 'Taiz' });

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Updated Name');
      expect(res.body.city).toBe('Taiz');
    });

    it('does not allow updating others hall', async () => {
      const hall = await createHallDirect(owner.id);

      const res = await request(app)
        .patch(`/v1/owner/halls/${hall.id}`)
        .set('Authorization', `Bearer ${otherOwnerToken}`)
        .send({ name: 'Hacked Name' });

      expect(res.status).toBe(403);
    });

    it('rejects direct status updates', async () => {
      const hall = await createHallDirect(owner.id);

      const res = await request(app)
        .patch(`/v1/owner/halls/${hall.id}`)
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({ status: 'DELETED' });

      expect(res.status).toBe(400);
      expect(res.body.error.code).toBe('STATUS_UPDATE_NOT_ALLOWED');
    });
  });

  describe('DELETE /v1/owner/halls/:id', () => {
    it('blocks delete when there is a future pending booking', async () => {
      const hall = await createHallDirect(owner.id);

      await prisma.booking.create({
        data: {
          hallId: hall.id,
          customerId: customer.id,
          status: BookingStatus.PENDING_REVIEW,
          purpose: 'Wedding',
          date: utcDateWithOffset(7),
          daytime: Daytime.EVENING,
          totalPrice: 120000,
          currency: 'YER'
        }
      });

      const res = await request(app)
        .delete(`/v1/owner/halls/${hall.id}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('HALL_HAS_UPCOMING_BOOKINGS');
      expect(res.body.error.details.daytime).toBe(Daytime.EVENING);
    });

    it('blocks delete when there is an accepted booking on today date', async () => {
      const hall = await createHallDirect(owner.id);

      await prisma.booking.create({
        data: {
          hallId: hall.id,
          customerId: customer.id,
          status: BookingStatus.ACCEPTED,
          purpose: 'Conference',
          date: utcDateWithOffset(0),
          daytime: Daytime.MORNING,
          totalPrice: 90000,
          currency: 'YER'
        }
      });

      const res = await request(app)
        .delete(`/v1/owner/halls/${hall.id}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(409);
      expect(res.body.error.code).toBe('HALL_HAS_UPCOMING_BOOKINGS');
      expect(res.body.error.details.daytime).toBe(Daytime.MORNING);
    });

    it('allows delete when only future rejected/cancelled bookings exist', async () => {
      const hall = await createHallDirect(owner.id);

      await prisma.booking.createMany({
        data: [
          {
            hallId: hall.id,
            customerId: customer.id,
            status: BookingStatus.REJECTED,
            purpose: 'Event A',
            date: utcDateWithOffset(3),
            daytime: Daytime.MORNING,
            totalPrice: 90000,
            currency: 'YER'
          },
          {
            hallId: hall.id,
            customerId: customer.id,
            status: BookingStatus.CANCELLED,
            purpose: 'Event B',
            date: utcDateWithOffset(5),
            daytime: Daytime.EVENING,
            totalPrice: 120000,
            currency: 'YER'
          }
        ]
      });

      const res = await request(app)
        .delete(`/v1/owner/halls/${hall.id}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(204);

      const deletedHall = await prisma.hall.findUnique({ where: { id: hall.id } });
      expect(deletedHall.status).toBe('DELETED');
      expect(deletedHall.ownerActiveKey).toBeNull();
    });

    it('allows delete when only past pending/accepted bookings exist', async () => {
      const hall = await createHallDirect(owner.id);

      await prisma.booking.createMany({
        data: [
          {
            hallId: hall.id,
            customerId: customer.id,
            status: BookingStatus.PENDING_REVIEW,
            purpose: 'Past Event A',
            date: utcDateWithOffset(-3),
            daytime: Daytime.MORNING,
            totalPrice: 90000,
            currency: 'YER'
          },
          {
            hallId: hall.id,
            customerId: customer.id,
            status: BookingStatus.ACCEPTED,
            purpose: 'Past Event B',
            date: utcDateWithOffset(-1),
            daytime: Daytime.EVENING,
            totalPrice: 120000,
            currency: 'YER'
          }
        ]
      });

      const res = await request(app)
        .delete(`/v1/owner/halls/${hall.id}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(204);
    });

    it('allows creating a replacement hall after successful delete', async () => {
      const hall = await createHallDirect(owner.id);

      const deleteRes = await request(app)
        .delete(`/v1/owner/halls/${hall.id}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(deleteRes.status).toBe(204);

      const createRes = await request(app)
        .post('/v1/owner/halls')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send(buildCreatePayload(service1.id, { name: 'Replacement Hall' }));

      expect(createRes.status).toBe(201);
      expect(createRes.body.name).toBe('Replacement Hall');
    });
  });
});

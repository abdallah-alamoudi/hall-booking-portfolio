const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');
const { signAccessToken } = require('../src/utils/jwt');
const { BookingStatus } = require('@hall-booking/contracts');

const prisma = new PrismaClient();

describe('Bookings Management (F04)', () => {
  let owner, otherOwner, customer, otherCustomer;
  let ownerToken, otherOwnerToken, customerToken, otherCustomerToken;
  let hall1, hall2;

  beforeAll(async () => {
    // Cleanup
    await prisma.booking.deleteMany();
    await prisma.availabilityBlock.deleteMany();
    await prisma.hallPhoto.deleteMany();
    await prisma.hallServiceMap.deleteMany();
    await prisma.hall.deleteMany();
    await prisma.user.deleteMany();

    // Create users
    owner = await prisma.user.create({
      data: { fullName: 'Owner One', email: 'owner1@test.com', role: 'OWNER', passwordHash: 'hash', phone: '111' }
    });
    ownerToken = signAccessToken({ userId: owner.id, role: 'OWNER', fullName: owner.fullName });

    otherOwner = await prisma.user.create({
      data: { fullName: 'Owner Two', email: 'owner2@test.com', role: 'OWNER', passwordHash: 'hash', phone: '222' }
    });
    otherOwnerToken = signAccessToken({ userId: otherOwner.id, role: 'OWNER', fullName: otherOwner.fullName });

    customer = await prisma.user.create({
      data: { fullName: 'Customer One', email: 'cust1@test.com', role: 'CUSTOMER', passwordHash: 'hash', phone: '333' }
    });
    customerToken = signAccessToken({ userId: customer.id, role: 'CUSTOMER', fullName: customer.fullName });

    otherCustomer = await prisma.user.create({
      data: { fullName: 'Customer Two', email: 'cust2@test.com', role: 'CUSTOMER', passwordHash: 'hash', phone: '444' }
    });
    otherCustomerToken = signAccessToken({ userId: otherCustomer.id, role: 'CUSTOMER', fullName: otherCustomer.fullName });

    // Create halls
    hall1 = await prisma.hall.create({
      data: {
        ownerId: owner.id,
        name: 'Hall One',
        city: 'City A',
        capacity: 100,
        basePrice: 1000,
        status: 'ACTIVE'
      }
    });

    hall2 = await prisma.hall.create({
      data: {
        ownerId: otherOwner.id,
        name: 'Hall Two',
        city: 'City B',
        capacity: 200,
        basePrice: 2000,
        status: 'ACTIVE'
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('POST /v1/bookings', () => {
    it('customer should create a booking successfully', async () => {
      const now = new Date();
      const startAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 5); // 5 days from now
      const endAt = new Date(startAt.getTime() + 1000 * 60 * 60 * 24 * 2); // +2 days

      const res = await request(app)
        .post('/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          hallId: hall1.id,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          guestCount: 50,
          customerNote: 'Test booking'
        });

      expect(res.status).toBe(201);
      expect(res.body.hallId).toBe(hall1.id);
      expect(res.body.customerId).toBe(customer.id);
      expect(res.body.status).toBe(BookingStatus.PENDING);
    });

    it('should fail if dates are in the past', async () => {
      const now = new Date();
      const startAt = new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5); // 5 days ago
      const endAt = new Date(startAt.getTime() + 1000 * 60 * 60 * 24 * 2);

      const res = await request(app)
        .post('/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          hallId: hall1.id,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          guestCount: 50
        });

      expect(res.status).toBe(400);
      expect(res.body.error.message).toContain('past dates');
    });

    it('should fail for non-customers (owner)', async () => {
      const now = new Date();
      const startAt = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 5);
      const endAt = new Date(startAt.getTime() + 1000 * 60 * 60 * 24 * 2);

      const res = await request(app)
        .post('/v1/bookings')
        .set('Authorization', `Bearer ${ownerToken}`)
        .send({
          hallId: hall1.id,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          guestCount: 50
        });

      expect(res.status).toBe(403);
    });
  });

  describe('GET /v1/bookings', () => {
    it('should list customer bookings only', async () => {
      const res = await request(app)
        .get('/v1/bookings')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].hallId).toBe(hall1.id);
    });

    it('other customer should see empty list', async () => {
      const res = await request(app)
        .get('/v1/bookings')
        .set('Authorization', `Bearer ${otherCustomerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
    });
  });

  describe('GET /v1/owner/bookings', () => {
    it('owner should see bookings for their halls', async () => {
      const res = await request(app)
        .get('/v1/owner/bookings')
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      expect(res.body[0].hallId).toBe(hall1.id);
      expect(res.body[0].customer.id).toBe(customer.id);
    });

    it('other owner should see empty list', async () => {
      const res = await request(app)
        .get('/v1/owner/bookings')
        .set('Authorization', `Bearer ${otherOwnerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(0);
    });
  });

  describe('GET /v1/owner/bookings/:id', () => {
    let bookingId;

    beforeAll(async () => {
      const booking = await prisma.booking.findFirst({ where: { hallId: hall1.id } });
      bookingId = booking.id;
    });

    it('should return full detail for owner of the hall', async () => {
      const res = await request(app)
        .get(`/v1/owner/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe(bookingId);
      expect(res.body.hall.id).toBe(hall1.id);
      expect(res.body.customer.id).toBe(customer.id);
    });

    it('should return 403 when access booking for other owner', async () => {
      const res = await request(app)
        .get(`/v1/owner/bookings/${bookingId}`)
        .set('Authorization', `Bearer ${otherOwnerToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent booking', async () => {
      const res = await request(app)
        .get(`/v1/owner/bookings/non-existent-id`)
        .set('Authorization', `Bearer ${ownerToken}`);

      expect(res.status).toBe(404);
    });
  });
});

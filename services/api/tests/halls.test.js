const request = require('supertest');
const app = require('../src/app');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

describe('Hall Discovery (F01)', () => {
  let owner;
  let hall1, hall2;

  beforeAll(async () => {
    // Cleanup
    await prisma.hallServiceMap.deleteMany();
    await prisma.hallPhoto.deleteMany();
    await prisma.hall.deleteMany();
    await prisma.user.deleteMany();
    await prisma.hallService.deleteMany();

    // Create owner
    owner = await prisma.user.create({
      data: {
        fullName: 'Test Owner',
        email: 'owner@test.com',
        role: 'OWNER',
        passwordHash: 'hash',
        phone: '123456789'
      }
    });

    // Create services
    const service1 = await prisma.hallService.create({ data: { name: 'Parking' } });
    const service2 = await prisma.hallService.create({ data: { name: 'WiFi' } });

    // Create halls
    hall1 = await prisma.hall.create({
      data: {
        ownerId: owner.id,
        name: 'Grand Hall',
        city: 'Sanaa',
        capacity: 500,
        basePrice: 100000,
        status: 'ACTIVE',
        services: {
          create: [{ serviceId: service1.id }]
        }
      }
    });

    hall2 = await prisma.hall.create({
      data: {
        ownerId: owner.id,
        name: 'Small Hall',
        city: 'Aden',
        capacity: 100,
        basePrice: 50000,
        status: 'ACTIVE',
        services: {
          create: [{ serviceId: service2.id }]
        }
      }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('GET /v1/halls', () => {
    it('should list all active halls', async () => {
      const res = await request(app).get('/v1/halls');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
      expect(res.body.meta.total).toBe(2);
    });

    it('should filter by city', async () => {
      const res = await request(app).get('/v1/halls?city=Sanaa');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(hall1.id);
    });

    it('should filter by capacity', async () => {
      const res = await request(app).get('/v1/halls?minCapacity=400');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(hall1.id);
    });

    it('should filter by price', async () => {
      const res = await request(app).get('/v1/halls?maxPrice=60000');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(hall2.id);
    });

    it('should search by name', async () => {
      const res = await request(app).get('/v1/halls?search=Grand');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].id).toBe(hall1.id);
    });
  });

  describe('GET /v1/halls/:id', () => {
    it('should return hall details', async () => {
      const res = await request(app).get(`/v1/halls/${hall1.id}`);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(hall1.id);
      expect(res.body.name).toBe(hall1.name);
      expect(res.body.services).toHaveLength(1);
      expect(res.body.services[0].name).toBe('Parking');
    });

    it('should return 404 for non-existent hall', async () => {
      const res = await request(app).get('/v1/halls/non-existent-id');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /v1/services', () => {
    it('should list all services', async () => {
      const res = await request(app).get('/v1/services');
      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(2);
    });
  });
});

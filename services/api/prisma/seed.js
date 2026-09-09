const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const seedPassword = process.env.SEED_PASSWORD;
  if (!seedPassword || seedPassword.length < 12) {
    throw new Error('Set SEED_PASSWORD to a local demo password of at least 12 characters.');
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Demo seed is disabled in production.');
  }
  const passwordHash = await bcrypt.hash(seedPassword, 10);

  // Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {
      passwordHash,
      phone: '900000',
      role: 'ADMIN',
      isActive: true
    },
    create: {
      email: 'admin@example.com',
      fullName: 'Admin User',
      role: 'ADMIN',
      passwordHash,
      phone: '900000',
      isActive: true
    },
  });

  // Owner
  const owner = await prisma.user.upsert({
    where: { email: 'owner1@example.com' },
    update: {
      passwordHash,
      phone: '900001',
      role: 'OWNER',
      isActive: true
    },
    create: {
      email: 'owner1@example.com',
      fullName: 'Owner One',
      role: 'OWNER',
      passwordHash,
      phone: '900001',
      isActive: true
    },
  });

  // Customer
  const customer = await prisma.user.upsert({
    where: { email: 'customer1@example.com' },
    update: {
      passwordHash,
      phone: '900002',
      role: 'CUSTOMER',
      isActive: true
    },
    create: {
      email: 'customer1@example.com',
      fullName: 'Customer One',
      role: 'CUSTOMER',
      passwordHash,
      phone: '900002',
      isActive: true
    },
  });

  // Services
  const services = ['WiFi', 'Parking', 'Catering', 'DJ', 'Decoration'];
  for (const name of services) {
    await prisma.hallService.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  // Fetch services to link to the hall
  const wifiService = await prisma.hallService.findUnique({ where: { name: 'WiFi' } });
  const parkingService = await prisma.hallService.findUnique({ where: { name: 'Parking' } });
  const cateringService = await prisma.hallService.findUnique({ where: { name: 'Catering' } });

  // Create a Hall for the Owner with daytime pricing
  const hall = await prisma.hall.upsert({
    where: { id: 'seed-hall-1' },
    update: {},
    create: {
      ownerId: owner.id,
      ownerActiveKey: owner.id,
      name: 'Grand Celebration Hall',
      description: 'A beautiful and spacious hall for majestic weddings and large events.',
      city: 'Sanaa',
      area: 'Hadda District',
      capacity: 500,
      depositAmount: 50000,
      currency: 'YER',
      status: 'ACTIVE',
      photos: {
        create: [
          {
            url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80&w=1200',
            isCover: true,
          }
        ]
      },
      services: {
        create: [
          { serviceId: wifiService.id },
          { serviceId: parkingService.id },
          { serviceId: cateringService.id }
        ]
      },
      daytimePrices: {
        create: [
          { daytime: 'MORNING', price: 100000 },
          { daytime: 'EVENING', price: 150000 },
          { daytime: 'FULL_DAY', price: 200000 },
        ]
      },
      bankAccounts: {
        create: [
          {
            bankCode: 'kuraimy',
            accountHolder: 'Owner One',
            accountNumber: '1234567890',
          }
        ]
      }
    }
  }).catch(async (e) => {
    return prisma.hall.findFirst({ where: { ownerId: owner.id } });
  });

  console.log({ admin: admin.email, owner: owner.email, customer: customer.email, hall: hall?.name });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

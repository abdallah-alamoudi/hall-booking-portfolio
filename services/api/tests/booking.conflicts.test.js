const { PrismaClient } = require('@prisma/client');
const { Daytime, BookingStatus } = require('@hall-booking/contracts');
const availabilityService = require('../src/modules/availability/availability.service');
const bookingsService = require('../src/modules/bookings/bookings.service');
const { HttpError } = require('../src/common/http-error');

const prisma = new PrismaClient();

function toDateOnlyString(date) {
  return date.toISOString().split('T')[0];
}

function addDaysFromToday(days) {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
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
  await prisma.user.deleteMany();
}

describe('Booking conflict hardening', () => {
  let owner;
  let customerA;
  let customerB;
  let hall;

  beforeAll(async () => {
    await resetDb();

    owner = await prisma.user.create({
      data: {
        fullName: 'Owner',
        email: 'owner+conflicts@test.com',
        phone: '900100001',
        passwordHash: 'hash',
        role: 'OWNER'
      }
    });

    customerA = await prisma.user.create({
      data: {
        fullName: 'Customer A',
        email: 'customer.a+conflicts@test.com',
        phone: '900100002',
        passwordHash: 'hash',
        role: 'CUSTOMER'
      }
    });

    customerB = await prisma.user.create({
      data: {
        fullName: 'Customer B',
        email: 'customer.b+conflicts@test.com',
        phone: '900100003',
        passwordHash: 'hash',
        role: 'CUSTOMER'
      }
    });

    hall = await prisma.hall.create({
      data: {
        ownerId: owner.id,
        name: 'Conflict Test Hall',
        city: 'Sanaa',
        capacity: 120,
        depositAmount: 50000,
        currency: 'YER',
        status: 'ACTIVE'
      }
    });

    await prisma.daytimePrice.createMany({
      data: [
        { hallId: hall.id, daytime: Daytime.MORNING, price: 100000 },
        { hallId: hall.id, daytime: Daytime.EVENING, price: 100000 },
        { hallId: hall.id, daytime: Daytime.FULL_DAY, price: 180000 }
      ]
    });
  });

  afterEach(async () => {
    await prisma.receipt.deleteMany();
    await prisma.booking.deleteMany();
    await prisma.availabilityBlock.deleteMany();
  });

  afterAll(async () => {
    await resetDb();
    await prisma.$disconnect();
  });

  it('returns dashboard-compatible busy slots and mobile slot map with full-day dependency', async () => {
    const targetDate = addDaysFromToday(7);
    const dateKey = toDateOnlyString(targetDate);

    const block = await prisma.availabilityBlock.create({
      data: {
        hallId: hall.id,
        startAt: targetDate,
        endAt: targetDate,
        type: 'BLOCKED',
        daytime: Daytime.MORNING
      }
    });

    const booking = await prisma.booking.create({
      data: {
        hallId: hall.id,
        customerId: customerA.id,
        status: BookingStatus.PENDING_REVIEW,
        purpose: 'Engagement',
        date: targetDate,
        daytime: Daytime.EVENING,
        totalPrice: 100000,
        currency: 'YER',
        receipt: {
          create: {
            imageUrl: '/uploads/receipts/test-a.jpg',
            status: 'UPLOADED'
          }
        }
      }
    });

    const availability = await availabilityService.getAvailability(hall.id);

    expect(availability.busySlotsMap[dateKey]).toEqual(
      expect.arrayContaining([Daytime.MORNING, Daytime.EVENING, Daytime.FULL_DAY])
    );

    expect(availability.busySlots).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: block.id,
          type: 'BLOCKED',
          date: dateKey
        }),
        expect.objectContaining({
          bookingId: booking.id,
          type: 'BOOKED',
          date: dateKey
        })
      ])
    );
  });

  it('marks MORNING booking as MORNING + FULL_DAY only (keeps EVENING available)', async () => {
    const targetDate = addDaysFromToday(8);
    const dateKey = toDateOnlyString(targetDate);

    await prisma.booking.create({
      data: {
        hallId: hall.id,
        customerId: customerA.id,
        status: BookingStatus.PENDING_REVIEW,
        purpose: 'Morning only',
        date: targetDate,
        daytime: Daytime.MORNING,
        totalPrice: 100000,
        currency: 'YER',
        receipt: {
          create: {
            imageUrl: '/uploads/receipts/morning-only.jpg',
            status: 'UPLOADED'
          }
        }
      }
    });

    const availability = await availabilityService.getAvailability(hall.id);
    const daySlots = availability.busySlotsMap[dateKey];

    expect(daySlots).toEqual(expect.arrayContaining([Daytime.MORNING, Daytime.FULL_DAY]));
    expect(daySlots).not.toContain(Daytime.EVENING);
  });

  it('returns owner-only details for blocked reasons and booking info', async () => {
    const targetDate = addDaysFromToday(9);
    const dateKey = toDateOnlyString(targetDate);

    await prisma.availabilityBlock.create({
      data: {
        hallId: hall.id,
        startAt: targetDate,
        endAt: targetDate,
        type: 'BLOCKED',
        daytime: Daytime.EVENING,
        note: 'Deep cleaning'
      }
    });

    const booking = await prisma.booking.create({
      data: {
        hallId: hall.id,
        customerId: customerA.id,
        status: BookingStatus.PENDING_REVIEW,
        purpose: 'Family event',
        date: targetDate,
        daytime: Daytime.MORNING,
        totalPrice: 100000,
        currency: 'YER',
        receipt: {
          create: {
            imageUrl: '/uploads/receipts/owner-details.jpg',
            status: 'UPLOADED'
          }
        }
      }
    });

    const availability = await availabilityService.getOwnerAvailability(owner.id, hall.id);
    const sameDay = availability.busySlots.filter((slot) => slot.date === dateKey);
    const blocked = sameDay.find((slot) => slot.type === 'BLOCKED' && slot.daytime === Daytime.EVENING);
    const booked = sameDay.find((slot) => slot.type === 'BOOKED' && slot.daytime === Daytime.MORNING);

    expect(blocked?.note).toBe('Deep cleaning');
    expect(booked?.bookingId).toBe(booking.id);
    expect(booked?.booking?.customer?.fullName).toBe(customerA.fullName);
  });

  it('prevents concurrent FULL_DAY and MORNING creates for the same hall/date', async () => {
    const bookingDate = addDaysFromToday(10);
    const bookingDateStr = toDateOnlyString(bookingDate);

    const fullDayRequest = bookingsService.createBooking(customerA.id, {
      hallId: hall.id,
      date: bookingDateStr,
      daytime: Daytime.FULL_DAY,
      purpose: 'Wedding',
      receiptImageUrl: '/uploads/receipts/full-day.jpg'
    });

    const morningRequest = bookingsService.createBooking(customerB.id, {
      hallId: hall.id,
      date: bookingDateStr,
      daytime: Daytime.MORNING,
      purpose: 'Morning event',
      receiptImageUrl: '/uploads/receipts/morning.jpg'
    });

    const results = await Promise.allSettled([fullDayRequest, morningRequest]);
    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toBeInstanceOf(HttpError);
    expect(rejected[0].reason.code).toBe('SLOT_TAKEN');
  });

  it('prevents concurrent acceptance of conflicting pending bookings', async () => {
    const targetDate = addDaysFromToday(12);

    const fullDayBooking = await prisma.booking.create({
      data: {
        hallId: hall.id,
        customerId: customerA.id,
        status: BookingStatus.PENDING_REVIEW,
        purpose: 'Full day event',
        date: targetDate,
        daytime: Daytime.FULL_DAY,
        totalPrice: 180000,
        currency: 'YER',
        receipt: {
          create: {
            imageUrl: '/uploads/receipts/full-accept.jpg',
            status: 'UPLOADED'
          }
        }
      }
    });

    const morningBooking = await prisma.booking.create({
      data: {
        hallId: hall.id,
        customerId: customerB.id,
        status: BookingStatus.PENDING_REVIEW,
        purpose: 'Morning event',
        date: targetDate,
        daytime: Daytime.MORNING,
        totalPrice: 100000,
        currency: 'YER',
        receipt: {
          create: {
            imageUrl: '/uploads/receipts/morning-accept.jpg',
            status: 'UPLOADED'
          }
        }
      }
    });

    const results = await Promise.allSettled([
      bookingsService.updateBookingStatus(owner.id, fullDayBooking.id, { action: 'accept' }),
      bookingsService.updateBookingStatus(owner.id, morningBooking.id, { action: 'accept' })
    ]);

    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    expect(rejected[0].reason).toBeInstanceOf(HttpError);
    expect(rejected[0].reason.code).toBe('DOUBLE_BOOKING');
  });
});

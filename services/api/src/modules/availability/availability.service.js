const { PrismaClient } = require('@prisma/client');
const { HttpError } = require('../../common/http-error');

const prisma = new PrismaClient();
const ALL_DAYTIME_SLOTS = ['MORNING', 'EVENING', 'FULL_DAY'];

function toDateKey(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toUtcDateOnly(dateInput) {
  const date = new Date(dateInput);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function toDateStartIso(dateKey) {
  return `${dateKey}T00:00:00.000Z`;
}

async function assertOwnerHall(ownerId, hallId) {
  const hall = await prisma.hall.findUnique({
    where: { id: hallId },
    select: { id: true, ownerId: true }
  });

  if (!hall) throw new HttpError(404, 'HALL_NOT_FOUND', 'Hall not found');
  if (hall.ownerId !== ownerId) throw new HttpError(403, 'FORBIDDEN', 'You are not the owner of this hall');
}

async function createBlock(ownerId, hallId, input) {
  const { startAt, endAt, type, daytime, note } = input;

  const hall = await prisma.hall.findUnique({ where: { id: hallId } });
  if (!hall) throw new HttpError(404, 'HALL_NOT_FOUND', 'Hall not found');
  if (hall.ownerId !== ownerId) throw new HttpError(403, 'FORBIDDEN', 'You are not the owner of this hall');

  const parsedStart = new Date(startAt);
  const parsedEnd = new Date(endAt);

  if (Number.isNaN(parsedStart.getTime()) || Number.isNaN(parsedEnd.getTime())) {
    throw new HttpError(400, 'INVALID_DATES', 'startAt and endAt must be valid dates');
  }

  const startDate = toUtcDateOnly(parsedStart);
  const endDate = toUtcDateOnly(parsedEnd);
  const now = toUtcDateOnly(new Date());

  if (startDate > endDate) throw new HttpError(400, 'INVALID_DATES', 'Start date must be before or equal to end date');
  if (startDate < now) throw new HttpError(400, 'PAST_DATE', 'Cannot block dates in the past');

  return prisma.availabilityBlock.create({
    data: {
      hallId,
      startAt: startDate,
      endAt: endDate,
      type,
      daytime: daytime || null,
      note
    }
  });
}

async function deleteBlock(ownerId, blockId) {
  const block = await prisma.availabilityBlock.findUnique({
    where: { id: blockId },
    include: { hall: true }
  });

  if (!block) throw new HttpError(404, 'BLOCK_NOT_FOUND', 'Availability block not found');
  if (block.hall.ownerId !== ownerId) throw new HttpError(403, 'FORBIDDEN', 'You are not the owner of this hall');

  await prisma.availabilityBlock.delete({ where: { id: blockId } });
  return { message: 'Block removed' };
}

/**
 * Returns busy slots combining availability blocks + existing bookings.
 */
async function getAvailabilityCore(hallId, options = {}) {
  const { includeOwnerDetails = false } = options;
  const busySlotsMap = {}; // { "2026-03-01": ["MORNING", "EVENING", "FULL_DAY"] }
  const busySlotsList = []; // Flat list for dashboard

  // 1. Get all availability blocks
  const blocks = await prisma.availabilityBlock.findMany({
    where: { hallId },
    orderBy: { startAt: 'asc' }
  });

  for (const block of blocks) {
    const start = toUtcDateOnly(block.startAt);
    const end = toUtcDateOnly(block.endAt);

    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      const dateStr = toDateKey(d);
      if (!busySlotsMap[dateStr]) busySlotsMap[dateStr] = new Set();

      const blockedSlots = block.daytime ? [block.daytime] : ALL_DAYTIME_SLOTS;
      blockedSlots.forEach((slot) => busySlotsMap[dateStr].add(slot));

      busySlotsList.push({
        id: block.id,
        blockId: block.id,
        date: dateStr,
        daytime: block.daytime || 'FULL_DAY',
        startAt: toDateStartIso(dateStr),
        type: 'BLOCKED',
        ...(includeOwnerDetails ? { note: block.note || null } : {})
      });
    }
  }

  // 2. Get bookings that are PENDING_REVIEW or ACCEPTED
  const bookings = await prisma.booking.findMany({
    where: {
      hallId,
      status: { in: ['PENDING_REVIEW', 'ACCEPTED'] }
    },
    ...(includeOwnerDetails
      ? {
          include: {
            customer: {
              select: {
                id: true,
                fullName: true,
                phone: true,
                email: true
              }
            }
          }
        }
      : {})
  });

  for (const booking of bookings) {
    const dateStr = toDateKey(booking.date);
    if (!busySlotsMap[dateStr]) busySlotsMap[dateStr] = new Set();

    busySlotsMap[dateStr].add(booking.daytime);

    busySlotsList.push({
      id: `booking-${booking.id}-${booking.daytime}`,
      bookingId: booking.id,
      date: dateStr,
      daytime: booking.daytime,
      startAt: toDateStartIso(dateStr),
      type: 'BOOKED',
      ...(includeOwnerDetails
        ? {
            booking: {
              id: booking.id,
              status: booking.status,
              purpose: booking.purpose,
              totalPrice: booking.totalPrice,
              currency: booking.currency,
              customer: booking.customer
            }
          }
        : {})
    });
  }

  // 3. Apply business rules for dependencies (FULL_DAY <-> MORNING/EVENING)
  const finalMap = {};
  Object.keys(busySlotsMap).forEach(date => {
    const originalSlots = busySlotsMap[date];
    const resolvedSlots = new Set(originalSlots);

    // MORNING/EVENING occupancy makes FULL_DAY unavailable.
    if (originalSlots.has('MORNING') || originalSlots.has('EVENING')) {
      resolvedSlots.add('FULL_DAY');
    }

    // Only an actually occupied FULL_DAY slot blocks MORNING + EVENING.
    if (originalSlots.has('FULL_DAY')) {
      resolvedSlots.add('MORNING');
      resolvedSlots.add('EVENING');
    }

    finalMap[date] = Array.from(resolvedSlots).sort();
  });

  return { 
    busySlots: busySlotsList,     // Flat list for dashboard
    busySlotsMap: finalMap        // Map for mobile
  };
}

async function getAvailability(hallId) {
  return getAvailabilityCore(hallId);
}

async function getOwnerAvailability(ownerId, hallId) {
  await assertOwnerHall(ownerId, hallId);
  return getAvailabilityCore(hallId, { includeOwnerDetails: true });
}

module.exports = {
  createBlock,
  deleteBlock,
  getAvailability,
  getOwnerAvailability
};

const { PrismaClient, Prisma } = require('@prisma/client');
const { HttpError } = require('../../common/http-error');
const { BookingStatus, Daytime } = require('@hall-booking/contracts');

const prisma = new PrismaClient();
const BOOKING_LOCK_TIMEOUT_SECONDS = 10;

function toUtcDateOnly(dateInput) {
  const date = new Date(dateInput);
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function toDateKey(date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function withBookingSlotLock(hallId, bookingDate, work) {
  const lockKey = `hall-booking:${hallId}:${toDateKey(bookingDate)}`;
  return prisma.$transaction(
    async (lockTx) => {
      const lockResult = await lockTx.$queryRaw`
        SELECT GET_LOCK(${lockKey}, ${BOOKING_LOCK_TIMEOUT_SECONDS}) AS lockAcquired
      `;
      const lockAcquired = Number(lockResult?.[0]?.lockAcquired || 0);

      if (lockAcquired !== 1) {
        throw new HttpError(503, 'BOOKING_LOCK_TIMEOUT', 'Could not lock the requested slot. Please retry.');
      }

      try {
        return await work();
      } finally {
        await lockTx.$queryRaw`SELECT RELEASE_LOCK(${lockKey}) AS lockReleased`;
      }
    },
    { maxWait: 5000, timeout: (BOOKING_LOCK_TIMEOUT_SECONDS + 10) * 1000 }
  );
}

function mapUniqueSlotError(error) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    throw new HttpError(409, 'SLOT_TAKEN', 'This slot is already booked');
  }
  throw error;
}

/**
 * Creates a booking with receipt (receipt-first flow).
 * Booking is only created when the customer uploads a receipt.
 */
async function createBooking(customerId, input) {
  const { hallId, date, daytime, purpose, bankAccountId, customerNote, receiptImageUrl } = input;

  // Validate required fields
  if (!hallId) throw new HttpError(400, 'VALIDATION_ERROR', 'hallId is required');
  if (!date) throw new HttpError(400, 'VALIDATION_ERROR', 'date is required');
  if (!daytime || !Object.values(Daytime).includes(daytime)) {
    throw new HttpError(400, 'VALIDATION_ERROR', `daytime must be one of: ${Object.values(Daytime).join(', ')}`);
  }
  if (!purpose || !purpose.trim()) throw new HttpError(400, 'VALIDATION_ERROR', 'purpose is required');
  if (!receiptImageUrl) throw new HttpError(400, 'VALIDATION_ERROR', 'Receipt image is required');

  // 1. Verify Hall exists and is active
  const hall = await prisma.hall.findUnique({
    where: { id: hallId },
    include: { daytimePrices: true }
  });

  if (!hall || hall.status !== 'ACTIVE') {
    throw new HttpError(404, 'HALL_NOT_FOUND', 'Hall not found');
  }

  // 2. Get the price for the selected daytime
  const daytimePrice = hall.daytimePrices.find(dp => dp.daytime === daytime);
  if (!daytimePrice) {
    throw new HttpError(400, 'NO_PRICE', `No price configured for ${daytime} slot`);
  }

  // 3. Validate date
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'date must be a valid date');
  }
  const bookingDate = toUtcDateOnly(parsedDate);
  const now = toUtcDateOnly(new Date());

  if (bookingDate < now) {
    throw new HttpError(400, 'PAST_DATE', 'Cannot book past dates');
  }

  try {
    return await withBookingSlotLock(hallId, bookingDate, async () => {
      // 4. Check availability blocks
      const blockingBlock = await prisma.availabilityBlock.findFirst({
        where: {
          hallId,
          startAt: { lte: bookingDate },
          endAt: { gte: bookingDate },
          OR: [
            { daytime: null },       // blocks all slots
            { daytime: daytime },    // blocks this specific slot
            // If booking MORNING or EVENING, check if FULL_DAY is blocked
            ...(daytime !== 'FULL_DAY' ? [{ daytime: 'FULL_DAY' }] : []),
            // If booking FULL_DAY, check if MORNING or EVENING is blocked
            ...(daytime === 'FULL_DAY' ? [{ daytime: 'MORNING' }, { daytime: 'EVENING' }] : [])
          ]
        }
      });

      if (blockingBlock) {
        throw new HttpError(409, 'DATE_BLOCKED', 'This slot is blocked by the owner');
      }

      // 5. Check existing bookings (PENDING_REVIEW or ACCEPTED)
      const conflictWhere = {
        hallId,
        date: bookingDate,
        status: { in: [BookingStatus.PENDING_REVIEW, BookingStatus.ACCEPTED] },
        OR: [
          { daytime: daytime },
          // FULL_DAY conflicts with MORNING and EVENING
          ...(daytime === 'FULL_DAY' ? [{ daytime: 'MORNING' }, { daytime: 'EVENING' }] : []),
          ...(daytime !== 'FULL_DAY' ? [{ daytime: 'FULL_DAY' }] : [])
        ]
      };

      const conflictingBooking = await prisma.booking.findFirst({ where: conflictWhere });
      if (conflictingBooking) {
        throw new HttpError(409, 'SLOT_TAKEN', 'This slot is already booked');
      }

      // 6. Verify bankAccountId belongs to this hall (if provided)
      if (bankAccountId) {
        const bankAccount = await prisma.hallBankAccount.findUnique({ where: { id: bankAccountId } });
        if (!bankAccount || bankAccount.hallId !== hallId) {
          throw new HttpError(400, 'INVALID_BANK_ACCOUNT', 'Bank account does not belong to this hall');
        }
      }

      // 7. Create Booking + Receipt atomically
      const totalPrice = daytimePrice.price;

      return prisma.booking.create({
        data: {
          hallId,
          customerId,
          status: BookingStatus.PENDING_REVIEW,
          purpose: purpose.trim(),
          date: bookingDate,
          daytime,
          totalPrice,
          currency: hall.currency,
          bankAccountId,
          customerNote,
          receipt: {
            create: {
              imageUrl: receiptImageUrl,
              status: 'UPLOADED'
            }
          }
        },
        include: { receipt: true, hall: { select: { id: true, name: true } } }
      });
    });
  } catch (error) {
    mapUniqueSlotError(error);
  }
}

async function getCustomerBookings(customerId) {
  return prisma.booking.findMany({
    where: { customerId },
    include: {
      hall: {
        select: {
          id: true,
          name: true,
          city: true,
          photos: {
            where: { isCover: true },
            take: 1,
            select: { url: true }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

async function getOwnerBookings(ownerId) {
  return prisma.booking.findMany({
    where: {
      hall: { ownerId }
    },
    include: {
      hall: { select: { id: true, name: true } },
      customer: {
        select: { id: true, fullName: true, phone: true, email: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}

async function getOwnerBookingById(ownerId, bookingId) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      hall: {
        select: {
          id: true,
          name: true,
          ownerId: true,
          depositAmount: true,
          currency: true
        }
      },
      customer: {
        select: { id: true, fullName: true, phone: true, email: true }
      },
      receipt: true
    }
  });

  if (!booking) throw new HttpError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
  if (booking.hall.ownerId !== ownerId) throw new HttpError(403, 'FORBIDDEN', 'Not your hall');

  return booking;
}

async function reuploadReceipt(customerId, bookingId, imageUrl) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { receipt: true }
  });

  if (!booking) throw new HttpError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
  if (booking.customerId !== customerId) throw new HttpError(403, 'FORBIDDEN', 'Not your booking');
  if (!booking.receipt || booking.receipt.status !== 'REJECTED') {
    throw new HttpError(400, 'INVALID_STATE', 'Receipt can only be re-uploaded after rejection');
  }

  // Reset booking status back to PENDING_REVIEW
  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: BookingStatus.PENDING_REVIEW, rejectReason: null }
  });

  return prisma.receipt.update({
    where: { bookingId },
    data: { imageUrl, status: 'UPLOADED', note: null }
  });
}

/**
 * Owner accepts or rejects a booking.
 * On accept: transactional double-booking check before updating.
 */
async function updateBookingStatus(ownerId, bookingId, { action, reason }) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { hall: true, receipt: true }
  });

  if (!booking) throw new HttpError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
  if (booking.hall.ownerId !== ownerId) throw new HttpError(403, 'FORBIDDEN', 'Not your hall');
  if (booking.status !== BookingStatus.PENDING_REVIEW) {
    throw new HttpError(400, 'INVALID_STATE', 'Booking is not pending review');
  }

  if (action === 'accept') {
    return withBookingSlotLock(booking.hallId, booking.date, async () => {
      return prisma.$transaction(async (tx) => {
        const currentBooking = await tx.booking.findUnique({
          where: { id: bookingId },
          include: { hall: true, receipt: true }
        });

        if (!currentBooking) throw new HttpError(404, 'BOOKING_NOT_FOUND', 'Booking not found');
        if (currentBooking.hall.ownerId !== ownerId) throw new HttpError(403, 'FORBIDDEN', 'Not your hall');
        if (currentBooking.status !== BookingStatus.PENDING_REVIEW) {
          throw new HttpError(400, 'INVALID_STATE', 'Booking is not pending review');
        }
        if (!currentBooking.receipt || currentBooking.receipt.status !== 'UPLOADED') {
          throw new HttpError(400, 'NO_RECEIPT', 'Cannot accept without an uploaded receipt');
        }

        // Check for conflicts: another ACCEPTED booking for same hall+date+daytime
        const conflictWhere = {
          hallId: currentBooking.hallId,
          date: currentBooking.date,
          id: { not: bookingId },
          status: BookingStatus.ACCEPTED,
          OR: [
            { daytime: currentBooking.daytime },
            ...(currentBooking.daytime === 'FULL_DAY' ? [{ daytime: 'MORNING' }, { daytime: 'EVENING' }] : []),
            ...(currentBooking.daytime !== 'FULL_DAY' ? [{ daytime: 'FULL_DAY' }] : [])
          ]
        };

        const conflict = await tx.booking.findFirst({ where: conflictWhere });
        if (conflict) {
          throw new HttpError(409, 'DOUBLE_BOOKING', 'Another booking is already accepted for this slot');
        }

        await tx.booking.update({
          where: { id: bookingId },
          data: {
            status: BookingStatus.ACCEPTED,
            ownerDecisionAt: new Date(),
            ownerDecisionBy: ownerId
          }
        });

        await tx.receipt.update({
          where: { bookingId },
          data: { status: 'VERIFIED' }
        });

        return { message: 'Booking accepted' };
      });
    });

  } else if (action === 'reject') {
    if (!reason || !reason.trim()) {
      throw new HttpError(400, 'REASON_REQUIRED', 'A reason is required when rejecting');
    }

    await prisma.$transaction([
      prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: BookingStatus.REJECTED,
          rejectReason: reason.trim(),
          ownerDecisionAt: new Date(),
          ownerDecisionBy: ownerId
        }
      }),
      prisma.receipt.update({
        where: { bookingId },
        data: { status: 'REJECTED', note: reason.trim() }
      })
    ]);

    return { message: 'Booking rejected' };

  } else {
    throw new HttpError(400, 'INVALID_ACTION', 'action must be "accept" or "reject"');
  }
}

module.exports = {
  createBooking,
  getCustomerBookings,
  getOwnerBookings,
  getOwnerBookingById,
  reuploadReceipt,
  updateBookingStatus
};

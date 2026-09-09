const { PrismaClient, Prisma } = require('@prisma/client');
const { Daytime, BookingStatus } = require('@hall-booking/contracts');
const { HttpError } = require('../../common/http-error');
const { deleteFile } = require('../../utils/file.utils');

const prisma = new PrismaClient();
const DAYTIME_VALUES = Object.values(Daytime || {});
const DELETE_BLOCKING_STATUSES = [BookingStatus.PENDING_REVIEW, BookingStatus.ACCEPTED];

function parsePositiveInt(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', `${fieldName} must be a positive integer`);
  }
  return parsed;
}

function parsePositiveNumber(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', `${fieldName} must be a positive number`);
  }
  return parsed;
}

function parseFiniteNumber(value, fieldName) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new HttpError(400, 'VALIDATION_ERROR', `${fieldName} must be a valid number`);
  }
  return parsed;
}

function normalizeDaytimePrices(daytimePrices, { required = false } = {}) {
  if (daytimePrices === undefined) {
    if (required) {
      throw new HttpError(400, 'VALIDATION_ERROR', 'At least one daytime price is required');
    }
    return undefined;
  }

  if (!Array.isArray(daytimePrices) || daytimePrices.length === 0) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'At least one daytime price is required');
  }

  const seen = new Set();

  return daytimePrices.map((dp, index) => {
    if (!dp || typeof dp !== 'object') {
      throw new HttpError(400, 'VALIDATION_ERROR', `daytimePrices[${index}] is invalid`);
    }

    const daytime = String(dp.daytime || '').trim();
    if (!daytime || !DAYTIME_VALUES.includes(daytime)) {
      throw new HttpError(400, 'VALIDATION_ERROR', `daytimePrices[${index}].daytime is invalid`);
    }

    if (seen.has(daytime)) {
      throw new HttpError(400, 'VALIDATION_ERROR', `Duplicate daytime value: ${daytime}`);
    }
    seen.add(daytime);

    return {
      daytime,
      price: parsePositiveNumber(dp.price, `daytimePrices[${index}].price`)
    };
  });
}

function normalizePhotos(photos) {
  if (photos === undefined) return undefined;

  if (!Array.isArray(photos)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'photos must be an array');
  }

  if (photos.length > 10) {
    throw new HttpError(400, 'TOO_MANY_PHOTOS', 'Maximum 10 photos allowed');
  }

  return photos.map((photo, index) => {
    if (!photo || typeof photo !== 'object') {
      throw new HttpError(400, 'VALIDATION_ERROR', `photos[${index}] is invalid`);
    }

    const url = String(photo.url || '').trim();
    if (!url) {
      throw new HttpError(400, 'VALIDATION_ERROR', `photos[${index}].url is required`);
    }

    return {
      url,
      isCover: Boolean(photo.isCover),
      sortOrder: index
    };
  });
}

function normalizeServiceIds(serviceIds) {
  if (serviceIds === undefined) return undefined;

  if (!Array.isArray(serviceIds)) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'serviceIds must be an array');
  }

  return [...new Set(serviceIds.map((id) => String(id).trim()).filter(Boolean))];
}

async function assertValidServiceIds(serviceIds) {
  if (!serviceIds || serviceIds.length === 0) return;

  const count = await prisma.hallService.count({
    where: { id: { in: serviceIds } }
  });

  if (count !== serviceIds.length) {
    throw new HttpError(400, 'INVALID_SERVICES', 'One or more serviceIds are invalid');
  }
}

function buildCoordinates({ latitude, longitude }) {
  const coordinates = {};

  if (latitude !== undefined && latitude !== null && String(latitude).trim() !== '') {
    coordinates.latitude = parseFiniteNumber(latitude, 'latitude');
  }

  if (longitude !== undefined && longitude !== null && String(longitude).trim() !== '') {
    coordinates.longitude = parseFiniteNumber(longitude, 'longitude');
  }

  return coordinates;
}

function toDateKey(dateInput) {
  const date = new Date(dateInput);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getUtcTodayDateOnly() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

async function assertOwnerCanCreateHall(ownerId) {
  const existingHall = await prisma.hall.findFirst({
    where: { ownerId, status: { not: 'DELETED' } },
    select: { id: true }
  });

  if (existingHall) {
    throw new HttpError(409, 'OWNER_ALREADY_HAS_HALL', 'Owner already has an active hall', {
      hallId: existingHall.id
    });
  }
}

function mapOwnerActiveHallUniqueError(error) {
  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    const target = Array.isArray(error.meta?.target)
      ? error.meta.target.join(',')
      : String(error.meta?.target || '');

    if (!target || target.includes('ownerActiveKey')) {
      throw new HttpError(409, 'OWNER_ALREADY_HAS_HALL', 'Owner already has an active hall');
    }
  }

  throw error;
}

async function findUpcomingBlockingBooking(hallId) {
  const todayUtcDate = getUtcTodayDateOnly();

  return prisma.booking.findFirst({
    where: {
      hallId,
      date: { gte: todayUtcDate },
      status: { in: DELETE_BLOCKING_STATUSES }
    },
    orderBy: [{ date: 'asc' }, { createdAt: 'asc' }],
    select: {
      id: true,
      date: true,
      daytime: true
    }
  });
}

async function createHall(ownerId, input) {
  await assertOwnerCanCreateHall(ownerId);

  const {
    name,
    description,
    city,
    area,
    address,
    latitude,
    longitude,
    capacity,
    depositAmount,
    currency,
    serviceIds,
    photos,
    daytimePrices
  } = input;

  const normalizedCapacity = parsePositiveInt(capacity, 'capacity');
  const normalizedDepositAmount = parsePositiveNumber(depositAmount, 'depositAmount');
  const normalizedServiceIds = normalizeServiceIds(serviceIds) || [];
  const normalizedPhotos = normalizePhotos(photos) || [];
  const normalizedDaytimePrices = normalizeDaytimePrices(daytimePrices, { required: true });
  const coordinates = buildCoordinates({ latitude, longitude });

  await assertValidServiceIds(normalizedServiceIds);

  try {
    const hall = await prisma.hall.create({
      data: {
        ownerId,
        ownerActiveKey: ownerId,
        name,
        description,
        city,
        area,
        address,
        ...coordinates,
        capacity: normalizedCapacity,
        depositAmount: normalizedDepositAmount,
        currency,
        status: 'ACTIVE',
        services: {
          create: normalizedServiceIds.map((serviceId) => ({
            service: { connect: { id: serviceId } }
          }))
        },
        photos: {
          create: normalizedPhotos
        },
        daytimePrices: {
          create: normalizedDaytimePrices
        }
      },
      include: {
        photos: true,
        services: { include: { service: true } },
        daytimePrices: true,
        owner: { select: { id: true, fullName: true } }
      }
    });

    return transformHall(hall);
  } catch (error) {
    mapOwnerActiveHallUniqueError(error);
  }
}

async function updateHall(ownerId, hallId, input) {
  const hall = await prisma.hall.findUnique({
    where: { id: hallId }
  });

  if (!hall) {
    throw new HttpError(404, 'HALL_NOT_FOUND', 'Hall not found');
  }

  if (hall.ownerId !== ownerId) {
    throw new HttpError(403, 'FORBIDDEN', 'You are not the owner of this hall');
  }

  const {
    name,
    description,
    city,
    area,
    address,
    latitude,
    longitude,
    capacity,
    depositAmount,
    currency,
    status,
    serviceIds,
    photos,
    daytimePrices
  } = input;

  if (status !== undefined) {
    throw new HttpError(400, 'STATUS_UPDATE_NOT_ALLOWED', 'status cannot be updated from this endpoint');
  }

  const normalizedServiceIds = normalizeServiceIds(serviceIds);
  const normalizedPhotos = normalizePhotos(photos);
  const normalizedDaytimePrices = normalizeDaytimePrices(daytimePrices);
  const coordinates = buildCoordinates({ latitude, longitude });

  await assertValidServiceIds(normalizedServiceIds);

  const updateData = {
    name,
    description,
    city,
    area,
    address,
    ...coordinates,
    currency,
    updatedAt: new Date()
  };

  if (capacity !== undefined) {
    updateData.capacity = parsePositiveInt(capacity, 'capacity');
  }

  if (depositAmount !== undefined) {
    updateData.depositAmount = parsePositiveNumber(depositAmount, 'depositAmount');
  }

  Object.keys(updateData).forEach((key) => updateData[key] === undefined && delete updateData[key]);

  if (normalizedServiceIds !== undefined) {
    updateData.services = {
      deleteMany: {},
      create: normalizedServiceIds.map((serviceId) => ({
        service: { connect: { id: serviceId } }
      }))
    };
  }

  if (normalizedPhotos !== undefined) {
    const currentHall = await prisma.hall.findUnique({
      where: { id: hallId },
      include: { photos: true }
    });

    const currentUrls = currentHall.photos.map((p) => p.url);
    const newUrls = normalizedPhotos.map((p) => p.url);
    const urlsToDelete = currentUrls.filter((url) => !newUrls.includes(url));

    updateData.photos = {
      deleteMany: {},
      create: normalizedPhotos
    };

    urlsToDelete.forEach((url) => deleteFile(url));
  }

  if (normalizedDaytimePrices !== undefined) {
    updateData.daytimePrices = {
      deleteMany: {},
      create: normalizedDaytimePrices
    };
  }

  const updatedHall = await prisma.hall.update({
    where: { id: hallId },
    data: updateData,
    include: {
      photos: true,
      services: { include: { service: true } },
      daytimePrices: true,
      owner: { select: { id: true, fullName: true } }
    }
  });

  return transformHall(updatedHall);
}

async function deleteHall(ownerId, hallId) {
  const hall = await prisma.hall.findUnique({
    where: { id: hallId }
  });

  if (!hall) {
    throw new HttpError(404, 'HALL_NOT_FOUND', 'Hall not found');
  }

  if (hall.ownerId !== ownerId) {
    throw new HttpError(403, 'FORBIDDEN', 'You are not the owner of this hall');
  }

  if (hall.status === 'DELETED') {
    throw new HttpError(409, 'ALREADY_DELETED', 'Hall is already deleted');
  }

  const upcomingBooking = await findUpcomingBlockingBooking(hallId);
  if (upcomingBooking) {
    throw new HttpError(
      409,
      'HALL_HAS_UPCOMING_BOOKINGS',
      'Cannot delete hall with upcoming bookings',
      {
        bookingId: upcomingBooking.id,
        date: toDateKey(upcomingBooking.date),
        daytime: upcomingBooking.daytime
      }
    );
  }

  const hallWithPhotos = await prisma.hall.findUnique({
    where: { id: hallId },
    include: { photos: true }
  });

  await prisma.hall.update({
    where: { id: hallId },
    data: {
      status: 'DELETED',
      ownerActiveKey: null,
      updatedAt: new Date()
    }
  });

  if (hallWithPhotos && hallWithPhotos.photos) {
    hallWithPhotos.photos.forEach((p) => deleteFile(p.url));
  }

  return { message: 'Hall deleted' };
}

async function getMyHalls(ownerId) {
  const halls = await prisma.hall.findMany({
    where: { ownerId, status: { not: 'DELETED' } },
    include: {
      photos: {
        where: { isCover: true },
        take: 1
      },
      daytimePrices: true
    },
    orderBy: { createdAt: 'desc' }
  });

  return {
    data: halls.map((hall) => {
      const prices = hall.daytimePrices.map((dp) => Number(dp.price));
      const startingFrom = prices.length > 0 ? Math.min(...prices) : 0;
      return {
        id: hall.id,
        name: hall.name,
        city: hall.city,
        area: hall.area,
        capacity: hall.capacity,
        startingFrom,
        currency: hall.currency,
        coverPhoto: hall.photos[0]?.url || null,
        status: hall.status
      };
    })
  };
}

function transformHall(hall) {
  return {
    id: hall.id,
    name: hall.name,
    description: hall.description,
    city: hall.city,
    area: hall.area,
    address: hall.address,
    latitude: hall.latitude ? Number(hall.latitude) : null,
    longitude: hall.longitude ? Number(hall.longitude) : null,
    capacity: hall.capacity,
    depositAmount: Number(hall.depositAmount),
    currency: hall.currency,
    status: hall.status,
    daytimePrices: hall.daytimePrices.map((dp) => ({
      id: dp.id,
      daytime: dp.daytime,
      price: Number(dp.price)
    })),
    photos: hall.photos.map((p) => ({
      id: p.id,
      url: p.url,
      isCover: p.isCover
    })),
    services: hall.services.map((s) => ({
      id: s.service.id,
      name: s.service.name
    })),
    owner: hall.owner
  };
}

async function getHallById(ownerId, id) {
  const hall = await prisma.hall.findFirst({
    where: { id, ownerId, status: { not: 'DELETED' } },
    include: {
      photos: { orderBy: { sortOrder: 'asc' } },
      services: { include: { service: true } },
      daytimePrices: true
    }
  });

  if (!hall) {
    return null;
  }

  return {
    ...hall,
    depositAmount: Number(hall.depositAmount),
    daytimePrices: hall.daytimePrices.map((dp) => ({
      id: dp.id,
      daytime: dp.daytime,
      price: Number(dp.price)
    })),
    services: hall.services.map((s) => ({
      id: s.service.id,
      name: s.service.name
    }))
  };
}

module.exports = {
  createHall,
  updateHall,
  deleteHall,
  getMyHalls,
  getHallById
};

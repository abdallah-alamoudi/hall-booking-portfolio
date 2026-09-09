const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function getHalls(query = {}) {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 20;
  const skip = (page - 1) * limit;

  const where = {
    status: 'ACTIVE'
  };

  if (query.search) {
    where.OR = [
      { name: { contains: query.search } },
      { area: { contains: query.search } }
    ];
  }

  if (query.city) {
    where.city = query.city;
  }

  if (query.minCapacity) {
    where.capacity = { gte: parseInt(query.minCapacity) };
  }

  if (query.maxCapacity) {
    where.capacity = { ...where.capacity, lte: parseInt(query.maxCapacity) };
  }

  if (query.serviceIds) {
    const serviceIds = query.serviceIds.split(',');
    where.services = {
      some: {
        serviceId: { in: serviceIds }
      }
    };
  }

  const [halls, total] = await Promise.all([
    prisma.hall.findMany({
      where,
      skip,
      take: limit,
      include: {
        photos: {
          where: { isCover: true },
          take: 1
        },
        daytimePrices: true
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.hall.count({ where })
  ]);

  const data = halls.map(hall => {
    const prices = hall.daytimePrices.map(dp => Number(dp.price));
    const startingFrom = prices.length > 0 ? Math.min(...prices) : 0;
    return {
      id: hall.id,
      name: hall.name,
      city: hall.city,
      area: hall.area,
      capacity: hall.capacity,
      startingFrom,
      currency: hall.currency,
      coverPhoto: hall.photos[0]?.url || null
    };
  });

  return {
    data,
    meta: {
      page,
      limit,
      total
    }
  };
}

async function getHallById(id) {
  const hall = await prisma.hall.findUnique({
    where: { id },
    include: {
      photos: {
        orderBy: { sortOrder: 'asc' }
      },
      services: {
        include: {
          service: true
        }
      },
      daytimePrices: true,
      bankAccounts: {
        select: {
          id: true,
          bankCode: true,
          accountHolder: true,
          accountNumber: true
        }
      },
      owner: {
        select: {
          id: true,
          fullName: true
        }
      }
    }
  });

  if (!hall || hall.status !== 'ACTIVE') {
    return null;
  }

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
    daytimePrices: hall.daytimePrices.map(dp => ({
      id: dp.id,
      daytime: dp.daytime,
      price: Number(dp.price)
    })),
    photos: hall.photos.map(p => ({
      id: p.id,
      url: p.url,
      isCover: p.isCover
    })),
    services: hall.services.map(s => ({
      id: s.service.id,
      name: s.service.name
    })),
    bankAccounts: hall.bankAccounts,
    owner: {
      id: hall.owner.id,
      fullName: hall.owner.fullName
    }
  };
}

async function getServices() {
  const services = await prisma.hallService.findMany({
    orderBy: { name: 'asc' }
  });

  return {
    data: services
  };
}

module.exports = {
  getHalls,
  getHallById,
  getServices
};

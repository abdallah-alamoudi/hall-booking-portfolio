const { prisma } = require('../../db/prisma');

async function findByEmailOrPhone({ email, phone }) {
  if (!email && !phone) {
    return null;
  }

  return prisma.user.findFirst({
    where: {
      OR: [
        email ? { email } : undefined,
        phone ? { phone } : undefined
      ].filter(Boolean)
    }
  });
}

async function createUser(data) {
  return prisma.user.create({ data });
}

module.exports = {
  findByEmailOrPhone,
  createUser
};

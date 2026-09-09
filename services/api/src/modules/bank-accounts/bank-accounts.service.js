const { PrismaClient } = require('@prisma/client');
const { HttpError } = require('../../common/http-error');

const prisma = new PrismaClient();

const ALLOWED_BANK_CODES = ['omgy', 'kuraimy', 'busairy', 'hadramout'];

async function assertHallOwnership(ownerId, hallId) {
  const hall = await prisma.hall.findUnique({ where: { id: hallId } });
  if (!hall) throw new HttpError(404, 'HALL_NOT_FOUND', 'Hall not found');
  if (hall.ownerId !== ownerId) throw new HttpError(403, 'FORBIDDEN', 'Not your hall');
}

async function listBankAccounts(ownerId, hallId) {
  await assertHallOwnership(ownerId, hallId);

  return prisma.hallBankAccount.findMany({
    where: { hallId },
    orderBy: { createdAt: 'asc' },
  });
}

async function addBankAccount(ownerId, hallId, { bankCode, accountHolder, accountNumber }) {
  await assertHallOwnership(ownerId, hallId);

  if (!ALLOWED_BANK_CODES.includes(bankCode)) {
    throw new HttpError(400, 'INVALID_BANK_CODE', `Bank code must be one of: ${ALLOWED_BANK_CODES.join(', ')}`);
  }
  if (!accountHolder || !accountNumber) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'accountHolder and accountNumber are required');
  }

  return prisma.hallBankAccount.create({
    data: { hallId, bankCode, accountHolder, accountNumber },
  });
}

async function updateBankAccount(ownerId, hallId, accountId, { bankCode, accountHolder, accountNumber }) {
  await assertHallOwnership(ownerId, hallId);

  const account = await prisma.hallBankAccount.findUnique({ where: { id: accountId } });
  if (!account) {
    throw new HttpError(404, 'NOT_FOUND', 'Bank account not found');
  }

  if (account.hallId !== hallId) {
    throw new HttpError(403, 'FORBIDDEN', 'Account does not belong to this hall');
  }

  const nextBankCode = bankCode !== undefined ? String(bankCode).trim() : account.bankCode;
  const nextAccountHolder = accountHolder !== undefined ? String(accountHolder).trim() : account.accountHolder;
  const nextAccountNumber = accountNumber !== undefined ? String(accountNumber).trim() : account.accountNumber;

  if (!ALLOWED_BANK_CODES.includes(nextBankCode)) {
    throw new HttpError(400, 'INVALID_BANK_CODE', `Bank code must be one of: ${ALLOWED_BANK_CODES.join(', ')}`);
  }

  if (!nextAccountHolder || !nextAccountNumber) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'accountHolder and accountNumber are required');
  }

  return prisma.hallBankAccount.update({
    where: { id: accountId },
    data: {
      bankCode: nextBankCode,
      accountHolder: nextAccountHolder,
      accountNumber: nextAccountNumber
    }
  });
}

async function deleteBankAccount(ownerId, hallId, accountId) {
  const account = await prisma.hallBankAccount.findUnique({ where: { id: accountId } });
  if (!account) {
    throw new HttpError(404, 'NOT_FOUND', 'Bank account not found');
  }
  // Verify the account belongs to this hall
  if (account.hallId !== hallId) {
    throw new HttpError(403, 'FORBIDDEN', 'Account does not belong to this hall');
  }
  await assertHallOwnership(ownerId, hallId);

  await prisma.hallBankAccount.delete({ where: { id: accountId } });
}

module.exports = { listBankAccounts, addBankAccount, updateBankAccount, deleteBankAccount };

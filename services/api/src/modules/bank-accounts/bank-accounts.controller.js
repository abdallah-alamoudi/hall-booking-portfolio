const bankAccountsService = require('./bank-accounts.service');

async function list(req, res, next) {
  try {
    const ownerId = req.user.userId;
    const hallId = req.params.hallId;
    const accounts = await bankAccountsService.listBankAccounts(ownerId, hallId);
    res.json(accounts);
  } catch (error) {
    next(error);
  }
}

async function add(req, res, next) {
  try {
    const ownerId = req.user.userId;
    const hallId = req.params.hallId;
    const account = await bankAccountsService.addBankAccount(ownerId, hallId, req.body);
    res.status(201).json(account);
  } catch (error) {
    next(error);
  }
}

async function update(req, res, next) {
  try {
    const ownerId = req.user.userId;
    const hallId = req.params.hallId;
    const accountId = req.params.id;
    const account = await bankAccountsService.updateBankAccount(ownerId, hallId, accountId, req.body);
    res.json(account);
  } catch (error) {
    next(error);
  }
}

async function remove(req, res, next) {
  try {
    const ownerId = req.user.userId;
    const hallId = req.params.hallId;
    const accountId = req.params.id;
    await bankAccountsService.deleteBankAccount(ownerId, hallId, accountId);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = { list, add, update, remove };

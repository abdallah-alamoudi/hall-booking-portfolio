const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { Roles } = require('@hall-booking/contracts');
const bankAccountsController = require('./bank-accounts.controller');

const router = express.Router({ mergeParams: true });

// Routes are mounted at /owner/halls/:hallId/bank-accounts
router.get('/', requireAuth, requireRole(Roles.OWNER), bankAccountsController.list);
router.post('/', requireAuth, requireRole(Roles.OWNER), bankAccountsController.add);
router.patch('/:id', requireAuth, requireRole(Roles.OWNER), bankAccountsController.update);
router.delete('/:id', requireAuth, requireRole(Roles.OWNER), bankAccountsController.remove);

module.exports = router;

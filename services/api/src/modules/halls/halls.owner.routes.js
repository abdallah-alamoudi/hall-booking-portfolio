const express = require('express');
const ownerHallController = require('./halls.owner.controller');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { Roles } = require('@hall-booking/contracts');

const router = express.Router();

router.post(
  '/',
  requireAuth,
  requireRole(Roles.OWNER),
  ownerHallController.createHall
);

router.get(
  '/',
  requireAuth,
  requireRole(Roles.OWNER),
  ownerHallController.getMyHalls
);

router.get(
  '/:id',
  requireAuth,
  requireRole(Roles.OWNER),
  ownerHallController.getHallById
);

router.patch(
  '/:id',
  requireAuth,
  requireRole(Roles.OWNER),
  ownerHallController.updateHall
);

router.delete(
  '/:id',
  requireAuth,
  requireRole(Roles.OWNER),
  ownerHallController.deleteHall
);

module.exports = router;

const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth');
const availabilityController = require('./availability.controller');
const { Roles } = require('@hall-booking/contracts');

const router = express.Router();

// Public: Get availability for a hall (slot-level)
router.get(
  '/halls/:id/availability',
  availabilityController.getAvailability
);

// Owner: Block availability
router.get(
  '/owner/halls/:id/availability',
  requireAuth,
  requireRole(Roles.OWNER),
  availabilityController.getOwnerAvailability
);

router.post(
  '/owner/halls/:id/availability',
  requireAuth,
  requireRole(Roles.OWNER),
  availabilityController.createBlock
);

// Owner: Remove block
router.delete(
  '/owner/availability/:id',
  requireAuth,
  requireRole(Roles.OWNER),
  availabilityController.deleteBlock
);

module.exports = router;

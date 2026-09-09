const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth');
const bookingsController = require('./bookings.controller');
const { Roles } = require('@hall-booking/contracts');

const router = express.Router();

// Owner: Get bookings for my halls
router.get(
  '/',
  requireAuth,
  requireRole(Roles.OWNER),
  bookingsController.getOwnerBookings
);

// Owner: Get a specific booking detail
router.get(
  '/:id',
  requireAuth,
  requireRole(Roles.OWNER),
  bookingsController.getOwnerBookingById
);

// Owner: Accept or Reject a booking
router.patch(
  '/:id/status',
  requireAuth,
  requireRole(Roles.OWNER),
  bookingsController.updateBookingStatus
);

module.exports = router;

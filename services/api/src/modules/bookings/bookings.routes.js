const express = require('express');
const { requireAuth, requireRole } = require('../../middleware/auth');
const { Roles } = require('@hall-booking/contracts');
const bookingsController = require('./bookings.controller');
const upload = require('../../middleware/upload');

const router = express.Router();

// POST /v1/bookings — create booking with receipt (multipart)
router.post('/', requireAuth, requireRole(Roles.CUSTOMER), upload.single('receiptImage'), bookingsController.createBooking);

// GET /v1/bookings — my bookings
router.get('/', requireAuth, requireRole(Roles.CUSTOMER), bookingsController.getMyBookings);

// PATCH /v1/bookings/:id/receipt — re-upload receipt (multipart)
router.patch('/:id/receipt', requireAuth, requireRole(Roles.CUSTOMER), upload.single('receiptImage'), bookingsController.reuploadReceipt);

module.exports = router;

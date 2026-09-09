const express = require('express');

const healthRoutes = require('./modules/health/health.routes');
const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const hallRoutes = require('./modules/halls/halls.routes');
const ownerHallRoutes = require('./modules/halls/halls.owner.routes');
const availabilityRoutes = require('./modules/availability/availability.routes');
const uploadRoutes = require('./modules/uploads/uploads.routes');

const bookingsRoutes = require('./modules/bookings/bookings.routes');
const bookingsOwnerRoutes = require('./modules/bookings/bookings.owner.routes');
const bankAccountRoutes = require('./modules/bank-accounts/bank-accounts.owner.routes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/', hallRoutes); // Public routes: /halls, /services
router.use('/', availabilityRoutes); // Availability routes
router.use('/owner/halls', ownerHallRoutes); // Owner routes: /owner/halls
router.use('/owner/halls/:hallId/bank-accounts', bankAccountRoutes); // Per-hall bank accounts
router.use('/bookings', bookingsRoutes); // Customer booking routes
router.use('/owner/bookings', bookingsOwnerRoutes); // Owner booking routes
router.use('/uploads', uploadRoutes); // File upload routes
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);

module.exports = router;

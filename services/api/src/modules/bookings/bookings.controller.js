const bookingsService = require('./bookings.service');

async function createBooking(req, res, next) {
  try {
    const customerId = req.user.userId;
    const { hallId, date, daytime, purpose, bankAccountId, customerNote } = req.body;
    const receiptImageUrl = req.file
      ? `/uploads/receipts/${req.file.filename}`
      : null;

    const booking = await bookingsService.createBooking(customerId, {
      hallId, date, daytime, purpose, bankAccountId, customerNote, receiptImageUrl
    });

    res.status(201).json(booking);
  } catch (error) {
    next(error);
  }
}

async function getMyBookings(req, res, next) {
  try {
    const customerId = req.user.userId;
    const bookings = await bookingsService.getCustomerBookings(customerId);
    res.json(bookings);
  } catch (error) {
    next(error);
  }
}

async function getOwnerBookings(req, res, next) {
  try {
    const ownerId = req.user.userId;
    const bookings = await bookingsService.getOwnerBookings(ownerId);
    res.json(bookings);
  } catch (error) {
    next(error);
  }
}

async function getOwnerBookingById(req, res, next) {
  try {
    const ownerId = req.user.userId;
    const bookingId = req.params.id;
    const booking = await bookingsService.getOwnerBookingById(ownerId, bookingId);
    res.json(booking);
  } catch (error) {
    next(error);
  }
}

async function reuploadReceipt(req, res, next) {
  try {
    const customerId = req.user.userId;
    const bookingId = req.params.id;
    const receiptImageUrl = req.file
      ? `/uploads/receipts/${req.file.filename}`
      : null;

    if (!receiptImageUrl) {
      return res.status(400).json({ error: 'Receipt image is required' });
    }

    const result = await bookingsService.reuploadReceipt(customerId, bookingId, receiptImageUrl);
    res.json(result);
  } catch (error) {
    next(error);
  }
}

async function updateBookingStatus(req, res, next) {
  try {
    const ownerId = req.user.userId;
    const bookingId = req.params.id;
    const { action, reason } = req.body;
    const result = await bookingsService.updateBookingStatus(ownerId, bookingId, { action, reason });
    res.json(result);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createBooking,
  getMyBookings,
  getOwnerBookings,
  getOwnerBookingById,
  reuploadReceipt,
  updateBookingStatus
};

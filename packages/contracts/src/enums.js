const Roles = Object.freeze({
  CUSTOMER: 'CUSTOMER',
  OWNER: 'OWNER',
  ADMIN: 'ADMIN'
});

const Daytime = Object.freeze({
  MORNING: 'MORNING',
  EVENING: 'EVENING',
  FULL_DAY: 'FULL_DAY'
});

const BookingStatus = Object.freeze({
  PENDING_REVIEW: 'PENDING_REVIEW',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED'
});

const ReceiptStatus = Object.freeze({
  UPLOADED: 'UPLOADED',
  VERIFIED: 'VERIFIED',
  REJECTED: 'REJECTED'
});

module.exports = {
  Roles,
  Daytime,
  BookingStatus,
  ReceiptStatus
};

const BookingRules = Object.freeze({
  MIN_BOOKING_NOTICE_HOURS: 24,
  MAX_ADVANCE_BOOKING_DAYS: 365,
  DEFAULT_CURRENCY: 'USD'
});

const PaymentRules = Object.freeze({
  RECEIPT_MAX_FILE_SIZE_MB: 10,
  ALLOWED_RECEIPT_MIME_TYPES: ['image/jpeg', 'image/png']
});

const AuthRules = Object.freeze({
  MIN_PASSWORD_LENGTH: 8
});

export { BookingRules, PaymentRules, AuthRules };

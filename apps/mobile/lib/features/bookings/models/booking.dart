import 'package:hall_booking_mobile/features/halls/models/hall.dart';

double _asDouble(dynamic value, {double fallback = 0}) {
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? fallback;
  return fallback;
}

String _asString(dynamic value, {String fallback = ''}) {
  if (value == null) return fallback;
  if (value is String) return value;
  return value.toString();
}

String? _asNullableString(dynamic value) {
  if (value == null) return null;
  final parsed = value.toString();
  return parsed.isEmpty ? null : parsed;
}

DateTime _asDate(dynamic value) {
  if (value is DateTime) return value;
  if (value is String) {
    final parsed = DateTime.tryParse(value);
    if (parsed != null) return parsed;
  }
  return DateTime.fromMillisecondsSinceEpoch(0, isUtc: true);
}

class Booking {
  final String id;
  final String hallId;
  final String customerId;
  final String status;
  final DateTime date;
  final String daytime;
  final double totalPrice;
  final String currency;
  final String? customerNote;
  final String? purpose;
  final String? rejectReason;
  final Hall? hall;

  Booking({
    required this.id,
    required this.hallId,
    required this.customerId,
    required this.status,
    required this.date,
    required this.daytime,
    required this.totalPrice,
    required this.currency,
    this.customerNote,
    this.purpose,
    this.rejectReason,
    this.hall,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: _asString(json['id']),
      hallId: _asString(json['hallId']),
      customerId: _asString(json['customerId']),
      status: _asString(json['status']),
      date: _asDate(json['date']),
      daytime: _asString(json['daytime'], fallback: 'FULL_DAY'),
      totalPrice: _asDouble(json['totalPrice']),
      currency: _asString(json['currency'], fallback: 'YER'),
      customerNote: _asNullableString(json['customerNote']),
      purpose: _asNullableString(json['purpose']),
      rejectReason: _asNullableString(json['rejectReason']),
      hall: json['hall'] is Map
          ? Hall.fromJson(Map<String, dynamic>.from(json['hall']))
          : null,
    );
  }
}

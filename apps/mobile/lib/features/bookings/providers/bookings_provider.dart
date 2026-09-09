import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hall_booking_mobile/core/api/api_client.dart';
import 'package:hall_booking_mobile/features/auth/providers/auth_provider.dart';
import 'package:hall_booking_mobile/features/bookings/models/booking.dart';
import 'package:image_picker/image_picker.dart';
import 'package:intl/intl.dart';

class ApiRequestException implements Exception {
  final String message;
  final String? code;
  final int? statusCode;
  final Map<String, dynamic> details;

  const ApiRequestException({
    required this.message,
    this.code,
    this.statusCode,
    this.details = const {},
  });

  @override
  String toString() => message;
}

final bookingsProvider = Provider((ref) => BookingsService(ref));

final myBookingsFutureProvider = FutureProvider.autoDispose<List<Booking>>((
  ref,
) {
  final service = ref.watch(bookingsProvider);
  return service.getMyBookings();
});

/// Returns a map of date -> list of busy daytimes for that date.
/// e.g. { "2025-03-15": ["MORNING", "EVENING"], "2025-03-16": ["FULL_DAY"] }
final hallAvailabilityProvider = FutureProvider.autoDispose
    .family<Map<String, List<String>>, String>((ref, hallId) {
      final service = ref.watch(bookingsProvider);
      return service.getHallAvailability(hallId);
    });

class BookingsService {
  final Ref ref;
  BookingsService(this.ref);

  Options _getAuthOptions() {
    final token = ref.read(authProvider).token;
    return Options(
      headers: {if (token != null) 'Authorization': 'Bearer $token'},
    );
  }

  Future<List<Booking>> getMyBookings() async {
    final response = await ApiClient.instance.get(
      '/bookings',
      options: _getAuthOptions(),
    );
    final List<dynamic> data = response.data;
    return data.map((json) => Booking.fromJson(json)).toList();
  }

  Future<Map<String, List<String>>> getHallAvailability(String hallId) async {
    final response = await ApiClient.instance.get(
      '/halls/$hallId/availability',
    );
    final Map<String, dynamic> data = response.data;
    final Map<String, List<String>> busySlots = {};

    if (data['busySlotsMap'] != null) {
      final Map<String, dynamic> rawSlots = data['busySlotsMap'];
      rawSlots.forEach((date, slots) {
        busySlots[date] = List<String>.from(slots);
      });
    }

    return busySlots;
  }

  /// Creates a booking with a required receipt image (multipart/form-data).
  Future<Booking> createBooking({
    required String hallId,
    required DateTime date,
    required String daytime,
    required String bankAccountId,
    required String purpose,
    required XFile receiptImage,
    List<int>? receiptImageBytes,
    String? customerNote,
  }) async {
    final imageBytes = receiptImageBytes ?? await receiptImage.readAsBytes();
    final extension = _inferExtension(receiptImage.name, receiptImage.path);

    final formData = FormData.fromMap({
      'hallId': hallId,
      'date': DateFormat('yyyy-MM-dd').format(date),
      'daytime': daytime,
      'bankAccountId': bankAccountId,
      'purpose': purpose,
      if (customerNote != null && customerNote.isNotEmpty)
        'customerNote': customerNote,
      'receiptImage': MultipartFile.fromBytes(
        imageBytes,
        filename: 'receipt.$extension',
        contentType: DioMediaType(
          'image',
          extension == 'jpg' ? 'jpeg' : extension,
        ),
      ),
    });

    try {
      final response = await ApiClient.instance.post(
        '/bookings',
        data: formData,
        options: Options(
          headers: {
            if (ref.read(authProvider).token != null)
              'Authorization': 'Bearer ${ref.read(authProvider).token}',
            'Content-Type': 'multipart/form-data',
          },
        ),
      );
      return Booking.fromJson(response.data);
    } on DioException catch (e) {
      throw _toApiRequestException(e);
    }
  }

  String _inferExtension(String name, String path) {
    final fileName = name.isNotEmpty
        ? name
        : path.split('/').last.split('\\').last;
    final dotIndex = fileName.lastIndexOf('.');
    if (dotIndex >= 0 && dotIndex < fileName.length - 1) {
      final raw = fileName.substring(dotIndex + 1).toLowerCase();
      if (raw == 'jpeg') return 'jpg';
      if (raw == 'jpg' || raw == 'png' || raw == 'webp') return raw;
    }
    return 'jpg';
  }

  ApiRequestException _toApiRequestException(DioException e) {
    final statusCode = e.response?.statusCode;
    String message = 'Request failed. Please try again.';
    String? code;
    Map<String, dynamic> details = const {};

    final payload = e.response?.data;
    if (payload is Map) {
      final responseMap = Map<String, dynamic>.from(payload);
      final errorNode = responseMap['error'];
      if (errorNode is Map) {
        final errorMap = Map<String, dynamic>.from(errorNode);
        code = errorMap['code']?.toString();
        final serverMessage = errorMap['message']?.toString();
        if (serverMessage != null && serverMessage.trim().isNotEmpty) {
          message = serverMessage;
        }
        if (errorMap['details'] is Map) {
          details = Map<String, dynamic>.from(errorMap['details']);
        }
      }
    }

    return ApiRequestException(
      message: message,
      code: code,
      statusCode: statusCode,
      details: details,
    );
  }
}

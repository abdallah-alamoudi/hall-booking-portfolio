import 'package:dio/dio.dart';
import 'package:hall_booking_mobile/core/api/api_client.dart';
import 'package:hall_booking_mobile/features/auth/models/auth_models.dart';

class AuthService {
  final Dio _dio = ApiClient.instance;

  Future<AuthResponse> login(String identifier, String password) async {
    try {
      final response = await _dio.post('/auth/login', data: {
        'identifier': identifier,
        'password': password,
      });
      return AuthResponse.fromJson(response.data);
    } catch (e) {
      rethrow;
    }
  }

  Future<AuthResponse> register({
    required String fullName,
    String? email,
    String? phone,
    required String password,
    required String role,
  }) async {
    try {
      final response = await _dio.post('/auth/register', data: {
        'fullName': fullName,
        'email': email,
        'phone': phone,
        'password': password,
        'role': role,
      });
      return AuthResponse.fromJson(response.data);
    } catch (e) {
      rethrow;
    }
  }
}

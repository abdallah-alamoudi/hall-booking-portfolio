import 'package:dio/dio.dart';
import 'package:hall_booking_mobile/core/api/api_client.dart';
import 'package:hall_booking_mobile/features/halls/models/hall.dart';

class HallService {
  final Dio _dio = ApiClient.instance;

  Future<List<Hall>> getHalls() async {
    try {
      final response = await _dio.get('/halls');
      final List data = response.data['data'] ?? [];
      return data.map((e) => Hall.fromJson(e)).toList();
    } catch (e) {
      rethrow;
    }
  }

  Future<Hall> getHallById(String id) async {
    try {
      final response = await _dio.get('/halls/$id');
      return Hall.fromJson(response.data);
    } catch (e) {
      rethrow;
    }
  }
}

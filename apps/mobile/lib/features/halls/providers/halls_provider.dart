import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hall_booking_mobile/features/halls/models/hall.dart';
import 'package:hall_booking_mobile/features/halls/services/hall_service.dart';

final hallServiceProvider = Provider((ref) => HallService());

final hallsProvider = FutureProvider<List<Hall>>((ref) async {
  return ref.watch(hallServiceProvider).getHalls();
});

final hallDetailProvider = FutureProvider.family<Hall, String>((ref, id) async {
  return ref.watch(hallServiceProvider).getHallById(id);
});

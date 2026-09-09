import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hall_booking_mobile/core/theme/app_theme.dart';
import 'package:hall_booking_mobile/features/halls/providers/halls_provider.dart';
import 'package:hall_booking_mobile/features/bookings/screens/book_now_screen.dart';
import 'package:lucide_icons/lucide_icons.dart';

class HallDetailScreen extends ConsumerWidget {
  final String hallId;

  const HallDetailScreen({super.key, required this.hallId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final hallAsync = ref.watch(hallDetailProvider(hallId));
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      extendBodyBehindAppBar: true,
      bottomNavigationBar: _buildBottomBar(context, cs, hallAsync),
      body: hallAsync.when(
        data: (hall) => CustomScrollView(
          slivers: [
            // --- Hero Image with Overlay ---
            SliverAppBar(
              expandedHeight: 340,
              pinned: true,
              backgroundColor: isDark ? const Color(0xFF0F0F1A) : cs.surface,
              leading: Padding(
                padding: const EdgeInsets.all(8),
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.black.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: IconButton(
                    icon: const Icon(LucideIcons.arrowLeft,
                        color: Colors.white, size: 20),
                    onPressed: () => Navigator.pop(context),
                  ),
                ),
              ),
              actions: [
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: IconButton(
                      icon: const Icon(LucideIcons.share2,
                          color: Colors.white, size: 20),
                      onPressed: () {},
                    ),
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.only(right: 16),
                  child: Container(
                    decoration: BoxDecoration(
                      color: Colors.black.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: IconButton(
                      icon: const Icon(LucideIcons.heart,
                          color: Colors.white, size: 20),
                      onPressed: () {},
                    ),
                  ),
                ),
              ],
              flexibleSpace: FlexibleSpaceBar(
                background: Stack(
                  fit: StackFit.expand,
                  children: [
                    if (hall.coverPhoto != null)
                      Image.network(
                        hall.coverPhoto!,
                        fit: BoxFit.cover,
                        errorBuilder: (c, e, s) => Container(
                          color: cs.surfaceContainerHighest,
                          child: Icon(LucideIcons.image,
                              size: 48, color: cs.onSurfaceVariant),
                        ),
                      )
                    else
                      Container(
                        decoration: BoxDecoration(
                          gradient: AppTheme.primaryGradient,
                        ),
                        child: const Icon(LucideIcons.building2,
                            size: 64, color: Colors.white38),
                      ),
                    // Gradient overlay
                    Container(
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [
                            Colors.transparent,
                            Colors.transparent,
                            Colors.black.withOpacity(0.7),
                          ],
                          stops: const [0.0, 0.4, 1.0],
                        ),
                      ),
                    ),
                    // Name overlay
                    Positioned(
                      bottom: 20,
                      left: 20,
                      right: 20,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (hall.status != null)
                            Container(
                              margin: const EdgeInsets.only(bottom: 10),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppTheme.tertiaryColor,
                                borderRadius: BorderRadius.circular(8),
                              ),
                              child: Text(
                                hall.status!.toUpperCase(),
                                style: const TextStyle(
                                  color: Colors.white,
                                  fontSize: 11,
                                  fontWeight: FontWeight.w700,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                          Text(
                            hall.name,
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 26,
                              fontWeight: FontWeight.w800,
                              letterSpacing: -0.5,
                              height: 1.2,
                            ),
                          ),
                          const SizedBox(height: 6),
                          Row(
                            children: [
                              const Icon(LucideIcons.mapPin,
                                  size: 14, color: Colors.white70),
                              const SizedBox(width: 4),
                              Text(
                                '${hall.city}${hall.area != null ? ', ${hall.area}' : ''}',
                                style: const TextStyle(
                                  color: Colors.white70,
                                  fontSize: 14,
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // --- Content ---
            SliverToBoxAdapter(
              child: Container(
                decoration: BoxDecoration(
                  gradient: isDark
                      ? AppTheme.darkSurfaceGradient
                      : AppTheme.surfaceGradient,
                ),
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Info Chips Row
                      _buildInfoChips(context, hall, cs, isDark)
                          .animate()
                          .fadeIn(duration: 500.ms, delay: 100.ms)
                          .slideY(begin: 0.1, end: 0),

                      const SizedBox(height: 28),

                      // About Section
                      Text(
                        'About this venue',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w700,
                              letterSpacing: -0.3,
                            ),
                      ).animate().fadeIn(duration: 500.ms, delay: 200.ms),
                      const SizedBox(height: 12),
                      Text(
                        'This is a premium venue located in the heart of ${hall.city}. '
                        'It offers world-class facilities and a stunning atmosphere '
                        'for your special events — from weddings and birthdays to '
                        'corporate gatherings. Contact the owner for availability.',
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                              color: cs.onSurfaceVariant,
                              height: 1.6,
                            ),
                      ).animate().fadeIn(duration: 500.ms, delay: 250.ms),

                      const SizedBox(height: 28),

                      // Daytime Prices Section
                      Text(
                        'Pricing',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w700,
                              letterSpacing: -0.3,
                            ),
                      ).animate().fadeIn(duration: 500.ms, delay: 300.ms),
                      const SizedBox(height: 16),
                      _buildDaytimePrices(context, hall, cs, isDark)
                          .animate()
                          .fadeIn(duration: 500.ms, delay: 350.ms),

                      const SizedBox(height: 28),

                      // Amenities Section
                      Text(
                        'Amenities',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w700,
                              letterSpacing: -0.3,
                            ),
                      ).animate().fadeIn(duration: 500.ms, delay: 400.ms),
                      const SizedBox(height: 16),
                      _buildAmenities(context, cs, isDark)
                          .animate()
                          .fadeIn(duration: 500.ms, delay: 450.ms),

                      const SizedBox(height: 100), // Space for bottom bar
                    ],
                  ),
                ),
              ),
            ),
          ],
        ),
        loading: () => Container(
          decoration: BoxDecoration(
            gradient: isDark ? AppTheme.darkSurfaceGradient : AppTheme.surfaceGradient,
          ),
          child: const Center(
            child: CircularProgressIndicator(),
          ),
        ),
        error: (err, stack) => Container(
          decoration: BoxDecoration(
            gradient: isDark ? AppTheme.darkSurfaceGradient : AppTheme.surfaceGradient,
          ),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(LucideIcons.alertCircle, size: 48, color: cs.error),
                const SizedBox(height: 16),
                Text('Error: $err'),
                const SizedBox(height: 12),
                FilledButton.icon(
                  onPressed: () => ref.refresh(hallDetailProvider(hallId)),
                  icon: const Icon(LucideIcons.refreshCw, size: 16),
                  label: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInfoChips(
    BuildContext context,
    dynamic hall,
    ColorScheme cs,
    bool isDark,
  ) {
    final minPrice = hall.daytimePrices.isNotEmpty
        ? hall.daytimePrices.map((dp) => dp.price).reduce((a, b) => a < b ? a : b)
        : 0.0;
    final items = [
      _InfoChipData(
        icon: LucideIcons.users,
        label: 'Capacity',
        value: '${hall.capacity}',
        color: AppTheme.primaryColor,
      ),
      _InfoChipData(
        icon: LucideIcons.banknote,
        label: 'Starting at',
        value: '${minPrice.toInt()} ${hall.currency}',
        color: AppTheme.secondaryColor,
      ),
      _InfoChipData(
        icon: LucideIcons.receipt,
        label: 'Deposit',
        value: '${hall.depositAmount?.toInt() ?? 0} ${hall.currency}',
        color: AppTheme.tertiaryColor,
      ),
    ];

    return Row(
      children: items.map((item) {
        return Expanded(
          child: Container(
            margin: EdgeInsets.only(
              right: item == items.last ? 0 : 10,
            ),
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
            decoration: BoxDecoration(
              color: isDark
                  ? Colors.white.withOpacity(0.06)
                  : Colors.white.withOpacity(0.8),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark
                    ? Colors.white.withOpacity(0.08)
                    : cs.outlineVariant.withOpacity(0.15),
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(isDark ? 0.2 : 0.04),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Column(
              children: [
                Container(
                  width: 40,
                  height: 40,
                  decoration: BoxDecoration(
                    color: item.color.withOpacity(0.12),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Icon(item.icon, size: 20, color: item.color),
                ),
                const SizedBox(height: 10),
                Text(
                  item.value,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                      ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 2),
                Text(
                  item.label,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: cs.onSurfaceVariant,
                        fontSize: 11,
                      ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildDaytimePrices(BuildContext context, dynamic hall, ColorScheme cs, bool isDark) {
    final daytimeIcons = {
      'MORNING': LucideIcons.sun,
      'EVENING': LucideIcons.moon,
      'FULL_DAY': LucideIcons.clock,
    };
    final daytimeLabels = {
      'MORNING': 'Morning',
      'EVENING': 'Evening',
      'FULL_DAY': 'Full Day',
    };
    final daytimeColors = {
      'MORNING': const Color(0xFFF59E0B),
      'EVENING': const Color(0xFF818CF8),
      'FULL_DAY': const Color(0xFF10B981),
    };

    return Row(
      children: hall.daytimePrices.map<Widget>((dp) {
        final icon = daytimeIcons[dp.daytime] ?? LucideIcons.clock;
        final label = daytimeLabels[dp.daytime] ?? dp.daytime;
        final color = daytimeColors[dp.daytime] ?? cs.primary;

        return Expanded(
          child: Container(
            margin: EdgeInsets.only(
              right: dp == hall.daytimePrices.last ? 0 : 10,
            ),
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 12),
            decoration: BoxDecoration(
              color: isDark
                  ? Colors.white.withOpacity(0.06)
                  : Colors.white.withOpacity(0.8),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(
                color: isDark
                    ? Colors.white.withOpacity(0.08)
                    : cs.outlineVariant.withOpacity(0.15),
              ),
            ),
            child: Column(
              children: [
                Icon(icon, size: 22, color: color),
                const SizedBox(height: 8),
                Text(
                  label,
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: cs.onSurfaceVariant,
                        fontSize: 11,
                      ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${dp.price.toInt()} ${hall.currency}',
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                        fontWeight: FontWeight.w700,
                        color: color,
                      ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildAmenities(BuildContext context, ColorScheme cs, bool isDark) {
    final amenities = [
      _Amenity(LucideIcons.wifi, 'WiFi'),
      _Amenity(LucideIcons.car, 'Parking'),
      _Amenity(LucideIcons.snowflake, 'AC'),
      _Amenity(LucideIcons.music, 'Sound'),
      _Amenity(LucideIcons.lamp, 'Lighting'),
      _Amenity(LucideIcons.utensils, 'Catering'),
    ];

    return Wrap(
      spacing: 10,
      runSpacing: 10,
      children: amenities.map((a) {
        return Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
          decoration: BoxDecoration(
            color: isDark
                ? Colors.white.withOpacity(0.06)
                : Colors.white.withOpacity(0.8),
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isDark
                  ? Colors.white.withOpacity(0.08)
                  : cs.outlineVariant.withOpacity(0.15),
            ),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(a.icon, size: 16, color: cs.primary),
              const SizedBox(width: 8),
              Text(
                a.label,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
              ),
            ],
          ),
        );
      }).toList(),
    );
  }

  Widget _buildBottomBar(BuildContext context, ColorScheme cs, AsyncValue<dynamic> hallAsync) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final hall = hallAsync.asData?.value;

    return Container(
      padding: const EdgeInsets.fromLTRB(24, 16, 24, 24),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F0F1A) : Colors.white,
        border: Border(
          top: BorderSide(
            color: isDark
                ? Colors.white.withOpacity(0.06)
                : cs.outlineVariant.withOpacity(0.15),
          ),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.3 : 0.06),
            blurRadius: 16,
            offset: const Offset(0, -4),
          ),
        ],
      ),
      child: SafeArea(
        child: Row(
          children: [
            // Price display
            Expanded(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Starting from',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: cs.onSurfaceVariant,
                        ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    hall != null
                        ? 'From ${hall.daytimePrices.isNotEmpty ? hall.daytimePrices.map((dp) => dp.price).reduce((a, b) => a < b ? a : b).toInt() : 0} ${hall.currency}'
                        : 'Loading...',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w800,
                          color: cs.primary,
                        ),
                  ),
                ],
              ),
            ),
            // Book button
            Container(
              height: 52,
              decoration: BoxDecoration(
                gradient: AppTheme.primaryGradient,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: AppTheme.primaryColor.withOpacity(0.35),
                    blurRadius: 16,
                    offset: const Offset(0, 6),
                  ),
                ],
              ),
              child: Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () {
                    if (hall != null) {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => BookNowScreen(hall: hall),
                        ),
                      );
                    }
                  },
                  borderRadius: BorderRadius.circular(16),
                  child: const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 28),
                    child: Center(
                      child: Text(
                        'Book Now',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w700,
                          fontSize: 15,
                          letterSpacing: 0.3,
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoChipData {
  final IconData icon;
  final String label;
  final String value;
  final Color color;

  const _InfoChipData({
    required this.icon,
    required this.label,
    required this.value,
    required this.color,
  });
}

class _Amenity {
  final IconData icon;
  final String label;
  const _Amenity(this.icon, this.label);
}

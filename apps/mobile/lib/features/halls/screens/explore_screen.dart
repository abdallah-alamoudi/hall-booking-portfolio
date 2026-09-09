import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hall_booking_mobile/core/theme/app_theme.dart';
import 'package:hall_booking_mobile/features/halls/models/hall.dart';
import 'package:hall_booking_mobile/features/halls/providers/halls_provider.dart';
import 'package:hall_booking_mobile/features/halls/screens/hall_detail_screen.dart';
import 'package:hall_booking_mobile/features/bookings/screens/my_bookings_screen.dart';
import 'package:hall_booking_mobile/features/auth/providers/auth_provider.dart';
import 'package:hall_booking_mobile/features/auth/screens/login_screen.dart';
import 'package:lucide_icons/lucide_icons.dart';
import 'package:skeletonizer/skeletonizer.dart';

class ExploreScreen extends ConsumerStatefulWidget {
  const ExploreScreen({super.key});

  @override
  ConsumerState<ExploreScreen> createState() => _ExploreScreenState();
}

class _ExploreScreenState extends ConsumerState<ExploreScreen> {
  int _selectedCategory = 0;

  final _categories = const [
    _Category(icon: LucideIcons.sparkles, label: 'All'),
    _Category(icon: LucideIcons.heart, label: 'Weddings'),
    _Category(icon: LucideIcons.cake, label: 'Birthdays'),
    _Category(icon: LucideIcons.briefcase, label: 'Corporate'),
    _Category(icon: LucideIcons.music, label: 'Parties'),
    _Category(icon: LucideIcons.graduationCap, label: 'Graduation'),
  ];

  @override
  Widget build(BuildContext context) {
    final hallsAsync = ref.watch(hallsProvider);
    final cs = Theme.of(context).colorScheme;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: isDark ? AppTheme.darkSurfaceGradient : AppTheme.surfaceGradient,
        ),
        child: RefreshIndicator(
          onRefresh: () => ref.refresh(hallsProvider.future),
          color: cs.primary,
          child: CustomScrollView(
            slivers: [
              // --- Premium App Bar ---
              SliverAppBar(
                floating: true,
                snap: true,
                backgroundColor: Colors.transparent,
                surfaceTintColor: Colors.transparent,
                expandedHeight: 120,
                flexibleSpace: FlexibleSpaceBar(
                  background: SafeArea(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(24, 12, 24, 0),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    'Discover',
                                    style: Theme.of(context)
                                        .textTheme
                                        .headlineMedium
                                        ?.copyWith(
                                          fontWeight: FontWeight.w800,
                                          letterSpacing: -0.5,
                                        ),
                                  ),
                                  const SizedBox(height: 4),
                                  Text(
                                    'Find the perfect venue',
                                    style: Theme.of(context)
                                        .textTheme
                                        .bodyMedium
                                        ?.copyWith(color: cs.onSurfaceVariant),
                                  ),
                                ],
                              ),
                              // Profile avatar
                              PopupMenuButton<String>(
                                offset: const Offset(0, 50),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                onSelected: (value) {
                                  if (value == 'bookings') {
                                    Navigator.push(
                                      context,
                                      MaterialPageRoute(builder: (_) => const MyBookingsScreen()),
                                    );
                                  } else if (value == 'logout') {
                                    ref.read(authProvider.notifier).logout();
                                    Navigator.pushAndRemoveUntil(
                                      context,
                                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                                      (route) => false,
                                    );
                                  }
                                },
                                itemBuilder: (context) => [
                                  PopupMenuItem(
                                    value: 'bookings',
                                    child: Row(
                                      children: [
                                        Icon(LucideIcons.calendar, size: 18, color: cs.onSurfaceVariant),
                                        const SizedBox(width: 12),
                                        const Text('My Bookings'),
                                      ],
                                    ),
                                  ),
                                  const PopupMenuDivider(),
                                  const PopupMenuItem(
                                    value: 'logout',
                                    child: Row(
                                      children: [
                                        Icon(LucideIcons.logOut, size: 18, color: Colors.red),
                                        SizedBox(width: 12),
                                        Text('Logout', style: TextStyle(color: Colors.red)),
                                      ],
                                    ),
                                  ),
                                ],
                                child: Container(
                                  width: 44,
                                  height: 44,
                                  decoration: BoxDecoration(
                                    gradient: AppTheme.primaryGradient,
                                    borderRadius: BorderRadius.circular(14),
                                  ),
                                  child: const Icon(
                                    LucideIcons.user,
                                    color: Colors.white,
                                    size: 20,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              ),

              // --- Search Bar ---
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 8, 24, 0),
                  child: Container(
                    height: 54,
                    decoration: BoxDecoration(
                      color: isDark
                          ? Colors.white.withOpacity(0.07)
                          : Colors.white.withOpacity(0.8),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(
                        color: isDark
                            ? Colors.white.withOpacity(0.1)
                            : cs.outlineVariant.withOpacity(0.3),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withOpacity(isDark ? 0.2 : 0.04),
                          blurRadius: 12,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Row(
                      children: [
                        const SizedBox(width: 16),
                        Icon(LucideIcons.search, size: 20, color: cs.onSurfaceVariant),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Search venues, locations...',
                            style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                  color: cs.onSurfaceVariant.withOpacity(0.6),
                                ),
                          ),
                        ),
                        Container(
                          margin: const EdgeInsets.all(6),
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: cs.primary.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(LucideIcons.sliders, size: 18, color: cs.primary),
                        ),
                      ],
                    ),
                  ).animate().fadeIn(duration: 500.ms, delay: 100.ms).slideY(begin: 0.1, end: 0),
                ),
              ),

              // --- Category Chips ---
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 72,
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.fromLTRB(24, 16, 24, 8),
                    itemCount: _categories.length,
                    itemBuilder: (context, index) {
                      final cat = _categories[index];
                      final isSelected = _selectedCategory == index;
                      return Padding(
                        padding: const EdgeInsets.only(right: 10),
                        child: FilterChip(
                          selected: isSelected,
                          showCheckmark: false,
                          avatar: Icon(
                            cat.icon,
                            size: 16,
                            color: isSelected ? Colors.white : cs.primary,
                          ),
                          label: Text(
                            cat.label,
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              color: isSelected ? Colors.white : cs.onSurface,
                              fontSize: 13,
                            ),
                          ),
                          backgroundColor: isDark
                              ? Colors.white.withOpacity(0.06)
                              : Colors.white.withOpacity(0.8),
                          selectedColor: cs.primary,
                          side: BorderSide(
                            color: isSelected
                                ? Colors.transparent
                                : cs.outlineVariant.withOpacity(0.3),
                          ),
                          onSelected: (v) => setState(() => _selectedCategory = index),
                        ),
                      )
                          .animate()
                          .fadeIn(duration: 400.ms, delay: (100 + index * 60).ms)
                          .slideX(begin: 0.2, end: 0);
                    },
                  ),
                ),
              ),

              // --- Section Header ---
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(24, 8, 24, 12),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Popular Venues',
                        style: Theme.of(context).textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.w700,
                              letterSpacing: -0.3,
                            ),
                      ),
                      TextButton(
                        onPressed: () {},
                        child: Text(
                          'See All',
                          style: TextStyle(
                            color: cs.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ).animate().fadeIn(duration: 500.ms, delay: 300.ms),
                ),
              ),

              // --- Hall Cards ---
              hallsAsync.when(
                data: (halls) => _buildHallList(halls, cs, isDark),
                loading: () => Skeletonizer.sliver(child: _buildHallList(_dummyHalls(), cs, isDark)),
                error: (err, stack) => SliverFillRemaining(
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Container(
                          width: 64,
                          height: 64,
                          decoration: BoxDecoration(
                            color: cs.errorContainer,
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: Icon(LucideIcons.wifiOff, size: 28, color: cs.error),
                        ),
                        const SizedBox(height: 16),
                        Text(
                          'Something went wrong',
                          style: Theme.of(context)
                              .textTheme
                              .titleMedium
                              ?.copyWith(fontWeight: FontWeight.w600),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Couldn\'t load venues. Please try again.',
                          style: TextStyle(color: cs.onSurfaceVariant),
                        ),
                        const SizedBox(height: 20),
                        FilledButton.icon(
                          onPressed: () => ref.refresh(hallsProvider),
                          icon: const Icon(LucideIcons.refreshCw, size: 16),
                          label: const Text('Retry'),
                        ),
                      ],
                    ),
                  ),
                ),
              ),

              const SliverToBoxAdapter(child: SizedBox(height: 32)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHallList(List<Hall> halls, ColorScheme cs, bool isDark) {
    if (halls.isEmpty) {
      return SliverFillRemaining(
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(LucideIcons.searchX, size: 48, color: cs.onSurfaceVariant),
              const SizedBox(height: 16),
              const Text('No venues found'),
            ],
          ),
        ),
      );
    }

    return SliverPadding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      sliver: SliverList(
        delegate: SliverChildBuilderDelegate(
          (context, index) {
            final hall = halls[index];
            return _HallCard(hall: hall, isDark: isDark)
                .animate()
                .fadeIn(duration: 500.ms, delay: (200 + index * 80).ms)
                .slideY(begin: 0.08, end: 0);
          },
          childCount: halls.length,
        ),
      ),
    );
  }

  List<Hall> _dummyHalls() {
    return List.generate(
      3,
      (i) => Hall(
        id: '$i',
        name: 'Loading Venue Name',
        city: 'Loading...',
        capacity: 0,
        currency: '...',
      ),
    );
  }
}

// --- Hall Card Widget ---
class _HallCard extends StatelessWidget {
  final Hall hall;
  final bool isDark;

  const _HallCard({required this.hall, required this.isDark});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Container(
        decoration: BoxDecoration(
          color: isDark ? Colors.white.withOpacity(0.06) : Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isDark
                ? Colors.white.withOpacity(0.08)
                : cs.outlineVariant.withOpacity(0.15),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(isDark ? 0.25 : 0.06),
              blurRadius: 16,
              offset: const Offset(0, 6),
            ),
          ],
        ),
        clipBehavior: Clip.antiAlias,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => HallDetailScreen(hallId: hall.id),
                ),
              );
            },
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Image with gradient overlay
                AspectRatio(
                  aspectRatio: 16 / 10,
                  child: Stack(
                    fit: StackFit.expand,
                    children: [
                      Container(
                        color: cs.surfaceContainerHighest,
                        child: hall.coverPhoto != null
                            ? Image.network(
                                hall.coverPhoto!,
                                fit: BoxFit.cover,
                                errorBuilder: (c, e, s) => Center(
                                  child: Icon(
                                    LucideIcons.image,
                                    size: 40,
                                    color: cs.onSurfaceVariant.withOpacity(0.3),
                                  ),
                                ),
                              )
                            : Center(
                                child: Icon(
                                  LucideIcons.building2,
                                  size: 40,
                                  color: cs.onSurfaceVariant.withOpacity(0.3),
                                ),
                              ),
                      ),
                      // Bottom gradient
                      Positioned(
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: 80,
                        child: Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                Colors.transparent,
                                Colors.black.withOpacity(0.5),
                              ],
                            ),
                          ),
                        ),
                      ),
                      // Price tag
                      Positioned(
                        bottom: 12,
                        right: 12,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 12,
                            vertical: 6,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(10),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.15),
                                blurRadius: 8,
                              ),
                            ],
                          ),
                          child: Text(
                            'From ${hall.startingFrom?.toInt() ?? 0} ${hall.currency}',
                            style: TextStyle(
                              color: cs.primary,
                              fontWeight: FontWeight.w800,
                              fontSize: 14,
                            ),
                          ),
                        ),
                      ),
                      // Favorite button
                      Positioned(
                        top: 12,
                        right: 12,
                        child: Container(
                          width: 36,
                          height: 36,
                          decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.9),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Icon(
                            LucideIcons.heart,
                            size: 18,
                            color: cs.onSurfaceVariant,
                          ),
                        ),
                      ),
                      // Status badge
                      if (hall.status != null)
                        Positioned(
                          top: 12,
                          left: 12,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 10,
                              vertical: 5,
                            ),
                            decoration: BoxDecoration(
                              color: AppTheme.tertiaryColor,
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              hall.status!.toUpperCase(),
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.w700,
                                letterSpacing: 0.5,
                              ),
                            ),
                          ),
                        ),
                    ],
                  ),
                ),

                // Content section
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        hall.name,
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(LucideIcons.mapPin,
                              size: 14, color: cs.primary.withOpacity(0.7)),
                          const SizedBox(width: 4),
                          Expanded(
                            child: Text(
                              '${hall.city}${hall.area != null ? ', ${hall.area}' : ''}',
                              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: cs.onSurfaceVariant,
                                  ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          const SizedBox(width: 12),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 3,
                            ),
                            decoration: BoxDecoration(
                              color: cs.primary.withOpacity(0.08),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(LucideIcons.users, size: 12, color: cs.primary),
                                const SizedBox(width: 4),
                                Text(
                                  '${hall.capacity}',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: cs.primary,
                                  ),
                                ),
                              ],
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
      ),
    );
  }
}

// --- Category Model ---
class _Category {
  final IconData icon;
  final String label;
  const _Category({required this.icon, required this.label});
}

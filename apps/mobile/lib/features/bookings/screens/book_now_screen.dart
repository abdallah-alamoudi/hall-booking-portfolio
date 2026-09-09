import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:hall_booking_mobile/core/theme/app_theme.dart';
import 'package:hall_booking_mobile/features/halls/models/hall.dart';
import 'package:hall_booking_mobile/features/bookings/providers/bookings_provider.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';

// Supported banks (matches backend ALLOWED_BANK_CODES)
const _kBanks = [
  {'code': 'omgy', 'name': 'OMG Bank', 'emoji': '🏦'},
  {'code': 'kuraimy', 'name': 'Al-Kuraimy', 'emoji': '🏛'},
  {'code': 'busairy', 'name': 'Al-Busairy', 'emoji': '🏢'},
  {'code': 'hadramout', 'name': 'Hadramout Bank', 'emoji': '🏗'},
];

const _kPurposeSuggestions = [
  'Wedding 💍',
  'Graduation 🎓',
  'Birthday 🎂',
  'Celebration 🎉',
  'Corporate Event 💼',
  'Other',
];

const _kDaytimeConfig = {
  'MORNING': {
    'label': 'Morning',
    'icon': LucideIcons.sun,
    'color': Color(0xFFF59E0B),
  },
  'EVENING': {
    'label': 'Evening',
    'icon': LucideIcons.moon,
    'color': Color(0xFF818CF8),
  },
  'FULL_DAY': {
    'label': 'Full Day',
    'icon': LucideIcons.clock,
    'color': Color(0xFF10B981),
  },
};

class BookNowScreen extends ConsumerStatefulWidget {
  final Hall hall;

  const BookNowScreen({super.key, required this.hall});

  @override
  ConsumerState<BookNowScreen> createState() => _BookNowScreenState();
}

class _BookNowScreenState extends ConsumerState<BookNowScreen> {
  // Step 1 — Date + Daytime + Info
  DateTime? _selectedDate;
  String? _selectedDaytime;
  String? _selectedBankAccountId;
  final TextEditingController _noteController = TextEditingController();
  final TextEditingController _purposeController = TextEditingController();

  // Step 2 — Payment (read-only, info shown from hall)

  // Step 3 — Receipt
  XFile? _receiptImage;
  Uint8List? _receiptImageBytes;

  bool _isLoading = false;
  int _currentStep = 0; // 0: Info, 1: Payment, 2: Upload

  DaytimePrice? get _selectedPrice {
    if (_selectedDaytime == null) return null;
    try {
      return widget.hall.daytimePrices.firstWhere(
        (dp) => dp.daytime == _selectedDaytime,
      );
    } catch (_) {
      return null;
    }
  }

  double get _totalPrice => _selectedPrice?.price ?? 0;

  Future<void> _selectDate(Map<String, List<String>> busySlots) async {
    final DateTime now = DateTime.now();
    final DateTime firstDate = DateTime(now.year, now.month, now.day);

    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate ?? firstDate,
      firstDate: firstDate,
      lastDate: firstDate.add(const Duration(days: 365)),
      builder: (context, child) => Theme(
        data: Theme.of(context).copyWith(
          colorScheme: Theme.of(context).colorScheme.copyWith(
            primary: AppTheme.primaryColor,
            onPrimary: Colors.white,
          ),
        ),
        child: child!,
      ),
      selectableDayPredicate: (day) {
        final dateKey = DateFormat('yyyy-MM-dd').format(day);
        final slots = busySlots[dateKey] ?? [];
        // A day is fully booked only when both half-day slots are unavailable.
        if (slots.contains('MORNING') && slots.contains('EVENING')) {
          return false;
        }
        return true;
      },
    );

    if (picked != null) {
      setState(() {
        _selectedDate = picked;
        // Reset daytime if the newly selected date blocks it
        if (_selectedDaytime != null) {
          final dateKey = DateFormat('yyyy-MM-dd').format(picked);
          final slotsForDate = busySlots[dateKey] ?? [];
          if (slotsForDate.contains(_selectedDaytime)) {
            _selectedDaytime = null;
          }
        }
      });
    }
  }

  List<String> _getAvailableDaytimes(Map<String, List<String>> busySlots) {
    if (_selectedDate == null) {
      return widget.hall.daytimePrices.map((dp) => dp.daytime).toList();
    }
    final dateKey = DateFormat('yyyy-MM-dd').format(_selectedDate!);
    final slotsForDate = busySlots[dateKey] ?? [];

    return widget.hall.daytimePrices.map((dp) => dp.daytime).where((d) {
      if (slotsForDate.contains(d)) return false;
      return true;
    }).toList();
  }

  Future<void> _pickImage(ImageSource source) async {
    try {
      final picker = ImagePicker();
      final picked = await picker.pickImage(
        source: source,
        imageQuality: 85,
        maxWidth: 1920,
        maxHeight: 1920,
      );

      if (!mounted || picked == null) return;
      final bytes = await picked.readAsBytes();
      if (!mounted) return;
      setState(() {
        _receiptImage = picked;
        _receiptImageBytes = bytes;
      });
    } on PlatformException catch (e) {
      if (!mounted) return;
      final message = e.code.contains('denied')
          ? 'Image access is denied. Please allow Photos/Camera permissions in settings.'
          : 'Failed to select image. Please try again.';
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message), backgroundColor: Colors.red),
      );
    } catch (_) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Unexpected error while selecting image.'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  void _showImageSourceSheet() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const SizedBox(height: 8),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.withOpacity(0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            ListTile(
              leading: const Icon(LucideIcons.camera),
              title: const Text('Take Photo'),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.camera);
              },
            ),
            ListTile(
              leading: const Icon(LucideIcons.image),
              title: const Text('Choose from Gallery'),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.gallery);
              },
            ),
            const SizedBox(height: 8),
          ],
        ),
      ),
    );
  }

  Future<void> _submitBooking() async {
    if (_selectedDate == null || _selectedDaytime == null) return;
    if (_purposeController.text.trim().isEmpty) return;
    if (_selectedBankAccountId == null) return;
    if (_receiptImage == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please upload your deposit receipt.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final service = ref.read(bookingsProvider);
      final selectedDateKey = DateFormat('yyyy-MM-dd').format(_selectedDate!);
      final latestBusySlots = await service.getHallAvailability(widget.hall.id);
      final occupiedSlots =
          latestBusySlots[selectedDateKey] ?? const <String>[];

      if (occupiedSlots.contains(_selectedDaytime)) {
        ref.invalidate(hallAvailabilityProvider(widget.hall.id));
        if (mounted) {
          setState(() {
            _currentStep = 0;
            _selectedDaytime = null;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'This slot just became unavailable. Please choose another time slot.',
              ),
              backgroundColor: Colors.orange,
            ),
          );
        }
        return;
      }

      await service.createBooking(
        hallId: widget.hall.id,
        date: _selectedDate!,
        daytime: _selectedDaytime!,
        bankAccountId: _selectedBankAccountId!,
        purpose: _purposeController.text.trim(),
        receiptImage: _receiptImage!,
        receiptImageBytes: _receiptImageBytes,
        customerNote: _noteController.text.trim().isNotEmpty
            ? _noteController.text.trim()
            : null,
      );

      ref.invalidate(myBookingsFutureProvider);
      ref.invalidate(hallAvailabilityProvider(widget.hall.id));

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Booking request sent! The owner will review your receipt.',
            ),
            backgroundColor: Colors.green,
          ),
        );
        Navigator.of(context).pop();
      }
    } on ApiRequestException catch (e) {
      var message = e.message;
      if (e.code == 'SLOT_TAKEN') {
        message =
            'This slot is already booked. Please choose another date or time slot.';
      } else if (e.code == 'DATE_BLOCKED') {
        message =
            'This slot is blocked by the owner. Please choose another date or time slot.';
      }

      if (e.code == 'SLOT_TAKEN' || e.code == 'DATE_BLOCKED') {
        ref.invalidate(hallAvailabilityProvider(widget.hall.id));
        if (mounted) {
          setState(() {
            _currentStep = 0;
            _selectedDaytime = null;
          });
        }
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message), backgroundColor: Colors.red),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e'), backgroundColor: Colors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  bool get _step1Valid =>
      _selectedDate != null &&
      _selectedDaytime != null &&
      _purposeController.text.trim().isNotEmpty;

  @override
  void dispose() {
    _noteController.dispose();
    _purposeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final availabilityAsync = ref.watch(
      hallAvailabilityProvider(widget.hall.id),
    );
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Book ${widget.hall.name}',
          style: const TextStyle(fontSize: 18),
        ),
        scrolledUnderElevation: 0,
        backgroundColor: Colors.transparent,
        bottom: PreferredSize(
          preferredSize: const Size.fromHeight(56),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 0, 24, 12),
            child: Row(
              children: List.generate(3, (i) {
                final isActive = i == _currentStep;
                final isDone = i < _currentStep;
                return Expanded(
                  child: Row(
                    children: [
                      Expanded(
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          height: 4,
                          decoration: BoxDecoration(
                            color: isDone || isActive
                                ? AppTheme.primaryColor
                                : cs.outlineVariant.withOpacity(0.3),
                            borderRadius: BorderRadius.circular(2),
                          ),
                        ),
                      ),
                      if (i < 2) const SizedBox(width: 6),
                    ],
                  ),
                );
              }),
            ),
          ),
        ),
      ),
      body: availabilityAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, _) => Center(child: Text('Failed to load: $err')),
        data: (busySlots) => IndexedStack(
          index: _currentStep,
          children: [
            _buildStep1(busySlots, isDark, cs),
            _buildStep2(isDark, cs),
            _buildStep3(isDark, cs),
          ],
        ),
      ),
      bottomNavigationBar: _buildBottomBar(isDark, cs),
    );
  }

  // ─── Step 1: Booking Info ───────────────────────────────────────────────────

  Widget _buildStep1(
    Map<String, List<String>> busySlots,
    bool isDark,
    ColorScheme cs,
  ) {
    final availableDaytimes = _getAvailableDaytimes(busySlots);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionTitle('Select Date'),
          const SizedBox(height: 12),
          // Date picker tile
          InkWell(
            onTap: () => _selectDate(busySlots),
            borderRadius: BorderRadius.circular(16),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: _cardDeco(
                isDark,
                cs,
                selected: _selectedDate != null,
              ),
              child: Row(
                children: [
                  _iconBadge(LucideIcons.calendar),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _selectedDate != null
                              ? 'Selected Date'
                              : 'Pick a Date',
                          style: TextStyle(
                            fontSize: 12,
                            color: cs.onSurfaceVariant,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          _selectedDate != null
                              ? DateFormat(
                                  'EEEE, MMM dd, yyyy',
                                ).format(_selectedDate!)
                              : 'Tap to select a date',
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 14,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Icon(
                    LucideIcons.chevronRight,
                    color: cs.onSurfaceVariant,
                    size: 18,
                  ),
                ],
              ),
            ),
          ),

          const SizedBox(height: 24),
          _sectionTitle('Select Time Slot'),
          const SizedBox(height: 12),
          // Daytime chips
          Row(
            children: widget.hall.daytimePrices.map((dp) {
              final config = _kDaytimeConfig[dp.daytime];
              final isAvailable = availableDaytimes.contains(dp.daytime);
              final isSelected = _selectedDaytime == dp.daytime;
              final icon = config?['icon'] as IconData? ?? LucideIcons.clock;
              final color = config?['color'] as Color? ?? cs.primary;
              final label = config?['label'] as String? ?? dp.daytime;

              return Expanded(
                child: Padding(
                  padding: EdgeInsets.only(
                    right: dp == widget.hall.daytimePrices.last ? 0 : 8,
                  ),
                  child: InkWell(
                    onTap: isAvailable
                        ? () => setState(() => _selectedDaytime = dp.daytime)
                        : null,
                    borderRadius: BorderRadius.circular(16),
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 200),
                      padding: const EdgeInsets.symmetric(
                        vertical: 16,
                        horizontal: 8,
                      ),
                      decoration: BoxDecoration(
                        color: isSelected
                            ? color.withOpacity(0.15)
                            : isAvailable
                            ? (isDark
                                  ? Colors.white.withOpacity(0.05)
                                  : Colors.white)
                            : (isDark
                                  ? Colors.white.withOpacity(0.02)
                                  : Colors.grey.shade100),
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isSelected
                              ? color
                              : isAvailable
                              ? cs.outlineVariant.withOpacity(0.3)
                              : Colors.transparent,
                          width: isSelected ? 2 : 1,
                        ),
                      ),
                      child: Column(
                        children: [
                          Icon(
                            icon,
                            size: 22,
                            color: isAvailable
                                ? color
                                : cs.onSurfaceVariant.withOpacity(0.3),
                          ),
                          const SizedBox(height: 6),
                          Text(
                            label,
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: isAvailable
                                  ? cs.onSurface
                                  : cs.onSurfaceVariant.withOpacity(0.4),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            isAvailable
                                ? '${dp.price.toInt()} ${widget.hall.currency}'
                                : 'Booked',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w700,
                              color: isAvailable
                                  ? color
                                  : cs.error.withOpacity(0.5),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),

          const SizedBox(height: 24),
          _sectionTitle('Event Purpose'),
          const SizedBox(height: 12),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _kPurposeSuggestions.map((s) {
              final isSelected = _purposeController.text == s;
              return FilterChip(
                label: Text(s),
                selected: isSelected,
                selectedColor: AppTheme.primaryColor.withOpacity(0.15),
                checkmarkColor: AppTheme.primaryColor,
                side: BorderSide(
                  color: isSelected
                      ? AppTheme.primaryColor
                      : cs.outlineVariant.withOpacity(0.4),
                ),
                onSelected: (_) {
                  setState(() => _purposeController.text = s);
                },
              );
            }).toList(),
          ),
          const SizedBox(height: 12),
          TextFormField(
            controller: _purposeController,
            onChanged: (_) => setState(() {}),
            decoration: InputDecoration(
              labelText: 'Or type your event purpose',
              prefixIcon: const Icon(LucideIcons.sparkles),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
          const SizedBox(height: 24),
          _sectionTitle('Additional Details'),
          const SizedBox(height: 12),
          TextFormField(
            controller: _noteController,
            maxLines: 3,
            decoration: InputDecoration(
              labelText: 'Notes / Special Requests (Optional)',
              alignLabelWithHint: true,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(14),
              ),
            ),
          ),
          const SizedBox(height: 100),
        ],
      ),
    );
  }

  // ─── Step 2: Payment Info ──────────────────────────────────────────────────

  Widget _buildStep2(bool isDark, ColorScheme cs) {
    final bankAccounts = widget.hall.bankAccounts;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionTitle('Deposit Summary'),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: _cardDeco(isDark, cs),
            child: Column(
              children: [
                _priceRow(
                  'Slot Price',
                  '${_totalPrice.toStringAsFixed(0)} ${widget.hall.currency}',
                  cs,
                ),
                const Divider(height: 24),
                _priceRow(
                  'Required Deposit',
                  '${widget.hall.depositAmount?.toStringAsFixed(0) ?? '?'} ${widget.hall.currency}',
                  cs,
                  highlight: true,
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Colors.amber.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.amber.withOpacity(0.4)),
            ),
            child: Row(
              children: [
                const Icon(
                  LucideIcons.alertCircle,
                  color: Colors.amber,
                  size: 18,
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    'Transfer the deposit to one of the bank accounts below, then upload your receipt.',
                    style: TextStyle(
                      fontSize: 12,
                      color: cs.onSurface.withOpacity(0.75),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 24),
          _sectionTitle('Select Bank Account'),
          const SizedBox(height: 12),
          if (bankAccounts.isEmpty)
            Container(
              padding: const EdgeInsets.all(20),
              decoration: _cardDeco(isDark, cs),
              child: Text(
                'The owner has not added bank accounts yet.\nPlease contact them directly.',
                style: TextStyle(color: cs.onSurfaceVariant),
                textAlign: TextAlign.center,
              ),
            )
          else
            ...bankAccounts.map((account) {
              final bank = _kBanks.firstWhere(
                (b) => b['code'] == account.bankCode,
                orElse: () => {
                  'code': account.bankCode,
                  'name': account.bankCode,
                  'emoji': '🏦',
                },
              );
              final isSelected = _selectedBankAccountId == account.id;
              return GestureDetector(
                onTap: () =>
                    setState(() => _selectedBankAccountId = account.id),
                child: Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: _cardDeco(isDark, cs, selected: isSelected),
                  child: Row(
                    children: [
                      Container(
                        width: 44,
                        height: 44,
                        decoration: BoxDecoration(
                          color: AppTheme.primaryColor.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Center(
                          child: Text(
                            bank['emoji']!,
                            style: const TextStyle(fontSize: 22),
                          ),
                        ),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              bank['name']!,
                              style: const TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 14,
                              ),
                            ),
                            Text(
                              account.accountHolder,
                              style: const TextStyle(fontSize: 12),
                            ),
                            SelectableText(
                              account.accountNumber,
                              style: TextStyle(
                                fontSize: 14,
                                fontFamily: 'monospace',
                                fontWeight: FontWeight.w600,
                                color: AppTheme.primaryColor,
                              ),
                            ),
                          ],
                        ),
                      ),
                      if (isSelected)
                        Icon(
                          LucideIcons.checkCircle2,
                          color: AppTheme.primaryColor,
                          size: 22,
                        ),
                    ],
                  ),
                ),
              );
            }),
          const SizedBox(height: 100),
        ],
      ),
    );
  }

  // ─── Step 3: Upload Receipt ────────────────────────────────────────────────

  Widget _buildStep3(bool isDark, ColorScheme cs) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _sectionTitle('Upload Deposit Receipt'),
          const SizedBox(height: 8),
          Text(
            'Take a photo or upload a screenshot of your bank transfer confirmation.',
            style: TextStyle(fontSize: 13, color: cs.onSurfaceVariant),
          ),
          const SizedBox(height: 20),
          if (_receiptImage == null)
            GestureDetector(
              onTap: _showImageSourceSheet,
              child: Container(
                height: 200,
                decoration: BoxDecoration(
                  color: isDark
                      ? Colors.white.withOpacity(0.04)
                      : Colors.grey.shade50,
                  border: Border.all(
                    color: AppTheme.primaryColor.withOpacity(0.4),
                    strokeAlign: BorderSide.strokeAlignOutside,
                  ),
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      LucideIcons.uploadCloud,
                      size: 40,
                      color: AppTheme.primaryColor.withOpacity(0.6),
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Tap to upload receipt',
                      style: TextStyle(
                        color: AppTheme.primaryColor,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'JPEG, PNG, WebP',
                      style: TextStyle(
                        fontSize: 12,
                        color: cs.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            )
          else
            Column(
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(16),
                  child: _receiptImageBytes == null
                      ? Container(
                          height: 280,
                          width: double.infinity,
                          color: Colors.grey.shade200,
                          alignment: Alignment.center,
                          child: const Text('Image preview unavailable'),
                        )
                      : Image.memory(
                          _receiptImageBytes!,
                          width: double.infinity,
                          fit: BoxFit.cover,
                          height: 280,
                          cacheWidth: 1400,
                          cacheHeight: 1400,
                          filterQuality: FilterQuality.medium,
                        ),
                ),
                const SizedBox(height: 12),
                OutlinedButton.icon(
                  onPressed: _showImageSourceSheet,
                  icon: const Icon(LucideIcons.refreshCw, size: 16),
                  label: const Text('Change Image'),
                  style: OutlinedButton.styleFrom(
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                ),
              ],
            ),
          const SizedBox(height: 100),
        ],
      ),
    );
  }

  // ─── Bottom Bar ────────────────────────────────────────────────────────────

  Widget _buildBottomBar(bool isDark, ColorScheme cs) {
    final labels = [
      'Next: Payment Info',
      'Next: Upload Receipt',
      'Submit Booking',
    ];
    final canProceed = _currentStep == 0
        ? _step1Valid
        : (_currentStep == 1
              ? _selectedBankAccountId != null
              : _receiptImage != null);

    return Container(
      padding: EdgeInsets.fromLTRB(
        24,
        16,
        24,
        MediaQuery.of(context).padding.bottom + 16,
      ),
      decoration: BoxDecoration(
        color: isDark ? const Color(0xFF0F0F1A) : Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(isDark ? 0.3 : 0.06),
            blurRadius: 20,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Row(
        children: [
          if (_currentStep > 0)
            Padding(
              padding: const EdgeInsets.only(right: 12),
              child: OutlinedButton(
                onPressed: () => setState(() => _currentStep--),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 14,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(14),
                  ),
                ),
                child: const Icon(LucideIcons.arrowLeft, size: 20),
              ),
            ),
          Expanded(
            child: FilledButton(
              onPressed: (_isLoading || !canProceed)
                  ? null
                  : () {
                      if (_currentStep < 2) {
                        setState(() => _currentStep++);
                      } else {
                        _submitBooking();
                      }
                    },
              style: FilledButton.styleFrom(
                backgroundColor: AppTheme.primaryColor,
                padding: const EdgeInsets.symmetric(vertical: 14),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(14),
                ),
              ),
              child: _isLoading
                  ? const SizedBox(
                      width: 22,
                      height: 22,
                      child: CircularProgressIndicator(
                        color: Colors.white,
                        strokeWidth: 2,
                      ),
                    )
                  : Text(
                      labels[_currentStep],
                      style: const TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                      ),
                    ),
            ),
          ),
        ],
      ),
    );
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  Widget _sectionTitle(String text) => Text(
    text,
    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700),
  );

  Widget _iconBadge(IconData icon) => Container(
    padding: const EdgeInsets.all(10),
    decoration: BoxDecoration(
      color: AppTheme.primaryColor.withOpacity(0.1),
      borderRadius: BorderRadius.circular(12),
    ),
    child: Icon(icon, color: AppTheme.primaryColor, size: 20),
  );

  BoxDecoration _cardDeco(
    bool isDark,
    ColorScheme cs, {
    bool selected = false,
  }) => BoxDecoration(
    color: isDark ? Colors.white.withOpacity(0.05) : Colors.white,
    border: Border.all(
      color: selected
          ? AppTheme.primaryColor
          : cs.outlineVariant.withOpacity(0.4),
      width: selected ? 2 : 1,
    ),
    borderRadius: BorderRadius.circular(16),
    boxShadow: [
      if (!isDark)
        BoxShadow(
          color: Colors.black.withOpacity(0.04),
          blurRadius: 10,
          offset: const Offset(0, 4),
        ),
    ],
  );

  Widget _priceRow(
    String label,
    String value,
    ColorScheme cs, {
    bool highlight = false,
  }) => Row(
    mainAxisAlignment: MainAxisAlignment.spaceBetween,
    children: [
      Text(label, style: TextStyle(color: cs.onSurfaceVariant, fontSize: 13)),
      Text(
        value,
        style: TextStyle(
          fontWeight: FontWeight.w700,
          fontSize: highlight ? 18 : 14,
          color: highlight ? AppTheme.primaryColor : cs.onSurface,
        ),
      ),
    ],
  );
}

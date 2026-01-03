import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';

import '../../providers/scheduled_provider.dart';

// App Colors
class AppColors {
  static const Color primary = Color(0xFF1E88E5);
}

class ScheduleTripScreen extends ConsumerStatefulWidget {
  const ScheduleTripScreen({super.key});

  @override
  ConsumerState<ScheduleTripScreen> createState() => _ScheduleTripScreenState();
}

class _ScheduleTripScreenState extends ConsumerState<ScheduleTripScreen> {
  DateTime _selectedDate = DateTime.now().add(const Duration(hours: 1));
  TimeOfDay _selectedTime = TimeOfDay.now();
  String _selectedRideType = 'economy';
  String _paymentMethod = 'cash';
  final TextEditingController _notesController = TextEditingController();

  TripLocation? _pickup;
  TripLocation? _dropoff;

  @override
  void initState() {
    super.initState();
    // Round to next 30 min slot
    final now = DateTime.now();
    final minutes = now.minute;
    final roundedMinutes = (minutes / 30).ceil() * 30;
    _selectedDate = DateTime(now.year, now.month, now.day, now.hour, 0)
        .add(Duration(minutes: roundedMinutes + 30));
    _selectedTime = TimeOfDay.fromDateTime(_selectedDate);

    // Load available slots for today
    Future.microtask(() {
      ref.read(scheduledProvider.notifier).loadAvailableSlots(_selectedDate);
    });
  }

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _selectDate() async {
    final now = DateTime.now();
    final minDate = now.add(const Duration(minutes: 30));
    final maxDate = now.add(const Duration(days: 7));

    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate.isAfter(minDate) ? _selectedDate : minDate,
      firstDate: minDate,
      lastDate: maxDate,
      locale: const Locale('ar'),
    );

    if (picked != null) {
      setState(() {
        _selectedDate = DateTime(
          picked.year,
          picked.month,
          picked.day,
          _selectedTime.hour,
          _selectedTime.minute,
        );
      });
      ref.read(scheduledProvider.notifier).loadAvailableSlots(picked);
    }
  }

  Future<void> _selectTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _selectedTime,
    );

    if (picked != null) {
      final now = DateTime.now();
      final selectedDateTime = DateTime(
        _selectedDate.year,
        _selectedDate.month,
        _selectedDate.day,
        picked.hour,
        picked.minute,
      );

      if (selectedDateTime.isBefore(now.add(const Duration(minutes: 30)))) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('يجب أن يكون الموعد بعد 30 دقيقة على الأقل')),
          );
        }
        return;
      }

      setState(() {
        _selectedTime = picked;
        _selectedDate = selectedDateTime;
      });
    }
  }

  void _selectPickup() async {
    final result = await context.push<Map<String, dynamic>>(
      '/location-picker',
      extra: {'isPickup': true},
    );

    if (result != null) {
      setState(() {
        _pickup = TripLocation(
          address: result['address'] ?? '',
          latitude: result['latitude'] ?? 0.0,
          longitude: result['longitude'] ?? 0.0,
          name: result['name'],
        );
      });
    }
  }

  void _selectDropoff() async {
    final result = await context.push<Map<String, dynamic>>(
      '/location-picker',
      extra: {'isPickup': false},
    );

    if (result != null) {
      setState(() {
        _dropoff = TripLocation(
          address: result['address'] ?? '',
          latitude: result['latitude'] ?? 0.0,
          longitude: result['longitude'] ?? 0.0,
          name: result['name'],
        );
      });
    }
  }

  Future<void> _scheduleTrip() async {
    if (_pickup == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('الرجاء تحديد نقطة الانطلاق')),
      );
      return;
    }

    if (_dropoff == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('الرجاء تحديد الوجهة')),
      );
      return;
    }

    final trip = await ref.read(scheduledProvider.notifier).createScheduledTrip(
      pickup: _pickup!,
      dropoff: _dropoff!,
      rideType: _selectedRideType,
      scheduledTime: _selectedDate,
      paymentMethod: _paymentMethod,
      notes: _notesController.text.isNotEmpty ? _notesController.text : null,
    );

    if (trip != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('تم جدولة الرحلة ${trip.tripNumber}')),
      );
      context.pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(scheduledProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('جدولة رحلة'),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16.w),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Date & Time Section
            _buildSectionHeader('موعد الرحلة', Icons.schedule),
            SizedBox(height: 12.h),
            Row(
              children: [
                Expanded(
                  child: _buildDateTimeCard(
                    icon: Icons.calendar_today,
                    label: 'التاريخ',
                    value: DateFormat('EEE, d MMM', 'ar').format(_selectedDate),
                    onTap: _selectDate,
                  ),
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: _buildDateTimeCard(
                    icon: Icons.access_time,
                    label: 'الوقت',
                    value: DateFormat('HH:mm').format(_selectedDate),
                    onTap: _selectTime,
                  ),
                ),
              ],
            ),
            SizedBox(height: 24.h),

            // Location Section
            _buildSectionHeader('المواقع', Icons.location_on),
            SizedBox(height: 12.h),
            _buildLocationCard(
              icon: Icons.radio_button_on,
              iconColor: Colors.green,
              label: 'نقطة الانطلاق',
              value: _pickup?.address,
              onTap: _selectPickup,
            ),
            SizedBox(height: 12.h),
            _buildLocationCard(
              icon: Icons.location_on,
              iconColor: Colors.red,
              label: 'الوجهة',
              value: _dropoff?.address,
              onTap: _selectDropoff,
            ),
            SizedBox(height: 24.h),

            // Ride Type Section
            _buildSectionHeader('نوع الرحلة', Icons.directions_car),
            SizedBox(height: 12.h),
            _buildRideTypeSelector(),
            SizedBox(height: 24.h),

            // Payment Section
            _buildSectionHeader('طريقة الدفع', Icons.payment),
            SizedBox(height: 12.h),
            _buildPaymentSelector(),
            SizedBox(height: 24.h),

            // Notes Section
            _buildSectionHeader('ملاحظات (اختياري)', Icons.note),
            SizedBox(height: 12.h),
            TextField(
              controller: _notesController,
              maxLines: 2,
              decoration: InputDecoration(
                hintText: 'أي ملاحظات للسائق...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12.r),
                ),
              ),
            ),
            SizedBox(height: 32.h),

            // Error message
            if (state.errorMessage != null) ...[
              Container(
                padding: EdgeInsets.all(12.w),
                decoration: BoxDecoration(
                  color: Colors.red.shade50,
                  borderRadius: BorderRadius.circular(8.r),
                ),
                child: Text(
                  state.errorMessage!,
                  style: TextStyle(color: Colors.red, fontSize: 14.sp),
                ),
              ),
              SizedBox(height: 16.h),
            ],

            // Schedule Button
            SizedBox(
              width: double.infinity,
              height: 50.h,
              child: ElevatedButton(
                onPressed: state.isLoading ? null : _scheduleTrip,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                ),
                child: state.isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text(
                        'جدولة الرحلة',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                      ),
              ),
            ),
            SizedBox(height: 16.h),

            // Info note
            Container(
              padding: EdgeInsets.all(12.w),
              decoration: BoxDecoration(
                color: AppColors.primary.withAlpha(25),
                borderRadius: BorderRadius.circular(8.r),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline, color: AppColors.primary, size: 20.sp),
                  SizedBox(width: 8.w),
                  Expanded(
                    child: Text(
                      'سيتم البحث عن سائق قبل 15 دقيقة من موعد الرحلة',
                      style: TextStyle(
                        fontSize: 12.sp,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(height: 32.h),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 20.sp, color: AppColors.primary),
        SizedBox(width: 8.w),
        Text(
          title,
          style: TextStyle(
            fontSize: 16.sp,
            fontWeight: FontWeight.bold,
          ),
        ),
      ],
    );
  }

  Widget _buildDateTimeCard({
    required IconData icon,
    required String label,
    required String value,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12.r),
      child: Container(
        padding: EdgeInsets.all(16.w),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey[300]!),
          borderRadius: BorderRadius.circular(12.r),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, size: 18.sp, color: Colors.grey[600]),
                SizedBox(width: 8.w),
                Text(
                  label,
                  style: TextStyle(
                    fontSize: 12.sp,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
            SizedBox(height: 8.h),
            Text(
              value,
              style: TextStyle(
                fontSize: 16.sp,
                fontWeight: FontWeight.bold,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildLocationCard({
    required IconData icon,
    required Color iconColor,
    required String label,
    String? value,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12.r),
      child: Container(
        padding: EdgeInsets.all(16.w),
        decoration: BoxDecoration(
          border: Border.all(color: Colors.grey[300]!),
          borderRadius: BorderRadius.circular(12.r),
        ),
        child: Row(
          children: [
            Icon(icon, color: iconColor, size: 20.sp),
            SizedBox(width: 12.w),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    label,
                    style: TextStyle(
                      fontSize: 12.sp,
                      color: Colors.grey[600],
                    ),
                  ),
                  SizedBox(height: 4.h),
                  Text(
                    value ?? 'اضغط للتحديد',
                    style: TextStyle(
                      fontSize: 14.sp,
                      fontWeight: value != null ? FontWeight.w500 : FontWeight.normal,
                      color: value != null ? Colors.black : Colors.grey[500],
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_left, color: Colors.grey[400]),
          ],
        ),
      ),
    );
  }

  Widget _buildRideTypeSelector() {
    final rideTypes = [
      {'key': 'economy', 'name': 'اقتصادي', 'icon': Icons.directions_car},
      {'key': 'comfort', 'name': 'مريح', 'icon': Icons.airline_seat_recline_extra},
      {'key': 'family', 'name': 'عائلي', 'icon': Icons.family_restroom},
    ];

    return Row(
      children: rideTypes.map((type) {
        final isSelected = _selectedRideType == type['key'];
        return Expanded(
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: 4.w),
            child: InkWell(
              onTap: () => setState(() => _selectedRideType = type['key'] as String),
              borderRadius: BorderRadius.circular(12.r),
              child: Container(
                padding: EdgeInsets.symmetric(vertical: 16.h),
                decoration: BoxDecoration(
                  color: isSelected ? AppColors.primary : Colors.grey[100],
                  borderRadius: BorderRadius.circular(12.r),
                  border: Border.all(
                    color: isSelected ? AppColors.primary : Colors.grey[300]!,
                  ),
                ),
                child: Column(
                  children: [
                    Icon(
                      type['icon'] as IconData,
                      color: isSelected ? Colors.white : Colors.grey[600],
                      size: 24.sp,
                    ),
                    SizedBox(height: 8.h),
                    Text(
                      type['name'] as String,
                      style: TextStyle(
                        fontSize: 12.sp,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        color: isSelected ? Colors.white : Colors.grey[700],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  Widget _buildPaymentSelector() {
    final paymentMethods = [
      {'key': 'cash', 'name': 'نقدي', 'icon': Icons.money},
      {'key': 'wallet', 'name': 'المحفظة', 'icon': Icons.account_balance_wallet},
      {'key': 'card', 'name': 'بطاقة', 'icon': Icons.credit_card},
    ];

    return Row(
      children: paymentMethods.map((method) {
        final isSelected = _paymentMethod == method['key'];
        return Expanded(
          child: Padding(
            padding: EdgeInsets.symmetric(horizontal: 4.w),
            child: InkWell(
              onTap: () => setState(() => _paymentMethod = method['key'] as String),
              borderRadius: BorderRadius.circular(12.r),
              child: Container(
                padding: EdgeInsets.symmetric(vertical: 12.h),
                decoration: BoxDecoration(
                  color: isSelected ? AppColors.primary.withAlpha(25) : Colors.grey[100],
                  borderRadius: BorderRadius.circular(12.r),
                  border: Border.all(
                    color: isSelected ? AppColors.primary : Colors.grey[300]!,
                  ),
                ),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      method['icon'] as IconData,
                      color: isSelected ? AppColors.primary : Colors.grey[600],
                      size: 18.sp,
                    ),
                    SizedBox(width: 6.w),
                    Text(
                      method['name'] as String,
                      style: TextStyle(
                        fontSize: 12.sp,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                        color: isSelected ? AppColors.primary : Colors.grey[700],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      }).toList(),
    );
  }
}

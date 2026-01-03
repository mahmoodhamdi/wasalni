import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../../config/theme.dart';
import '../../providers/trip_provider.dart';

class TripCompleteScreen extends ConsumerStatefulWidget {
  const TripCompleteScreen({super.key});

  @override
  ConsumerState<TripCompleteScreen> createState() => _TripCompleteScreenState();
}

class _TripCompleteScreenState extends ConsumerState<TripCompleteScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    );
    _scaleAnimation = Tween<double>(begin: 0, end: 1).animate(
      CurvedAnimation(parent: _animController, curve: Curves.elasticOut),
    );
    _animController.forward();
  }

  @override
  void dispose() {
    _animController.dispose();
    super.dispose();
  }

  void _goHome() {
    ref.read(driverTripProvider.notifier).resetTrip();
    context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    final tripState = ref.watch(driverTripProvider);
    final fare = tripState.fareBreakdown;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) {
          _goHome();
        }
      },
      child: Scaffold(
        body: SafeArea(
          child: Padding(
            padding: EdgeInsets.all(24.w),
            child: Column(
              children: [
                const Spacer(),

                // Success Animation
                ScaleTransition(
                  scale: _scaleAnimation,
                  child: Container(
                    width: 120.w,
                    height: 120.w,
                    decoration: BoxDecoration(
                      color: AppColors.success.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.check_circle,
                      color: AppColors.success,
                      size: 80.sp,
                    ),
                  ),
                ),
                SizedBox(height: 32.h),

                Text(
                  'تم إكمال الرحلة!',
                  style: AppTextStyles.heading1,
                ),
                SizedBox(height: 8.h),
                Text(
                  'رحلة رقم ${tripState.tripNumber ?? '---'}',
                  style: AppTextStyles.subtitle,
                ),
                SizedBox(height: 40.h),

                // Earnings Card
                Container(
                  width: double.infinity,
                  padding: EdgeInsets.all(24.w),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [AppColors.primary, AppColors.primaryDark],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20.r),
                    boxShadow: [
                      BoxShadow(
                        color: AppColors.primary.withValues(alpha: 0.3),
                        blurRadius: 20,
                        offset: const Offset(0, 10),
                      ),
                    ],
                  ),
                  child: Column(
                    children: [
                      Text(
                        'أرباحك من هذه الرحلة',
                        style: AppTextStyles.body.copyWith(color: Colors.white70),
                      ),
                      SizedBox(height: 12.h),
                      Text(
                        '${fare?.driverEarnings.toStringAsFixed(0) ?? '0'} ج.م',
                        style: AppTextStyles.heading1.copyWith(
                          color: Colors.white,
                          fontSize: 40.sp,
                        ),
                      ),
                      SizedBox(height: 8.h),
                      Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: 16.w,
                          vertical: 6.h,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withValues(alpha: 0.2),
                          borderRadius: BorderRadius.circular(20.r),
                        ),
                        child: Text(
                          'نقدي',
                          style: AppTextStyles.caption.copyWith(
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                SizedBox(height: 24.h),

                // Fare Breakdown
                if (fare != null)
                  Container(
                    width: double.infinity,
                    padding: EdgeInsets.all(20.w),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(16.r),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.black.withValues(alpha: 0.05),
                          blurRadius: 10,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('تفاصيل الأجرة', style: AppTextStyles.heading3),
                        SizedBox(height: 16.h),
                        _FareRow(
                          label: 'إجمالي الأجرة',
                          value: '${fare.total.toStringAsFixed(0)} ج.م',
                        ),
                        _FareRow(
                          label: 'عمولة المنصة',
                          value: '-${fare.bookingFee.toStringAsFixed(0)} ج.م',
                          valueColor: AppColors.error,
                        ),
                        if (fare.discount > 0)
                          _FareRow(
                            label: 'خصم الراكب',
                            value: '-${fare.discount.toStringAsFixed(0)} ج.م',
                            valueColor: AppColors.error,
                          ),
                        const Divider(),
                        _FareRow(
                          label: 'صافي الأرباح',
                          value: '${fare.driverEarnings.toStringAsFixed(0)} ج.م',
                          isTotal: true,
                        ),
                      ],
                    ),
                  ),

                const Spacer(),

                // Done Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _goHome,
                    style: ElevatedButton.styleFrom(
                      padding: EdgeInsets.symmetric(vertical: 16.h),
                    ),
                    child: const Text('العودة للرئيسية'),
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

class _FareRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;
  final bool isTotal;

  const _FareRow({
    required this.label,
    required this.value,
    this.valueColor,
    this.isTotal = false,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.symmetric(vertical: 6.h),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: isTotal
                ? AppTextStyles.body.copyWith(fontWeight: FontWeight.bold)
                : AppTextStyles.body,
          ),
          Text(
            value,
            style: (isTotal
                    ? AppTextStyles.body.copyWith(fontWeight: FontWeight.bold)
                    : AppTextStyles.body)
                .copyWith(
              color: valueColor ?? (isTotal ? AppColors.primary : null),
            ),
          ),
        ],
      ),
    );
  }
}

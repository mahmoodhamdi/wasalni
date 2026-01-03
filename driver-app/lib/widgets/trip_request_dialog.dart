import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../config/theme.dart';
import '../providers/trip_provider.dart';

class TripRequestDialog extends ConsumerStatefulWidget {
  final TripRequest request;

  const TripRequestDialog({
    super.key,
    required this.request,
  });

  @override
  ConsumerState<TripRequestDialog> createState() => _TripRequestDialogState();
}

class _TripRequestDialogState extends ConsumerState<TripRequestDialog>
    with SingleTickerProviderStateMixin {
  late AnimationController _animController;
  late Animation<double> _progressAnimation;
  Timer? _timeoutTimer;
  int _remainingSeconds = 30;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _remainingSeconds = widget.request.timeoutSeconds;

    _animController = AnimationController(
      vsync: this,
      duration: Duration(seconds: widget.request.timeoutSeconds),
    );

    _progressAnimation = Tween<double>(begin: 1.0, end: 0.0).animate(_animController);

    _animController.forward();

    _timeoutTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() {
          _remainingSeconds--;
          if (_remainingSeconds <= 0) {
            timer.cancel();
            _onTimeout();
          }
        });
      }
    });
  }

  @override
  void dispose() {
    _animController.dispose();
    _timeoutTimer?.cancel();
    super.dispose();
  }

  void _onTimeout() {
    if (mounted && !_isLoading) {
      ref.read(driverTripProvider.notifier).rejectTrip(reason: 'timeout');
      Navigator.of(context).pop();
    }
  }

  Future<void> _acceptTrip() async {
    setState(() => _isLoading = true);
    _timeoutTimer?.cancel();

    final success = await ref.read(driverTripProvider.notifier).acceptTrip();

    if (mounted) {
      Navigator.of(context).pop(success);
    }
  }

  void _rejectTrip() {
    _timeoutTimer?.cancel();
    ref.read(driverTripProvider.notifier).rejectTrip();
    Navigator.of(context).pop(false);
  }

  @override
  Widget build(BuildContext context) {
    final request = widget.request;

    return Dialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(24.r),
      ),
      child: Container(
        padding: EdgeInsets.all(24.w),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Timer Progress
            Stack(
              alignment: Alignment.center,
              children: [
                SizedBox(
                  width: 70.w,
                  height: 70.w,
                  child: AnimatedBuilder(
                    animation: _progressAnimation,
                    builder: (context, child) {
                      return CircularProgressIndicator(
                        value: _progressAnimation.value,
                        strokeWidth: 4,
                        backgroundColor: Colors.grey.shade200,
                        valueColor: AlwaysStoppedAnimation<Color>(
                          _remainingSeconds <= 10 ? AppColors.error : AppColors.primary,
                        ),
                      );
                    },
                  ),
                ),
                Text(
                  '$_remainingSeconds',
                  style: AppTextStyles.heading2.copyWith(
                    color: _remainingSeconds <= 10 ? AppColors.error : AppColors.primary,
                  ),
                ),
              ],
            ),
            SizedBox(height: 20.h),

            // Title
            Text('رحلة جديدة!', style: AppTextStyles.heading2),
            SizedBox(height: 8.h),
            Container(
              padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 4.h),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(8.r),
              ),
              child: Text(
                request.rideTypeAr,
                style: AppTextStyles.caption.copyWith(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            SizedBox(height: 20.h),

            // Trip Details
            Container(
              padding: EdgeInsets.all(16.w),
              decoration: BoxDecoration(
                color: Colors.grey.shade50,
                borderRadius: BorderRadius.circular(12.r),
              ),
              child: Column(
                children: [
                  // Pickup
                  Row(
                    children: [
                      Icon(Icons.trip_origin, color: AppColors.success, size: 18.sp),
                      SizedBox(width: 12.w),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('نقطة الانطلاق', style: AppTextStyles.caption),
                            Text(
                              request.pickup.address ?? 'موقع الراكب',
                              style: AppTextStyles.body,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  Padding(
                    padding: EdgeInsets.only(right: 8.w),
                    child: Column(
                      children: List.generate(
                        2,
                        (index) => Container(
                          width: 2,
                          height: 5.h,
                          margin: EdgeInsets.symmetric(vertical: 2.h),
                          color: Colors.grey.shade300,
                        ),
                      ),
                    ),
                  ),
                  // Dropoff
                  Row(
                    children: [
                      Icon(Icons.location_on, color: AppColors.primary, size: 18.sp),
                      SizedBox(width: 12.w),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text('الوجهة', style: AppTextStyles.caption),
                            Text(
                              request.dropoff.address ?? 'الوجهة',
                              style: AppTextStyles.body,
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            SizedBox(height: 16.h),

            // Trip Info Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceEvenly,
              children: [
                _InfoItem(
                  icon: Icons.route,
                  label: '${request.distanceKm.toStringAsFixed(1)} كم',
                ),
                _InfoItem(
                  icon: Icons.timer,
                  label: '${request.durationMinutes} دقيقة',
                ),
                _InfoItem(
                  icon: Icons.payments,
                  label: request.paymentMethodAr,
                ),
              ],
            ),
            SizedBox(height: 16.h),

            // Fare
            Container(
              padding: EdgeInsets.all(12.w),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12.r),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text('الأجرة المتوقعة: ', style: AppTextStyles.body),
                  Text(
                    '${request.estimatedFare.toStringAsFixed(0)} ج.م',
                    style: AppTextStyles.heading3.copyWith(color: AppColors.primary),
                  ),
                ],
              ),
            ),
            SizedBox(height: 24.h),

            // Action Buttons
            if (_isLoading)
              const CircularProgressIndicator()
            else
              Row(
                children: [
                  // Reject Button
                  Expanded(
                    child: OutlinedButton(
                      onPressed: _rejectTrip,
                      style: OutlinedButton.styleFrom(
                        foregroundColor: AppColors.error,
                        side: const BorderSide(color: AppColors.error),
                        padding: EdgeInsets.symmetric(vertical: 14.h),
                      ),
                      child: const Text('رفض'),
                    ),
                  ),
                  SizedBox(width: 12.w),
                  // Accept Button
                  Expanded(
                    flex: 2,
                    child: ElevatedButton(
                      onPressed: _acceptTrip,
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.success,
                        padding: EdgeInsets.symmetric(vertical: 14.h),
                      ),
                      child: const Text('قبول'),
                    ),
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}

class _InfoItem extends StatelessWidget {
  final IconData icon;
  final String label;

  const _InfoItem({
    required this.icon,
    required this.label,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: AppColors.textSecondary, size: 20.sp),
        SizedBox(height: 4.h),
        Text(label, style: AppTextStyles.caption),
      ],
    );
  }
}

/// Show the trip request dialog
Future<bool?> showTripRequestDialog(
  BuildContext context,
  TripRequest request,
) {
  return showDialog<bool>(
    context: context,
    barrierDismissible: false,
    builder: (context) => TripRequestDialog(request: request),
  );
}

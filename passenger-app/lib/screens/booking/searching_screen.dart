import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../../config/theme.dart';
import '../../providers/trip_provider.dart';

class SearchingScreen extends ConsumerStatefulWidget {
  const SearchingScreen({super.key});

  @override
  ConsumerState<SearchingScreen> createState() => _SearchingScreenState();
}

class _SearchingScreenState extends ConsumerState<SearchingScreen>
    with SingleTickerProviderStateMixin {
  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;
  int _searchDots = 0;
  Timer? _dotsTimer;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();

    _pulseAnimation = Tween<double>(begin: 1.0, end: 1.3).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _dotsTimer = Timer.periodic(const Duration(milliseconds: 500), (timer) {
      if (mounted) {
        setState(() {
          _searchDots = (_searchDots + 1) % 4;
        });
      }
    });
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _dotsTimer?.cancel();
    super.dispose();
  }

  void _showCancelDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('إلغاء الرحلة'),
        content: const Text('هل أنت متأكد من إلغاء طلب الرحلة؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('لا'),
          ),
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              _cancelTrip();
            },
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('نعم، إلغاء'),
          ),
        ],
      ),
    );
  }

  Future<void> _cancelTrip() async {
    await ref.read(tripProvider.notifier).cancelTrip('Cancelled by passenger');
    if (mounted) {
      ref.read(tripProvider.notifier).resetTrip();
      context.go('/home');
    }
  }

  String _getSearchingDots() {
    return '.' * _searchDots;
  }

  @override
  Widget build(BuildContext context) {
    final tripState = ref.watch(tripProvider);

    // Listen for status changes
    ref.listen<TripState>(tripProvider, (previous, next) {
      if (next.status == TripStatus.driverAssigned ||
          next.status == TripStatus.driverArriving) {
        // Driver found - navigate to trip tracking
        context.go('/trip');
      } else if (next.status == TripStatus.cancelled ||
          next.status == TripStatus.idle) {
        // Trip cancelled or failed - go back to home
        if (next.errorMessage != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(next.errorMessage!),
              backgroundColor: AppColors.error,
            ),
          );
          ref.read(tripProvider.notifier).clearError();
        }
        context.go('/home');
      }
    });

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) {
          _showCancelDialog();
        }
      },
      child: Scaffold(
        body: SafeArea(
          child: Padding(
            padding: EdgeInsets.all(24.w),
            child: Column(
              children: [
                // Header
                Row(
                  children: [
                    Text(
                      'جاري البحث عن سائق',
                      style: AppTextStyles.heading2,
                    ),
                  ],
                ),
                SizedBox(height: 8.h),
                Text(
                  'رقم الرحلة: ${tripState.tripNumber ?? '---'}',
                  style: AppTextStyles.caption,
                ),

                const Spacer(),

                // Animated searching indicator
                ScaleTransition(
                  scale: _pulseAnimation,
                  child: Container(
                    width: 150.w,
                    height: 150.w,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: AppColors.primary.withValues(alpha: 0.1),
                    ),
                    child: Center(
                      child: Container(
                        width: 100.w,
                        height: 100.w,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: AppColors.primary.withValues(alpha: 0.2),
                        ),
                        child: Icon(
                          Icons.local_taxi,
                          size: 48.sp,
                          color: AppColors.primary,
                        ),
                      ),
                    ),
                  ),
                ),

                SizedBox(height: 32.h),

                Text(
                  'جاري البحث${_getSearchingDots()}',
                  style: AppTextStyles.heading3,
                ),
                SizedBox(height: 8.h),
                Text(
                  'يرجى الانتظار بينما نبحث لك عن سائق قريب',
                  style: AppTextStyles.body.copyWith(
                    color: AppColors.textSecondary,
                  ),
                  textAlign: TextAlign.center,
                ),

                const Spacer(),

                // Trip Summary
                Container(
                  padding: EdgeInsets.all(16.w),
                  decoration: BoxDecoration(
                    color: Colors.grey.shade50,
                    borderRadius: BorderRadius.circular(16.r),
                  ),
                  child: Column(
                    children: [
                      // Pickup
                      Row(
                        children: [
                          Icon(Icons.trip_origin, color: AppColors.success, size: 20.sp),
                          SizedBox(width: 12.w),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('من', style: AppTextStyles.caption),
                                Text(
                                  tripState.pickup?.address ?? 'نقطة الانطلاق',
                                  style: AppTextStyles.body,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      Padding(
                        padding: EdgeInsets.only(right: 9.w),
                        child: Column(
                          children: List.generate(
                            3,
                            (index) => Container(
                              width: 2,
                              height: 6.h,
                              margin: EdgeInsets.symmetric(vertical: 2.h),
                              color: Colors.grey.shade300,
                            ),
                          ),
                        ),
                      ),
                      // Dropoff
                      Row(
                        children: [
                          Icon(Icons.location_on, color: AppColors.primary, size: 20.sp),
                          SizedBox(width: 12.w),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('إلى', style: AppTextStyles.caption),
                                Text(
                                  tripState.dropoff?.address ?? 'الوجهة',
                                  style: AppTextStyles.body,
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                      SizedBox(height: 12.h),
                      const Divider(),
                      SizedBox(height: 8.h),
                      // Fare estimate
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('السعر المتوقع', style: AppTextStyles.body),
                          Text(
                            tripState.selectedFare?.fareRange ?? '---',
                            style: AppTextStyles.heading3.copyWith(
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                SizedBox(height: 24.h),

                // Cancel button
                SizedBox(
                  width: double.infinity,
                  child: OutlinedButton(
                    onPressed: _showCancelDialog,
                    style: OutlinedButton.styleFrom(
                      foregroundColor: AppColors.error,
                      side: const BorderSide(color: AppColors.error),
                      padding: EdgeInsets.symmetric(vertical: 14.h),
                    ),
                    child: const Text('إلغاء الطلب'),
                  ),
                ),

                SizedBox(height: 16.h),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

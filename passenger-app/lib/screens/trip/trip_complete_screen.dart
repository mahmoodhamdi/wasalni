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
  int _rating = 0;
  final TextEditingController _commentController = TextEditingController();
  bool _isSubmitting = false;
  double _tipAmount = 0;

  final List<double> _tipOptions = [5, 10, 20, 50];

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
    _commentController.dispose();
    super.dispose();
  }

  Future<void> _submitRating() async {
    if (_rating == 0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('يرجى تقييم السائق'),
          backgroundColor: AppColors.warning,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      await ref.read(tripProvider.notifier).rateDriver(
        _rating,
        comment: _commentController.text.isNotEmpty
            ? _commentController.text
            : null,
      );

      if (mounted) {
        ref.read(tripProvider.notifier).resetTrip();
        context.go('/home');
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('فشل في إرسال التقييم'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  void _skipRating() {
    ref.read(tripProvider.notifier).resetTrip();
    context.go('/home');
  }

  @override
  Widget build(BuildContext context) {
    final tripState = ref.watch(tripProvider);
    final driver = tripState.driver;
    final fare = tripState.fareBreakdown;

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) {
          _skipRating();
        }
      },
      child: Scaffold(
        body: SafeArea(
          child: SingleChildScrollView(
            padding: EdgeInsets.all(24.w),
            child: Column(
              children: [
                // Success Animation
                ScaleTransition(
                  scale: _scaleAnimation,
                  child: Container(
                    width: 100.w,
                    height: 100.w,
                    decoration: BoxDecoration(
                      color: AppColors.success.withValues(alpha: 0.1),
                      shape: BoxShape.circle,
                    ),
                    child: Icon(
                      Icons.check_circle,
                      color: AppColors.success,
                      size: 60.sp,
                    ),
                  ),
                ),
                SizedBox(height: 24.h),

                Text(
                  'تم إكمال الرحلة!',
                  style: AppTextStyles.heading1,
                ),
                SizedBox(height: 8.h),
                Text(
                  'شكراً لاستخدامك وصّلني',
                  style: AppTextStyles.subtitle,
                ),
                SizedBox(height: 32.h),

                // Trip Summary Card
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
                    children: [
                      // Fare breakdown
                      if (fare != null) ...[
                        _FareRow(
                          label: 'أجرة الأساس',
                          value: '${fare.baseFare.toStringAsFixed(0)} ج.م',
                        ),
                        _FareRow(
                          label: 'أجرة المسافة',
                          value: '${fare.distanceFare.toStringAsFixed(0)} ج.م',
                        ),
                        _FareRow(
                          label: 'أجرة الوقت',
                          value: '${fare.timeFare.toStringAsFixed(0)} ج.م',
                        ),
                        if (fare.waitingFare > 0)
                          _FareRow(
                            label: 'أجرة الانتظار',
                            value: '${fare.waitingFare.toStringAsFixed(0)} ج.م',
                          ),
                        if (fare.surgeAmount > 0)
                          _FareRow(
                            label: 'زيادة الطلب',
                            value: '${fare.surgeAmount.toStringAsFixed(0)} ج.م',
                            valueColor: AppColors.warning,
                          ),
                        _FareRow(
                          label: 'رسوم الحجز',
                          value: '${fare.bookingFee.toStringAsFixed(0)} ج.م',
                        ),
                        if (fare.discount > 0)
                          _FareRow(
                            label: 'خصم',
                            value: '-${fare.discount.toStringAsFixed(0)} ج.م',
                            valueColor: AppColors.success,
                          ),
                        const Divider(),
                        _FareRow(
                          label: 'الإجمالي',
                          value: '${fare.total.toStringAsFixed(0)} ج.م',
                          isTotal: true,
                        ),
                      ] else ...[
                        _FareRow(
                          label: 'الإجمالي',
                          value: tripState.selectedFare?.fareRange ?? '---',
                          isTotal: true,
                        ),
                      ],
                      if (_tipAmount > 0) ...[
                        SizedBox(height: 8.h),
                        _FareRow(
                          label: 'إكرامية',
                          value: '${_tipAmount.toStringAsFixed(0)} ج.م',
                          valueColor: AppColors.success,
                        ),
                      ],
                    ],
                  ),
                ),
                SizedBox(height: 24.h),

                // Tip Section
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
                      Row(
                        children: [
                          Icon(Icons.volunteer_activism,
                              color: AppColors.primary, size: 24.sp),
                          SizedBox(width: 8.w),
                          Text('إضافة إكرامية', style: AppTextStyles.heading3),
                        ],
                      ),
                      SizedBox(height: 16.h),
                      Row(
                        children: _tipOptions.map((tip) {
                          final isSelected = _tipAmount == tip;
                          return Expanded(
                            child: Padding(
                              padding: EdgeInsets.symmetric(horizontal: 4.w),
                              child: GestureDetector(
                                onTap: () => setState(() {
                                  _tipAmount = isSelected ? 0 : tip;
                                }),
                                child: Container(
                                  padding: EdgeInsets.symmetric(vertical: 12.h),
                                  decoration: BoxDecoration(
                                    color: isSelected
                                        ? AppColors.primary
                                        : AppColors.primary.withValues(alpha: 0.1),
                                    borderRadius: BorderRadius.circular(8.r),
                                  ),
                                  child: Center(
                                    child: Text(
                                      '${tip.toInt()} ج.م',
                                      style: AppTextStyles.body.copyWith(
                                        color: isSelected
                                            ? Colors.white
                                            : AppColors.primary,
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                ),
                SizedBox(height: 24.h),

                // Rating Section
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
                    children: [
                      // Driver info
                      if (driver != null) ...[
                        CircleAvatar(
                          radius: 35.r,
                          backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                          backgroundImage: driver.avatar != null
                              ? NetworkImage(driver.avatar!)
                              : null,
                          child: driver.avatar == null
                              ? Icon(Icons.person,
                                  size: 35.sp, color: AppColors.primary)
                              : null,
                        ),
                        SizedBox(height: 12.h),
                        Text(
                          driver.name,
                          style: AppTextStyles.heading3,
                        ),
                        SizedBox(height: 4.h),
                        Text(
                          driver.vehicleDescription,
                          style: AppTextStyles.caption,
                        ),
                        SizedBox(height: 16.h),
                      ],

                      Text(
                        'كيف كانت رحلتك مع ${driver?.name ?? "السائق"}؟',
                        style: AppTextStyles.subtitle,
                        textAlign: TextAlign.center,
                      ),
                      SizedBox(height: 16.h),

                      // Star Rating
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(5, (index) {
                          final starValue = index + 1;
                          return GestureDetector(
                            onTap: () => setState(() => _rating = starValue),
                            child: Padding(
                              padding: EdgeInsets.symmetric(horizontal: 8.w),
                              child: Icon(
                                starValue <= _rating
                                    ? Icons.star
                                    : Icons.star_border,
                                color: Colors.amber,
                                size: 40.sp,
                              ),
                            ),
                          );
                        }),
                      ),
                      SizedBox(height: 8.h),
                      Text(
                        _getRatingText(_rating),
                        style: AppTextStyles.body.copyWith(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      SizedBox(height: 16.h),

                      // Comment Field
                      TextField(
                        controller: _commentController,
                        maxLines: 3,
                        decoration: InputDecoration(
                          hintText: 'أضف تعليق (اختياري)...',
                          hintStyle: AppTextStyles.body.copyWith(
                            color: AppColors.textHint,
                          ),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12.r),
                            borderSide: BorderSide(color: Colors.grey.shade300),
                          ),
                          enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12.r),
                            borderSide: BorderSide(color: Colors.grey.shade300),
                          ),
                          focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12.r),
                            borderSide: const BorderSide(color: AppColors.primary),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                SizedBox(height: 32.h),

                // Submit Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isSubmitting ? null : _submitRating,
                    style: ElevatedButton.styleFrom(
                      padding: EdgeInsets.symmetric(vertical: 16.h),
                    ),
                    child: _isSubmitting
                        ? SizedBox(
                            width: 24.w,
                            height: 24.w,
                            child: const CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor:
                                  AlwaysStoppedAnimation<Color>(Colors.white),
                            ),
                          )
                        : const Text('إرسال التقييم'),
                  ),
                ),
                SizedBox(height: 12.h),

                // Skip Button
                TextButton(
                  onPressed: _skipRating,
                  child: Text(
                    'تخطي',
                    style: AppTextStyles.body.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _getRatingText(int rating) {
    switch (rating) {
      case 1:
        return 'سيء جداً';
      case 2:
        return 'سيء';
      case 3:
        return 'مقبول';
      case 4:
        return 'جيد';
      case 5:
        return 'ممتاز!';
      default:
        return 'اختر تقييمك';
    }
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
      padding: EdgeInsets.symmetric(vertical: 4.h),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: isTotal ? AppTextStyles.heading3 : AppTextStyles.body,
          ),
          Text(
            value,
            style: (isTotal ? AppTextStyles.heading3 : AppTextStyles.body)
                .copyWith(
              color: valueColor ?? (isTotal ? AppColors.primary : null),
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
            ),
          ),
        ],
      ),
    );
  }
}

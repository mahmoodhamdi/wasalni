import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';
import '../../providers/promo_provider.dart';
import '../../config/theme.dart';

// ignore_for_file: deprecated_member_use

class PromosScreen extends ConsumerStatefulWidget {
  const PromosScreen({super.key});

  @override
  ConsumerState<PromosScreen> createState() => _PromosScreenState();
}

class _PromosScreenState extends ConsumerState<PromosScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _promoCodeController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadData();
  }

  void _loadData() {
    Future.microtask(() {
      ref.read(promoProvider.notifier).loadAvailablePromos();
      ref.read(promoProvider.notifier).loadUsageHistory(refresh: true);
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _promoCodeController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(promoProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('أكواد الخصم'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'المتاحة'),
            Tab(text: 'السجل'),
          ],
        ),
      ),
      body: Column(
        children: [
          // Promo code input
          _buildPromoCodeInput(),

          // Tab views
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildAvailablePromos(state),
                _buildUsageHistory(state),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPromoCodeInput() {
    final state = ref.watch(promoProvider);

    return Container(
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'هل لديك كود خصم؟',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w600,
            ),
          ),
          SizedBox(height: 8.h),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _promoCodeController,
                  textCapitalization: TextCapitalization.characters,
                  decoration: InputDecoration(
                    hintText: 'أدخل كود الخصم',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8.r),
                    ),
                    contentPadding: EdgeInsets.symmetric(
                      horizontal: 16.w,
                      vertical: 12.h,
                    ),
                    prefixIcon: const Icon(Icons.local_offer_outlined),
                  ),
                ),
              ),
              SizedBox(width: 12.w),
              SizedBox(
                height: 48.h,
                child: ElevatedButton(
                  onPressed: state.isValidating ? null : _validatePromo,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8.r),
                    ),
                  ),
                  child: state.isValidating
                      ? SizedBox(
                          width: 20.w,
                          height: 20.h,
                          child: const CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('تطبيق'),
                ),
              ),
            ],
          ),

          // Validation result
          if (state.lastValidation != null) ...[
            SizedBox(height: 12.h),
            _buildValidationResult(state.lastValidation!),
          ],
        ],
      ),
    );
  }

  Widget _buildValidationResult(PromoValidationResult result) {
    return Container(
      padding: EdgeInsets.all(12.w),
      decoration: BoxDecoration(
        color: result.valid
            ? Colors.green.withOpacity(0.1)
            : Colors.red.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8.r),
        border: Border.all(
          color: result.valid ? Colors.green : Colors.red,
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Icon(
            result.valid ? Icons.check_circle : Icons.error,
            color: result.valid ? Colors.green : Colors.red,
            size: 20.sp,
          ),
          SizedBox(width: 8.w),
          Expanded(
            child: Text(
              result.valid
                  ? 'تم تطبيق الكود! وفر ${result.discountType == 'percentage' ? '${result.discount?.toInt()}%' : '${result.discount?.toStringAsFixed(0)} ج.م'}'
                  : result.message ?? 'كود غير صالح',
              style: TextStyle(
                color: result.valid ? Colors.green.shade700 : Colors.red.shade700,
                fontWeight: FontWeight.w500,
                fontSize: 14.sp,
              ),
            ),
          ),
          if (result.valid)
            TextButton(
              onPressed: () {
                ref.read(promoProvider.notifier).clearValidation();
              },
              child: const Text('مسح'),
            ),
        ],
      ),
    );
  }

  void _validatePromo() async {
    final code = _promoCodeController.text.trim();
    if (code.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('الرجاء إدخال كود الخصم')),
      );
      return;
    }

    // For validation demo, use placeholder fare/rideType
    // In real use, this would come from the current booking
    final valid = await ref.read(promoProvider.notifier).validatePromoCode(
      code: code,
      fare: 50.0, // Placeholder
      rideType: 'economy', // Placeholder
    );

    if (valid) {
      _promoCodeController.clear();
    }
  }

  Widget _buildAvailablePromos(PromoState state) {
    if (state.isLoading && state.availablePromos.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.availablePromos.isEmpty) {
      return _buildEmptyState(
        icon: Icons.local_offer_outlined,
        title: 'لا توجد عروض متاحة',
        subtitle: 'تابعنا للحصول على عروض جديدة!',
      );
    }

    return RefreshIndicator(
      onRefresh: () async {
        await ref.read(promoProvider.notifier).loadAvailablePromos();
      },
      child: ListView.builder(
        padding: EdgeInsets.all(16.w),
        itemCount: state.availablePromos.length,
        itemBuilder: (context, index) {
          return _buildPromoCard(state.availablePromos[index]);
        },
      ),
    );
  }

  Widget _buildPromoCard(PromoCode promo) {
    return Container(
      margin: EdgeInsets.only(bottom: 12.h),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(12.r),
        border: Border.all(
          color: promo.isExpiringSoon
              ? Colors.orange.withOpacity(0.5)
              : Colors.grey.withOpacity(0.2),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Header with discount
          Container(
            padding: EdgeInsets.all(16.w),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  AppColors.primary,
                  AppColors.primary.withOpacity(0.8),
                ],
              ),
              borderRadius: BorderRadius.vertical(
                top: Radius.circular(11.r),
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: EdgeInsets.all(8.w),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(8.r),
                  ),
                  child: Icon(
                    Icons.local_offer,
                    color: Colors.white,
                    size: 24.sp,
                  ),
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        promo.discountText,
                        style: TextStyle(
                          color: Colors.white,
                          fontSize: 22.sp,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      Text(
                        promo.type == 'percentage' ? 'خصم على رحلتك' : 'خصم',
                        style: TextStyle(
                          color: Colors.white.withOpacity(0.9),
                          fontSize: 14.sp,
                        ),
                      ),
                    ],
                  ),
                ),
                if (promo.isExpiringSoon)
                  Container(
                    padding: EdgeInsets.symmetric(
                      horizontal: 8.w,
                      vertical: 4.h,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.orange,
                      borderRadius: BorderRadius.circular(4.r),
                    ),
                    child: Text(
                      '${promo.daysUntilExpiry} يوم',
                      style: TextStyle(
                        color: Colors.white,
                        fontSize: 12.sp,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
              ],
            ),
          ),

          // Details
          Padding(
            padding: EdgeInsets.all(16.w),
            child: Column(
              children: [
                // Promo code
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: 12.w,
                          vertical: 10.h,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade100,
                          borderRadius: BorderRadius.circular(8.r),
                          border: Border.all(
                            color: Colors.grey.shade300,
                            style: BorderStyle.solid,
                          ),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Flexible(
                              child: Text(
                                promo.code,
                                style: TextStyle(
                                  fontSize: 16.sp,
                                  fontWeight: FontWeight.bold,
                                  letterSpacing: 2,
                                ),
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    SizedBox(width: 8.w),
                    IconButton(
                      onPressed: () {
                        Clipboard.setData(ClipboardData(text: promo.code));
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            content: Text('تم نسخ الكود!'),
                            duration: Duration(seconds: 2),
                          ),
                        );
                      },
                      icon: const Icon(Icons.copy),
                      tooltip: 'نسخ الكود',
                    ),
                  ],
                ),

                SizedBox(height: 12.h),

                // Conditions
                if (promo.minFare != null || promo.maxDiscount != null || promo.rideTypes != null)
                  Column(
                    children: [
                      const Divider(),
                      SizedBox(height: 8.h),
                      if (promo.minFare != null)
                        _buildConditionRow(
                          Icons.attach_money,
                          'الحد الأدنى: ${promo.minFare!.toStringAsFixed(0)} ج.م',
                        ),
                      if (promo.maxDiscount != null)
                        _buildConditionRow(
                          Icons.trending_down,
                          'أقصى خصم: ${promo.maxDiscount!.toStringAsFixed(0)} ج.م',
                        ),
                      if (promo.rideTypes != null && promo.rideTypes!.isNotEmpty)
                        _buildConditionRow(
                          Icons.directions_car,
                          'صالح لـ: ${_translateRideTypes(promo.rideTypes!)}',
                        ),
                    ],
                  ),

                SizedBox(height: 8.h),

                // Expiry
                Row(
                  children: [
                    Icon(
                      Icons.schedule,
                      size: 14.sp,
                      color: Colors.grey.shade600,
                    ),
                    SizedBox(width: 4.w),
                    Flexible(
                      child: Text(
                        'صالح حتى ${DateFormat('d MMM yyyy', 'ar').format(promo.validUntil)}',
                        style: TextStyle(
                          fontSize: 12.sp,
                          color: Colors.grey.shade600,
                        ),
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _translateRideTypes(List<String> types) {
    final Map<String, String> translations = {
      'economy': 'اقتصادي',
      'comfort': 'مريح',
      'family': 'عائلي',
      'tuktuk': 'توكتوك',
      'motorcycle': 'موتوسيكل',
    };
    return types.map((t) => translations[t] ?? t).join('، ');
  }

  Widget _buildConditionRow(IconData icon, String text) {
    return Padding(
      padding: EdgeInsets.only(bottom: 4.h),
      child: Row(
        children: [
          Icon(icon, size: 16.sp, color: Colors.grey.shade600),
          SizedBox(width: 8.w),
          Flexible(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 13.sp,
                color: Colors.grey.shade700,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUsageHistory(PromoState state) {
    if (state.isLoading && state.usageHistory.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.usageHistory.isEmpty) {
      return _buildEmptyState(
        icon: Icons.history,
        title: 'لا يوجد سجل استخدام',
        subtitle: 'سيظهر سجل استخدام الأكواد هنا',
      );
    }

    return NotificationListener<ScrollNotification>(
      onNotification: (notification) {
        if (notification is ScrollEndNotification &&
            notification.metrics.extentAfter < 100 &&
            state.hasMore &&
            !state.isLoading) {
          ref.read(promoProvider.notifier).loadMoreHistory();
        }
        return false;
      },
      child: RefreshIndicator(
        onRefresh: () async {
          await ref.read(promoProvider.notifier).loadUsageHistory(refresh: true);
        },
        child: ListView.builder(
          padding: EdgeInsets.all(16.w),
          itemCount: state.usageHistory.length + (state.hasMore ? 1 : 0),
          itemBuilder: (context, index) {
            if (index == state.usageHistory.length) {
              return Center(
                child: Padding(
                  padding: EdgeInsets.all(16.w),
                  child: const CircularProgressIndicator(),
                ),
              );
            }
            return _buildHistoryItem(state.usageHistory[index]);
          },
        ),
      ),
    );
  }

  Widget _buildHistoryItem(PromoUsage usage) {
    return Container(
      margin: EdgeInsets.only(bottom: 8.h),
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: Theme.of(context).cardColor,
        borderRadius: BorderRadius.circular(8.r),
        border: Border.all(color: Colors.grey.withOpacity(0.2)),
      ),
      child: Row(
        children: [
          Container(
            padding: EdgeInsets.all(10.w),
            decoration: BoxDecoration(
              color: AppColors.primary.withOpacity(0.1),
              borderRadius: BorderRadius.circular(8.r),
            ),
            child: Icon(
              Icons.local_offer,
              color: AppColors.primary,
              size: 20.sp,
            ),
          ),
          SizedBox(width: 12.w),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  usage.promoCode,
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 15.sp,
                  ),
                ),
                SizedBox(height: 4.h),
                Text(
                  DateFormat('d MMM yyyy - h:mm a', 'ar').format(usage.usedAt),
                  style: TextStyle(
                    fontSize: 12.sp,
                    color: Colors.grey.shade600,
                  ),
                ),
              ],
            ),
          ),
          Container(
            padding: EdgeInsets.symmetric(horizontal: 10.w, vertical: 6.h),
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.1),
              borderRadius: BorderRadius.circular(6.r),
            ),
            child: Text(
              '-${usage.discountAmount.toStringAsFixed(0)} ج.م',
              style: TextStyle(
                color: Colors.green,
                fontWeight: FontWeight.w600,
                fontSize: 14.sp,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState({
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Center(
      child: Padding(
        padding: EdgeInsets.all(32.w),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: EdgeInsets.all(20.w),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                size: 48.sp,
                color: Colors.grey.shade400,
              ),
            ),
            SizedBox(height: 16.h),
            Text(
              title,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            SizedBox(height: 8.h),
            Text(
              subtitle,
              style: TextStyle(
                color: Colors.grey.shade600,
                fontSize: 14.sp,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';

import '../../config/theme.dart';
import '../../providers/earnings_provider.dart';

class EarningsScreen extends ConsumerStatefulWidget {
  const EarningsScreen({super.key});

  @override
  ConsumerState<EarningsScreen> createState() => _EarningsScreenState();
}

class _EarningsScreenState extends ConsumerState<EarningsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final ScrollController _historyScrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);

    // Load earnings on init
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(earningsProvider.notifier).loadEarnings();
    });

    // Listen for scroll to load more history
    _historyScrollController.addListener(() {
      if (_historyScrollController.position.pixels >=
          _historyScrollController.position.maxScrollExtent - 200) {
        ref.read(earningsProvider.notifier).loadTripHistory();
      }
    });
  }

  @override
  void dispose() {
    _tabController.dispose();
    _historyScrollController.dispose();
    super.dispose();
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final dateToCheck = DateTime(date.year, date.month, date.day);

    if (dateToCheck == today) {
      return 'اليوم ${DateFormat.jm('ar').format(date)}';
    } else if (dateToCheck == today.subtract(const Duration(days: 1))) {
      return 'أمس ${DateFormat.jm('ar').format(date)}';
    } else {
      return DateFormat('dd/MM/yyyy HH:mm', 'ar').format(date);
    }
  }

  @override
  Widget build(BuildContext context) {
    final earningsState = ref.watch(earningsProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('الأرباح'),
        bottom: TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'الملخص'),
            Tab(text: 'السجل'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          // Summary Tab
          _SummaryTab(
            earningsState: earningsState,
            onPeriodChanged: (period) {
              ref.read(earningsProvider.notifier).setPeriod(period);
            },
            onRefresh: () async {
              await ref.read(earningsProvider.notifier).loadEarnings();
            },
          ),
          // History Tab
          _HistoryTab(
            earningsState: earningsState,
            scrollController: _historyScrollController,
            onRefresh: () async {
              await ref.read(earningsProvider.notifier).loadTripHistory(refresh: true);
            },
            formatDate: _formatDate,
          ),
        ],
      ),
    );
  }
}

class _SummaryTab extends StatelessWidget {
  final EarningsState earningsState;
  final void Function(EarningsPeriod) onPeriodChanged;
  final Future<void> Function() onRefresh;

  const _SummaryTab({
    required this.earningsState,
    required this.onPeriodChanged,
    required this.onRefresh,
  });

  @override
  Widget build(BuildContext context) {
    return RefreshIndicator(
      onRefresh: onRefresh,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: EdgeInsets.all(16.w),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Period Selector
            SingleChildScrollView(
              scrollDirection: Axis.horizontal,
              child: Row(
                children: [
                  _PeriodChip(
                    label: 'اليوم',
                    isSelected: earningsState.period == EarningsPeriod.today,
                    onTap: () => onPeriodChanged(EarningsPeriod.today),
                  ),
                  SizedBox(width: 8.w),
                  _PeriodChip(
                    label: 'أمس',
                    isSelected: earningsState.period == EarningsPeriod.yesterday,
                    onTap: () => onPeriodChanged(EarningsPeriod.yesterday),
                  ),
                  SizedBox(width: 8.w),
                  _PeriodChip(
                    label: 'هذا الأسبوع',
                    isSelected: earningsState.period == EarningsPeriod.thisWeek,
                    onTap: () => onPeriodChanged(EarningsPeriod.thisWeek),
                  ),
                  SizedBox(width: 8.w),
                  _PeriodChip(
                    label: 'هذا الشهر',
                    isSelected: earningsState.period == EarningsPeriod.thisMonth,
                    onTap: () => onPeriodChanged(EarningsPeriod.thisMonth),
                  ),
                ],
              ),
            ),
            SizedBox(height: 24.h),

            // Loading State
            if (earningsState.isLoading)
              const Center(child: CircularProgressIndicator())
            else if (earningsState.summary != null) ...[
              // Total Earnings Card
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
                      'إجمالي الأرباح',
                      style: AppTextStyles.body.copyWith(color: Colors.white70),
                    ),
                    SizedBox(height: 8.h),
                    Text(
                      '${earningsState.summary!.totalEarnings.toStringAsFixed(0)} ج.م',
                      style: AppTextStyles.heading1.copyWith(
                        color: Colors.white,
                        fontSize: 36.sp,
                      ),
                    ),
                    SizedBox(height: 8.h),
                    Text(
                      _getPeriodLabel(earningsState.period),
                      style: AppTextStyles.caption.copyWith(color: Colors.white70),
                    ),
                  ],
                ),
              ),
              SizedBox(height: 24.h),

              // Stats Cards Row
              Row(
                children: [
                  Expanded(
                    child: _StatCard(
                      icon: Icons.route,
                      label: 'الرحلات',
                      value: '${earningsState.summary!.totalTrips}',
                    ),
                  ),
                  SizedBox(width: 12.w),
                  Expanded(
                    child: _StatCard(
                      icon: Icons.timer,
                      label: 'ساعات العمل',
                      value: earningsState.summary!.totalHours.toStringAsFixed(1),
                    ),
                  ),
                ],
              ),
              SizedBox(height: 12.h),
              Row(
                children: [
                  Expanded(
                    child: _StatCard(
                      icon: Icons.trending_up,
                      label: 'متوسط/رحلة',
                      value: '${earningsState.summary!.averagePerTrip.toStringAsFixed(0)} ج.م',
                    ),
                  ),
                  SizedBox(width: 12.w),
                  Expanded(
                    child: _StatCard(
                      icon: Icons.speed,
                      label: 'متوسط/ساعة',
                      value: '${earningsState.summary!.averagePerHour.toStringAsFixed(0)} ج.م',
                    ),
                  ),
                ],
              ),
              SizedBox(height: 24.h),

              // Balance Card
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
                    Text('الرصيد', style: AppTextStyles.heading3),
                    SizedBox(height: 16.h),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('الرصيد المتاح', style: AppTextStyles.body),
                        Text(
                          '${earningsState.summary!.availableBalance.toStringAsFixed(0)} ج.م',
                          style: AppTextStyles.body.copyWith(
                            fontWeight: FontWeight.bold,
                            color: AppColors.success,
                          ),
                        ),
                      ],
                    ),
                    SizedBox(height: 8.h),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text('قيد المعالجة', style: AppTextStyles.body),
                        Text(
                          '${earningsState.summary!.pendingBalance.toStringAsFixed(0)} ج.م',
                          style: AppTextStyles.body.copyWith(
                            fontWeight: FontWeight.bold,
                            color: AppColors.warning,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              SizedBox(height: 24.h),

              // Daily Breakdown
              if (earningsState.summary!.dailyBreakdown.isNotEmpty) ...[
                Text('توزيع يومي', style: AppTextStyles.heading3),
                SizedBox(height: 12.h),
                ...earningsState.summary!.dailyBreakdown.map((day) => Container(
                      margin: EdgeInsets.only(bottom: 8.h),
                      padding: EdgeInsets.all(16.w),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12.r),
                      ),
                      child: Row(
                        children: [
                          Expanded(
                            child: Text(
                              DateFormat('EEEE', 'ar').format(day.date),
                              style: AppTextStyles.body,
                            ),
                          ),
                          Text(
                            '${day.trips} رحلات',
                            style: AppTextStyles.caption,
                          ),
                          SizedBox(width: 16.w),
                          Text(
                            '${day.earnings.toStringAsFixed(0)} ج.م',
                            style: AppTextStyles.body.copyWith(
                              fontWeight: FontWeight.bold,
                              color: AppColors.primary,
                            ),
                          ),
                        ],
                      ),
                    )),
              ],
            ] else
              Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Icon(
                      Icons.account_balance_wallet_outlined,
                      size: 80.sp,
                      color: AppColors.textSecondary,
                    ),
                    SizedBox(height: 16.h),
                    Text('لا توجد أرباح بعد', style: AppTextStyles.heading3),
                    SizedBox(height: 8.h),
                    Text('ابدأ العمل لجمع الأرباح!', style: AppTextStyles.subtitle),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  String _getPeriodLabel(EarningsPeriod period) {
    switch (period) {
      case EarningsPeriod.today:
        return 'اليوم';
      case EarningsPeriod.yesterday:
        return 'أمس';
      case EarningsPeriod.thisWeek:
        return 'هذا الأسبوع';
      case EarningsPeriod.thisMonth:
        return 'هذا الشهر';
      default:
        return '';
    }
  }
}

class _HistoryTab extends StatelessWidget {
  final EarningsState earningsState;
  final ScrollController scrollController;
  final Future<void> Function() onRefresh;
  final String Function(DateTime) formatDate;

  const _HistoryTab({
    required this.earningsState,
    required this.scrollController,
    required this.onRefresh,
    required this.formatDate,
  });

  @override
  Widget build(BuildContext context) {
    if (earningsState.tripHistory.isEmpty && !earningsState.isLoadingHistory) {
      return RefreshIndicator(
        onRefresh: onRefresh,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          child: SizedBox(
            height: MediaQuery.of(context).size.height * 0.6,
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.history,
                    size: 80.sp,
                    color: AppColors.textSecondary,
                  ),
                  SizedBox(height: 16.h),
                  Text('لا توجد رحلات سابقة', style: AppTextStyles.heading3),
                  SizedBox(height: 8.h),
                  Text('سجل رحلاتك سيظهر هنا', style: AppTextStyles.subtitle),
                ],
              ),
            ),
          ),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: onRefresh,
      child: ListView.builder(
        controller: scrollController,
        padding: EdgeInsets.all(16.w),
        itemCount: earningsState.tripHistory.length +
            (earningsState.isLoadingHistory ? 1 : 0),
        itemBuilder: (context, index) {
          if (index >= earningsState.tripHistory.length) {
            return Center(
              child: Padding(
                padding: EdgeInsets.all(16.h),
                child: const CircularProgressIndicator(),
              ),
            );
          }

          final trip = earningsState.tripHistory[index];
          return _TripHistoryCard(trip: trip, formatDate: formatDate);
        },
      ),
    );
  }
}

class _PeriodChip extends StatelessWidget {
  final String label;
  final bool isSelected;
  final VoidCallback onTap;

  const _PeriodChip({
    required this.label,
    required this.isSelected,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 8.h),
        decoration: BoxDecoration(
          color: isSelected ? AppColors.primary : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(20.r),
        ),
        child: Text(
          label,
          style: AppTextStyles.body.copyWith(
            color: isSelected ? Colors.white : AppColors.textSecondary,
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
          ),
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _StatCard({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16.w),
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
          Icon(icon, color: AppColors.primary, size: 28.sp),
          SizedBox(height: 8.h),
          Text(value, style: AppTextStyles.heading3),
          Text(label, style: AppTextStyles.caption),
        ],
      ),
    );
  }
}

class _TripHistoryCard extends StatelessWidget {
  final TripEarning trip;
  final String Function(DateTime) formatDate;

  const _TripHistoryCard({
    required this.trip,
    required this.formatDate,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.only(bottom: 12.h),
      padding: EdgeInsets.all(16.w),
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
          // Header
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'رحلة ${trip.tripNumber}',
                style: AppTextStyles.body.copyWith(fontWeight: FontWeight.w600),
              ),
              Container(
                padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
                decoration: BoxDecoration(
                  color: AppColors.success.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(8.r),
                ),
                child: Text(
                  '+${trip.driverEarnings.toStringAsFixed(0)} ج.م',
                  style: AppTextStyles.caption.copyWith(
                    color: AppColors.success,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ],
          ),
          SizedBox(height: 8.h),
          Text(
            formatDate(trip.date),
            style: AppTextStyles.caption,
          ),
          SizedBox(height: 12.h),

          // Locations
          Row(
            children: [
              Icon(Icons.trip_origin, color: AppColors.success, size: 14.sp),
              SizedBox(width: 8.w),
              Expanded(
                child: Text(
                  trip.pickupAddress,
                  style: AppTextStyles.caption,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          SizedBox(height: 4.h),
          Row(
            children: [
              Icon(Icons.location_on, color: AppColors.primary, size: 14.sp),
              SizedBox(width: 8.w),
              Expanded(
                child: Text(
                  trip.dropoffAddress,
                  style: AppTextStyles.caption,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          SizedBox(height: 12.h),

          // Footer
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Row(
                children: [
                  Icon(Icons.payments, size: 14.sp, color: AppColors.textSecondary),
                  SizedBox(width: 4.w),
                  Text(trip.paymentMethodAr, style: AppTextStyles.caption),
                ],
              ),
              Text(
                'الأجرة: ${trip.fare.toStringAsFixed(0)} ج.م',
                style: AppTextStyles.caption,
              ),
            ],
          ),
        ],
      ),
    );
  }
}

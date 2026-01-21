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

class ScheduledTripsScreen extends ConsumerStatefulWidget {
  const ScheduledTripsScreen({super.key});

  @override
  ConsumerState<ScheduledTripsScreen> createState() => _ScheduledTripsScreenState();
}

class _ScheduledTripsScreenState extends ConsumerState<ScheduledTripsScreen> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(scheduledProvider.notifier).loadUpcomingTrips(refresh: true);
      ref.read(scheduledProvider.notifier).loadStats();
    });

    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      final state = ref.read(scheduledProvider);
      if (!state.isLoading && state.hasMore) {
        ref.read(scheduledProvider.notifier).loadUpcomingTrips();
      }
    }
  }

  Future<void> _onRefresh() async {
    await ref.read(scheduledProvider.notifier).loadUpcomingTrips(refresh: true);
    await ref.read(scheduledProvider.notifier).loadStats();
  }

  String _formatDate(DateTime date) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final tomorrow = today.add(const Duration(days: 1));
    final tripDate = DateTime(date.year, date.month, date.day);

    if (tripDate == today) {
      return 'اليوم ${DateFormat('HH:mm').format(date)}';
    } else if (tripDate == tomorrow) {
      return 'غداً ${DateFormat('HH:mm').format(date)}';
    } else {
      return DateFormat('EEE, d MMM HH:mm', 'ar').format(date);
    }
  }

  void _showCancelDialog(ScheduledTrip trip) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('إلغاء الرحلة'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('هل تريد إلغاء الرحلة المجدولة؟'),
            SizedBox(height: 12.h),
            Text(
              'الرحلة: ${trip.tripNumber}',
              style: TextStyle(
                fontSize: 12.sp,
                color: Colors.grey[600],
              ),
            ),
            Text(
              'الموعد: ${_formatDate(trip.scheduledTime)}',
              style: TextStyle(
                fontSize: 12.sp,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('إلغاء'),
          ),
          TextButton(
            onPressed: () async {
              final messenger = ScaffoldMessenger.of(context);
              Navigator.pop(context);
              await ref.read(scheduledProvider.notifier).cancelTrip(trip.id);
              if (mounted) {
                messenger.showSnackBar(
                  const SnackBar(content: Text('تم إلغاء الرحلة')),
                );
              }
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('تأكيد الإلغاء'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(scheduledProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('الرحلات المجدولة'),
        centerTitle: true,
      ),
      body: RefreshIndicator(
        onRefresh: _onRefresh,
        child: state.upcomingTrips.isEmpty && state.isLoading
            ? const Center(child: CircularProgressIndicator())
            : state.upcomingTrips.isEmpty
                ? _buildEmptyState()
                : _buildTripsList(state),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.push('/schedule-trip'),
        icon: const Icon(Icons.add),
        label: const Text('جدولة رحلة'),
        backgroundColor: AppColors.primary,
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.schedule_outlined,
            size: 80.sp,
            color: Colors.grey[400],
          ),
          SizedBox(height: 16.h),
          Text(
            'لا توجد رحلات مجدولة',
            style: TextStyle(
              fontSize: 18.sp,
              fontWeight: FontWeight.bold,
              color: Colors.grey[600],
            ),
          ),
          SizedBox(height: 8.h),
          Text(
            'جدولة رحلة مسبقاً لضمان توفر سائق',
            style: TextStyle(
              fontSize: 14.sp,
              color: Colors.grey[500],
            ),
            textAlign: TextAlign.center,
          ),
          SizedBox(height: 24.h),
          ElevatedButton.icon(
            onPressed: () => context.push('/schedule-trip'),
            icon: const Icon(Icons.add),
            label: const Text('جدولة رحلة جديدة'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: EdgeInsets.symmetric(horizontal: 24.w, vertical: 12.h),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTripsList(ScheduledState state) {
    return ListView.builder(
      controller: _scrollController,
      padding: EdgeInsets.all(16.w),
      itemCount: state.upcomingTrips.length + (state.hasMore ? 1 : 0),
      itemBuilder: (context, index) {
        if (index == state.upcomingTrips.length) {
          return Center(
            child: Padding(
              padding: EdgeInsets.all(16.w),
              child: const CircularProgressIndicator(),
            ),
          );
        }

        final trip = state.upcomingTrips[index];
        return _ScheduledTripCard(
          trip: trip,
          onCancel: () => _showCancelDialog(trip),
          onModify: () => context.push('/modify-schedule/${trip.id}'),
          formatDate: _formatDate,
        );
      },
    );
  }
}

class _ScheduledTripCard extends StatelessWidget {
  final ScheduledTrip trip;
  final VoidCallback onCancel;
  final VoidCallback onModify;
  final String Function(DateTime) formatDate;

  const _ScheduledTripCard({
    required this.trip,
    required this.onCancel,
    required this.onModify,
    required this.formatDate,
  });

  Color _getStatusColor() {
    switch (trip.status) {
      case ScheduledTripStatus.upcoming:
        return Colors.blue;
      case ScheduledTripStatus.searching:
        return Colors.orange;
      case ScheduledTripStatus.assigned:
        return Colors.green;
      case ScheduledTripStatus.cancelled:
        return Colors.red;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.only(bottom: 16.h),
      child: Padding(
        padding: EdgeInsets.all(16.w),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Row(
              children: [
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
                  decoration: BoxDecoration(
                    color: _getStatusColor().withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(4.r),
                  ),
                  child: Text(
                    trip.status.displayName,
                    style: TextStyle(
                      fontSize: 12.sp,
                      color: _getStatusColor(),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                const Spacer(),
                Text(
                  '#${trip.tripNumber}',
                  style: TextStyle(
                    fontSize: 12.sp,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
            SizedBox(height: 12.h),

            // Time
            Row(
              children: [
                Icon(
                  Icons.schedule,
                  size: 20.sp,
                  color: AppColors.primary,
                ),
                SizedBox(width: 8.w),
                Text(
                  formatDate(trip.scheduledTime),
                  style: TextStyle(
                    fontSize: 16.sp,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            SizedBox(height: 12.h),

            // Locations
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Column(
                  children: [
                    Icon(Icons.radio_button_on, size: 16.sp, color: Colors.green),
                    Container(
                      width: 1,
                      height: 24.h,
                      color: Colors.grey[300],
                    ),
                    Icon(Icons.location_on, size: 16.sp, color: Colors.red),
                  ],
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        trip.pickup.address,
                        style: TextStyle(fontSize: 13.sp),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      SizedBox(height: 16.h),
                      Text(
                        trip.dropoff.address,
                        style: TextStyle(fontSize: 13.sp),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            SizedBox(height: 12.h),

            // Fare and Ride Type
            Row(
              children: [
                Chip(
                  label: Text(
                    _getRideTypeName(trip.rideType),
                    style: TextStyle(fontSize: 11.sp),
                  ),
                  padding: EdgeInsets.zero,
                  visualDensity: VisualDensity.compact,
                  backgroundColor: Colors.grey[100],
                ),
                const Spacer(),
                Text(
                  '${trip.estimatedFare.toStringAsFixed(0)} ج.م',
                  style: TextStyle(
                    fontSize: 16.sp,
                    fontWeight: FontWeight.bold,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),

            // Driver info if assigned
            if (trip.driverInfo != null) ...[
              Divider(height: 24.h),
              Row(
                children: [
                  CircleAvatar(
                    radius: 20.r,
                    backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                    child: Icon(Icons.person, color: AppColors.primary),
                  ),
                  SizedBox(width: 12.w),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          trip.driverInfo!.name,
                          style: TextStyle(
                            fontSize: 14.sp,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        Text(
                          '${trip.driverInfo!.vehicle} - ${trip.driverInfo!.plateNumber}',
                          style: TextStyle(
                            fontSize: 12.sp,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  ),
                  IconButton(
                    onPressed: () {
                      // TODO: Call driver
                    },
                    icon: Icon(Icons.phone, color: AppColors.primary),
                  ),
                ],
              ),
            ],

            // Actions
            if (trip.status == ScheduledTripStatus.upcoming ||
                trip.status == ScheduledTripStatus.searching) ...[
              Divider(height: 24.h),
              Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  if (trip.status == ScheduledTripStatus.upcoming &&
                      trip.driverInfo == null)
                    TextButton.icon(
                      onPressed: onModify,
                      icon: Icon(Icons.edit_outlined, size: 18.sp),
                      label: const Text('تعديل'),
                    ),
                  TextButton.icon(
                    onPressed: onCancel,
                    icon: Icon(Icons.close, size: 18.sp),
                    label: const Text('إلغاء'),
                    style: TextButton.styleFrom(foregroundColor: Colors.red),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _getRideTypeName(String rideType) {
    switch (rideType) {
      case 'economy':
        return 'اقتصادي';
      case 'comfort':
        return 'مريح';
      case 'family':
        return 'عائلي';
      case 'tuktuk':
        return 'توك توك';
      case 'motorcycle':
        return 'موتوسيكل';
      default:
        return rideType;
    }
  }
}

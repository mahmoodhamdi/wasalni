import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:intl/intl.dart';

import '../../services/api_service.dart';

class TripHistoryScreen extends ConsumerStatefulWidget {
  const TripHistoryScreen({super.key});

  @override
  ConsumerState<TripHistoryScreen> createState() => _TripHistoryScreenState();
}

class _TripHistoryScreenState extends ConsumerState<TripHistoryScreen> {
  final ScrollController _scrollController = ScrollController();
  final List<Map<String, dynamic>> _trips = [];
  bool _isLoading = false;
  bool _hasMore = true;
  int _page = 1;

  @override
  void initState() {
    super.initState();
    _loadTrips();
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
      _loadMore();
    }
  }

  Future<void> _loadTrips() async {
    if (_isLoading) return;
    setState(() => _isLoading = true);

    try {
      final response = await apiService.getTripHistory(page: _page);
      final data = response.data['data'];
      // API returns data directly as a list of trips
      final trips = (data as List?)?.cast<Map<String, dynamic>>() ?? [];

      setState(() {
        _trips.addAll(trips);
        _hasMore = trips.length >= 20;
        _isLoading = false;
      });
    } catch (e) {
      setState(() => _isLoading = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('فشل في تحميل الرحلات: $e')),
        );
      }
    }
  }

  Future<void> _loadMore() async {
    if (_isLoading || !_hasMore) return;
    _page++;
    await _loadTrips();
  }

  Future<void> _refresh() async {
    setState(() {
      _trips.clear();
      _page = 1;
      _hasMore = true;
    });
    await _loadTrips();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('سجل الرحلات'),
      ),
      body: RefreshIndicator(
        onRefresh: _refresh,
        child: _trips.isEmpty && !_isLoading
            ? _buildEmptyState()
            : ListView.builder(
                controller: _scrollController,
                padding: EdgeInsets.all(16.w),
                itemCount: _trips.length + (_hasMore ? 1 : 0),
                itemBuilder: (context, index) {
                  if (index == _trips.length) {
                    return Center(
                      child: Padding(
                        padding: EdgeInsets.all(16.h),
                        child: const CircularProgressIndicator(),
                      ),
                    );
                  }
                  return _buildTripCard(_trips[index]);
                },
              ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.history,
            size: 64.sp,
            color: Colors.grey[400],
          ),
          SizedBox(height: 16.h),
          Text(
            'لا توجد رحلات سابقة',
            style: TextStyle(
              fontSize: 18.sp,
              color: Colors.grey[600],
            ),
          ),
          SizedBox(height: 8.h),
          Text(
            'ستظهر رحلاتك هنا بعد إتمامها',
            style: TextStyle(
              fontSize: 14.sp,
              color: Colors.grey[500],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTripCard(Map<String, dynamic> trip) {
    final status = trip['status'] as String? ?? '';
    final createdAt = trip['createdAt'] as String?;
    final pickup = trip['pickup'] as Map<String, dynamic>?;
    final dropoff = trip['dropoff'] as Map<String, dynamic>?;
    final fare = trip['fare'] as Map<String, dynamic>?;

    final statusInfo = _getStatusInfo(status);
    final dateStr = createdAt != null
        ? DateFormat('dd MMM yyyy - hh:mm a', 'ar').format(DateTime.parse(createdAt))
        : '';

    return Card(
      margin: EdgeInsets.only(bottom: 12.h),
      child: Padding(
        padding: EdgeInsets.all(16.w),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Row
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  dateStr,
                  style: TextStyle(
                    fontSize: 12.sp,
                    color: Colors.grey[600],
                  ),
                ),
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 4.h),
                  decoration: BoxDecoration(
                    color: statusInfo.color.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                  child: Text(
                    statusInfo.label,
                    style: TextStyle(
                      fontSize: 12.sp,
                      color: statusInfo.color,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
            SizedBox(height: 12.h),

            // Locations
            Row(
              children: [
                Column(
                  children: [
                    Icon(Icons.circle, size: 10.sp, color: Colors.green),
                    Container(
                      width: 2,
                      height: 30.h,
                      color: Colors.grey[300],
                    ),
                    Icon(Icons.circle, size: 10.sp, color: Colors.red),
                  ],
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        pickup?['address'] as String? ?? 'نقطة الانطلاق',
                        style: TextStyle(fontSize: 14.sp),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      SizedBox(height: 20.h),
                      Text(
                        dropoff?['address'] as String? ?? 'الوجهة',
                        style: TextStyle(fontSize: 14.sp),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                  ),
                ),
              ],
            ),
            SizedBox(height: 12.h),

            // Footer
            const Divider(),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'المبلغ الإجمالي',
                  style: TextStyle(
                    fontSize: 14.sp,
                    color: Colors.grey[600],
                  ),
                ),
                Text(
                  '${fare?['total']?.toStringAsFixed(0) ?? '0'} ج.م',
                  style: TextStyle(
                    fontSize: 16.sp,
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).primaryColor,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  ({String label, Color color}) _getStatusInfo(String status) {
    switch (status) {
      case 'trip_completed':
      case 'completed':
        return (label: 'مكتملة', color: Colors.green);
      case 'cancelled':
        return (label: 'ملغية', color: Colors.red);
      case 'trip_started':
      case 'in_progress':
        return (label: 'قيد التنفيذ', color: Colors.blue);
      case 'searching':
        return (label: 'جاري البحث', color: Colors.orange);
      case 'driver_assigned':
        return (label: 'تم التعيين', color: Colors.teal);
      case 'driver_arriving':
        return (label: 'السائق في الطريق', color: Colors.cyan);
      case 'driver_arrived':
        return (label: 'السائق وصل', color: Colors.purple);
      default:
        return (label: status, color: Colors.grey);
    }
  }
}

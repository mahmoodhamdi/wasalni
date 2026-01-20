import 'dart:async';
import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';
import 'package:intl/intl.dart';

import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/trip_provider.dart';
import '../../providers/earnings_provider.dart';
import '../../services/location_service.dart';
import '../../services/api_service.dart';
import '../../services/storage_service.dart';
import '../../widgets/wasalni_map.dart';
import '../../widgets/trip_request_dialog.dart';

// Driver status provider
enum DriverStatus { offline, online, busy }

final driverStatusProvider = StateProvider<DriverStatus>((ref) => DriverStatus.offline);

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  int _currentIndex = 0;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _currentIndex,
        children: const [
          _HomeTab(),
          _TripsTab(),
          _EarningsTab(),
          _ProfileTab(),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: _currentIndex,
        onTap: (index) => setState(() => _currentIndex = index),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            activeIcon: Icon(Icons.home),
            label: 'الرئيسية',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.history_outlined),
            activeIcon: Icon(Icons.history),
            label: 'الرحلات',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.account_balance_wallet_outlined),
            activeIcon: Icon(Icons.account_balance_wallet),
            label: 'الأرباح',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.person_outline),
            activeIcon: Icon(Icons.person),
            label: 'حسابي',
          ),
        ],
      ),
    );
  }
}

// Home Tab - Map and Status
class _HomeTab extends ConsumerStatefulWidget {
  const _HomeTab();

  @override
  ConsumerState<_HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends ConsumerState<_HomeTab> {
  WasalniMapController? _mapController;
  Position? _currentPosition;
  bool _isLoadingLocation = true;
  LocationPermissionStatus _permissionStatus = LocationPermissionStatus.denied;
  StreamSubscription<Position>? _locationSubscription;
  Timer? _locationUpdateTimer;
  bool _isShowingTripDialog = false;

  @override
  void initState() {
    super.initState();
    _initLocation();
    // Load today's earnings stats
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(earningsProvider.notifier).loadEarnings(period: EarningsPeriod.today);
    });
  }

  void _showTripRequestDialog(TripRequest request) async {
    if (_isShowingTripDialog) return;
    _isShowingTripDialog = true;

    final accepted = await showTripRequestDialog(context, request);

    _isShowingTripDialog = false;

    if (accepted == true && mounted) {
      // Navigate to active trip screen
      context.go('/active-trip');
    }
  }

  @override
  void dispose() {
    _locationSubscription?.cancel();
    _locationUpdateTimer?.cancel();
    super.dispose();
  }

  Future<void> _initLocation() async {
    setState(() => _isLoadingLocation = true);

    final status = await locationService.requestPermission();
    setState(() => _permissionStatus = status);

    if (status == LocationPermissionStatus.granted) {
      final position = await locationService.getCurrentPosition();
      if (mounted && position != null) {
        setState(() {
          _currentPosition = position;
          _isLoadingLocation = false;
        });
        _animateToCurrentLocation();
      } else {
        setState(() => _isLoadingLocation = false);
      }
    } else {
      setState(() => _isLoadingLocation = false);
    }
  }

  void _animateToCurrentLocation() {
    if (_currentPosition != null && _mapController != null) {
      _mapController!.animateToLocation(
        LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
        zoom: 16,
      );
    }
  }

  void _onMapCreated(WasalniMapController controller) {
    _mapController = controller;
    if (_currentPosition != null) {
      _animateToCurrentLocation();
    }
  }

  Future<void> _toggleOnlineStatus() async {
    final currentStatus = ref.read(driverStatusProvider);
    final newStatus = currentStatus == DriverStatus.offline
        ? DriverStatus.online
        : DriverStatus.offline;

    try {
      // Call API to update status
      if (newStatus == DriverStatus.online) {
        await apiService.goOnline();
      } else {
        await apiService.goOffline();
      }

      ref.read(driverStatusProvider.notifier).state = newStatus;

      if (newStatus == DriverStatus.online) {
        _startLocationUpdates();
      } else {
        _stopLocationUpdates();
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('فشل في تحديث الحالة')),
        );
      }
    }
  }

  void _startLocationUpdates() {
    // Start location stream
    _locationSubscription = locationService.getPositionStream(
      distanceFilter: 10,
    ).listen((position) {
      setState(() => _currentPosition = position);
    });

    // Send location updates to server every 10 seconds
    _locationUpdateTimer = Timer.periodic(const Duration(seconds: 10), (_) {
      _sendLocationUpdate();
    });

    // Send initial location
    _sendLocationUpdate();
  }

  void _stopLocationUpdates() {
    _locationSubscription?.cancel();
    _locationSubscription = null;
    _locationUpdateTimer?.cancel();
    _locationUpdateTimer = null;
  }

  Future<void> _sendLocationUpdate() async {
    if (_currentPosition == null) return;

    try {
      await apiService.updateLocation(
        lat: _currentPosition!.latitude,
        lng: _currentPosition!.longitude,
        heading: _currentPosition!.heading,
        speed: _currentPosition!.speed,
      );
    } catch (e) {
      // Silently fail - location updates are best effort
    }
  }

  @override
  Widget build(BuildContext context) {
    final status = ref.watch(driverStatusProvider);
    final tripState = ref.watch(driverTripProvider);

    // Listen for incoming trip requests
    ref.listen<DriverTripState>(driverTripProvider, (previous, next) {
      // Show trip request dialog when a new request arrives
      if (next.currentRequest != null &&
          next.status == DriverTripStatus.requested &&
          previous?.currentRequest?.tripId != next.currentRequest?.tripId) {
        _showTripRequestDialog(next.currentRequest!);
      }

      // Navigate to active trip if already accepted
      if (next.hasActiveTrip &&
          !next.hasPendingRequest &&
          previous?.status != next.status) {
        context.go('/active-trip');
      }
    });

    // If there's an active trip, redirect to it
    if (tripState.hasActiveTrip && !tripState.hasPendingRequest) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        context.go('/active-trip');
      });
    }

    // Show permission request if needed
    if (_permissionStatus == LocationPermissionStatus.denied ||
        _permissionStatus == LocationPermissionStatus.permanentlyDenied) {
      return Stack(
        children: [
          WasalniMap(showMyLocation: false, onMapCreated: _onMapCreated),
          Positioned.fill(
            child: Container(
              color: Colors.white.withValues(alpha: 0.9),
              child: LocationPermissionRequest(
                isPermanentlyDenied:
                    _permissionStatus == LocationPermissionStatus.permanentlyDenied,
                onRequestPermission: _initLocation,
                onOpenSettings: () => locationService.openAppSettings(),
              ),
            ),
          ),
        ],
      );
    }

    // Loading state
    if (_isLoadingLocation) {
      return const MapLoadingPlaceholder();
    }

    return Stack(
      children: [
        // Map
        WasalniMap(
          initialPosition: _currentPosition != null
              ? LatLng(_currentPosition!.latitude, _currentPosition!.longitude)
              : null,
          showMyLocation: true,
          onMapCreated: _onMapCreated,
        ),

        // Top Bar
        SafeArea(
          child: Padding(
            padding: EdgeInsets.all(16.w),
            child: Row(
              children: [
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12.r),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.1),
                        blurRadius: 10,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.menu),
                    onPressed: () {},
                  ),
                ),
                const Spacer(),
                // Status Badge
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 8.h),
                  decoration: BoxDecoration(
                    color: _getStatusColor(status),
                    borderRadius: BorderRadius.circular(20.r),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 8.w,
                        height: 8.w,
                        decoration: const BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                        ),
                      ),
                      SizedBox(width: 8.w),
                      Text(
                        _getStatusText(status),
                        style: AppTextStyles.caption.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ],
                  ),
                ),
                const Spacer(),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12.r),
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withValues(alpha: 0.1),
                        blurRadius: 10,
                        offset: const Offset(0, 2),
                      ),
                    ],
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.notifications_outlined),
                    onPressed: () {},
                  ),
                ),
              ],
            ),
          ),
        ),

        // Bottom Status Card
        Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          child: Container(
            padding: EdgeInsets.all(20.w),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(top: Radius.circular(24.r)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: 0.1),
                  blurRadius: 20,
                  offset: const Offset(0, -5),
                ),
              ],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                // Today's Stats - Connected to earnings provider
                Consumer(
                  builder: (context, ref, child) {
                    final earnings = ref.watch(earningsProvider);
                    final summary = earnings.summary;
                    final todayTrips = summary?.totalTrips ?? 0;
                    final todayHours = summary?.totalHours ?? 0;
                    final todayEarnings = summary?.totalEarnings ?? 0;
                    final hoursDisplay = '${todayHours.toInt()}:${((todayHours % 1) * 60).toInt().toString().padLeft(2, '0')}';

                    return Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _StatItem(icon: Icons.route, label: 'الرحلات', value: '$todayTrips'),
                        _StatItem(icon: Icons.timer, label: 'ساعات العمل', value: hoursDisplay),
                        _StatItem(icon: Icons.attach_money, label: 'الأرباح', value: '${todayEarnings.toStringAsFixed(0)} ج.م'),
                      ],
                    );
                  },
                ),
                SizedBox(height: 20.h),

                // Go Online/Offline Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _toggleOnlineStatus,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: status == DriverStatus.offline
                          ? AppColors.online
                          : AppColors.offline,
                      padding: EdgeInsets.symmetric(vertical: 16.h),
                    ),
                    child: Text(
                      status == DriverStatus.offline ? 'ابدأ العمل' : 'أوقف العمل',
                      style: AppTextStyles.button.copyWith(color: Colors.white),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Color _getStatusColor(DriverStatus status) {
    switch (status) {
      case DriverStatus.online:
        return AppColors.online;
      case DriverStatus.busy:
        return AppColors.busy;
      case DriverStatus.offline:
        return AppColors.offline;
    }
  }

  String _getStatusText(DriverStatus status) {
    switch (status) {
      case DriverStatus.online:
        return 'متاح';
      case DriverStatus.busy:
        return 'مشغول';
      case DriverStatus.offline:
        return 'غير متاح';
    }
  }
}

class _StatItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _StatItem({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Icon(icon, color: AppColors.primary, size: 24.sp),
        SizedBox(height: 4.h),
        Text(value, style: AppTextStyles.body.copyWith(fontWeight: FontWeight.bold)),
        Text(label, style: AppTextStyles.caption),
      ],
    );
  }
}

// Trips History Tab
class _TripsTab extends ConsumerStatefulWidget {
  const _TripsTab();

  @override
  ConsumerState<_TripsTab> createState() => _TripsTabState();
}

class _TripsTabState extends ConsumerState<_TripsTab> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    // Load trips on first build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(earningsProvider.notifier).loadTripHistory(refresh: true);
    });

    // Setup pagination scroll listener
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      ref.read(earningsProvider.notifier).loadTripHistory();
    }
  }

  Future<void> _onRefresh() async {
    await ref.read(earningsProvider.notifier).loadTripHistory(refresh: true);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(earningsProvider);
    final trips = state.tripHistory;
    final isLoading = state.isLoadingHistory;
    final error = state.errorMessage;

    return Scaffold(
      appBar: AppBar(title: const Text('رحلاتي')),
      body: Builder(
        builder: (context) {
          // Loading state
          if (isLoading && trips.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          // Error state
          if (error != null && trips.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 64.sp, color: AppColors.error),
                  SizedBox(height: 16.h),
                  Text(error, style: AppTextStyles.body),
                  SizedBox(height: 16.h),
                  ElevatedButton(
                    onPressed: () => ref.read(earningsProvider.notifier).loadTripHistory(refresh: true),
                    child: const Text('إعادة المحاولة'),
                  ),
                ],
              ),
            );
          }

          // Empty state
          if (trips.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.directions_car_outlined, size: 80.sp, color: AppColors.textSecondary),
                  SizedBox(height: 16.h),
                  Text('لا توجد رحلات سابقة', style: AppTextStyles.heading3),
                  SizedBox(height: 8.h),
                  Text('رحلاتك ستظهر هنا', style: AppTextStyles.subtitle),
                ],
              ),
            );
          }

          // Trips list
          return RefreshIndicator(
            onRefresh: _onRefresh,
            child: ListView.builder(
              controller: _scrollController,
              padding: EdgeInsets.all(16.w),
              itemCount: trips.length + (isLoading ? 1 : 0),
              itemBuilder: (context, index) {
                if (index == trips.length) {
                  return Padding(
                    padding: EdgeInsets.symmetric(vertical: 16.h),
                    child: const Center(child: CircularProgressIndicator()),
                  );
                }

                final trip = trips[index];
                return _TripHistoryCard(trip: trip);
              },
            ),
          );
        },
      ),
    );
  }
}

// Trip History Card Widget
class _TripHistoryCard extends StatelessWidget {
  final TripEarning trip;

  const _TripHistoryCard({required this.trip});

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('dd/MM/yyyy', 'ar');
    final timeFormat = DateFormat('hh:mm a', 'ar');

    return Container(
      margin: EdgeInsets.only(bottom: 12.h),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12.r),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(12.r),
        child: InkWell(
          borderRadius: BorderRadius.circular(12.r),
          onTap: () {
            // TODO: Navigate to trip details
          },
          child: Padding(
            padding: EdgeInsets.all(16.w),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header - Trip number and payment method
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.receipt_outlined, size: 20.sp, color: AppColors.primary),
                        SizedBox(width: 8.w),
                        Text(
                          'رحلة #${trip.tripNumber}',
                          style: AppTextStyles.body.copyWith(fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    Container(
                      padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 4.h),
                      decoration: BoxDecoration(
                        color: AppColors.success.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12.r),
                      ),
                      child: Text(
                        trip.paymentMethodAr,
                        style: AppTextStyles.caption.copyWith(
                          color: AppColors.success,
                          fontWeight: FontWeight.w600,
                        ),
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
                        Container(
                          width: 10.w,
                          height: 10.w,
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                          ),
                        ),
                        Container(
                          width: 2.w,
                          height: 30.h,
                          color: AppColors.textSecondary.withValues(alpha: 0.3),
                        ),
                        Container(
                          width: 10.w,
                          height: 10.w,
                          decoration: BoxDecoration(
                            color: AppColors.error,
                            shape: BoxShape.circle,
                          ),
                        ),
                      ],
                    ),
                    SizedBox(width: 12.w),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            trip.pickupAddress.isNotEmpty ? trip.pickupAddress : 'موقع البداية',
                            style: AppTextStyles.body,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          SizedBox(height: 28.h),
                          Text(
                            trip.dropoffAddress.isNotEmpty ? trip.dropoffAddress : 'موقع الوصول',
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

                // Trip info - Date and time
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.calendar_today, size: 14.sp, color: AppColors.textSecondary),
                        SizedBox(width: 4.w),
                        Text(
                          dateFormat.format(trip.date),
                          style: AppTextStyles.caption,
                        ),
                        SizedBox(width: 12.w),
                        Icon(Icons.access_time, size: 14.sp, color: AppColors.textSecondary),
                        SizedBox(width: 4.w),
                        Text(
                          timeFormat.format(trip.date),
                          style: AppTextStyles.caption,
                        ),
                      ],
                    ),
                  ],
                ),
                SizedBox(height: 8.h),

                // Fare breakdown
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'الأجرة الكلية: ${trip.fare.toStringAsFixed(2)} ج.م',
                          style: AppTextStyles.caption,
                        ),
                        SizedBox(height: 2.h),
                        Text(
                          'رسوم المنصة: ${trip.platformFee.toStringAsFixed(2)} ج.م',
                          style: AppTextStyles.caption.copyWith(color: AppColors.textSecondary),
                        ),
                      ],
                    ),
                    Text(
                      '${trip.driverEarnings.toStringAsFixed(2)} ج.م',
                      style: AppTextStyles.body.copyWith(
                        fontWeight: FontWeight.bold,
                        color: AppColors.success,
                        fontSize: 18.sp,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

// Earnings Tab
class _EarningsTab extends StatelessWidget {
  const _EarningsTab();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('الأرباح')),
      body: Padding(
        padding: EdgeInsets.all(16.w),
        child: Column(
          children: [
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
                borderRadius: BorderRadius.circular(16.r),
              ),
              child: Column(
                children: [
                  Text(
                    'إجمالي الأرباح',
                    style: AppTextStyles.body.copyWith(color: Colors.white70),
                  ),
                  SizedBox(height: 8.h),
                  Text(
                    '0.00 ج.م',
                    style: AppTextStyles.heading1.copyWith(color: Colors.white),
                  ),
                  SizedBox(height: 8.h),
                  Text(
                    'هذا الأسبوع',
                    style: AppTextStyles.caption.copyWith(color: Colors.white70),
                  ),
                ],
              ),
            ),
            SizedBox(height: 24.h),

            // Weekly Stats
            Row(
              children: [
                Expanded(
                  child: _EarningCard(
                    title: 'اليوم',
                    amount: '0.00 ج.م',
                    trips: '0 رحلات',
                  ),
                ),
                SizedBox(width: 12.w),
                Expanded(
                  child: _EarningCard(
                    title: 'الأمس',
                    amount: '0.00 ج.م',
                    trips: '0 رحلات',
                  ),
                ),
              ],
            ),

            SizedBox(height: 24.h),
            Text('سجل الأرباح', style: AppTextStyles.heading3),
            SizedBox(height: 16.h),

            Expanded(
              child: Center(
                child: Text('لا توجد أرباح بعد', style: AppTextStyles.subtitle),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EarningCard extends StatelessWidget {
  final String title;
  final String amount;
  final String trips;

  const _EarningCard({
    required this.title,
    required this.amount,
    required this.trips,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12.r),
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
          Text(title, style: AppTextStyles.caption),
          SizedBox(height: 4.h),
          Text(amount, style: AppTextStyles.body.copyWith(fontWeight: FontWeight.bold)),
          Text(trips, style: AppTextStyles.caption),
        ],
      ),
    );
  }
}

// Profile Tab
class _ProfileTab extends ConsumerWidget {
  const _ProfileTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userName = storageService.getUserName() ?? 'سائق';
    final userPhone = storageService.getUserPhone() ?? '+201000000000';

    return Scaffold(
      appBar: AppBar(
        title: const Text('حسابي'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () => context.push('/settings'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(16.w),
        child: Column(
          children: [
            // Profile Header
            Container(
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
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 35.r,
                    backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                    child: Text(
                      userName.isNotEmpty ? userName[0].toUpperCase() : 'س',
                      style: TextStyle(
                        fontSize: 24.sp,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                  SizedBox(width: 16.w),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(userName, style: AppTextStyles.heading3),
                        SizedBox(height: 4.h),
                        Text(
                          userPhone,
                          style: AppTextStyles.caption,
                          textDirection: ui.TextDirection.ltr,
                        ),
                        SizedBox(height: 4.h),
                        Row(
                          children: [
                            Icon(Icons.star, size: 16.sp, color: AppColors.warning),
                            SizedBox(width: 4.w),
                            Text('5.0', style: AppTextStyles.caption),
                            SizedBox(width: 8.w),
                            Container(
                              padding: EdgeInsets.symmetric(horizontal: 8.w, vertical: 2.h),
                              decoration: BoxDecoration(
                                color: AppColors.success.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(4.r),
                              ),
                              child: Text(
                                'موثق',
                                style: AppTextStyles.caption.copyWith(
                                  color: AppColors.success,
                                  fontSize: 10.sp,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  IconButton(icon: const Icon(Icons.edit_outlined), onPressed: () {}),
                ],
              ),
            ),
            SizedBox(height: 24.h),

            // Menu Items
            _ProfileMenuItem(
              icon: Icons.directions_car_outlined,
              title: 'بيانات المركبة',
              onTap: () {},
            ),
            _ProfileMenuItem(
              icon: Icons.description_outlined,
              title: 'المستندات',
              onTap: () => context.push('/documents'),
            ),
            _ProfileMenuItem(
              icon: Icons.account_balance_outlined,
              title: 'الحساب البنكي',
              onTap: () => _showBankAccountSheet(context),
            ),
            _ProfileMenuItem(
              icon: Icons.help_outline,
              title: 'المساعدة والدعم',
              onTap: () => _showHelpSheet(context),
            ),
            _ProfileMenuItem(
              icon: Icons.info_outline,
              title: 'عن التطبيق',
              onTap: () => _showAboutDialog(context),
            ),
            SizedBox(height: 24.h),

            // Logout Button
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => _showLogoutDialog(context, ref),
                icon: const Icon(Icons.logout, color: AppColors.error),
                label: Text('تسجيل الخروج', style: AppTextStyles.button.copyWith(color: AppColors.error)),
                style: OutlinedButton.styleFrom(side: const BorderSide(color: AppColors.error)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _showLogoutDialog(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('تسجيل الخروج'),
        content: const Text('هل أنت متأكد من رغبتك في تسجيل الخروج؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext),
            child: const Text('إلغاء'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(dialogContext);
              await ref.read(authProvider.notifier).logout();
              if (context.mounted) {
                context.go('/welcome');
              }
            },
            child: const Text('تسجيل الخروج', style: TextStyle(color: AppColors.error)),
          ),
        ],
      ),
    );
  }

  void _showAboutDialog(BuildContext context) {
    showAboutDialog(
      context: context,
      applicationName: 'وصّلني للسائقين',
      applicationVersion: '1.0.0',
      applicationIcon: Icon(
        Icons.local_taxi,
        size: 48.sp,
        color: AppColors.primary,
      ),
      children: [
        const Text(
          'تطبيق وصّلني للسائقين - خدمات النقل المحلية في منطقة الباجور.',
          textAlign: TextAlign.center,
        ),
      ],
    );
  }

  void _showHelpSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24.r)),
      ),
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        expand: false,
        builder: (context, scrollController) => Container(
          padding: EdgeInsets.all(20.w),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'المساعدة والدعم',
                    style: AppTextStyles.heading2,
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              SizedBox(height: 16.h),
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  child: Column(
                    children: [
                      _HelpItem(
                        icon: Icons.phone,
                        title: 'اتصل بنا',
                        subtitle: '01000000000',
                        onTap: () {},
                      ),
                      _HelpItem(
                        icon: Icons.email,
                        title: 'البريد الإلكتروني',
                        subtitle: 'drivers@wasalni.app',
                        onTap: () {},
                      ),
                      _HelpItem(
                        icon: Icons.chat,
                        title: 'الدردشة المباشرة',
                        subtitle: 'تحدث مع فريق الدعم',
                        onTap: () {},
                      ),
                      SizedBox(height: 24.h),
                      Text('الأسئلة الشائعة', style: AppTextStyles.heading3),
                      SizedBox(height: 16.h),
                      _FaqItem(
                        question: 'كيف أستلم أرباحي؟',
                        answer: 'يتم تحويل الأرباح أسبوعياً إلى حسابك البنكي المسجل.',
                      ),
                      _FaqItem(
                        question: 'ماذا أفعل إذا واجهت مشكلة مع راكب؟',
                        answer: 'يمكنك الإبلاغ عن أي مشكلة من خلال تفاصيل الرحلة أو الاتصال بالدعم.',
                      ),
                      _FaqItem(
                        question: 'كيف أحدث بيانات مركبتي؟',
                        answer: 'انتقل إلى بيانات المركبة من صفحة حسابي وقم بتحديث البيانات.',
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showBankAccountSheet(BuildContext context) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24.r)),
      ),
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: Container(
          padding: EdgeInsets.all(20.w),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'الحساب البنكي',
                    style: AppTextStyles.heading2,
                  ),
                  IconButton(
                    icon: const Icon(Icons.close),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              SizedBox(height: 16.h),
              Container(
                padding: EdgeInsets.all(16.w),
                decoration: BoxDecoration(
                  color: AppColors.warning.withValues(alpha: 0.1),
                  borderRadius: BorderRadius.circular(12.r),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline, color: AppColors.warning),
                    SizedBox(width: 12.w),
                    Expanded(
                      child: Text(
                        'لم يتم إضافة حساب بنكي بعد. أضف حسابك لاستلام أرباحك.',
                        style: AppTextStyles.caption,
                      ),
                    ),
                  ],
                ),
              ),
              SizedBox(height: 24.h),
              TextField(
                decoration: InputDecoration(
                  labelText: 'اسم البنك',
                  hintText: 'مثال: البنك الأهلي المصري',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                ),
              ),
              SizedBox(height: 16.h),
              TextField(
                decoration: InputDecoration(
                  labelText: 'اسم صاحب الحساب',
                  hintText: 'الاسم كما هو في البنك',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                ),
              ),
              SizedBox(height: 16.h),
              TextField(
                keyboardType: TextInputType.number,
                decoration: InputDecoration(
                  labelText: 'رقم الحساب / IBAN',
                  hintText: 'أدخل رقم الحساب',
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12.r),
                  ),
                ),
              ),
              SizedBox(height: 24.h),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('سيتم إضافة هذه الميزة قريباً')),
                    );
                  },
                  style: ElevatedButton.styleFrom(
                    padding: EdgeInsets.symmetric(vertical: 14.h),
                  ),
                  child: const Text('حفظ'),
                ),
              ),
              SizedBox(height: 16.h),
            ],
          ),
        ),
      ),
    );
  }
}

class _HelpItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final VoidCallback onTap;

  const _HelpItem({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Container(
        padding: EdgeInsets.all(8.w),
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(8.r),
        ),
        child: Icon(icon, color: AppColors.primary),
      ),
      title: Text(title, style: AppTextStyles.body),
      subtitle: Text(subtitle, style: AppTextStyles.caption),
      trailing: const Icon(Icons.chevron_left),
      onTap: onTap,
    );
  }
}

class _FaqItem extends StatefulWidget {
  final String question;
  final String answer;

  const _FaqItem({
    required this.question,
    required this.answer,
  });

  @override
  State<_FaqItem> createState() => _FaqItemState();
}

class _FaqItemState extends State<_FaqItem> {
  bool _isExpanded = false;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: EdgeInsets.only(bottom: 8.h),
      child: ExpansionTile(
        title: Text(widget.question, style: AppTextStyles.body),
        trailing: Icon(_isExpanded ? Icons.expand_less : Icons.expand_more),
        onExpansionChanged: (expanded) => setState(() => _isExpanded = expanded),
        children: [
          Padding(
            padding: EdgeInsets.fromLTRB(16.w, 0, 16.w, 16.h),
            child: Text(widget.answer, style: AppTextStyles.caption),
          ),
        ],
      ),
    );
  }
}

class _ProfileMenuItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;

  const _ProfileMenuItem({
    required this.icon,
    required this.title,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.only(bottom: 8.h),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12.r),
      ),
      child: ListTile(
        leading: Icon(icon, color: AppColors.primary),
        title: Text(title, style: AppTextStyles.body),
        trailing: const Icon(Icons.chevron_left, color: AppColors.textSecondary),
        onTap: onTap,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12.r)),
      ),
    );
  }
}

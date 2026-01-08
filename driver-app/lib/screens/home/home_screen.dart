import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import 'package:geolocator/geolocator.dart';

import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/trip_provider.dart';
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

  // Stats (will be fetched from API in phase 4)
  final int _todayTrips = 0;
  final String _todayHours = '0:00';
  final String _todayEarnings = '0';

  @override
  void initState() {
    super.initState();
    _initLocation();
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
                // Today's Stats
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _StatItem(icon: Icons.route, label: 'الرحلات', value: '$_todayTrips'),
                    _StatItem(icon: Icons.timer, label: 'ساعات العمل', value: _todayHours),
                    _StatItem(icon: Icons.attach_money, label: 'الأرباح', value: '$_todayEarnings ج.م'),
                  ],
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
class _TripsTab extends StatelessWidget {
  const _TripsTab();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('رحلاتي')),
      body: Center(
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
                          textDirection: TextDirection.ltr,
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
              onTap: () {},
            ),
            _ProfileMenuItem(
              icon: Icons.help_outline,
              title: 'المساعدة والدعم',
              onTap: () {},
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
      builder: (context) => AlertDialog(
        title: const Text('تسجيل الخروج'),
        content: const Text('هل أنت متأكد من رغبتك في تسجيل الخروج؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('إلغاء'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(context);
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

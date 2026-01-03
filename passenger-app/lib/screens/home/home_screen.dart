import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';

import '../../config/theme.dart';
import '../../providers/auth_provider.dart';
import '../../providers/trip_provider.dart';
import '../../services/api_service.dart';
import '../../services/location_service.dart';
import '../../services/storage_service.dart';
import '../../widgets/wasalni_map.dart';

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
            label: 'رحلاتي',
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

// Home Tab - Map and Booking
class _HomeTab extends ConsumerStatefulWidget {
  const _HomeTab();

  @override
  ConsumerState<_HomeTab> createState() => _HomeTabState();
}

class _HomeTabState extends ConsumerState<_HomeTab> {
  GoogleMapController? _mapController;
  LocationPermissionStatus _permissionStatus = LocationPermissionStatus.denied;
  Position? _currentPosition;
  bool _isLoadingLocation = true;
  final Set<Marker> _markers = {};

  @override
  void initState() {
    super.initState();
    _initLocation();
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
      _mapController!.animateCamera(
        CameraUpdate.newLatLngZoom(
          LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
          16,
        ),
      );
    }
  }

  void _onMapCreated(GoogleMapController controller) {
    _mapController = controller;
    if (_currentPosition != null) {
      _animateToCurrentLocation();
    }
  }

  Future<void> _navigateToLocationPicker() async {
    // First, set current location as pickup
    if (_currentPosition != null) {
      final pickupAddress = await _getAddressForPosition(_currentPosition!);
      ref.read(tripProvider.notifier).setPickup(
        LocationPoint(
          latitude: _currentPosition!.latitude,
          longitude: _currentPosition!.longitude,
          address: pickupAddress,
        ),
      );
    }

    // Then open location picker for dropoff
    if (!mounted) return;
    final result = await context.push<Map<String, dynamic>>('/location-picker');

    if (result != null && mounted) {
      final location = result['location'] as LatLng?;
      final address = result['address'] as String?;

      if (location != null) {
        ref.read(tripProvider.notifier).setDropoff(
          LocationPoint(
            latitude: location.latitude,
            longitude: location.longitude,
            address: address,
          ),
        );

        // Navigate to booking screen
        context.push('/booking');
      }
    }
  }

  Future<String?> _getAddressForPosition(Position position) async {
    try {
      final response = await apiService.getAddressFromCoordinates(
        position.latitude,
        position.longitude,
      );
      if (response.data['success'] == true) {
        final addressData = response.data['data']['address'];
        return addressData['shortAddress'] ?? addressData['address'];
      }
    } catch (e) {
      // Ignore errors
    }
    return 'موقعك الحالي';
  }

  @override
  Widget build(BuildContext context) {
    // Show permission request if needed
    if (_permissionStatus == LocationPermissionStatus.denied ||
        _permissionStatus == LocationPermissionStatus.permanentlyDenied) {
      return Stack(
        children: [
          // Show map with default position
          WasalniMap(
            showMyLocation: false,
            onMapCreated: _onMapCreated,
          ),
          // Permission request overlay
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
          markers: _markers,
          showMyLocation: true,
          onMapCreated: _onMapCreated,
          padding: EdgeInsets.only(bottom: 200.h),
        ),

        // Top Bar
        SafeArea(
          child: Padding(
            padding: EdgeInsets.all(16.w),
            child: Row(
              children: [
                // Menu Button
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
                    onPressed: () {
                      // TODO: Open drawer
                    },
                  ),
                ),
                const Spacer(),
                // Notifications
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
                    onPressed: () {
                      // TODO: Open notifications
                    },
                  ),
                ),
              ],
            ),
          ),
        ),

        // Bottom Booking Card
        Positioned(
          left: 0,
          right: 0,
          bottom: 0,
          child: Container(
            padding: EdgeInsets.all(20.w),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.vertical(
                top: Radius.circular(24.r),
              ),
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
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'إلى أين تريد الذهاب؟',
                  style: AppTextStyles.heading3,
                ),
                SizedBox(height: 16.h),
                // Search Field
                GestureDetector(
                  onTap: _navigateToLocationPicker,
                  child: Container(
                    padding: EdgeInsets.symmetric(
                      horizontal: 16.w,
                      vertical: 14.h,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade100,
                      borderRadius: BorderRadius.circular(12.r),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.search,
                          color: AppColors.textSecondary,
                        ),
                        SizedBox(width: 12.w),
                        Text(
                          'ابحث عن وجهتك...',
                          style: AppTextStyles.body.copyWith(
                            color: AppColors.textHint,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                SizedBox(height: 20.h),
                // Quick Actions
                Row(
                  children: [
                    Expanded(
                      child: _QuickAction(
                        icon: Icons.home_outlined,
                        label: 'المنزل',
                        onTap: () {
                          // TODO: Set home as destination
                        },
                      ),
                    ),
                    SizedBox(width: 12.w),
                    Expanded(
                      child: _QuickAction(
                        icon: Icons.work_outline,
                        label: 'العمل',
                        onTap: () {
                          // TODO: Set work as destination
                        },
                      ),
                    ),
                    SizedBox(width: 12.w),
                    Expanded(
                      child: _QuickAction(
                        icon: Icons.star_outline,
                        label: 'المفضلة',
                        onTap: () {
                          // TODO: Show saved places
                        },
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;

  const _QuickAction({
    required this.icon,
    required this.label,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: EdgeInsets.symmetric(vertical: 12.h),
        decoration: BoxDecoration(
          color: AppColors.primary.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(12.r),
        ),
        child: Column(
          children: [
            Icon(icon, color: AppColors.primary),
            SizedBox(height: 4.h),
            Text(
              label,
              style: AppTextStyles.caption.copyWith(
                color: AppColors.primary,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// Trips History Tab
class _TripsTab extends StatelessWidget {
  const _TripsTab();

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('رحلاتي'),
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.directions_car_outlined,
              size: 80.sp,
              color: AppColors.textSecondary,
            ),
            SizedBox(height: 16.h),
            Text(
              'لا توجد رحلات سابقة',
              style: AppTextStyles.heading3,
            ),
            SizedBox(height: 8.h),
            Text(
              'رحلاتك ستظهر هنا',
              style: AppTextStyles.subtitle,
            ),
          ],
        ),
      ),
    );
  }
}

// Profile Tab
class _ProfileTab extends ConsumerWidget {
  const _ProfileTab();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final userName = storageService.getUserName() ?? 'مستخدم';
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
                      userName.isNotEmpty ? userName[0].toUpperCase() : 'م',
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
                      ],
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.edit_outlined),
                    onPressed: () => context.push('/profile'),
                  ),
                ],
              ),
            ),
            SizedBox(height: 24.h),

            // Menu Items
            _ProfileMenuItem(
              icon: Icons.history,
              title: 'سجل الرحلات',
              onTap: () => context.push('/history'),
            ),
            _ProfileMenuItem(
              icon: Icons.schedule,
              title: 'الرحلات المجدولة',
              onTap: () => context.push('/scheduled-trips'),
            ),
            _ProfileMenuItem(
              icon: Icons.local_offer_outlined,
              title: 'الأكواد الترويجية',
              onTap: () => context.push('/promos'),
            ),
            _ProfileMenuItem(
              icon: Icons.security_outlined,
              title: 'الأمان والخصوصية',
              onTap: () => context.push('/safety-settings'),
            ),
            _ProfileMenuItem(
              icon: Icons.help_outline,
              title: 'المساعدة والدعم',
              onTap: () => context.push('/help'),
            ),
            SizedBox(height: 24.h),

            // Logout Button
            SizedBox(
              width: double.infinity,
              child: OutlinedButton.icon(
                onPressed: () => _showLogoutDialog(context, ref),
                icon: const Icon(Icons.logout, color: AppColors.error),
                label: Text(
                  'تسجيل الخروج',
                  style: AppTextStyles.button.copyWith(color: AppColors.error),
                ),
                style: OutlinedButton.styleFrom(
                  side: const BorderSide(color: AppColors.error),
                ),
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
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12.r),
        ),
      ),
    );
  }
}

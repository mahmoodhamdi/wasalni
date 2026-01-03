import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../config/theme.dart';
import '../../providers/trip_provider.dart';
import '../../services/location_service.dart';
import '../../widgets/wasalni_map.dart';

class ActiveTripScreen extends ConsumerStatefulWidget {
  const ActiveTripScreen({super.key});

  @override
  ConsumerState<ActiveTripScreen> createState() => _ActiveTripScreenState();
}

class _ActiveTripScreenState extends ConsumerState<ActiveTripScreen> {
  GoogleMapController? _mapController;
  final Set<Marker> _markers = {};
  final Set<Polyline> _polylines = {};
  Position? _currentPosition;
  StreamSubscription<Position>? _locationSubscription;
  Timer? _locationUpdateTimer;

  @override
  void initState() {
    super.initState();
    _initLocation();
  }

  @override
  void dispose() {
    _locationSubscription?.cancel();
    _locationUpdateTimer?.cancel();
    super.dispose();
  }

  Future<void> _initLocation() async {
    final position = await locationService.getCurrentPosition();
    if (mounted && position != null) {
      setState(() => _currentPosition = position);
      _startLocationUpdates();
    }
  }

  void _startLocationUpdates() {
    _locationSubscription = locationService.getPositionStream(
      distanceFilter: 10,
    ).listen((position) {
      setState(() => _currentPosition = position);
      _updateMarkers();
    });

    // Send location updates to server every 5 seconds during trip
    _locationUpdateTimer = Timer.periodic(const Duration(seconds: 5), (_) {
      if (_currentPosition != null) {
        ref.read(driverTripProvider.notifier).updateTripLocation(
          _currentPosition!.latitude,
          _currentPosition!.longitude,
          heading: _currentPosition!.heading,
        );
      }
    });
  }

  void _updateMarkers() {
    final tripState = ref.read(driverTripProvider);
    _markers.clear();

    // Driver location marker
    if (_currentPosition != null) {
      _markers.add(
        Marker(
          markerId: const MarkerId('driver'),
          position: LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueBlue),
          rotation: _currentPosition!.heading,
          infoWindow: const InfoWindow(title: 'موقعك'),
        ),
      );
    }

    // Show pickup only when heading there
    if (tripState.status == DriverTripStatus.accepted && tripState.pickup != null) {
      _markers.add(
        Marker(
          markerId: const MarkerId('pickup'),
          position: tripState.pickup!.latLng,
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
          infoWindow: InfoWindow(
            title: 'نقطة الانطلاق',
            snippet: tripState.pickup!.address ?? '',
          ),
        ),
      );
    }

    // Show dropoff during/after pickup
    if (tripState.dropoff != null) {
      _markers.add(
        Marker(
          markerId: const MarkerId('dropoff'),
          position: tripState.dropoff!.latLng,
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
          infoWindow: InfoWindow(
            title: 'الوجهة',
            snippet: tripState.dropoff!.address ?? '',
          ),
        ),
      );
    }

    if (mounted) setState(() {});
  }

  void _fitBounds() {
    if (_mapController == null) return;

    final tripState = ref.read(driverTripProvider);
    final List<LatLng> points = [];

    if (_currentPosition != null) {
      points.add(LatLng(_currentPosition!.latitude, _currentPosition!.longitude));
    }

    // Target based on status
    if (tripState.status == DriverTripStatus.accepted ||
        tripState.status == DriverTripStatus.arrived) {
      if (tripState.pickup != null) {
        points.add(tripState.pickup!.latLng);
      }
    } else if (tripState.status == DriverTripStatus.inProgress) {
      if (tripState.dropoff != null) {
        points.add(tripState.dropoff!.latLng);
      }
    }

    if (points.length >= 2) {
      double minLat = points.first.latitude;
      double maxLat = points.first.latitude;
      double minLng = points.first.longitude;
      double maxLng = points.first.longitude;

      for (final point in points) {
        if (point.latitude < minLat) minLat = point.latitude;
        if (point.latitude > maxLat) maxLat = point.latitude;
        if (point.longitude < minLng) minLng = point.longitude;
        if (point.longitude > maxLng) maxLng = point.longitude;
      }

      _mapController!.animateCamera(
        CameraUpdate.newLatLngBounds(
          LatLngBounds(
            southwest: LatLng(minLat - 0.005, minLng - 0.005),
            northeast: LatLng(maxLat + 0.005, maxLng + 0.005),
          ),
          50,
        ),
      );
    }
  }

  Future<void> _openNavigation() async {
    final tripState = ref.read(driverTripProvider);
    LatLng? destination;

    if (tripState.status == DriverTripStatus.accepted ||
        tripState.status == DriverTripStatus.arrived) {
      destination = tripState.pickup?.latLng;
    } else if (tripState.status == DriverTripStatus.inProgress) {
      destination = tripState.dropoff?.latLng;
    }

    if (destination != null) {
      final url = Uri.parse(
        'https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}&travelmode=driving',
      );
      if (await canLaunchUrl(url)) {
        await launchUrl(url, mode: LaunchMode.externalApplication);
      }
    }
  }

  Future<void> _callPassenger() async {
    final phone = ref.read(driverTripProvider).passenger?.phone;
    if (phone != null) {
      final uri = Uri.parse('tel:$phone');
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      }
    }
  }

  void _showCancelDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('إلغاء الرحلة'),
        content: const Text('هل أنت متأكد من إلغاء الرحلة؟'),
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
    await ref.read(driverTripProvider.notifier).cancelTrip('Driver cancelled');
    if (mounted) {
      context.go('/home');
    }
  }

  Future<void> _onArrivedPressed() async {
    final success = await ref.read(driverTripProvider.notifier).arrivedAtPickup();
    if (!success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(ref.read(driverTripProvider).errorMessage ?? 'فشل في تحديث الحالة'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<void> _onStartTripPressed() async {
    final success = await ref.read(driverTripProvider.notifier).startTrip();
    if (!success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(ref.read(driverTripProvider).errorMessage ?? 'فشل في بدء الرحلة'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  Future<void> _onCompleteTripPressed() async {
    final success = await ref.read(driverTripProvider.notifier).completeTrip();
    if (success && mounted) {
      context.go('/trip-complete');
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(ref.read(driverTripProvider).errorMessage ?? 'فشل في إنهاء الرحلة'),
          backgroundColor: AppColors.error,
        ),
      );
    }
  }

  String _getStatusTitle(DriverTripStatus status) {
    switch (status) {
      case DriverTripStatus.accepted:
        return 'متجه إلى نقطة الانطلاق';
      case DriverTripStatus.arrived:
        return 'وصلت - في انتظار الراكب';
      case DriverTripStatus.inProgress:
        return 'الرحلة جارية';
      default:
        return 'جاري التحميل...';
    }
  }

  IconData _getStatusIcon(DriverTripStatus status) {
    switch (status) {
      case DriverTripStatus.accepted:
        return Icons.directions_car;
      case DriverTripStatus.arrived:
        return Icons.person_pin;
      case DriverTripStatus.inProgress:
        return Icons.navigation;
      default:
        return Icons.info;
    }
  }

  String _getActionButtonText(DriverTripStatus status) {
    switch (status) {
      case DriverTripStatus.accepted:
        return 'وصلت';
      case DriverTripStatus.arrived:
        return 'بدء الرحلة';
      case DriverTripStatus.inProgress:
        return 'إنهاء الرحلة';
      default:
        return '';
    }
  }

  VoidCallback? _getActionButtonCallback(DriverTripStatus status) {
    switch (status) {
      case DriverTripStatus.accepted:
        return _onArrivedPressed;
      case DriverTripStatus.arrived:
        return _onStartTripPressed;
      case DriverTripStatus.inProgress:
        return _onCompleteTripPressed;
      default:
        return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final tripState = ref.watch(driverTripProvider);

    // Listen for cancellation
    ref.listen<DriverTripState>(driverTripProvider, (previous, next) {
      if (next.status == DriverTripStatus.idle && previous?.status != DriverTripStatus.idle) {
        if (next.errorMessage != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(next.errorMessage!),
              backgroundColor: AppColors.error,
            ),
          );
          ref.read(driverTripProvider.notifier).clearError();
        }
        context.go('/home');
      }
    });

    _updateMarkers();

    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (didPop, result) {
        if (!didPop) {
          _showCancelDialog();
        }
      },
      child: Scaffold(
        body: Stack(
          children: [
            // Map
            WasalniMap(
              initialPosition: _currentPosition != null
                  ? LatLng(_currentPosition!.latitude, _currentPosition!.longitude)
                  : null,
              markers: _markers,
              polylines: _polylines,
              showMyLocation: false,
              onMapCreated: (controller) {
                _mapController = controller;
                Future.delayed(const Duration(milliseconds: 500), _fitBounds);
              },
              padding: EdgeInsets.only(bottom: 280.h),
            ),

            // Top Bar
            SafeArea(
              child: Padding(
                padding: EdgeInsets.all(16.w),
                child: Row(
                  children: [
                    // Status chip
                    Container(
                      padding: EdgeInsets.symmetric(
                        horizontal: 16.w,
                        vertical: 8.h,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(20.r),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.1),
                            blurRadius: 10,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(
                            _getStatusIcon(tripState.status),
                            color: AppColors.primary,
                            size: 20.sp,
                          ),
                          SizedBox(width: 8.w),
                          Text(
                            _getStatusTitle(tripState.status),
                            style: AppTextStyles.body.copyWith(
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const Spacer(),
                    // Navigate button
                    Container(
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(12.r),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.primary.withValues(alpha: 0.3),
                            blurRadius: 10,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: IconButton(
                        icon: const Icon(Icons.navigation, color: Colors.white),
                        onPressed: _openNavigation,
                        tooltip: 'فتح التنقل',
                      ),
                    ),
                  ],
                ),
              ),
            ),

            // Bottom Sheet
            Positioned(
              left: 0,
              right: 0,
              bottom: 0,
              child: Container(
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
                  children: [
                    // Handle
                    Container(
                      margin: EdgeInsets.only(top: 12.h),
                      width: 40.w,
                      height: 4.h,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade300,
                        borderRadius: BorderRadius.circular(2.r),
                      ),
                    ),

                    Padding(
                      padding: EdgeInsets.all(20.w),
                      child: Column(
                        children: [
                          // Passenger Info
                          if (tripState.passenger != null)
                            Row(
                              children: [
                                CircleAvatar(
                                  radius: 25.r,
                                  backgroundColor:
                                      AppColors.primary.withValues(alpha: 0.1),
                                  backgroundImage: tripState.passenger!.avatar != null
                                      ? NetworkImage(tripState.passenger!.avatar!)
                                      : null,
                                  child: tripState.passenger!.avatar == null
                                      ? Icon(Icons.person,
                                          size: 25.sp, color: AppColors.primary)
                                      : null,
                                ),
                                SizedBox(width: 12.w),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        tripState.passenger!.name,
                                        style: AppTextStyles.heading3,
                                      ),
                                      Row(
                                        children: [
                                          Icon(Icons.star,
                                              color: Colors.amber, size: 14.sp),
                                          SizedBox(width: 4.w),
                                          Text(
                                            tripState.passenger!.rating
                                                .toStringAsFixed(1),
                                            style: AppTextStyles.caption,
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ),
                                // Call button
                                CircleAvatar(
                                  radius: 22.r,
                                  backgroundColor:
                                      AppColors.success.withValues(alpha: 0.1),
                                  child: IconButton(
                                    icon: Icon(Icons.call,
                                        color: AppColors.success, size: 20.sp),
                                    onPressed: _callPassenger,
                                  ),
                                ),
                              ],
                            ),
                          SizedBox(height: 16.h),

                          // Destination info
                          Container(
                            padding: EdgeInsets.all(12.w),
                            decoration: BoxDecoration(
                              color: Colors.grey.shade50,
                              borderRadius: BorderRadius.circular(12.r),
                            ),
                            child: Row(
                              children: [
                                Icon(
                                  tripState.status == DriverTripStatus.inProgress
                                      ? Icons.location_on
                                      : Icons.trip_origin,
                                  color: tripState.status == DriverTripStatus.inProgress
                                      ? AppColors.primary
                                      : AppColors.success,
                                  size: 20.sp,
                                ),
                                SizedBox(width: 12.w),
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                        tripState.status == DriverTripStatus.inProgress
                                            ? 'الوجهة'
                                            : 'نقطة الانطلاق',
                                        style: AppTextStyles.caption,
                                      ),
                                      Text(
                                        tripState.status == DriverTripStatus.inProgress
                                            ? tripState.dropoff?.address ?? 'الوجهة'
                                            : tripState.pickup?.address ?? 'نقطة الانطلاق',
                                        style: AppTextStyles.body,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ),
                                ),
                              ],
                            ),
                          ),
                          SizedBox(height: 16.h),

                          // Action Button
                          if (tripState.isLoading)
                            const CircularProgressIndicator()
                          else
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: _getActionButtonCallback(tripState.status),
                                style: ElevatedButton.styleFrom(
                                  backgroundColor:
                                      tripState.status == DriverTripStatus.inProgress
                                          ? AppColors.success
                                          : AppColors.primary,
                                  padding: EdgeInsets.symmetric(vertical: 16.h),
                                ),
                                child: Text(_getActionButtonText(tripState.status)),
                              ),
                            ),
                          SizedBox(height: 12.h),

                          // Cancel Button (only before trip starts)
                          if (tripState.status != DriverTripStatus.inProgress)
                            TextButton(
                              onPressed: _showCancelDialog,
                              child: Text(
                                'إلغاء الرحلة',
                                style: AppTextStyles.body.copyWith(
                                  color: AppColors.error,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

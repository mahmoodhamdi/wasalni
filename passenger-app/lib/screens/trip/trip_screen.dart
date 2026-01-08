import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:latlong2/latlong.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../config/theme.dart';
import '../../providers/trip_provider.dart';
import '../../widgets/wasalni_map.dart';

class TripScreen extends ConsumerStatefulWidget {
  const TripScreen({super.key});

  @override
  ConsumerState<TripScreen> createState() => _TripScreenState();
}

class _TripScreenState extends ConsumerState<TripScreen> {
  WasalniMapController? _mapController;
  List<WasalniMarker> _markers = [];
  List<WasalniPolyline> _polylines = [];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _initTrip();
    });
  }

  void _initTrip() {
    final tripState = ref.read(tripProvider);
    _updateMarkers(tripState);
    _updateRoute(tripState);
  }

  void _updateMarkers(TripState tripState) {
    final markers = <WasalniMarker>[];

    // Driver marker (if available)
    if (tripState.driverLat != null && tripState.driverLng != null) {
      markers.add(
        MarkerBuilder.driverMarker(
          id: 'driver',
          position: LatLng(tripState.driverLat!, tripState.driverLng!),
          isAvailable: true,
        ),
      );
    }

    // Pickup marker (only if not yet picked up)
    if (tripState.status != TripStatus.inProgress && tripState.pickup != null) {
      markers.add(
        MarkerBuilder.pickupMarker(
          id: 'pickup',
          position: LatLng(
            tripState.pickup!.latitude,
            tripState.pickup!.longitude,
          ),
        ),
      );
    }

    // Dropoff marker
    if (tripState.dropoff != null) {
      markers.add(
        MarkerBuilder.dropoffMarker(
          id: 'dropoff',
          position: LatLng(
            tripState.dropoff!.latitude,
            tripState.dropoff!.longitude,
          ),
        ),
      );
    }

    if (mounted) {
      setState(() {
        _markers = markers;
      });
    }
  }

  void _updateRoute(TripState tripState) {
    final polylines = <WasalniPolyline>[];

    if (tripState.route?.encodedPolyline != null &&
        tripState.route!.encodedPolyline.isNotEmpty) {
      final points = _decodePolyline(tripState.route!.encodedPolyline);
      if (points.isNotEmpty) {
        polylines.add(
          WasalniPolyline(
            id: 'route',
            points: points,
            color: AppColors.primary,
            strokeWidth: 4,
          ),
        );
      }
    }

    if (mounted) {
      setState(() {
        _polylines = polylines;
      });
    }
  }

  // Decode Google encoded polyline
  List<LatLng> _decodePolyline(String encoded) {
    final List<LatLng> points = [];
    int index = 0;
    int lat = 0;
    int lng = 0;

    while (index < encoded.length) {
      int shift = 0;
      int result = 0;

      int b;
      do {
        b = encoded.codeUnitAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      int dlat = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.codeUnitAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      int dlng = ((result & 1) != 0 ? ~(result >> 1) : (result >> 1));
      lng += dlng;

      points.add(LatLng(lat / 1E5, lng / 1E5));
    }

    return points;
  }

  void _fitBounds(TripState tripState) {
    if (_mapController == null) return;

    final List<LatLng> points = [];

    if (tripState.driverLat != null && tripState.driverLng != null) {
      points.add(LatLng(tripState.driverLat!, tripState.driverLng!));
    }

    if (tripState.status != TripStatus.inProgress && tripState.pickup != null) {
      points.add(LatLng(
        tripState.pickup!.latitude,
        tripState.pickup!.longitude,
      ));
    }

    if (tripState.dropoff != null) {
      points.add(LatLng(
        tripState.dropoff!.latitude,
        tripState.dropoff!.longitude,
      ));
    }

    if (points.isNotEmpty) {
      // Center on first point for now
      _mapController!.moveToLocation(points.first, zoom: 14.0);
    }
  }

  Future<void> _callDriver() async {
    final phone = ref.read(tripProvider).driver?.phone;
    if (phone != null) {
      final uri = Uri.parse('tel:$phone');
      if (await canLaunchUrl(uri)) {
        await launchUrl(uri);
      }
    }
  }

  void _showCancelDialog() {
    final tripState = ref.read(tripProvider);

    // Can only cancel before trip starts
    if (tripState.status == TripStatus.inProgress) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('لا يمكن إلغاء الرحلة بعد بدءها'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('إلغاء الرحلة'),
        content: const Text('هل أنت متأكد من إلغاء الرحلة؟ قد يتم تطبيق رسوم إلغاء.'),
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

  void _showSOSDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Row(
          children: [
            Icon(Icons.warning, color: AppColors.error, size: 28.sp),
            SizedBox(width: 8.w),
            const Text('طوارئ'),
          ],
        ),
        content: const Text(
          'هل تحتاج مساعدة؟ سيتم إرسال موقعك الحالي لفريق الدعم والطوارئ.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _sendSOS();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
            ),
            child: const Text('إرسال طلب مساعدة'),
          ),
        ],
      ),
    );
  }

  Future<void> _sendSOS() async {
    // Show SOS confirmation and options
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('تم إرسال طلب المساعدة - سيتواصل معك فريق الدعم'),
        backgroundColor: AppColors.warning,
        duration: Duration(seconds: 5),
      ),
    );

    // Show emergency call option
    _showEmergencyCallOption();
  }

  void _showEmergencyCallOption() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('اتصال طوارئ'),
        content: const Text('هل تريد الاتصال بخدمات الطوارئ؟'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('لا'),
          ),
          ElevatedButton(
            onPressed: () async {
              Navigator.pop(context);
              final uri = Uri.parse('tel:122'); // Egypt emergency number
              if (await canLaunchUrl(uri)) {
                await launchUrl(uri);
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
            ),
            child: const Text('اتصل بالطوارئ 122'),
          ),
        ],
      ),
    );
  }

  void _openChat() {
    final tripState = ref.read(tripProvider);
    final driver = tripState.driver;

    if (driver == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('لا يمكن بدء المحادثة الآن')),
      );
      return;
    }

    // Show chat bottom sheet
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24.r)),
      ),
      builder: (context) => _QuickChatSheet(
        driverName: driver.name,
        onSendMessage: (message) {
          // Send message via socket/API
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('تم إرسال: $message')),
          );
          Navigator.pop(context);
        },
      ),
    );
  }

  String _getStatusTitle(TripStatus status) {
    switch (status) {
      case TripStatus.driverAssigned:
        return 'تم تعيين سائق';
      case TripStatus.driverArriving:
        return 'السائق في الطريق إليك';
      case TripStatus.driverArrived:
        return 'السائق وصل';
      case TripStatus.inProgress:
        return 'الرحلة جارية';
      case TripStatus.completed:
        return 'تم إكمال الرحلة';
      default:
        return 'جاري التحميل...';
    }
  }

  String _getStatusSubtitle(TripState tripState) {
    switch (tripState.status) {
      case TripStatus.driverArriving:
        final eta = tripState.driverEta;
        if (eta != null) {
          return 'الوصول خلال $eta دقيقة';
        }
        return 'في الطريق إليك';
      case TripStatus.driverArrived:
        return 'السائق في انتظارك عند نقطة الانطلاق';
      case TripStatus.inProgress:
        final durationText = tripState.route?.durationText;
        if (durationText != null && durationText.isNotEmpty) {
          return 'الوصول خلال $durationText';
        }
        return 'في الطريق إلى الوجهة';
      default:
        return '';
    }
  }

  IconData _getStatusIcon(TripStatus status) {
    switch (status) {
      case TripStatus.driverAssigned:
        return Icons.person_pin;
      case TripStatus.driverArriving:
        return Icons.directions_car;
      case TripStatus.driverArrived:
        return Icons.place;
      case TripStatus.inProgress:
        return Icons.navigation;
      case TripStatus.completed:
        return Icons.check_circle;
      default:
        return Icons.info;
    }
  }

  @override
  Widget build(BuildContext context) {
    final tripState = ref.watch(tripProvider);

    // Listen for state changes
    ref.listen<TripState>(tripProvider, (previous, next) {
      _updateMarkers(next);
      _updateRoute(next);

      // Check if driver location changed
      final prevDriverLoc = previous != null
          ? (previous.driverLat, previous.driverLng)
          : (null, null);
      final nextDriverLoc = (next.driverLat, next.driverLng);
      if (next.driverLat != null && prevDriverLoc != nextDriverLoc) {
        _fitBounds(next);
      }

      if (next.status == TripStatus.completed) {
        // Navigate to completion/rating screen
        context.go('/trip-complete');
      } else if (next.status == TripStatus.cancelled ||
          next.status == TripStatus.idle) {
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
        body: Stack(
          children: [
            // Map
            WasalniMap(
              initialPosition: tripState.pickup != null
                  ? LatLng(tripState.pickup!.latitude, tripState.pickup!.longitude)
                  : null,
              markers: _markers,
              polylines: _polylines,
              showMyLocation: true,
              onMapCreated: (controller) {
                _mapController = controller;
                Future.delayed(const Duration(milliseconds: 500), () {
                  _fitBounds(tripState);
                });
              },
            ),

            // Top Bar
            SafeArea(
              child: Padding(
                padding: EdgeInsets.all(16.w),
                child: Row(
                  children: [
                    // Trip status chip
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
                    // SOS Button
                    Container(
                      decoration: BoxDecoration(
                        color: AppColors.error,
                        borderRadius: BorderRadius.circular(12.r),
                        boxShadow: [
                          BoxShadow(
                            color: AppColors.error.withValues(alpha: 0.3),
                            blurRadius: 10,
                            offset: const Offset(0, 2),
                          ),
                        ],
                      ),
                      child: IconButton(
                        icon: const Icon(Icons.sos, color: Colors.white),
                        onPressed: _showSOSDialog,
                        tooltip: 'طوارئ',
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
                          // Status subtitle
                          if (_getStatusSubtitle(tripState).isNotEmpty)
                            Padding(
                              padding: EdgeInsets.only(bottom: 16.h),
                              child: Text(
                                _getStatusSubtitle(tripState),
                                style: AppTextStyles.subtitle.copyWith(
                                  color: AppColors.primary,
                                ),
                              ),
                            ),

                          // Driver Info Card
                          if (tripState.driver != null)
                            _DriverInfoCard(
                              driver: tripState.driver!,
                              onCall: _callDriver,
                              onMessage: _openChat,
                            ),

                          SizedBox(height: 16.h),

                          // Trip Details
                          _TripDetailsCard(tripState: tripState),

                          SizedBox(height: 16.h),

                          // Action Buttons
                          if (tripState.status != TripStatus.inProgress)
                            SizedBox(
                              width: double.infinity,
                              child: OutlinedButton(
                                onPressed: _showCancelDialog,
                                style: OutlinedButton.styleFrom(
                                  foregroundColor: AppColors.error,
                                  side: const BorderSide(color: AppColors.error),
                                  padding: EdgeInsets.symmetric(vertical: 14.h),
                                ),
                                child: const Text('إلغاء الرحلة'),
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

class _DriverInfoCard extends StatelessWidget {
  final DriverInfo driver;
  final VoidCallback onCall;
  final VoidCallback onMessage;

  const _DriverInfoCard({
    required this.driver,
    required this.onCall,
    required this.onMessage,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(16.r),
      ),
      child: Row(
        children: [
          // Driver Photo
          CircleAvatar(
            radius: 30.r,
            backgroundColor: AppColors.primary.withValues(alpha: 0.1),
            backgroundImage:
                driver.avatar != null ? NetworkImage(driver.avatar!) : null,
            child: driver.avatar == null
                ? Icon(Icons.person, size: 30.sp, color: AppColors.primary)
                : null,
          ),
          SizedBox(width: 16.w),

          // Driver Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  driver.name,
                  style: AppTextStyles.heading3,
                ),
                SizedBox(height: 4.h),
                Row(
                  children: [
                    Icon(Icons.star, color: Colors.amber, size: 16.sp),
                    SizedBox(width: 4.w),
                    Text(
                      driver.rating.toStringAsFixed(1),
                      style: AppTextStyles.body,
                    ),
                    SizedBox(width: 8.w),
                    Flexible(
                      child: Text(
                        '${driver.vehicleMake} ${driver.vehicleModel}',
                        style: AppTextStyles.caption,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ),
                  ],
                ),
                SizedBox(height: 4.h),
                Text(
                  driver.vehiclePlate,
                  style: AppTextStyles.body.copyWith(
                    fontWeight: FontWeight.w600,
                    color: AppColors.primary,
                  ),
                ),
              ],
            ),
          ),

          // Action Buttons
          Column(
            children: [
              CircleAvatar(
                radius: 22.r,
                backgroundColor: AppColors.success.withValues(alpha: 0.1),
                child: IconButton(
                  icon: Icon(Icons.call, color: AppColors.success, size: 20.sp),
                  onPressed: onCall,
                ),
              ),
              SizedBox(height: 8.h),
              CircleAvatar(
                radius: 22.r,
                backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                child: IconButton(
                  icon: Icon(Icons.chat, color: AppColors.primary, size: 20.sp),
                  onPressed: onMessage,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _TripDetailsCard extends StatelessWidget {
  final TripState tripState;

  const _TripDetailsCard({required this.tripState});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16.w),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(16.r),
      ),
      child: Column(
        children: [
          // Pickup
          if (tripState.status != TripStatus.inProgress) ...[
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
          ],
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
          // Fare
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('السعر', style: AppTextStyles.body),
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
    );
  }
}

class _QuickChatSheet extends StatefulWidget {
  final String driverName;
  final Function(String) onSendMessage;

  const _QuickChatSheet({
    required this.driverName,
    required this.onSendMessage,
  });

  @override
  State<_QuickChatSheet> createState() => _QuickChatSheetState();
}

class _QuickChatSheetState extends State<_QuickChatSheet> {
  final TextEditingController _messageController = TextEditingController();
  final List<String> _quickMessages = [
    'أين أنت؟',
    'أنا في الانتظار',
    'سأصل خلال دقيقة',
    'أنا أمام المبنى',
    'تأخرت قليلاً',
    'شكراً',
  ];

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
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
                  'محادثة مع ${widget.driverName}',
                  style: AppTextStyles.heading3,
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: () => Navigator.pop(context),
                ),
              ],
            ),
            SizedBox(height: 16.h),
            // Quick Messages
            Text('رسائل سريعة:', style: AppTextStyles.caption),
            SizedBox(height: 8.h),
            Wrap(
              spacing: 8.w,
              runSpacing: 8.h,
              children: _quickMessages.map((msg) {
                return GestureDetector(
                  onTap: () => widget.onSendMessage(msg),
                  child: Container(
                    padding: EdgeInsets.symmetric(
                      horizontal: 12.w,
                      vertical: 8.h,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(16.r),
                      border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                    ),
                    child: Text(
                      msg,
                      style: AppTextStyles.caption.copyWith(
                        color: AppColors.primary,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
            SizedBox(height: 16.h),
            // Custom Message Input
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _messageController,
                    decoration: InputDecoration(
                      hintText: 'اكتب رسالة...',
                      contentPadding: EdgeInsets.symmetric(
                        horizontal: 16.w,
                        vertical: 12.h,
                      ),
                    ),
                    textDirection: TextDirection.rtl,
                  ),
                ),
                SizedBox(width: 8.w),
                CircleAvatar(
                  backgroundColor: AppColors.primary,
                  child: IconButton(
                    icon: const Icon(Icons.send, color: Colors.white),
                    onPressed: () {
                      final msg = _messageController.text.trim();
                      if (msg.isNotEmpty) {
                        widget.onSendMessage(msg);
                      }
                    },
                  ),
                ),
              ],
            ),
            SizedBox(height: 16.h),
          ],
        ),
      ),
    );
  }
}

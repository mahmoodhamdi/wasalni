import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../config/theme.dart';
import '../../providers/trip_provider.dart';
import '../../widgets/wasalni_map.dart';

class BookingScreen extends ConsumerStatefulWidget {
  const BookingScreen({super.key});

  @override
  ConsumerState<BookingScreen> createState() => _BookingScreenState();
}

class _BookingScreenState extends ConsumerState<BookingScreen> {
  GoogleMapController? _mapController;
  final TextEditingController _promoController = TextEditingController();
  bool _showPromoInput = false;

  @override
  void dispose() {
    _promoController.dispose();
    super.dispose();
  }

  Set<Marker> _buildMarkers(TripState state) {
    final markers = <Marker>{};

    if (state.pickup != null) {
      markers.add(
        Marker(
          markerId: const MarkerId('pickup'),
          position: state.pickup!.latLng,
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
          infoWindow: InfoWindow(
            title: 'نقطة الانطلاق',
            snippet: state.pickup!.address,
          ),
        ),
      );
    }

    if (state.dropoff != null) {
      markers.add(
        Marker(
          markerId: const MarkerId('dropoff'),
          position: state.dropoff!.latLng,
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed),
          infoWindow: InfoWindow(
            title: 'الوجهة',
            snippet: state.dropoff!.address,
          ),
        ),
      );
    }

    return markers;
  }

  void _fitBounds(TripState state) {
    if (state.pickup != null && state.dropoff != null && _mapController != null) {
      final bounds = LatLngBounds(
        southwest: LatLng(
          state.pickup!.latitude < state.dropoff!.latitude
              ? state.pickup!.latitude
              : state.dropoff!.latitude,
          state.pickup!.longitude < state.dropoff!.longitude
              ? state.pickup!.longitude
              : state.dropoff!.longitude,
        ),
        northeast: LatLng(
          state.pickup!.latitude > state.dropoff!.latitude
              ? state.pickup!.latitude
              : state.dropoff!.latitude,
          state.pickup!.longitude > state.dropoff!.longitude
              ? state.pickup!.longitude
              : state.dropoff!.longitude,
        ),
      );

      _mapController!.animateCamera(
        CameraUpdate.newLatLngBounds(bounds, 80),
      );
    }
  }

  void _onMapCreated(GoogleMapController controller) {
    _mapController = controller;
    final state = ref.read(tripProvider);
    Future.delayed(const Duration(milliseconds: 300), () {
      _fitBounds(state);
    });
  }

  Future<void> _applyPromoCode() async {
    final code = _promoController.text.trim();
    if (code.isEmpty) return;

    final success = await ref.read(tripProvider.notifier).applyPromoCode(code);
    if (success && mounted) {
      setState(() => _showPromoInput = false);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('تم تطبيق كود الخصم بنجاح'),
          backgroundColor: AppColors.success,
        ),
      );
    }
  }

  Future<void> _confirmBooking() async {
    final success = await ref.read(tripProvider.notifier).requestTrip();
    if (success && mounted) {
      context.go('/searching');
    }
  }

  IconData _getIconForRideType(String rideType) {
    switch (rideType) {
      case 'economy':
      case 'comfort':
        return Icons.directions_car;
      case 'family':
        return Icons.airport_shuttle;
      case 'tuktuk':
        return Icons.electric_rickshaw;
      case 'motorcycle':
        return Icons.two_wheeler;
      default:
        return Icons.directions_car;
    }
  }

  String _getPaymentMethodName(PaymentMethod method) {
    switch (method) {
      case PaymentMethod.cash:
        return 'نقدي';
      case PaymentMethod.wallet:
        return 'المحفظة';
      case PaymentMethod.card:
        return 'بطاقة';
    }
  }

  IconData _getPaymentMethodIcon(PaymentMethod method) {
    switch (method) {
      case PaymentMethod.cash:
        return Icons.money;
      case PaymentMethod.wallet:
        return Icons.account_balance_wallet;
      case PaymentMethod.card:
        return Icons.credit_card;
    }
  }

  @override
  Widget build(BuildContext context) {
    final tripState = ref.watch(tripProvider);
    final rideTypes = ref.watch(rideTypesInfoProvider);

    // Show error messages
    ref.listen<TripState>(tripProvider, (previous, next) {
      if (next.errorMessage != null && next.errorMessage != previous?.errorMessage) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.errorMessage!),
            backgroundColor: AppColors.error,
          ),
        );
        ref.read(tripProvider.notifier).clearError();
      }
    });

    return Scaffold(
      body: Stack(
        children: [
          // Map with route
          WasalniMap(
            initialPosition: tripState.pickup?.latLng,
            markers: _buildMarkers(tripState),
            showMyLocation: false,
            onMapCreated: _onMapCreated,
            padding: EdgeInsets.only(bottom: 350.h),
          ),

          // Back button
          SafeArea(
            child: Padding(
              padding: EdgeInsets.all(16.w),
              child: CircleAvatar(
                backgroundColor: Colors.white,
                child: IconButton(
                  icon: const Icon(Icons.arrow_back, color: AppColors.textPrimary),
                  onPressed: () {
                    ref.read(tripProvider.notifier).resetTrip();
                    context.pop();
                  },
                ),
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

                  // Location Summary
                  Padding(
                    padding: EdgeInsets.all(16.w),
                    child: Row(
                      children: [
                        Column(
                          children: [
                            Icon(Icons.trip_origin, color: AppColors.success, size: 20.sp),
                            Container(
                              width: 2,
                              height: 24.h,
                              color: Colors.grey.shade300,
                            ),
                            Icon(Icons.location_on, color: AppColors.primary, size: 20.sp),
                          ],
                        ),
                        SizedBox(width: 12.w),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                tripState.pickup?.address ?? 'نقطة الانطلاق',
                                style: AppTextStyles.body,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              SizedBox(height: 16.h),
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
                  ),

                  const Divider(height: 1),

                  // Ride Type Selection
                  if (tripState.isFetchingFares)
                    Padding(
                      padding: EdgeInsets.all(24.w),
                      child: const Center(child: CircularProgressIndicator()),
                    )
                  else if (tripState.fareEstimates.isNotEmpty)
                    SizedBox(
                      height: 110.h,
                      child: ListView.builder(
                        scrollDirection: Axis.horizontal,
                        padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 12.h),
                        itemCount: tripState.fareEstimates.length,
                        itemBuilder: (context, index) {
                          final estimate = tripState.fareEstimates[index];
                          final rideInfo = rideTypes.firstWhere(
                            (r) => r.id == estimate.rideType,
                            orElse: () => rideTypes.first,
                          );
                          final isSelected = tripState.selectedRideType == estimate.rideType;

                          return GestureDetector(
                            onTap: () {
                              ref.read(tripProvider.notifier).setRideType(estimate.rideType);
                            },
                            child: Container(
                              width: 100.w,
                              margin: EdgeInsets.symmetric(horizontal: 4.w),
                              padding: EdgeInsets.all(8.w),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? AppColors.primary.withValues(alpha: 0.1)
                                    : Colors.grey.shade50,
                                borderRadius: BorderRadius.circular(12.r),
                                border: Border.all(
                                  color: isSelected ? AppColors.primary : Colors.transparent,
                                  width: 2,
                                ),
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(
                                    _getIconForRideType(estimate.rideType),
                                    size: 28.sp,
                                    color: isSelected ? AppColors.primary : AppColors.textSecondary,
                                  ),
                                  SizedBox(height: 4.h),
                                  Text(
                                    rideInfo.nameAr,
                                    style: AppTextStyles.caption.copyWith(
                                      fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                                      color: isSelected ? AppColors.primary : AppColors.textPrimary,
                                    ),
                                  ),
                                  SizedBox(height: 2.h),
                                  Text(
                                    estimate.fareRange,
                                    style: AppTextStyles.caption.copyWith(
                                      fontSize: 10.sp,
                                      color: isSelected ? AppColors.primary : AppColors.textSecondary,
                                    ),
                                  ),
                                  if (estimate.surgeMultiplier > 1)
                                    Container(
                                      margin: EdgeInsets.only(top: 2.h),
                                      padding: EdgeInsets.symmetric(horizontal: 4.w, vertical: 1.h),
                                      decoration: BoxDecoration(
                                        color: AppColors.warning.withValues(alpha: 0.2),
                                        borderRadius: BorderRadius.circular(4.r),
                                      ),
                                      child: Text(
                                        '${estimate.surgeMultiplier}x',
                                        style: TextStyle(
                                          fontSize: 8.sp,
                                          color: AppColors.warning,
                                          fontWeight: FontWeight.bold,
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),

                  // Trip Info
                  if (tripState.selectedFare != null)
                    Padding(
                      padding: EdgeInsets.symmetric(horizontal: 16.w),
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.route, size: 16.sp, color: AppColors.textSecondary),
                          SizedBox(width: 4.w),
                          Text(
                            tripState.selectedFare!.distanceText,
                            style: AppTextStyles.caption,
                          ),
                          SizedBox(width: 16.w),
                          Icon(Icons.access_time, size: 16.sp, color: AppColors.textSecondary),
                          SizedBox(width: 4.w),
                          Text(
                            tripState.selectedFare!.durationText,
                            style: AppTextStyles.caption,
                          ),
                        ],
                      ),
                    ),

                  SizedBox(height: 8.h),
                  const Divider(height: 1),

                  // Payment Method & Promo
                  Padding(
                    padding: EdgeInsets.all(16.w),
                    child: Row(
                      children: [
                        // Payment Method
                        Expanded(
                          child: GestureDetector(
                            onTap: () => _showPaymentMethodSheet(),
                            child: Container(
                              padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 10.h),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade100,
                                borderRadius: BorderRadius.circular(8.r),
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    _getPaymentMethodIcon(tripState.paymentMethod),
                                    size: 20.sp,
                                    color: AppColors.primary,
                                  ),
                                  SizedBox(width: 8.w),
                                  Text(
                                    _getPaymentMethodName(tripState.paymentMethod),
                                    style: AppTextStyles.body,
                                  ),
                                  const Spacer(),
                                  Icon(Icons.chevron_left, color: AppColors.textSecondary, size: 20.sp),
                                ],
                              ),
                            ),
                          ),
                        ),
                        SizedBox(width: 12.w),
                        // Promo Code
                        Expanded(
                          child: GestureDetector(
                            onTap: () => setState(() => _showPromoInput = !_showPromoInput),
                            child: Container(
                              padding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 10.h),
                              decoration: BoxDecoration(
                                color: tripState.promoValid
                                    ? AppColors.success.withValues(alpha: 0.1)
                                    : Colors.grey.shade100,
                                borderRadius: BorderRadius.circular(8.r),
                                border: tripState.promoValid
                                    ? Border.all(color: AppColors.success)
                                    : null,
                              ),
                              child: Row(
                                children: [
                                  Icon(
                                    Icons.local_offer,
                                    size: 20.sp,
                                    color: tripState.promoValid ? AppColors.success : AppColors.primary,
                                  ),
                                  SizedBox(width: 8.w),
                                  Text(
                                    tripState.promoValid ? tripState.promoCode! : 'كود خصم',
                                    style: AppTextStyles.body.copyWith(
                                      color: tripState.promoValid ? AppColors.success : AppColors.textPrimary,
                                    ),
                                  ),
                                  if (tripState.promoValid)
                                    GestureDetector(
                                      onTap: () => ref.read(tripProvider.notifier).removePromoCode(),
                                      child: Padding(
                                        padding: EdgeInsets.only(right: 4.w),
                                        child: Icon(Icons.close, size: 16.sp, color: AppColors.error),
                                      ),
                                    ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Promo Input
                  if (_showPromoInput)
                    Padding(
                      padding: EdgeInsets.symmetric(horizontal: 16.w),
                      child: Row(
                        children: [
                          Expanded(
                            child: TextField(
                              controller: _promoController,
                              decoration: InputDecoration(
                                hintText: 'أدخل كود الخصم',
                                contentPadding: EdgeInsets.symmetric(horizontal: 12.w, vertical: 10.h),
                                border: OutlineInputBorder(
                                  borderRadius: BorderRadius.circular(8.r),
                                ),
                              ),
                              textDirection: TextDirection.ltr,
                            ),
                          ),
                          SizedBox(width: 8.w),
                          ElevatedButton(
                            onPressed: _applyPromoCode,
                            style: ElevatedButton.styleFrom(
                              padding: EdgeInsets.symmetric(horizontal: 16.w, vertical: 12.h),
                            ),
                            child: const Text('تطبيق'),
                          ),
                        ],
                      ),
                    ),

                  SizedBox(height: 8.h),

                  // Confirm Button
                  Padding(
                    padding: EdgeInsets.fromLTRB(16.w, 0, 16.w, 24.h),
                    child: SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: tripState.canBook ? _confirmBooking : null,
                        child: tripState.isLoading
                            ? SizedBox(
                                height: 20.h,
                                width: 20.h,
                                child: const CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : Row(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  const Text('تأكيد الحجز'),
                                  if (tripState.selectedFare != null) ...[
                                    SizedBox(width: 8.w),
                                    Text('• ${tripState.selectedFare!.fareRange}'),
                                  ],
                                ],
                              ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showPaymentMethodSheet() {
    showModalBottomSheet(
      context: context,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24.r)),
      ),
      builder: (context) => Container(
        padding: EdgeInsets.all(20.w),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('طريقة الدفع', style: AppTextStyles.heading3),
            SizedBox(height: 16.h),
            _PaymentMethodOption(
              icon: Icons.money,
              title: 'نقدي',
              subtitle: 'ادفع للسائق مباشرة',
              isSelected: ref.read(tripProvider).paymentMethod == PaymentMethod.cash,
              onTap: () {
                ref.read(tripProvider.notifier).setPaymentMethod(PaymentMethod.cash);
                Navigator.pop(context);
              },
            ),
            SizedBox(height: 8.h),
            _PaymentMethodOption(
              icon: Icons.account_balance_wallet,
              title: 'المحفظة',
              subtitle: 'الرصيد: 0.00 ج.م',
              isSelected: ref.read(tripProvider).paymentMethod == PaymentMethod.wallet,
              onTap: () {
                ref.read(tripProvider.notifier).setPaymentMethod(PaymentMethod.wallet);
                Navigator.pop(context);
              },
              enabled: false, // Disable until wallet is implemented
            ),
            SizedBox(height: 8.h),
            _PaymentMethodOption(
              icon: Icons.credit_card,
              title: 'بطاقة ائتمان',
              subtitle: 'أضف بطاقة جديدة',
              isSelected: ref.read(tripProvider).paymentMethod == PaymentMethod.card,
              onTap: () {
                // TODO: Implement card payment
                Navigator.pop(context);
              },
              enabled: false, // Disable until card payment is implemented
            ),
            SizedBox(height: 16.h),
          ],
        ),
      ),
    );
  }
}

class _PaymentMethodOption extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final bool isSelected;
  final VoidCallback onTap;
  final bool enabled;

  const _PaymentMethodOption({
    required this.icon,
    required this.title,
    required this.subtitle,
    required this.isSelected,
    required this.onTap,
    this.enabled = true,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: enabled ? onTap : null,
      child: Container(
        padding: EdgeInsets.all(16.w),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary.withValues(alpha: 0.1)
              : enabled
                  ? Colors.grey.shade50
                  : Colors.grey.shade100,
          borderRadius: BorderRadius.circular(12.r),
          border: Border.all(
            color: isSelected ? AppColors.primary : Colors.transparent,
            width: 2,
          ),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              size: 28.sp,
              color: enabled
                  ? (isSelected ? AppColors.primary : AppColors.textPrimary)
                  : AppColors.textSecondary,
            ),
            SizedBox(width: 16.w),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: AppTextStyles.body.copyWith(
                      fontWeight: FontWeight.w600,
                      color: enabled ? AppColors.textPrimary : AppColors.textSecondary,
                    ),
                  ),
                  Text(
                    subtitle,
                    style: AppTextStyles.caption.copyWith(
                      color: AppColors.textSecondary,
                    ),
                  ),
                ],
              ),
            ),
            if (isSelected)
              Icon(Icons.check_circle, color: AppColors.primary, size: 24.sp),
          ],
        ),
      ),
    );
  }
}

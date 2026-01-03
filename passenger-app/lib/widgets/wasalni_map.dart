import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../config/theme.dart';
import '../services/location_service.dart';

class WasalniMap extends StatefulWidget {
  final LatLng? initialPosition;
  final double initialZoom;
  final Set<Marker>? markers;
  final Set<Polyline>? polylines;
  final Set<Circle>? circles;
  final bool showMyLocation;
  final bool showMyLocationButton;
  final bool showZoomControls;
  final bool scrollGesturesEnabled;
  final bool zoomGesturesEnabled;
  final bool tiltGesturesEnabled;
  final bool rotateGesturesEnabled;
  final MapType mapType;
  final Function(GoogleMapController)? onMapCreated;
  final Function(LatLng)? onTap;
  final Function(LatLng)? onLongPress;
  final Function(CameraPosition)? onCameraMove;
  final Function()? onCameraIdle;
  final EdgeInsets? padding;

  const WasalniMap({
    super.key,
    this.initialPosition,
    this.initialZoom = 15.0,
    this.markers,
    this.polylines,
    this.circles,
    this.showMyLocation = true,
    this.showMyLocationButton = false,
    this.showZoomControls = false,
    this.scrollGesturesEnabled = true,
    this.zoomGesturesEnabled = true,
    this.tiltGesturesEnabled = false,
    this.rotateGesturesEnabled = false,
    this.mapType = MapType.normal,
    this.onMapCreated,
    this.onTap,
    this.onLongPress,
    this.onCameraMove,
    this.onCameraIdle,
    this.padding,
  });

  @override
  State<WasalniMap> createState() => _WasalniMapState();
}

class _WasalniMapState extends State<WasalniMap> {
  GoogleMapController? _controller;

  // Default position (Bagour, Menoufia)
  static const LatLng _defaultPosition = LatLng(
    LocationService.bagourLatitude,
    LocationService.bagourLongitude,
  );

  // Map style - hide POIs
  static const String _mapStyle = '''
[
  {
    "featureType": "poi",
    "elementType": "labels",
    "stylers": [{"visibility": "off"}]
  },
  {
    "featureType": "transit",
    "stylers": [{"visibility": "simplified"}]
  }
]
''';

  LatLng get _initialPosition => widget.initialPosition ?? _defaultPosition;

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  void _onMapCreated(GoogleMapController controller) {
    _controller = controller;
    widget.onMapCreated?.call(controller);
  }

  @override
  Widget build(BuildContext context) {
    return GoogleMap(
      initialCameraPosition: CameraPosition(
        target: _initialPosition,
        zoom: widget.initialZoom,
      ),
      onMapCreated: _onMapCreated,
      markers: widget.markers ?? {},
      polylines: widget.polylines ?? {},
      circles: widget.circles ?? {},
      myLocationEnabled: widget.showMyLocation,
      myLocationButtonEnabled: widget.showMyLocationButton,
      zoomControlsEnabled: widget.showZoomControls,
      scrollGesturesEnabled: widget.scrollGesturesEnabled,
      zoomGesturesEnabled: widget.zoomGesturesEnabled,
      tiltGesturesEnabled: widget.tiltGesturesEnabled,
      rotateGesturesEnabled: widget.rotateGesturesEnabled,
      mapType: widget.mapType,
      onTap: widget.onTap,
      onLongPress: widget.onLongPress,
      onCameraMove: widget.onCameraMove,
      onCameraIdle: widget.onCameraIdle,
      padding: widget.padding ?? EdgeInsets.zero,
      compassEnabled: false,
      mapToolbarEnabled: false,
      buildingsEnabled: true,
      indoorViewEnabled: false,
      trafficEnabled: false,
      style: _mapStyle,
    );
  }
}

/// Custom marker builder for drivers
class DriverMarkerBuilder {
  static Future<BitmapDescriptor> buildDriverMarker({
    required String vehicleType,
    bool isAvailable = true,
  }) async {
    // Use default marker with color based on availability
    return BitmapDescriptor.defaultMarkerWithHue(
      isAvailable ? BitmapDescriptor.hueGreen : BitmapDescriptor.hueOrange,
    );
  }

  static Future<BitmapDescriptor> buildPickupMarker() async {
    return BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen);
  }

  static Future<BitmapDescriptor> buildDropoffMarker() async {
    return BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueRed);
  }
}

/// Location permission request widget
class LocationPermissionRequest extends StatelessWidget {
  final VoidCallback onRequestPermission;
  final VoidCallback? onOpenSettings;
  final bool isPermanentlyDenied;

  const LocationPermissionRequest({
    super.key,
    required this.onRequestPermission,
    this.onOpenSettings,
    this.isPermanentlyDenied = false,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: EdgeInsets.all(24.w),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.location_off,
              size: 64.sp,
              color: Colors.grey,
            ),
            SizedBox(height: 16.h),
            Text(
              isPermanentlyDenied
                  ? 'تم رفض إذن الموقع'
                  : 'نحتاج إذن الموقع',
              style: AppTextStyles.heading3,
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 8.h),
            Text(
              isPermanentlyDenied
                  ? 'يرجى تفعيل إذن الموقع من إعدادات التطبيق'
                  : 'لتحديد موقعك وإيجاد السائقين القريبين',
              style: AppTextStyles.subtitle,
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 24.h),
            if (isPermanentlyDenied && onOpenSettings != null)
              ElevatedButton(
                onPressed: onOpenSettings,
                child: const Text('فتح الإعدادات'),
              )
            else
              ElevatedButton(
                onPressed: onRequestPermission,
                child: const Text('السماح بالموقع'),
              ),
          ],
        ),
      ),
    );
  }
}

/// Map loading placeholder
class MapLoadingPlaceholder extends StatelessWidget {
  const MapLoadingPlaceholder({super.key});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.grey.shade200,
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const CircularProgressIndicator(color: AppColors.primary),
            SizedBox(height: 16.h),
            Text(
              'جاري تحميل الخريطة...',
              style: AppTextStyles.subtitle,
            ),
          ],
        ),
      ),
    );
  }
}

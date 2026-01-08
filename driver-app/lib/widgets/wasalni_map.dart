import 'package:flutter/material.dart';
import 'package:flutter_map/flutter_map.dart';
import 'package:latlong2/latlong.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';

import '../config/theme.dart';
import '../services/location_service.dart';

// TODO: Switch to Google Maps when billing is ready
// import 'package:google_maps_flutter/google_maps_flutter.dart' as gmaps;

/// Map controller wrapper for flutter_map
class WasalniMapController {
  final MapController _controller = MapController();

  MapController get controller => _controller;

  void moveToLocation(LatLng position, {double zoom = 15.0}) {
    _controller.move(position, zoom);
  }

  void animateToLocation(LatLng position, {double zoom = 15.0}) {
    _controller.move(position, zoom);
  }

  void zoomIn() {
    final currentZoom = _controller.camera.zoom;
    _controller.move(_controller.camera.center, currentZoom + 1);
  }

  void zoomOut() {
    final currentZoom = _controller.camera.zoom;
    _controller.move(_controller.camera.center, currentZoom - 1);
  }

  LatLng get center => _controller.camera.center;
  double get zoom => _controller.camera.zoom;
}

/// Custom marker data for the map
class WasalniMarker {
  final String id;
  final LatLng position;
  final Widget? icon;
  final Color? color;
  final double size;
  final VoidCallback? onTap;

  const WasalniMarker({
    required this.id,
    required this.position,
    this.icon,
    this.color,
    this.size = 40.0,
    this.onTap,
  });
}

/// Custom polyline data
class WasalniPolyline {
  final String id;
  final List<LatLng> points;
  final Color color;
  final double strokeWidth;

  const WasalniPolyline({
    required this.id,
    required this.points,
    this.color = Colors.blue,
    this.strokeWidth = 4.0,
  });
}

/// Custom circle data
class WasalniCircle {
  final String id;
  final LatLng center;
  final double radiusMeters;
  final Color fillColor;
  final Color borderColor;
  final double borderWidth;

  const WasalniCircle({
    required this.id,
    required this.center,
    required this.radiusMeters,
    this.fillColor = const Color(0x304CAF50),
    this.borderColor = Colors.green,
    this.borderWidth = 2.0,
  });
}

/// WasalniMap widget using OpenStreetMap (flutter_map)
/// FREE alternative to Google Maps
class WasalniMap extends StatefulWidget {
  final LatLng? initialPosition;
  final double initialZoom;
  final List<WasalniMarker>? markers;
  final List<WasalniPolyline>? polylines;
  final List<WasalniCircle>? circles;
  final bool showMyLocation;
  final bool showMyLocationButton;
  final bool showZoomControls;
  final bool scrollGesturesEnabled;
  final bool zoomGesturesEnabled;
  final bool rotateGesturesEnabled;
  final Function(WasalniMapController)? onMapCreated;
  final Function(LatLng)? onTap;
  final Function(LatLng)? onLongPress;
  final Function(LatLng, double)? onCameraMove;
  final Function()? onCameraIdle;
  final Widget? myLocationMarker;

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
    this.rotateGesturesEnabled = false,
    this.onMapCreated,
    this.onTap,
    this.onLongPress,
    this.onCameraMove,
    this.onCameraIdle,
    this.myLocationMarker,
  });

  @override
  State<WasalniMap> createState() => _WasalniMapState();
}

class _WasalniMapState extends State<WasalniMap> {
  late final WasalniMapController _mapController;
  LatLng? _myLocation;
  bool _isLoadingLocation = false;

  // Default position (Bagour, Menoufia)
  static final LatLng _defaultPosition = LatLng(
    LocationService.bagourLatitude,
    LocationService.bagourLongitude,
  );

  LatLng get _initialPosition => widget.initialPosition ?? _defaultPosition;

  @override
  void initState() {
    super.initState();
    _mapController = WasalniMapController();
    if (widget.showMyLocation) {
      _loadMyLocation();
    }
  }

  Future<void> _loadMyLocation() async {
    setState(() => _isLoadingLocation = true);
    try {
      final position = await locationService.getCurrentPosition();
      if (position != null && mounted) {
        setState(() {
          _myLocation = LatLng(position.latitude, position.longitude);
          _isLoadingLocation = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isLoadingLocation = false);
      }
    }
  }

  void _goToMyLocation() async {
    if (_myLocation != null) {
      _mapController.animateToLocation(_myLocation!, zoom: 16.0);
    } else {
      await _loadMyLocation();
      if (_myLocation != null) {
        _mapController.animateToLocation(_myLocation!, zoom: 16.0);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        FlutterMap(
          mapController: _mapController.controller,
          options: MapOptions(
            initialCenter: _initialPosition,
            initialZoom: widget.initialZoom,
            minZoom: 5.0,
            maxZoom: 18.0,
            interactionOptions: InteractionOptions(
              flags: (widget.scrollGesturesEnabled ? InteractiveFlag.drag : 0) |
                  (widget.zoomGesturesEnabled
                      ? InteractiveFlag.pinchZoom | InteractiveFlag.doubleTapZoom
                      : 0) |
                  (widget.rotateGesturesEnabled ? InteractiveFlag.rotate : 0),
            ),
            onTap: widget.onTap != null
                ? (tapPosition, point) => widget.onTap!(point)
                : null,
            onLongPress: widget.onLongPress != null
                ? (tapPosition, point) => widget.onLongPress!(point)
                : null,
            onPositionChanged: (position, hasGesture) {
              if (position.center != null) {
                widget.onCameraMove?.call(position.center!, position.zoom ?? widget.initialZoom);
              }
            },
            onMapReady: () {
              widget.onMapCreated?.call(_mapController);
            },
          ),
          children: [
            // OpenStreetMap Tile Layer (FREE)
            TileLayer(
              urlTemplate: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
              userAgentPackageName: 'com.wasalni.driver',
              maxZoom: 19,
            ),

            // Circles layer
            if (widget.circles != null && widget.circles!.isNotEmpty)
              CircleLayer(
                circles: widget.circles!.map((circle) {
                  return CircleMarker(
                    point: circle.center,
                    radius: circle.radiusMeters,
                    useRadiusInMeter: true,
                    color: circle.fillColor,
                    borderColor: circle.borderColor,
                    borderStrokeWidth: circle.borderWidth,
                  );
                }).toList(),
              ),

            // Polylines layer
            if (widget.polylines != null && widget.polylines!.isNotEmpty)
              PolylineLayer(
                polylines: widget.polylines!.map((polyline) {
                  return Polyline(
                    points: polyline.points,
                    color: polyline.color,
                    strokeWidth: polyline.strokeWidth,
                  );
                }).toList(),
              ),

            // Markers layer
            MarkerLayer(
              markers: [
                // Custom markers
                if (widget.markers != null)
                  ...widget.markers!.map((marker) {
                    return Marker(
                      point: marker.position,
                      width: marker.size,
                      height: marker.size,
                      child: GestureDetector(
                        onTap: marker.onTap,
                        child: marker.icon ??
                            Icon(
                              Icons.location_on,
                              color: marker.color ?? AppColors.primary,
                              size: marker.size,
                            ),
                      ),
                    );
                  }),

                // My location marker
                if (widget.showMyLocation && _myLocation != null)
                  Marker(
                    point: _myLocation!,
                    width: 24,
                    height: 24,
                    child: widget.myLocationMarker ??
                        Container(
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                            border: Border.all(color: Colors.white, width: 3),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.2),
                                blurRadius: 6,
                                spreadRadius: 2,
                              ),
                            ],
                          ),
                        ),
                  ),
              ],
            ),
          ],
        ),

        // My location button
        if (widget.showMyLocationButton)
          Positioned(
            right: 16.w,
            bottom: 100.h,
            child: FloatingActionButton.small(
              heroTag: 'myLocation',
              backgroundColor: Colors.white,
              onPressed: _goToMyLocation,
              child: _isLoadingLocation
                  ? SizedBox(
                      width: 20.w,
                      height: 20.w,
                      child: const CircularProgressIndicator(strokeWidth: 2),
                    )
                  : Icon(
                      Icons.my_location,
                      color: AppColors.primary,
                      size: 20.sp,
                    ),
            ),
          ),

        // Zoom controls
        if (widget.showZoomControls)
          Positioned(
            right: 16.w,
            bottom: 160.h,
            child: Column(
              children: [
                FloatingActionButton.small(
                  heroTag: 'zoomIn',
                  backgroundColor: Colors.white,
                  onPressed: _mapController.zoomIn,
                  child: Icon(Icons.add, color: Colors.grey.shade700),
                ),
                SizedBox(height: 8.h),
                FloatingActionButton.small(
                  heroTag: 'zoomOut',
                  backgroundColor: Colors.white,
                  onPressed: _mapController.zoomOut,
                  child: Icon(Icons.remove, color: Colors.grey.shade700),
                ),
              ],
            ),
          ),
      ],
    );
  }
}

/// Marker builders for common use cases
class MarkerBuilder {
  /// Pickup location marker (green)
  static WasalniMarker pickupMarker({
    required String id,
    required LatLng position,
    VoidCallback? onTap,
  }) {
    return WasalniMarker(
      id: id,
      position: position,
      size: 40,
      icon: const Icon(
        Icons.circle,
        color: Colors.green,
        size: 16,
      ),
      onTap: onTap,
    );
  }

  /// Dropoff location marker (red)
  static WasalniMarker dropoffMarker({
    required String id,
    required LatLng position,
    VoidCallback? onTap,
  }) {
    return WasalniMarker(
      id: id,
      position: position,
      size: 40,
      icon: const Icon(
        Icons.location_on,
        color: Colors.red,
        size: 32,
      ),
      onTap: onTap,
    );
  }

  /// Driver marker
  static WasalniMarker driverMarker({
    required String id,
    required LatLng position,
    bool isAvailable = true,
    VoidCallback? onTap,
  }) {
    return WasalniMarker(
      id: id,
      position: position,
      size: 40,
      icon: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: isAvailable ? Colors.green : Colors.orange,
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: 2),
        ),
        child: const Icon(
          Icons.directions_car,
          color: Colors.white,
          size: 20,
        ),
      ),
      onTap: onTap,
    );
  }

  /// Passenger marker
  static WasalniMarker passengerMarker({
    required String id,
    required LatLng position,
    VoidCallback? onTap,
  }) {
    return WasalniMarker(
      id: id,
      position: position,
      size: 40,
      icon: Container(
        padding: const EdgeInsets.all(4),
        decoration: BoxDecoration(
          color: Colors.blue,
          shape: BoxShape.circle,
          border: Border.all(color: Colors.white, width: 2),
        ),
        child: const Icon(
          Icons.person,
          color: Colors.white,
          size: 20,
        ),
      ),
      onTap: onTap,
    );
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
              isPermanentlyDenied ? 'تم رفض إذن الموقع' : 'نحتاج إذن الموقع',
              style: AppTextStyles.heading3,
              textAlign: TextAlign.center,
            ),
            SizedBox(height: 8.h),
            Text(
              isPermanentlyDenied
                  ? 'يرجى تفعيل إذن الموقع من إعدادات التطبيق'
                  : 'لتحديد موقعك وإيجاد الركاب القريبين',
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

/*
// TODO: Switch to Google Maps when billing is ready
// Original Google Maps implementation:

import 'package:google_maps_flutter/google_maps_flutter.dart';

class WasalniMap extends StatefulWidget {
  final LatLng? initialPosition;
  final Set<Marker>? markers;
  final Set<Polyline>? polylines;
  final Set<Circle>? circles;
  final Function(GoogleMapController)? onMapCreated;
  // ... rest of Google Maps implementation
}
*/

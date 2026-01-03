import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';

import '../../config/theme.dart';
import '../../services/location_service.dart';
import '../../services/api_service.dart';
import '../../widgets/wasalni_map.dart';

class LocationPickerScreen extends ConsumerStatefulWidget {
  final bool isPickup;

  const LocationPickerScreen({
    super.key,
    this.isPickup = false,
  });

  @override
  ConsumerState<LocationPickerScreen> createState() => _LocationPickerScreenState();
}

class _LocationPickerScreenState extends ConsumerState<LocationPickerScreen> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();

  GoogleMapController? _mapController;
  LatLng? _selectedLocation;
  String? _selectedAddress;
  bool _isSearching = false;
  bool _isLoadingAddress = false;
  bool _isDragging = false;
  List<PlacePrediction> _searchResults = [];
  Timer? _debounceTimer;

  @override
  void initState() {
    super.initState();
    _initCurrentLocation();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  Future<void> _initCurrentLocation() async {
    final position = await locationService.getCurrentPosition();
    if (mounted && position != null) {
      setState(() {
        _selectedLocation = LatLng(position.latitude, position.longitude);
      });
      _getAddressFromLocation(_selectedLocation!);
    }
  }

  void _onMapCreated(GoogleMapController controller) {
    _mapController = controller;
  }

  void _onCameraMove(CameraPosition position) {
    setState(() {
      _selectedLocation = position.target;
      _isDragging = true;
    });
  }

  void _onCameraIdle() {
    if (_isDragging && _selectedLocation != null) {
      setState(() => _isDragging = false);
      _getAddressFromLocation(_selectedLocation!);
    }
  }

  Future<void> _getAddressFromLocation(LatLng location) async {
    setState(() => _isLoadingAddress = true);

    try {
      final response = await apiService.getAddressFromCoordinates(
        location.latitude,
        location.longitude,
      );

      if (mounted && response.data['success'] == true) {
        final addressData = response.data['data']['address'];
        setState(() {
          _selectedAddress = addressData['shortAddress'] ?? addressData['address'];
          _isLoadingAddress = false;
        });
      } else {
        setState(() {
          _selectedAddress = null;
          _isLoadingAddress = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _selectedAddress = null;
          _isLoadingAddress = false;
        });
      }
    }
  }

  void _onSearchChanged(String query) {
    _debounceTimer?.cancel();

    if (query.isEmpty) {
      setState(() {
        _searchResults = [];
        _isSearching = false;
      });
      return;
    }

    _debounceTimer = Timer(const Duration(milliseconds: 300), () {
      _searchPlaces(query);
    });
  }

  Future<void> _searchPlaces(String query) async {
    setState(() => _isSearching = true);

    try {
      final response = await apiService.searchPlaces(
        query,
        _selectedLocation?.latitude,
        _selectedLocation?.longitude,
      );

      if (mounted && response.data['success'] == true) {
        final places = (response.data['data']['places'] as List)
            .map((p) => PlacePrediction.fromJson(p))
            .toList();
        setState(() {
          _searchResults = places;
          _isSearching = false;
        });
      } else {
        setState(() {
          _searchResults = [];
          _isSearching = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _searchResults = [];
          _isSearching = false;
        });
      }
    }
  }

  Future<void> _selectPlace(PlacePrediction place) async {
    _searchFocusNode.unfocus();
    _searchController.clear();
    setState(() {
      _searchResults = [];
    });

    try {
      final response = await apiService.getPlaceDetails(place.placeId);

      if (mounted && response.data['success'] == true) {
        final placeData = response.data['data']['place'];
        final location = LatLng(
          placeData['location']['lat'],
          placeData['location']['lng'],
        );

        setState(() {
          _selectedLocation = location;
          _selectedAddress = place.description;
        });

        _mapController?.animateCamera(
          CameraUpdate.newLatLngZoom(location, 16),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('فشل في تحديد الموقع')),
        );
      }
    }
  }

  void _confirmLocation() {
    if (_selectedLocation != null && _selectedAddress != null) {
      // Return the selected location and address
      context.pop({
        'location': _selectedLocation,
        'address': _selectedAddress,
        'isPickup': widget.isPickup,
      });
    }
  }

  void _goToCurrentLocation() async {
    final position = await locationService.getCurrentPosition();
    if (position != null && _mapController != null) {
      final location = LatLng(position.latitude, position.longitude);
      _mapController!.animateCamera(
        CameraUpdate.newLatLngZoom(location, 16),
      );
      setState(() => _selectedLocation = location);
      _getAddressFromLocation(location);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Map
          WasalniMap(
            initialPosition: _selectedLocation,
            showMyLocation: true,
            onMapCreated: _onMapCreated,
            onCameraMove: _onCameraMove,
            onCameraIdle: _onCameraIdle,
            padding: EdgeInsets.only(bottom: 150.h),
          ),

          // Center Pin
          Center(
            child: Padding(
              padding: EdgeInsets.only(bottom: 32.h),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                transform: Matrix4.translationValues(0, _isDragging ? -10 : 0, 0),
                child: Icon(
                  Icons.location_pin,
                  size: 48.sp,
                  color: widget.isPickup ? AppColors.success : AppColors.primary,
                ),
              ),
            ),
          ),

          // Search Bar
          SafeArea(
            child: Column(
              children: [
                Container(
                  margin: EdgeInsets.all(16.w),
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
                  child: Row(
                    children: [
                      IconButton(
                        icon: const Icon(Icons.arrow_back),
                        onPressed: () => context.pop(),
                      ),
                      Expanded(
                        child: TextField(
                          controller: _searchController,
                          focusNode: _searchFocusNode,
                          decoration: InputDecoration(
                            hintText: widget.isPickup
                                ? 'أين موقع الالتقاط؟'
                                : 'إلى أين تريد الذهاب؟',
                            border: InputBorder.none,
                            contentPadding: EdgeInsets.symmetric(
                              horizontal: 8.w,
                              vertical: 14.h,
                            ),
                          ),
                          onChanged: _onSearchChanged,
                        ),
                      ),
                      if (_isSearching)
                        Padding(
                          padding: EdgeInsets.all(12.w),
                          child: SizedBox(
                            width: 20.w,
                            height: 20.w,
                            child: const CircularProgressIndicator(strokeWidth: 2),
                          ),
                        )
                      else if (_searchController.text.isNotEmpty)
                        IconButton(
                          icon: const Icon(Icons.clear),
                          onPressed: () {
                            _searchController.clear();
                            setState(() => _searchResults = []);
                          },
                        ),
                    ],
                  ),
                ),

                // Search Results
                if (_searchResults.isNotEmpty)
                  Expanded(
                    child: Container(
                      margin: EdgeInsets.symmetric(horizontal: 16.w),
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
                      child: ListView.separated(
                        padding: EdgeInsets.zero,
                        shrinkWrap: true,
                        itemCount: _searchResults.length,
                        separatorBuilder: (_, __) => const Divider(height: 1),
                        itemBuilder: (context, index) {
                          final place = _searchResults[index];
                          return ListTile(
                            leading: const Icon(Icons.location_on_outlined),
                            title: Text(
                              place.mainText,
                              style: AppTextStyles.body,
                            ),
                            subtitle: Text(
                              place.secondaryText,
                              style: AppTextStyles.caption,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                            onTap: () => _selectPlace(place),
                          );
                        },
                      ),
                    ),
                  ),
              ],
            ),
          ),

          // Current Location Button
          Positioned(
            right: 16.w,
            bottom: 180.h,
            child: FloatingActionButton.small(
              heroTag: 'currentLocation',
              onPressed: _goToCurrentLocation,
              backgroundColor: Colors.white,
              child: const Icon(Icons.my_location, color: AppColors.primary),
            ),
          ),

          // Bottom Confirmation Bar
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
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        widget.isPickup ? Icons.trip_origin : Icons.location_on,
                        color: widget.isPickup ? AppColors.success : AppColors.primary,
                      ),
                      SizedBox(width: 12.w),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              widget.isPickup ? 'موقع الالتقاط' : 'الوجهة',
                              style: AppTextStyles.caption,
                            ),
                            SizedBox(height: 4.h),
                            _isLoadingAddress
                                ? Text(
                                    'جاري تحديد العنوان...',
                                    style: AppTextStyles.body.copyWith(
                                      color: AppColors.textHint,
                                    ),
                                  )
                                : Text(
                                    _selectedAddress ?? 'حرك الخريطة لتحديد الموقع',
                                    style: AppTextStyles.body,
                                    maxLines: 2,
                                    overflow: TextOverflow.ellipsis,
                                  ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 16.h),
                  SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed:
                          _selectedLocation != null && _selectedAddress != null
                              ? _confirmLocation
                              : null,
                      child: Text(
                        'تأكيد الموقع',
                        style: AppTextStyles.button.copyWith(color: Colors.white),
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
}

class PlacePrediction {
  final String placeId;
  final String description;
  final String mainText;
  final String secondaryText;

  PlacePrediction({
    required this.placeId,
    required this.description,
    required this.mainText,
    required this.secondaryText,
  });

  factory PlacePrediction.fromJson(Map<String, dynamic> json) {
    return PlacePrediction(
      placeId: json['placeId'] ?? '',
      description: json['description'] ?? '',
      mainText: json['mainText'] ?? '',
      secondaryText: json['secondaryText'] ?? '',
    );
  }
}

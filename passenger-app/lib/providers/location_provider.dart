import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';

import '../config/app_config.dart';

// Location State
class LocationState {
  final double? latitude;
  final double? longitude;
  final String? address;
  final bool isLoading;
  final bool hasPermission;
  final String? errorMessage;

  const LocationState({
    this.latitude,
    this.longitude,
    this.address,
    this.isLoading = false,
    this.hasPermission = false,
    this.errorMessage,
  });

  bool get hasLocation => latitude != null && longitude != null;

  LocationState copyWith({
    double? latitude,
    double? longitude,
    String? address,
    bool? isLoading,
    bool? hasPermission,
    String? errorMessage,
  }) {
    return LocationState(
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      address: address ?? this.address,
      isLoading: isLoading ?? this.isLoading,
      hasPermission: hasPermission ?? this.hasPermission,
      errorMessage: errorMessage ?? this.errorMessage,
    );
  }
}

// Location Notifier
class LocationNotifier extends StateNotifier<LocationState> {
  LocationNotifier() : super(const LocationState());

  Future<bool> _checkLocationService() async {
    bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      state = state.copyWith(
        errorMessage: 'خدمة الموقع غير مفعلة. الرجاء تفعيلها من الإعدادات.',
        hasPermission: false,
      );
      return false;
    }
    return true;
  }

  Future<void> checkPermission() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      // Check if location services are enabled
      if (!await _checkLocationService()) {
        state = state.copyWith(isLoading: false);
        return;
      }

      // Check permission status
      LocationPermission permission = await Geolocator.checkPermission();

      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          state = state.copyWith(
            isLoading: false,
            hasPermission: false,
            errorMessage: 'تم رفض إذن الموقع',
          );
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        state = state.copyWith(
          isLoading: false,
          hasPermission: false,
          errorMessage: 'تم رفض إذن الموقع بشكل دائم. الرجاء تفعيله من إعدادات التطبيق.',
        );
        return;
      }

      state = state.copyWith(
        isLoading: false,
        hasPermission: true,
        errorMessage: null,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'حدث خطأ أثناء التحقق من الإذن: ${e.toString()}',
      );
    }
  }

  Future<void> getCurrentLocation() async {
    state = state.copyWith(isLoading: true, errorMessage: null);
    try {
      // First check permission
      if (!state.hasPermission) {
        await checkPermission();
        if (!state.hasPermission) {
          state = state.copyWith(isLoading: false);
          return;
        }
      }

      // Check location service
      if (!await _checkLocationService()) {
        // Fallback to default location
        state = state.copyWith(
          latitude: AppConfig.defaultLatitude,
          longitude: AppConfig.defaultLongitude,
          address: 'الباجور، المنوفية',
          isLoading: false,
        );
        return;
      }

      // Get current position
      final position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
        timeLimit: const Duration(seconds: 15),
      );

      state = state.copyWith(
        latitude: position.latitude,
        longitude: position.longitude,
        isLoading: false,
        hasPermission: true,
        errorMessage: null,
      );
    } catch (e) {
      // On error, fallback to default location
      state = state.copyWith(
        latitude: AppConfig.defaultLatitude,
        longitude: AppConfig.defaultLongitude,
        address: 'الباجور، المنوفية',
        isLoading: false,
        errorMessage: 'تعذر الحصول على الموقع الحالي، تم استخدام الموقع الافتراضي',
      );
    }
  }

  void setLocation(double lat, double lng, String? address) {
    state = state.copyWith(
      latitude: lat,
      longitude: lng,
      address: address,
    );
  }

  void clearError() {
    state = state.copyWith(errorMessage: null);
  }

  Future<void> openLocationSettings() async {
    await Geolocator.openLocationSettings();
  }

  Future<void> openAppSettings() async {
    await Geolocator.openAppSettings();
  }
}

// Provider
final locationProvider = StateNotifierProvider<LocationNotifier, LocationState>((ref) {
  return LocationNotifier();
});

// Saved Places Provider
class SavedPlace {
  final String id;
  final String name;
  final String address;
  final double latitude;
  final double longitude;
  final String type; // home, work, favorite

  const SavedPlace({
    required this.id,
    required this.name,
    required this.address,
    required this.latitude,
    required this.longitude,
    required this.type,
  });
}

class SavedPlacesNotifier extends StateNotifier<List<SavedPlace>> {
  SavedPlacesNotifier() : super([]);

  void addPlace(SavedPlace place) {
    state = [...state, place];
  }

  void removePlace(String id) {
    state = state.where((p) => p.id != id).toList();
  }

  void updatePlace(SavedPlace place) {
    state = state.map((p) => p.id == place.id ? place : p).toList();
  }

  SavedPlace? getPlaceByType(String type) {
    try {
      return state.firstWhere((p) => p.type == type);
    } catch (e) {
      return null;
    }
  }
}

final savedPlacesProvider = StateNotifierProvider<SavedPlacesNotifier, List<SavedPlace>>((ref) {
  return SavedPlacesNotifier();
});

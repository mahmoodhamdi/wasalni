import 'package:flutter_riverpod/flutter_riverpod.dart';

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

  Future<void> checkPermission() async {
    state = state.copyWith(isLoading: true);
    try {
      // TODO: Check location permission using geolocator
      await Future.delayed(const Duration(milliseconds: 500));
      state = state.copyWith(
        isLoading: false,
        hasPermission: true,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: e.toString(),
      );
    }
  }

  Future<void> getCurrentLocation() async {
    state = state.copyWith(isLoading: true);
    try {
      // TODO: Get current location using geolocator
      await Future.delayed(const Duration(seconds: 1));

      // For now, use default location (Bagour)
      state = state.copyWith(
        latitude: AppConfig.defaultLatitude,
        longitude: AppConfig.defaultLongitude,
        address: 'الباجور، المنوفية',
        isLoading: false,
        hasPermission: true,
      );
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: e.toString(),
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

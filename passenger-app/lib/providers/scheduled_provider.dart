import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_service.dart';

// Scheduled Trip Model
class ScheduledTrip {
  final String id;
  final String tripNumber;
  final TripLocation pickup;
  final TripLocation dropoff;
  final DateTime scheduledTime;
  final String rideType;
  final double estimatedFare;
  final ScheduledTripStatus status;
  final DriverInfo? driverInfo;

  ScheduledTrip({
    required this.id,
    required this.tripNumber,
    required this.pickup,
    required this.dropoff,
    required this.scheduledTime,
    required this.rideType,
    required this.estimatedFare,
    required this.status,
    this.driverInfo,
  });

  factory ScheduledTrip.fromJson(Map<String, dynamic> json) {
    return ScheduledTrip(
      id: json['tripId'] ?? json['id'] ?? '',
      tripNumber: json['tripNumber'] ?? '',
      pickup: TripLocation.fromJson(json['pickup'] ?? {}),
      dropoff: TripLocation.fromJson(json['dropoff'] ?? {}),
      scheduledTime: DateTime.parse(json['scheduledTime']),
      rideType: json['rideType'] ?? 'economy',
      estimatedFare: (json['estimatedFare'] ?? 0).toDouble(),
      status: ScheduledTripStatus.fromString(json['status'] ?? 'upcoming'),
      driverInfo: json['driverInfo'] != null
          ? DriverInfo.fromJson(json['driverInfo'])
          : null,
    );
  }
}

// Trip Location
class TripLocation {
  final String address;
  final double latitude;
  final double longitude;
  final String? name;

  TripLocation({
    required this.address,
    required this.latitude,
    required this.longitude,
    this.name,
  });

  factory TripLocation.fromJson(Map<String, dynamic> json) {
    return TripLocation(
      address: json['address'] ?? '',
      latitude: (json['latitude'] ?? 0).toDouble(),
      longitude: (json['longitude'] ?? 0).toDouble(),
      name: json['name'],
    );
  }

  Map<String, dynamic> toJson() => {
        'address': address,
        'latitude': latitude,
        'longitude': longitude,
        if (name != null) 'name': name,
      };
}

// Driver Info
class DriverInfo {
  final String name;
  final String phone;
  final String vehicle;
  final String plateNumber;

  DriverInfo({
    required this.name,
    required this.phone,
    required this.vehicle,
    required this.plateNumber,
  });

  factory DriverInfo.fromJson(Map<String, dynamic> json) {
    return DriverInfo(
      name: json['name'] ?? '',
      phone: json['phone'] ?? '',
      vehicle: json['vehicle'] ?? '',
      plateNumber: json['plateNumber'] ?? '',
    );
  }
}

// Scheduled Trip Status
enum ScheduledTripStatus {
  upcoming,
  searching,
  assigned,
  cancelled;

  static ScheduledTripStatus fromString(String value) {
    switch (value) {
      case 'upcoming':
        return ScheduledTripStatus.upcoming;
      case 'searching':
        return ScheduledTripStatus.searching;
      case 'assigned':
        return ScheduledTripStatus.assigned;
      case 'cancelled':
        return ScheduledTripStatus.cancelled;
      default:
        return ScheduledTripStatus.upcoming;
    }
  }

  String get displayName {
    switch (this) {
      case ScheduledTripStatus.upcoming:
        return 'قادمة';
      case ScheduledTripStatus.searching:
        return 'جاري البحث';
      case ScheduledTripStatus.assigned:
        return 'تم التعيين';
      case ScheduledTripStatus.cancelled:
        return 'ملغاة';
    }
  }
}

// Time Slot
class TimeSlot {
  final DateTime time;
  final bool isAvailable;

  TimeSlot({
    required this.time,
    this.isAvailable = true,
  });
}

// Scheduled Trips Stats
class ScheduledTripsStats {
  final int total;
  final int upcoming;
  final int completed;
  final int cancelled;

  ScheduledTripsStats({
    required this.total,
    required this.upcoming,
    required this.completed,
    required this.cancelled,
  });

  factory ScheduledTripsStats.fromJson(Map<String, dynamic> json) {
    return ScheduledTripsStats(
      total: json['total'] ?? 0,
      upcoming: json['upcoming'] ?? 0,
      completed: json['completed'] ?? 0,
      cancelled: json['cancelled'] ?? 0,
    );
  }
}

// Scheduled State
class ScheduledState {
  final List<ScheduledTrip> upcomingTrips;
  final ScheduledTripsStats? stats;
  final List<TimeSlot> availableSlots;
  final bool isLoading;
  final String? errorMessage;
  final int currentPage;
  final bool hasMore;

  ScheduledState({
    this.upcomingTrips = const [],
    this.stats,
    this.availableSlots = const [],
    this.isLoading = false,
    this.errorMessage,
    this.currentPage = 1,
    this.hasMore = true,
  });

  ScheduledState copyWith({
    List<ScheduledTrip>? upcomingTrips,
    ScheduledTripsStats? stats,
    List<TimeSlot>? availableSlots,
    bool? isLoading,
    String? errorMessage,
    int? currentPage,
    bool? hasMore,
  }) {
    return ScheduledState(
      upcomingTrips: upcomingTrips ?? this.upcomingTrips,
      stats: stats ?? this.stats,
      availableSlots: availableSlots ?? this.availableSlots,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: errorMessage,
      currentPage: currentPage ?? this.currentPage,
      hasMore: hasMore ?? this.hasMore,
    );
  }
}

// Scheduled Notifier
class ScheduledNotifier extends StateNotifier<ScheduledState> {
  final ApiService _apiService;

  ScheduledNotifier(this._apiService) : super(ScheduledState());

  // Load upcoming scheduled trips
  Future<void> loadUpcomingTrips({bool refresh = false}) async {
    if (state.isLoading) return;

    final page = refresh ? 1 : state.currentPage;

    state = state.copyWith(
      isLoading: true,
      errorMessage: null,
      currentPage: page,
    );

    try {
      final response = await _apiService.getScheduledTrips(page: page);

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'];
        final trips = (data['trips'] as List)
            .map((t) => ScheduledTrip.fromJson(t))
            .toList();
        final hasMore = data['hasMore'] ?? false;

        state = state.copyWith(
          upcomingTrips: refresh ? trips : [...state.upcomingTrips, ...trips],
          isLoading: false,
          hasMore: hasMore,
          currentPage: page + 1,
        );
      } else {
        throw Exception(response.data['messageAr'] ?? 'فشل تحميل الرحلات');
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: e.toString(),
      );
    }
  }

  // Load available time slots
  Future<void> loadAvailableSlots(DateTime date) async {
    // Don't set loading state for slots - it's a background operation
    try {
      final response = await _apiService.getScheduledSlots(date);

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'];
        final slotsData = data['slots'];
        if (slotsData != null && slotsData is List) {
          final slots = slotsData
              .map((s) => TimeSlot(time: DateTime.parse(s.toString())))
              .toList();

          state = state.copyWith(availableSlots: slots);
        }
      }
    } catch (e) {
      // Silent failure for slots - not critical
      // Silent failure - slots are optional
    }
  }

  // Create scheduled trip
  Future<ScheduledTrip?> createScheduledTrip({
    required TripLocation pickup,
    required TripLocation dropoff,
    required String rideType,
    required DateTime scheduledTime,
    String? paymentMethod,
    String? promoCode,
    String? notes,
  }) async {
    state = state.copyWith(isLoading: true, errorMessage: null);

    try {
      final response = await _apiService.createScheduledTrip(
        pickup: pickup.toJson(),
        dropoff: dropoff.toJson(),
        rideType: rideType,
        scheduledTime: scheduledTime.toIso8601String(),
        paymentMethod: paymentMethod,
        promoCode: promoCode,
        notes: notes,
      );

      if (response.statusCode == 201 && response.data['success'] == true) {
        final tripData = response.data['data']['trip'];
        final trip = ScheduledTrip(
          id: tripData['id'] ?? '',
          tripNumber: tripData['tripNumber'] ?? '',
          pickup: pickup,
          dropoff: dropoff,
          scheduledTime: scheduledTime,
          rideType: rideType,
          estimatedFare: tripData['estimatedFare'] != null
              ? (tripData['estimatedFare']['max'] ?? 0).toDouble()
              : 0.0,
          status: ScheduledTripStatus.upcoming,
        );

        state = state.copyWith(
          upcomingTrips: [trip, ...state.upcomingTrips],
          isLoading: false,
        );

        return trip;
      } else {
        throw Exception(response.data['messageAr'] ?? 'فشل إنشاء الرحلة');
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: e.toString(),
      );
      return null;
    }
  }

  // Modify scheduled trip time
  Future<bool> modifyTripTime(String tripId, DateTime newTime) async {
    state = state.copyWith(isLoading: true, errorMessage: null);

    try {
      final response = await _apiService.modifyScheduledTime(tripId, newTime);

      if (response.statusCode == 200 && response.data['success'] == true) {
        // Update local state
        final updatedTrips = state.upcomingTrips.map((trip) {
          if (trip.id == tripId) {
            return ScheduledTrip(
              id: trip.id,
              tripNumber: trip.tripNumber,
              pickup: trip.pickup,
              dropoff: trip.dropoff,
              scheduledTime: newTime,
              rideType: trip.rideType,
              estimatedFare: trip.estimatedFare,
              status: trip.status,
              driverInfo: trip.driverInfo,
            );
          }
          return trip;
        }).toList();

        state = state.copyWith(
          upcomingTrips: updatedTrips,
          isLoading: false,
        );

        return true;
      } else {
        throw Exception(response.data['messageAr'] ?? 'فشل تعديل الموعد');
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: e.toString(),
      );
      return false;
    }
  }

  // Cancel scheduled trip
  Future<bool> cancelTrip(String tripId, {String? reason}) async {
    state = state.copyWith(isLoading: true, errorMessage: null);

    try {
      final response = await _apiService.cancelScheduledTrip(tripId, reason: reason);

      if (response.statusCode == 200 && response.data['success'] == true) {
        // Remove from local state
        final updatedTrips = state.upcomingTrips
            .where((trip) => trip.id != tripId)
            .toList();

        state = state.copyWith(
          upcomingTrips: updatedTrips,
          isLoading: false,
        );

        return true;
      } else {
        throw Exception(response.data['messageAr'] ?? 'فشل إلغاء الرحلة');
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: e.toString(),
      );
      return false;
    }
  }

  // Load stats
  Future<void> loadStats({DateTime? startDate, DateTime? endDate}) async {
    try {
      final response = await _apiService.getScheduledStats(
        startDate: startDate,
        endDate: endDate,
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final statsData = response.data['data']['stats'];
        final stats = ScheduledTripsStats.fromJson(statsData);

        state = state.copyWith(stats: stats);
      }
    } catch (e) {
      // Silent failure for stats
    }
  }

  void clearError() {
    state = state.copyWith(errorMessage: null);
  }
}

// Provider
final scheduledProvider =
    StateNotifierProvider<ScheduledNotifier, ScheduledState>((ref) {
  final apiService = ref.watch(apiServiceProvider);
  return ScheduledNotifier(apiService);
});

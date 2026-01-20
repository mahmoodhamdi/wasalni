import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';

import '../services/api_service.dart';
import '../services/socket_service.dart';

// Driver Trip Status
enum DriverTripStatus {
  idle,          // No active trip
  requested,     // Trip request received, waiting for decision
  accepted,      // Trip accepted, heading to pickup
  arrived,       // Arrived at pickup, waiting for passenger
  inProgress,    // Trip in progress
  completed,     // Trip completed
}

// Location Point
class LocationPoint {
  final double latitude;
  final double longitude;
  final String? address;

  const LocationPoint({
    required this.latitude,
    required this.longitude,
    this.address,
  });

  LatLng get latLng => LatLng(latitude, longitude);

  factory LocationPoint.fromJson(Map<String, dynamic> json) => LocationPoint(
        latitude: (json['latitude'] ?? json['lat'] ?? 0).toDouble(),
        longitude: (json['longitude'] ?? json['lng'] ?? 0).toDouble(),
        address: json['address'] as String?,
      );
}

// Passenger Info
class PassengerInfo {
  final String id;
  final String name;
  final String phone;
  final String? avatar;
  final double rating;

  const PassengerInfo({
    required this.id,
    required this.name,
    required this.phone,
    this.avatar,
    required this.rating,
  });

  factory PassengerInfo.fromJson(Map<String, dynamic> json) {
    final user = json['userId'] ?? json;
    return PassengerInfo(
      id: json['_id'] ?? json['id'] ?? '',
      name: user['name'] ?? json['name'] ?? '',
      phone: user['phone'] ?? json['phone'] ?? '',
      avatar: user['avatar'] ?? json['avatar'],
      rating: (json['rating'] ?? 5.0).toDouble(),
    );
  }
}

// Trip Request
class TripRequest {
  final String tripId;
  final String tripNumber;
  final LocationPoint pickup;
  final LocationPoint dropoff;
  final String rideType;
  final double estimatedFare;
  final double distanceKm;
  final int durationMinutes;
  final String paymentMethod;
  final PassengerInfo? passenger;
  final DateTime requestedAt;
  final int timeoutSeconds;

  const TripRequest({
    required this.tripId,
    required this.tripNumber,
    required this.pickup,
    required this.dropoff,
    required this.rideType,
    required this.estimatedFare,
    required this.distanceKm,
    required this.durationMinutes,
    required this.paymentMethod,
    this.passenger,
    required this.requestedAt,
    this.timeoutSeconds = 30,
  });

  factory TripRequest.fromJson(Map<String, dynamic> json) {
    // Handle estimatedFare which can be a number or an object {min, max}
    double fare = 0;
    final estimatedFare = json['estimatedFare'] ?? json['fare'];
    if (estimatedFare is num) {
      fare = estimatedFare.toDouble();
    } else if (estimatedFare is Map) {
      // Use average of min and max
      final min = (estimatedFare['min'] ?? 0).toDouble();
      final max = (estimatedFare['max'] ?? 0).toDouble();
      fare = (min + max) / 2;
    }

    // Handle distance which might be in meters
    double distanceKm = 0;
    final distance = json['distanceKm'] ?? json['distance'];
    if (distance is num) {
      // If value is > 100, assume it's meters
      distanceKm = distance > 100 ? distance / 1000 : distance.toDouble();
    }

    return TripRequest(
      tripId: json['tripId'] ?? json['_id'] ?? '',
      tripNumber: json['tripNumber'] ?? '',
      pickup: LocationPoint.fromJson(json['pickup'] ?? {}),
      dropoff: LocationPoint.fromJson(json['dropoff'] ?? {}),
      rideType: json['rideType'] ?? 'economy',
      estimatedFare: fare,
      distanceKm: distanceKm,
      durationMinutes: (json['durationMinutes'] ?? json['duration'] ?? 0).toInt(),
      paymentMethod: json['paymentMethod'] ?? 'cash',
      passenger: json['passenger'] != null
          ? PassengerInfo.fromJson(json['passenger'])
          : null,
      requestedAt: json['requestedAt'] != null
          ? DateTime.parse(json['requestedAt'])
          : DateTime.now(),
      timeoutSeconds: json['timeout'] ?? json['timeoutSeconds'] ?? 30,
    );
  }

  String get rideTypeAr {
    switch (rideType) {
      case 'economy':
        return 'اقتصادي';
      case 'comfort':
        return 'مريح';
      case 'family':
        return 'عائلي';
      case 'tuktuk':
        return 'توكتوك';
      case 'motorcycle':
        return 'موتوسيكل';
      default:
        return rideType;
    }
  }

  String get paymentMethodAr {
    switch (paymentMethod) {
      case 'cash':
        return 'نقدي';
      case 'wallet':
        return 'المحفظة';
      case 'card':
        return 'بطاقة';
      default:
        return paymentMethod;
    }
  }
}

// Fare Breakdown
class FareBreakdown {
  final double baseFare;
  final double distanceFare;
  final double timeFare;
  final double waitingFare;
  final double surgeAmount;
  final double bookingFee;
  final double discount;
  final double total;
  final double driverEarnings;

  const FareBreakdown({
    required this.baseFare,
    required this.distanceFare,
    required this.timeFare,
    this.waitingFare = 0,
    this.surgeAmount = 0,
    required this.bookingFee,
    this.discount = 0,
    required this.total,
    required this.driverEarnings,
  });

  factory FareBreakdown.fromJson(Map<String, dynamic> json) => FareBreakdown(
        baseFare: (json['baseFare'] ?? 0).toDouble(),
        distanceFare: (json['distanceFare'] ?? 0).toDouble(),
        timeFare: (json['timeFare'] ?? 0).toDouble(),
        waitingFare: (json['waitingFare'] ?? 0).toDouble(),
        surgeAmount: (json['surgeAmount'] ?? 0).toDouble(),
        bookingFee: (json['bookingFee'] ?? 0).toDouble(),
        discount: (json['discount'] ?? 0).toDouble(),
        total: (json['total'] ?? 0).toDouble(),
        driverEarnings: (json['driverEarnings'] ?? 0).toDouble(),
      );
}

// Trip State
class DriverTripState {
  final DriverTripStatus status;
  final TripRequest? currentRequest;
  final String? tripId;
  final String? tripNumber;
  final LocationPoint? pickup;
  final LocationPoint? dropoff;
  final PassengerInfo? passenger;
  final FareBreakdown? fareBreakdown;
  final double? passengerLat;
  final double? passengerLng;
  final bool isLoading;
  final String? errorMessage;

  const DriverTripState({
    this.status = DriverTripStatus.idle,
    this.currentRequest,
    this.tripId,
    this.tripNumber,
    this.pickup,
    this.dropoff,
    this.passenger,
    this.fareBreakdown,
    this.passengerLat,
    this.passengerLng,
    this.isLoading = false,
    this.errorMessage,
  });

  bool get hasActiveTrip =>
      status != DriverTripStatus.idle && status != DriverTripStatus.completed;

  bool get hasPendingRequest => currentRequest != null && status == DriverTripStatus.requested;

  DriverTripState copyWith({
    DriverTripStatus? status,
    TripRequest? currentRequest,
    String? tripId,
    String? tripNumber,
    LocationPoint? pickup,
    LocationPoint? dropoff,
    PassengerInfo? passenger,
    FareBreakdown? fareBreakdown,
    double? passengerLat,
    double? passengerLng,
    bool? isLoading,
    String? errorMessage,
    bool clearRequest = false,
    bool clearTrip = false,
    bool clearError = false,
  }) {
    return DriverTripState(
      status: status ?? this.status,
      currentRequest: clearRequest ? null : (currentRequest ?? this.currentRequest),
      tripId: clearTrip ? null : (tripId ?? this.tripId),
      tripNumber: clearTrip ? null : (tripNumber ?? this.tripNumber),
      pickup: clearTrip ? null : (pickup ?? this.pickup),
      dropoff: clearTrip ? null : (dropoff ?? this.dropoff),
      passenger: clearTrip ? null : (passenger ?? this.passenger),
      fareBreakdown: clearTrip ? null : (fareBreakdown ?? this.fareBreakdown),
      passengerLat: passengerLat ?? this.passengerLat,
      passengerLng: passengerLng ?? this.passengerLng,
      isLoading: isLoading ?? this.isLoading,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }

  DriverTripState reset() => const DriverTripState();
}

// Trip Notifier
class DriverTripNotifier extends StateNotifier<DriverTripState> {
  DriverTripNotifier() : super(const DriverTripState()) {
    _setupSocketListeners();
  }

  void _setupSocketListeners() {
    // Listen for incoming trip requests
    socketService.on('trip:request', (data) {
      final request = TripRequest.fromJson(data);
      state = state.copyWith(
        status: DriverTripStatus.requested,
        currentRequest: request,
      );
    });

    // Trip assigned (after accepting)
    socketService.on('trip:assigned', (data) {
      final tripId = data['tripId'] ?? data['_id'];
      state = state.copyWith(
        status: DriverTripStatus.accepted,
        tripId: tripId,
        tripNumber: data['tripNumber'],
        pickup: data['pickup'] != null ? LocationPoint.fromJson(data['pickup']) : null,
        dropoff: data['dropoff'] != null ? LocationPoint.fromJson(data['dropoff']) : null,
        passenger: data['passenger'] != null
            ? PassengerInfo.fromJson(data['passenger'])
            : null,
        clearRequest: true,
      );

      // Join the trip room for real-time updates
      socketService.joinTripRoom(tripId);
    });

    // Trip cancelled by passenger
    socketService.on('trip:cancelled', (data) {
      if (state.tripId == data['tripId'] || state.currentRequest?.tripId == data['tripId']) {
        state = state.copyWith(
          status: DriverTripStatus.idle,
          errorMessage: data['messageAr'] ?? 'تم إلغاء الرحلة من قبل الراكب',
          clearRequest: true,
          clearTrip: true,
        );
      }
    });

    // Passenger location update
    socketService.on('passenger:location', (data) {
      if (state.tripId == data['tripId']) {
        state = state.copyWith(
          passengerLat: data['latitude']?.toDouble(),
          passengerLng: data['longitude']?.toDouble(),
        );
      }
    });
  }

  void receiveTripRequest(TripRequest request) {
    state = state.copyWith(
      status: DriverTripStatus.requested,
      currentRequest: request,
    );
  }

  Future<bool> acceptTrip() async {
    if (state.currentRequest == null) return false;

    final tripId = state.currentRequest!.tripId;
    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final response = await apiService.acceptTrip(tripId);

      if (response.data['success'] == true) {
        final data = response.data['data']?['trip'] ?? response.data['data'];

        // Join the trip room
        socketService.joinTripRoom(tripId);
        socketService.acceptTripRequest(tripId);

        state = state.copyWith(
          status: DriverTripStatus.accepted,
          tripId: tripId,
          tripNumber: state.currentRequest!.tripNumber,
          pickup: state.currentRequest!.pickup,
          dropoff: state.currentRequest!.dropoff,
          passenger: state.currentRequest!.passenger ??
              (data['passenger'] != null ? PassengerInfo.fromJson(data['passenger']) : null),
          isLoading: false,
          clearRequest: true,
        );
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: response.data['messageAr'] ?? 'فشل في قبول الرحلة',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'فشل في الاتصال بالخادم',
      );
      return false;
    }
  }

  Future<void> rejectTrip({String? reason}) async {
    if (state.currentRequest == null) return;

    final tripId = state.currentRequest!.tripId;

    try {
      await apiService.rejectTrip(tripId);
      socketService.rejectTripRequest(tripId, reason: reason);
    } catch (e) {
      // Silently fail - rejection is optional
    }

    state = state.copyWith(
      status: DriverTripStatus.idle,
      clearRequest: true,
    );
  }

  Future<bool> arrivedAtPickup() async {
    if (state.tripId == null) return false;

    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final response = await apiService.arrivedAtPickup(state.tripId!);

      if (response.data['success'] == true) {
        socketService.notifyArrival(state.tripId!);
        state = state.copyWith(
          status: DriverTripStatus.arrived,
          isLoading: false,
        );
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: response.data['messageAr'] ?? 'فشل في تحديث الحالة',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'فشل في الاتصال بالخادم',
      );
      return false;
    }
  }

  Future<bool> startTrip() async {
    if (state.tripId == null) return false;

    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final response = await apiService.startTrip(state.tripId!);

      if (response.data['success'] == true) {
        socketService.startTrip(state.tripId!);
        state = state.copyWith(
          status: DriverTripStatus.inProgress,
          isLoading: false,
        );
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: response.data['messageAr'] ?? 'فشل في بدء الرحلة',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'فشل في الاتصال بالخادم',
      );
      return false;
    }
  }

  Future<bool> completeTrip() async {
    if (state.tripId == null) return false;

    state = state.copyWith(isLoading: true, clearError: true);

    try {
      final response = await apiService.completeTrip(state.tripId!);

      if (response.data['success'] == true) {
        final data = response.data['data'];
        final fare = data['fare'] != null ? FareBreakdown.fromJson(data['fare']) : null;

        socketService.completeTrip(state.tripId!);

        state = state.copyWith(
          status: DriverTripStatus.completed,
          fareBreakdown: fare,
          isLoading: false,
        );
        return true;
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: response.data['messageAr'] ?? 'فشل في إنهاء الرحلة',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'فشل في الاتصال بالخادم',
      );
      return false;
    }
  }

  Future<void> cancelTrip(String reason) async {
    if (state.tripId == null) return;

    state = state.copyWith(isLoading: true);

    try {
      await apiService.cancelTrip(state.tripId!, reason);
      socketService.cancelTrip(state.tripId!, reason);
    } catch (e) {
      // Continue with cancellation even on error
    }

    socketService.leaveTripRoom();
    state = state.copyWith(
      status: DriverTripStatus.idle,
      isLoading: false,
      clearTrip: true,
    );
  }

  void updateTripLocation(double lat, double lng, {double? heading}) {
    if (state.tripId != null && state.status == DriverTripStatus.inProgress) {
      socketService.updateTripLocation(lat, lng, heading: heading);
    }
  }

  void resetTrip() {
    if (state.tripId != null) {
      socketService.leaveTripRoom();
    }
    state = state.reset();
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }

  @override
  void dispose() {
    if (state.tripId != null) {
      socketService.leaveTripRoom();
    }
    super.dispose();
  }
}

// Provider
final driverTripProvider = StateNotifierProvider<DriverTripNotifier, DriverTripState>((ref) {
  return DriverTripNotifier();
});

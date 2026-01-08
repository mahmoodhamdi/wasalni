import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:latlong2/latlong.dart';

import '../services/api_service.dart';
import '../services/socket_service.dart';

// Trip Status
enum TripStatus {
  idle,
  searching,
  pending,
  driverAssigned,
  driverArriving,
  driverArrived,
  inProgress,
  completed,
  cancelled,
}

// Payment Method
enum PaymentMethod {
  cash,
  wallet,
  card,
}

// Location Point
class LocationPoint {
  final double latitude;
  final double longitude;
  final String? address;
  final String? placeId;

  const LocationPoint({
    required this.latitude,
    required this.longitude,
    this.address,
    this.placeId,
  });

  LatLng get latLng => LatLng(latitude, longitude);

  Map<String, dynamic> toJson() => {
        'latitude': latitude,
        'longitude': longitude,
        'address': address ?? '',
      };

  factory LocationPoint.fromJson(Map<String, dynamic> json) => LocationPoint(
        latitude: (json['latitude'] ?? json['lat'] ?? 0).toDouble(),
        longitude: (json['longitude'] ?? json['lng'] ?? 0).toDouble(),
        address: json['address'] as String?,
      );

  factory LocationPoint.fromLatLng(LatLng latLng, {String? address}) => LocationPoint(
        latitude: latLng.latitude,
        longitude: latLng.longitude,
        address: address,
      );
}

// Fare Estimate for a ride type
class FareEstimate {
  final String rideType;
  final String rideTypeAr;
  final double minFare;
  final double maxFare;
  final double distanceKm;
  final int durationMinutes;
  final double surgeMultiplier;
  final String distanceText;
  final String durationText;

  const FareEstimate({
    required this.rideType,
    required this.rideTypeAr,
    required this.minFare,
    required this.maxFare,
    required this.distanceKm,
    required this.durationMinutes,
    this.surgeMultiplier = 1.0,
    required this.distanceText,
    required this.durationText,
  });

  factory FareEstimate.fromJson(Map<String, dynamic> json) => FareEstimate(
        rideType: json['rideType'] ?? '',
        rideTypeAr: json['rideTypeAr'] ?? '',
        // Backend returns 'min'/'max', Flutter expects 'minFare'/'maxFare'
        minFare: (json['min'] ?? json['minFare'] ?? 0).toDouble(),
        maxFare: (json['max'] ?? json['maxFare'] ?? 0).toDouble(),
        // Backend returns distance in meters, convert to km
        distanceKm: ((json['distance'] ?? json['distanceKm'] ?? 0) / 1000).toDouble(),
        // Backend returns duration in seconds, convert to minutes
        durationMinutes: ((json['duration'] ?? json['durationMinutes'] ?? 0) / 60).round(),
        surgeMultiplier: (json['surgeMultiplier'] ?? 1.0).toDouble(),
        distanceText: json['distanceText'] ?? '',
        durationText: json['durationText'] ?? '',
      );

  String get fareRange => '${minFare.toStringAsFixed(0)} - ${maxFare.toStringAsFixed(0)} ج.م';
}

// Driver Info
class DriverInfo {
  final String id;
  final String name;
  final String phone;
  final String? avatar;
  final double rating;
  final String vehicleMake;
  final String vehicleModel;
  final String vehicleColor;
  final String vehiclePlate;
  final String vehicleType;

  const DriverInfo({
    required this.id,
    required this.name,
    required this.phone,
    this.avatar,
    required this.rating,
    required this.vehicleMake,
    required this.vehicleModel,
    required this.vehicleColor,
    required this.vehiclePlate,
    required this.vehicleType,
  });

  factory DriverInfo.fromJson(Map<String, dynamic> json) {
    final vehicle = json['vehicle'] ?? {};
    final user = json['userId'] ?? json;
    return DriverInfo(
      id: json['_id'] ?? json['id'] ?? '',
      name: user['name'] ?? json['name'] ?? '',
      phone: user['phone'] ?? json['phone'] ?? '',
      avatar: user['avatar'] ?? json['avatar'],
      rating: (json['rating'] ?? 5.0).toDouble(),
      vehicleMake: vehicle['make'] ?? '',
      vehicleModel: vehicle['model'] ?? '',
      vehicleColor: vehicle['color'] ?? '',
      vehiclePlate: vehicle['plateNumber'] ?? '',
      vehicleType: vehicle['type'] ?? '',
    );
  }

  String get vehicleDescription => '$vehicleMake $vehicleModel - $vehicleColor';
}

// Route Info
class RouteInfo {
  final String encodedPolyline;
  final double distanceMeters;
  final int durationSeconds;
  final String distanceText;
  final String durationText;

  const RouteInfo({
    required this.encodedPolyline,
    required this.distanceMeters,
    required this.durationSeconds,
    required this.distanceText,
    required this.durationText,
  });

  factory RouteInfo.fromJson(Map<String, dynamic> json) => RouteInfo(
        encodedPolyline: json['encodedPolyline'] ?? '',
        distanceMeters: (json['distanceMeters'] ?? 0).toDouble(),
        durationSeconds: (json['durationSeconds'] ?? 0).toInt(),
        distanceText: json['distanceText'] ?? '',
        durationText: json['durationText'] ?? '',
      );
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
  final String? promoCode;

  const FareBreakdown({
    required this.baseFare,
    required this.distanceFare,
    required this.timeFare,
    this.waitingFare = 0,
    this.surgeAmount = 0,
    required this.bookingFee,
    this.discount = 0,
    required this.total,
    this.promoCode,
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
        promoCode: json['promoCode'],
      );
}

// Trip State
class TripState {
  final TripStatus status;
  final LocationPoint? pickup;
  final LocationPoint? dropoff;
  final String? selectedRideType;
  final PaymentMethod paymentMethod;
  final String? promoCode;
  final bool promoValid;
  final double promoDiscount;
  final String? tripId;
  final String? tripNumber;
  final List<FareEstimate> fareEstimates;
  final RouteInfo? route;
  final FareBreakdown? fareBreakdown;
  final DriverInfo? driver;
  final double? driverLat;
  final double? driverLng;
  final double? driverHeading;
  final int? driverEta;
  final bool isLoading;
  final bool isFetchingFares;
  final String? errorMessage;

  const TripState({
    this.status = TripStatus.idle,
    this.pickup,
    this.dropoff,
    this.selectedRideType,
    this.paymentMethod = PaymentMethod.cash,
    this.promoCode,
    this.promoValid = false,
    this.promoDiscount = 0,
    this.tripId,
    this.tripNumber,
    this.fareEstimates = const [],
    this.route,
    this.fareBreakdown,
    this.driver,
    this.driverLat,
    this.driverLng,
    this.driverHeading,
    this.driverEta,
    this.isLoading = false,
    this.isFetchingFares = false,
    this.errorMessage,
  });

  bool get hasLocations => pickup != null && dropoff != null;
  bool get canBook => hasLocations && selectedRideType != null && !isLoading;
  bool get hasActiveTrip =>
      status != TripStatus.idle &&
      status != TripStatus.completed &&
      status != TripStatus.cancelled;

  FareEstimate? get selectedFare =>
      fareEstimates.where((e) => e.rideType == selectedRideType).firstOrNull;

  TripState copyWith({
    TripStatus? status,
    LocationPoint? pickup,
    LocationPoint? dropoff,
    String? selectedRideType,
    PaymentMethod? paymentMethod,
    String? promoCode,
    bool? promoValid,
    double? promoDiscount,
    String? tripId,
    String? tripNumber,
    List<FareEstimate>? fareEstimates,
    RouteInfo? route,
    FareBreakdown? fareBreakdown,
    DriverInfo? driver,
    double? driverLat,
    double? driverLng,
    double? driverHeading,
    int? driverEta,
    bool? isLoading,
    bool? isFetchingFares,
    String? errorMessage,
    bool clearError = false,
    bool clearPromo = false,
    bool clearDriver = false,
  }) {
    return TripState(
      status: status ?? this.status,
      pickup: pickup ?? this.pickup,
      dropoff: dropoff ?? this.dropoff,
      selectedRideType: selectedRideType ?? this.selectedRideType,
      paymentMethod: paymentMethod ?? this.paymentMethod,
      promoCode: clearPromo ? null : (promoCode ?? this.promoCode),
      promoValid: clearPromo ? false : (promoValid ?? this.promoValid),
      promoDiscount: clearPromo ? 0 : (promoDiscount ?? this.promoDiscount),
      tripId: tripId ?? this.tripId,
      tripNumber: tripNumber ?? this.tripNumber,
      fareEstimates: fareEstimates ?? this.fareEstimates,
      route: route ?? this.route,
      fareBreakdown: fareBreakdown ?? this.fareBreakdown,
      driver: clearDriver ? null : (driver ?? this.driver),
      driverLat: clearDriver ? null : (driverLat ?? this.driverLat),
      driverLng: clearDriver ? null : (driverLng ?? this.driverLng),
      driverHeading: clearDriver ? null : (driverHeading ?? this.driverHeading),
      driverEta: clearDriver ? null : (driverEta ?? this.driverEta),
      isLoading: isLoading ?? this.isLoading,
      isFetchingFares: isFetchingFares ?? this.isFetchingFares,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
    );
  }

  TripState reset() => const TripState();
}

// Trip Notifier
class TripNotifier extends StateNotifier<TripState> {
  TripNotifier() : super(const TripState()) {
    _setupSocketListeners();
  }

  void _setupSocketListeners() {
    // Listen for trip events from socket
    socketService.on('trip:accepted', (data) {
      if (state.tripId == data['tripId']) {
        final driver = DriverInfo.fromJson(data['driver'] ?? {});
        state = state.copyWith(
          status: TripStatus.driverAssigned,
          driver: driver,
        );
      }
    });

    socketService.on('trip:driver_arriving', (data) {
      if (state.tripId == data['tripId']) {
        state = state.copyWith(
          status: TripStatus.driverArriving,
          driverEta: data['eta'],
        );
      }
    });

    socketService.on('trip:driver_arrived', (data) {
      if (state.tripId == data['tripId']) {
        state = state.copyWith(status: TripStatus.driverArrived);
      }
    });

    socketService.on('trip:started', (data) {
      if (state.tripId == data['tripId']) {
        state = state.copyWith(status: TripStatus.inProgress);
      }
    });

    socketService.on('trip:completed', (data) {
      if (state.tripId == data['tripId']) {
        final fare = data['fare'] != null ? FareBreakdown.fromJson(data['fare']) : null;
        state = state.copyWith(
          status: TripStatus.completed,
          fareBreakdown: fare,
        );
      }
    });

    socketService.on('trip:cancelled', (data) {
      if (state.tripId == data['tripId']) {
        state = state.copyWith(status: TripStatus.cancelled);
      }
    });

    socketService.on('trip:driver:location', (data) {
      if (state.tripId == data['tripId']) {
        state = state.copyWith(
          driverLat: data['latitude']?.toDouble(),
          driverLng: data['longitude']?.toDouble(),
          driverHeading: data['heading']?.toDouble(),
        );
      }
    });

    socketService.on('trip:no_drivers', (data) {
      if (state.tripId == data['tripId']) {
        state = state.copyWith(
          status: TripStatus.idle,
          errorMessage: data['messageAr'] ?? 'لا يوجد سائقين متاحين',
          clearDriver: true,
        );
      }
    });

    socketService.on('trip:timeout', (data) {
      if (state.tripId == data['tripId']) {
        state = state.copyWith(
          status: TripStatus.idle,
          errorMessage: data['messageAr'] ?? 'انتهت مهلة البحث',
          clearDriver: true,
        );
      }
    });
  }

  void setPickup(LocationPoint pickup) {
    state = state.copyWith(pickup: pickup, clearError: true);
    _fetchFareEstimates();
  }

  void setDropoff(LocationPoint dropoff) {
    state = state.copyWith(dropoff: dropoff, clearError: true);
    _fetchFareEstimates();
  }

  void setRideType(String rideType) {
    state = state.copyWith(selectedRideType: rideType);
  }

  void setPaymentMethod(PaymentMethod method) {
    state = state.copyWith(paymentMethod: method);
  }

  Future<void> _fetchFareEstimates() async {
    if (!state.hasLocations) return;

    state = state.copyWith(isFetchingFares: true);

    try {
      final response = await apiService.getFareEstimates(
        pickupLat: state.pickup!.latitude,
        pickupLng: state.pickup!.longitude,
        dropoffLat: state.dropoff!.latitude,
        dropoffLng: state.dropoff!.longitude,
      );

      if (response.data['success'] == true) {
        final data = response.data['data'];
        final estimates = (data['estimates'] as List)
            .map((e) => FareEstimate.fromJson(e))
            .toList();
        // Backend returns route info at top level, not nested in 'route'
        RouteInfo? route;
        if (data['distance'] != null) {
          route = RouteInfo(
            encodedPolyline: '', // Not provided in fare estimate response
            distanceMeters: (data['distance'] as num).toDouble(),
            durationSeconds: (data['duration'] as num).toInt(),
            distanceText: data['distanceText'] ?? '',
            durationText: data['durationText'] ?? '',
          );
        }

        // Auto-select first ride type if none selected
        String? selectedRide = state.selectedRideType;
        if (selectedRide == null && estimates.isNotEmpty) {
          selectedRide = estimates.first.rideType;
        }

        state = state.copyWith(
          fareEstimates: estimates,
          route: route,
          selectedRideType: selectedRide,
          isFetchingFares: false,
        );
      } else {
        state = state.copyWith(
          isFetchingFares: false,
          errorMessage: response.data['messageAr'] ?? 'فشل في حساب التكلفة',
        );
      }
    } catch (e) {
      state = state.copyWith(
        isFetchingFares: false,
        errorMessage: 'فشل في الاتصال بالخادم',
      );
    }
  }

  Future<void> refreshFares() async {
    await _fetchFareEstimates();
  }

  Future<bool> applyPromoCode(String code) async {
    if (state.selectedRideType == null) return false;
    final selectedFare = state.selectedFare;
    if (selectedFare == null) return false;

    try {
      final response = await apiService.validatePromo(
        code: code,
        rideType: state.selectedRideType!,
        fare: selectedFare.minFare,
      );

      if (response.data['success'] == true) {
        final data = response.data['data'];
        state = state.copyWith(
          promoCode: code,
          promoValid: true,
          promoDiscount: (data['discount'] ?? 0).toDouble(),
        );
        return true;
      } else {
        state = state.copyWith(
          errorMessage: response.data['messageAr'] ?? 'كود غير صالح',
          clearPromo: true,
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        errorMessage: 'فشل في التحقق من الكود',
        clearPromo: true,
      );
      return false;
    }
  }

  void removePromoCode() {
    state = state.copyWith(clearPromo: true);
  }

  Future<bool> requestTrip() async {
    if (!state.canBook) {
      state = state.copyWith(errorMessage: 'يرجى اختيار نقطة البداية والوجهة ونوع الرحلة');
      return false;
    }

    state = state.copyWith(status: TripStatus.searching, isLoading: true, clearError: true);

    try {
      final response = await apiService.createTrip(
        pickup: state.pickup!.toJson(),
        dropoff: state.dropoff!.toJson(),
        rideType: state.selectedRideType!,
        paymentMethod: state.paymentMethod.name,
        promoCode: state.promoValid ? state.promoCode : null,
      );

      if (response.data['success'] == true) {
        final data = response.data['data']['trip'];
        final tripId = data['_id'] ?? data['id'];

        // Join the trip room for real-time updates
        socketService.emit('join:trip', tripId);

        state = state.copyWith(
          status: TripStatus.searching,
          tripId: tripId,
          tripNumber: data['tripNumber'],
          isLoading: false,
        );
        return true;
      } else {
        state = state.copyWith(
          status: TripStatus.idle,
          isLoading: false,
          errorMessage: response.data['messageAr'] ?? 'فشل في إنشاء الرحلة',
        );
        return false;
      }
    } catch (e) {
      state = state.copyWith(
        status: TripStatus.idle,
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
      final response = await apiService.cancelTrip(state.tripId!, reason);

      if (response.data['success'] == true) {
        // Leave the trip room
        socketService.emit('leave:trip', state.tripId);
        state = state.copyWith(
          status: TripStatus.cancelled,
          isLoading: false,
        );
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: response.data['messageAr'] ?? 'فشل في إلغاء الرحلة',
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'فشل في الاتصال بالخادم',
      );
    }
  }

  Future<void> rateDriver(int rating, {String? comment}) async {
    if (state.tripId == null) return;

    try {
      await apiService.rateTrip(state.tripId!, rating, comment);
    } catch (e) {
      // Silently fail - rating is optional
    }
  }

  void resetTrip() {
    if (state.tripId != null) {
      socketService.emit('leave:trip', state.tripId);
    }
    state = state.reset();
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }

  @override
  void dispose() {
    if (state.tripId != null) {
      socketService.emit('leave:trip', state.tripId);
    }
    super.dispose();
  }
}

// Provider
final tripProvider = StateNotifierProvider<TripNotifier, TripState>((ref) {
  return TripNotifier();
});

// Ride Type Display Info
class RideTypeInfo {
  final String id;
  final String name;
  final String nameAr;
  final IconType icon;
  final int capacity;
  final String description;

  const RideTypeInfo({
    required this.id,
    required this.name,
    required this.nameAr,
    required this.icon,
    required this.capacity,
    required this.description,
  });
}

enum IconType { car, van, tuktuk, motorcycle }

// Available Ride Types Provider
final rideTypesInfoProvider = Provider<List<RideTypeInfo>>((ref) {
  return const [
    RideTypeInfo(
      id: 'economy',
      name: 'Economy',
      nameAr: 'اقتصادي',
      icon: IconType.car,
      capacity: 4,
      description: 'رحلات يومية بأسعار مناسبة',
    ),
    RideTypeInfo(
      id: 'comfort',
      name: 'Comfort',
      nameAr: 'مريح',
      icon: IconType.car,
      capacity: 4,
      description: 'سيارات أفضل وراحة أكثر',
    ),
    RideTypeInfo(
      id: 'family',
      name: 'Family',
      nameAr: 'عائلي',
      icon: IconType.van,
      capacity: 6,
      description: 'للعائلات والمجموعات',
    ),
    RideTypeInfo(
      id: 'tuktuk',
      name: 'Tuktuk',
      nameAr: 'توكتوك',
      icon: IconType.tuktuk,
      capacity: 3,
      description: 'للمسافات القصيرة',
    ),
    RideTypeInfo(
      id: 'motorcycle',
      name: 'Motorcycle',
      nameAr: 'موتوسيكل',
      icon: IconType.motorcycle,
      capacity: 1,
      description: 'أسرع وصول',
    ),
  ];
});

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/api_service.dart';

// Earnings Period
enum EarningsPeriod {
  today,
  yesterday,
  thisWeek,
  thisMonth,
  custom,
}

// Daily Earning
class DailyEarning {
  final DateTime date;
  final double earnings;
  final int trips;
  final double hours;

  const DailyEarning({
    required this.date,
    required this.earnings,
    required this.trips,
    required this.hours,
  });

  factory DailyEarning.fromJson(Map<String, dynamic> json) => DailyEarning(
        date: json['date'] != null
            ? DateTime.parse(json['date'])
            : DateTime.now(),
        earnings: (json['earnings'] ?? json['total'] ?? 0).toDouble(),
        trips: (json['trips'] ?? json['tripCount'] ?? 0).toInt(),
        hours: (json['hours'] ?? json['hoursWorked'] ?? 0).toDouble(),
      );
}

// Trip Earning
class TripEarning {
  final String tripId;
  final String tripNumber;
  final DateTime date;
  final String pickupAddress;
  final String dropoffAddress;
  final double fare;
  final double driverEarnings;
  final double platformFee;
  final String paymentMethod;

  const TripEarning({
    required this.tripId,
    required this.tripNumber,
    required this.date,
    required this.pickupAddress,
    required this.dropoffAddress,
    required this.fare,
    required this.driverEarnings,
    required this.platformFee,
    required this.paymentMethod,
  });

  factory TripEarning.fromJson(Map<String, dynamic> json) {
    final pickup = json['pickup'] ?? {};
    final dropoff = json['dropoff'] ?? {};
    final fare = json['fare'] ?? {};

    return TripEarning(
      tripId: json['_id'] ?? json['tripId'] ?? '',
      tripNumber: json['tripNumber'] ?? '',
      date: json['completedAt'] != null
          ? DateTime.parse(json['completedAt'])
          : DateTime.now(),
      pickupAddress: pickup['address'] ?? '',
      dropoffAddress: dropoff['address'] ?? '',
      fare: (fare['total'] ?? json['fare'] ?? 0).toDouble(),
      driverEarnings: (fare['driverEarnings'] ?? json['driverEarnings'] ?? 0).toDouble(),
      platformFee: (fare['bookingFee'] ?? json['platformFee'] ?? 0).toDouble(),
      paymentMethod: json['paymentMethod'] ?? 'cash',
    );
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

// Earnings Summary
class EarningsSummary {
  final double totalEarnings;
  final int totalTrips;
  final double totalHours;
  final double averagePerTrip;
  final double averagePerHour;
  final double pendingBalance;
  final double availableBalance;
  final List<DailyEarning> dailyBreakdown;

  const EarningsSummary({
    this.totalEarnings = 0,
    this.totalTrips = 0,
    this.totalHours = 0,
    this.averagePerTrip = 0,
    this.averagePerHour = 0,
    this.pendingBalance = 0,
    this.availableBalance = 0,
    this.dailyBreakdown = const [],
  });

  factory EarningsSummary.fromJson(Map<String, dynamic> json) {
    final dailyList = (json['dailyBreakdown'] ?? json['daily'] ?? []) as List;

    return EarningsSummary(
      totalEarnings: (json['totalEarnings'] ?? json['total'] ?? 0).toDouble(),
      totalTrips: (json['totalTrips'] ?? json['trips'] ?? 0).toInt(),
      totalHours: (json['totalHours'] ?? json['hours'] ?? 0).toDouble(),
      averagePerTrip: (json['averagePerTrip'] ?? 0).toDouble(),
      averagePerHour: (json['averagePerHour'] ?? 0).toDouble(),
      pendingBalance: (json['pendingBalance'] ?? 0).toDouble(),
      availableBalance: (json['availableBalance'] ?? 0).toDouble(),
      dailyBreakdown: dailyList.map((e) => DailyEarning.fromJson(e)).toList(),
    );
  }
}

// Earnings State
class EarningsState {
  final EarningsPeriod period;
  final EarningsSummary? summary;
  final List<TripEarning> tripHistory;
  final bool isLoading;
  final bool isLoadingHistory;
  final String? errorMessage;
  final int historyPage;
  final bool hasMoreHistory;

  const EarningsState({
    this.period = EarningsPeriod.thisWeek,
    this.summary,
    this.tripHistory = const [],
    this.isLoading = false,
    this.isLoadingHistory = false,
    this.errorMessage,
    this.historyPage = 1,
    this.hasMoreHistory = true,
  });

  EarningsState copyWith({
    EarningsPeriod? period,
    EarningsSummary? summary,
    List<TripEarning>? tripHistory,
    bool? isLoading,
    bool? isLoadingHistory,
    String? errorMessage,
    int? historyPage,
    bool? hasMoreHistory,
    bool clearError = false,
  }) {
    return EarningsState(
      period: period ?? this.period,
      summary: summary ?? this.summary,
      tripHistory: tripHistory ?? this.tripHistory,
      isLoading: isLoading ?? this.isLoading,
      isLoadingHistory: isLoadingHistory ?? this.isLoadingHistory,
      errorMessage: clearError ? null : (errorMessage ?? this.errorMessage),
      historyPage: historyPage ?? this.historyPage,
      hasMoreHistory: hasMoreHistory ?? this.hasMoreHistory,
    );
  }
}

// Earnings Notifier
class EarningsNotifier extends StateNotifier<EarningsState> {
  EarningsNotifier() : super(const EarningsState());

  Future<void> loadEarnings({EarningsPeriod? period}) async {
    final selectedPeriod = period ?? state.period;
    state = state.copyWith(
      period: selectedPeriod,
      isLoading: true,
      clearError: true,
    );

    try {
      final periodString = _getPeriodString(selectedPeriod);
      final response = await apiService.getEarnings(period: periodString);

      if (response.data['success'] == true) {
        final data = response.data['data'];
        final summary = EarningsSummary.fromJson(data);

        state = state.copyWith(
          summary: summary,
          isLoading: false,
        );
      } else {
        state = state.copyWith(
          isLoading: false,
          errorMessage: response.data['messageAr'] ?? 'فشل في تحميل الأرباح',
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoading: false,
        errorMessage: 'فشل في الاتصال بالخادم',
      );
    }
  }

  Future<void> loadTripHistory({bool refresh = false}) async {
    if (state.isLoadingHistory) return;
    if (!refresh && !state.hasMoreHistory) return;

    final page = refresh ? 1 : state.historyPage;

    state = state.copyWith(
      isLoadingHistory: true,
      tripHistory: refresh ? [] : null,
      historyPage: page,
      clearError: true,
    );

    try {
      final response = await apiService.getEarningsHistory(page: page);

      if (response.data['success'] == true) {
        final data = response.data['data'];
        final trips = (data['trips'] ?? data['history'] ?? []) as List;
        final newTrips = trips.map((e) => TripEarning.fromJson(e)).toList();
        final pagination = data['pagination'] ?? {};
        final hasMore = pagination['hasMore'] ?? (newTrips.length >= 20);

        state = state.copyWith(
          tripHistory: refresh
              ? newTrips
              : [...state.tripHistory, ...newTrips],
          isLoadingHistory: false,
          historyPage: page + 1,
          hasMoreHistory: hasMore,
        );
      } else {
        state = state.copyWith(
          isLoadingHistory: false,
          errorMessage: response.data['messageAr'] ?? 'فشل في تحميل السجل',
        );
      }
    } catch (e) {
      state = state.copyWith(
        isLoadingHistory: false,
        errorMessage: 'فشل في الاتصال بالخادم',
      );
    }
  }

  void setPeriod(EarningsPeriod period) {
    if (state.period != period) {
      loadEarnings(period: period);
    }
  }

  String _getPeriodString(EarningsPeriod period) {
    switch (period) {
      case EarningsPeriod.today:
        return 'today';
      case EarningsPeriod.yesterday:
        return 'yesterday';
      case EarningsPeriod.thisWeek:
        return 'week';
      case EarningsPeriod.thisMonth:
        return 'month';
      default:
        return 'week';
    }
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }
}

// Provider
final earningsProvider = StateNotifierProvider<EarningsNotifier, EarningsState>((ref) {
  return EarningsNotifier();
});

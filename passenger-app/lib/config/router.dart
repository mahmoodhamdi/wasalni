import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../screens/auth/splash_screen.dart';
import '../screens/auth/welcome_screen.dart';
import '../screens/auth/phone_screen.dart';
import '../screens/auth/otp_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/home/location_picker_screen.dart';
import '../screens/booking/booking_screen.dart';
import '../screens/booking/searching_screen.dart';
import '../screens/trip/trip_screen.dart';
import '../screens/trip/trip_complete_screen.dart';
import '../screens/safety/emergency_contacts_screen.dart';
import '../screens/safety/safety_settings_screen.dart';

// Router provider
final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    debugLogDiagnostics: true,
    routes: [
      // Splash
      GoRoute(
        path: '/',
        name: 'splash',
        builder: (context, state) => const SplashScreen(),
      ),

      // Auth Routes
      GoRoute(
        path: '/welcome',
        name: 'welcome',
        builder: (context, state) => const WelcomeScreen(),
      ),
      GoRoute(
        path: '/phone',
        name: 'phone',
        builder: (context, state) => const PhoneScreen(),
      ),
      GoRoute(
        path: '/otp',
        name: 'otp',
        builder: (context, state) {
          final phone = state.extra as String? ?? '';
          return OTPScreen(phone: phone);
        },
      ),
      GoRoute(
        path: '/register',
        name: 'register',
        builder: (context, state) {
          final phone = state.extra as String? ?? '';
          return RegisterScreen(phone: phone);
        },
      ),

      // Main App Routes
      GoRoute(
        path: '/home',
        name: 'home',
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: '/location-picker',
        name: 'location-picker',
        builder: (context, state) {
          final isPickup = (state.extra as Map<String, dynamic>?)?['isPickup'] as bool? ?? false;
          return LocationPickerScreen(isPickup: isPickup);
        },
      ),

      // Booking Flow
      GoRoute(
        path: '/booking',
        name: 'booking',
        builder: (context, state) => const BookingScreen(),
      ),
      GoRoute(
        path: '/searching',
        name: 'searching',
        builder: (context, state) => const SearchingScreen(),
      ),
      GoRoute(
        path: '/trip',
        name: 'trip',
        builder: (context, state) => const TripScreen(),
      ),
      GoRoute(
        path: '/trip-complete',
        name: 'trip-complete',
        builder: (context, state) => const TripCompleteScreen(),
      ),

      // Safety Routes
      GoRoute(
        path: '/safety-settings',
        name: 'safety-settings',
        builder: (context, state) => const SafetySettingsScreen(),
      ),
      GoRoute(
        path: '/emergency-contacts',
        name: 'emergency-contacts',
        builder: (context, state) => const EmergencyContactsScreen(),
      ),

      // TODO: Add more routes as screens are created
      // - /profile
      // - /settings
      // - /history
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text(
              'Page not found',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(state.error?.message ?? 'Unknown error'),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () => context.go('/'),
              child: const Text('Go Home'),
            ),
          ],
        ),
      ),
    ),
  );
});

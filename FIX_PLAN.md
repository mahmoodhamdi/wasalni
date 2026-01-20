# WASALNI FIX PLAN

**Generated:** 2026-01-20
**Based on:** FULL_AUDIT_REPORT.md
**Total Fixes:** 60 issues (13 Critical, 24 Major, 23 Minor)

---

## EXECUTION ORDER

Fixes are organized by priority and dependency. Execute in order.

---

## PHASE A: CRITICAL FIXES (13 issues)

### A1. Driver App - Create Reset Password Screen
**ID:** DA-C1
**Priority:** CRITICAL
**Estimated Time:** 30 minutes

**Files to Create:**
- `driver-app/lib/screens/auth/reset_password_screen.dart`

**Files to Modify:**
- `driver-app/lib/config/router.dart` - Add route

**Steps:**
1. Create `reset_password_screen.dart` with:
   - New password field
   - Confirm password field
   - Submit button calling `authProvider.resetPassword()`
   - Navigation back to login on success
2. Add route in `router.dart`:
   ```dart
   GoRoute(
     path: '/reset-password',
     builder: (context, state) {
       final extra = state.extra as Map<String, dynamic>?;
       return ResetPasswordScreen(
         email: extra?['email'] ?? '',
         otp: extra?['otp'] ?? '',
       );
     },
   ),
   ```

---

### A2. Driver App - Fix Home Screen Stats
**ID:** DA-C2
**Priority:** CRITICAL
**Estimated Time:** 20 minutes

**File:** `driver-app/lib/screens/home/home_screen.dart`
**Lines:** 93-95

**Steps:**
1. Remove hardcoded values:
   ```dart
   // REMOVE THESE:
   int _todayTrips = 0;
   String _todayHours = '0:00';
   double _todayEarnings = 0;
   ```
2. Connect to earnings provider:
   ```dart
   final earnings = ref.watch(earningsProvider);
   ```
3. Use provider values in UI widgets

---

### A3. Driver App - Fix Documents Screen Redirect
**ID:** DA-C3
**Priority:** CRITICAL
**Estimated Time:** 5 minutes

**File:** `driver-app/lib/screens/auth/documents_screen.dart`
**Line:** 182

**Change:**
```dart
// FROM:
context.go('/');

// TO:
context.go('/pending-approval');
```

---

### A4. Driver App - Add Platform Permissions
**ID:** DA-C4
**Priority:** CRITICAL
**Estimated Time:** 15 minutes

**Files to Modify:**
- `driver-app/android/app/src/main/AndroidManifest.xml`
- `driver-app/ios/Runner/Info.plist`

**Android Permissions to Add:**
```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.CALL_PHONE" />
```

**iOS Info.plist Keys to Add:**
```xml
<key>NSLocationWhenInUseUsageDescription</key>
<string>We need your location to show nearby passengers</string>
<key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
<string>We need your location to track trips</string>
<key>NSCameraUsageDescription</key>
<string>We need camera access for document upload</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>We need photo library access for document upload</string>
```

---

### A5. Driver App - Fix Empty Profile Menu Handlers
**ID:** DA-C5
**Priority:** CRITICAL
**Estimated Time:** 30 minutes

**File:** `driver-app/lib/screens/home/home_screen.dart`
**Lines:** 711, 721

**Steps:**
1. Implement edit profile handler:
   ```dart
   onTap: () => context.push('/edit-profile'),
   ```
2. Implement vehicle data handler:
   ```dart
   onTap: () => context.push('/vehicle-info'),
   ```
3. Create `/edit-profile` and `/vehicle-info` screens if missing
4. OR remove buttons if not needed for MVP

---

### A6. Passenger App - Fix API Base URL Configuration
**ID:** PA-C1
**Priority:** CRITICAL
**Estimated Time:** 20 minutes

**File:** `passenger-app/lib/config/app_config.dart`

**Steps:**
1. Create environment configuration:
   ```dart
   class AppConfig {
     static String get apiBaseUrl {
       // Use environment variable or default
       const envUrl = String.fromEnvironment('API_BASE_URL');
       if (envUrl.isNotEmpty) return envUrl;

       // Development fallback
       if (kDebugMode) {
         return 'http://localhost:5000/api/v1';
       }

       // Production URL
       return 'https://api.wasalni.app/api/v1';
     }
   }
   ```
2. Update build commands to pass environment variable

---

### A7. Passenger App - Fix Socket Token Refresh
**ID:** PA-C2
**Priority:** CRITICAL
**Estimated Time:** 30 minutes

**File:** `passenger-app/lib/services/socket_service.dart`

**Steps:**
1. Add reconnection with fresh token:
   ```dart
   void _handleTokenExpiry() async {
     final newToken = await _refreshToken();
     if (newToken != null) {
       _socket?.io.options?['extraHeaders'] = {
         'Authorization': 'Bearer $newToken',
       };
       _socket?.connect();
     }
   }
   ```
2. Listen for auth errors on socket
3. Trigger token refresh and reconnect

---

### A8. Passenger App - Fix Service Initialization Order
**ID:** PA-C3
**Priority:** CRITICAL
**Estimated Time:** 15 minutes

**File:** `passenger-app/lib/main.dart`

**Steps:**
1. Move service initialization before runApp:
   ```dart
   void main() async {
     WidgetsFlutterBinding.ensureInitialized();

     // Initialize services FIRST
     await StorageService.instance.init();
     await ApiService.instance.init();

     runApp(
       ProviderScope(
         child: MyApp(),
       ),
     );
   }
   ```

---

### A9. Passenger App - Fix Storage Initialization
**ID:** PA-C4
**Priority:** CRITICAL
**Estimated Time:** 10 minutes

**File:** `passenger-app/lib/main.dart`

**Combined with A8** - Ensure storage is fully initialized before auth check runs.

---

### A10. Admin Dashboard - Add Google Maps API Validation
**ID:** AD-C1
**Priority:** CRITICAL
**Estimated Time:** 20 minutes

**File:** `admin-dashboard/app/dashboard/trips/active/page.tsx`
**Lines:** 60-62, 167-175

**Steps:**
1. Add API key validation:
   ```tsx
   const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

   if (!apiKey) {
     return (
       <div className="flex items-center justify-center h-full">
         <div className="text-center">
           <AlertTriangle className="w-12 h-12 text-yellow-500 mx-auto" />
           <p>Google Maps API key not configured</p>
           <p className="text-sm text-gray-500">
             Please set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
           </p>
         </div>
       </div>
     );
   }
   ```
2. Add fallback to Leaflet map if key missing

---

### A11. Admin Dashboard - Fix Drivers Detail API Call
**ID:** AD-C2
**Priority:** CRITICAL
**Estimated Time:** 15 minutes

**File:** `admin-dashboard/app/dashboard/drivers/[id]/page.tsx`
**Line:** 69

**Steps:**
1. Fix type-safe API call:
   ```tsx
   // Add to api.ts
   export const driversApi = {
     getTrips: (driverId: string, params?: { limit?: number }) =>
       api.get(`/admin/drivers/${driverId}/trips`, { params }),
   };
   ```
2. Update page to use new method

---

### A12. Admin Dashboard - Add Socket Error Handling
**ID:** AD-C3
**Priority:** CRITICAL
**Estimated Time:** 20 minutes

**File:** `admin-dashboard/app/dashboard/trips/active/page.tsx`
**Lines:** 94-96, 133

**Steps:**
1. Add connection error handling:
   ```tsx
   socket.on('connect_error', (error) => {
     console.error('Socket connection error:', error);
     setConnectionError('Failed to connect to real-time updates');
   });

   socket.on('disconnect', (reason) => {
     if (reason === 'io server disconnect') {
       // Token might be invalid, try to reconnect with new token
       const newToken = getNewToken();
       socket.auth = { token: newToken };
       socket.connect();
     }
   });
   ```
2. Show error state in UI

---

### A13. Admin Dashboard - Add Image Error Handling
**ID:** AD-C4
**Priority:** CRITICAL
**Estimated Time:** 10 minutes

**File:** `admin-dashboard/app/dashboard/drivers/pending/page.tsx`
**Lines:** 401-407

**Steps:**
1. Add onError handler to images:
   ```tsx
   <img
     src={imageUrl}
     alt="Document"
     onError={(e) => {
       e.currentTarget.src = '/placeholder-document.png';
       e.currentTarget.onerror = null;
     }}
   />
   ```

---

## PHASE B: MAJOR FIXES (24 issues)

### B1. Backend - Complete Scheduled Trip Driver Assignment
**ID:** B-M1
**Priority:** HIGH
**Estimated Time:** 2 hours

**File:** `backend/src/services/scheduled.service.ts`

**Steps:**
1. Find TODO comments and implement:
   - Driver notification when assigned
   - Socket event emission for matching
2. Integrate with matching.service.ts
3. Add cron job for scheduled trip activation

---

### B2. Passenger App - Fix Promo Code API Endpoint
**ID:** PA-M2
**Priority:** HIGH
**Estimated Time:** 10 minutes

**File:** `passenger-app/lib/providers/trip_provider.dart`
**Lines:** 494-506

**Change:**
```dart
// FROM:
final response = await _apiService.post('/fare/promo/validate', ...);

// TO:
final response = await _apiService.post('/promo/validate', ...);
```

---

### B3. Passenger App - Integrate Notification Service
**ID:** PA-M3
**Priority:** HIGH
**Estimated Time:** 30 minutes

**File:** `passenger-app/lib/main.dart`

**Steps:**
1. Initialize NotificationService:
   ```dart
   await NotificationService.instance.init();
   await NotificationService.instance.requestPermission();
   ```
2. Register FCM token on login
3. Handle background messages

---

### B4. Driver App - Implement Trips History Tab
**ID:** DA-M1
**Priority:** HIGH
**Estimated Time:** 1 hour

**File:** `driver-app/lib/screens/home/home_screen.dart`
**Lines:** 477-498

**Steps:**
1. Load trips from provider on tab init
2. Display list with trip cards
3. Add pagination
4. Add pull-to-refresh

---

### B5. Driver App - Connect Earnings to Provider
**ID:** DA-M2
**Priority:** HIGH
**Estimated Time:** 30 minutes

**File:** `driver-app/lib/screens/home/home_screen.dart`

**Steps:**
1. Watch earningsProvider in _EarningsTab
2. Load earnings on initState
3. Display real values

---

### B6. Admin Dashboard - Implement Server-Side Pagination
**ID:** AD-M2
**Priority:** HIGH
**Estimated Time:** 2 hours

**Files:** All list pages (drivers, passengers, trips, promos)

**Steps:**
1. Pass page/limit params to API calls
2. Update DataTable to handle server pagination
3. Add total count from API response
4. Update navigation callbacks

---

### B7. Admin Dashboard - Add Error Toasts
**ID:** AD-M3
**Priority:** HIGH
**Estimated Time:** 1 hour

**Steps:**
1. Add toast notification library (e.g., react-hot-toast)
2. Create toast context/provider
3. Replace console.error with toast.error
4. Add success toasts for mutations

---

### B8-B24. Remaining Major Issues
Continue with similar detailed steps for:
- AD-M1: Complete Settings Page
- AD-M4: Fix Trip Status Query
- AD-M5: Fix Fare Settings API
- PA-M1: Improve Location Permission UX
- PA-M4: Complete Socket Event Handling
- PA-M5: Complete Chat Screen
- PA-M6: Complete Settings/Help Screens
- DA-M3: Already covered in A1
- DA-M4: Allow Trip Cancel During Active
- DA-M5: Fix Trip Request Dialog
- DA-M6: Apply Language Change
- DA-M7: Implement Bank Account Saving
- DA-M8: Implement Support Contact
- B-M2: Google Maps Integration (when ready)
- B-M3: Fix Payment New User Detection
- B-M4: Email Notifications for Trip Sharing
- B-M5: Safety Service Push Notifications

---

## PHASE C: MINOR FIXES (23 issues)

### C1-C4. Backend Minor
- Replace console.log with logger
- Standardize response format
- Complete Swagger docs
- Add pagination to counters

### C5-C11. Admin Dashboard Minor
- Consistent loading states
- Form validation
- Centralize status labels
- Verify trip details page
- Fix commission rate
- Fix promo date handling
- Add confirmation dialogs

### C12-C17. Passenger App Minor
- Remove TODO comments
- Fix token refresh
- Improve location fallback UX
- Handle scheduled slots errors
- Remove debug prints
- Add error boundaries

### C18-C23. Driver App Minor
- Improve status colors
- Add passenger rating UI
- Make phone contact obvious
- Improve error messages
- Add loading states
- Verify map dependencies

---

## DEPENDENCY GRAPH

```
A1 (Reset Password Screen) -> No dependencies
A2 (Home Stats) -> Requires earnings provider
A3 (Documents Redirect) -> No dependencies
A4 (Permissions) -> No dependencies
A5 (Profile Handlers) -> May need new screens
A6 (API URL) -> No dependencies
A7 (Socket Token) -> No dependencies
A8/A9 (Init Order) -> No dependencies
A10 (Maps Key) -> No dependencies
A11 (API Call) -> Needs API update
A12 (Socket Errors) -> No dependencies
A13 (Image Errors) -> No dependencies

B1 (Scheduled Trips) -> Backend only
B2 (Promo Endpoint) -> No dependencies
B3 (Notifications) -> Requires A8/A9
B4 (Trips History) -> Requires trip provider
B5 (Earnings) -> Requires earnings provider
B6 (Pagination) -> API must support it
B7 (Toasts) -> No dependencies
```

---

## EXECUTION CHECKLIST

### Critical Phase (Week 1)
- [ ] A1: Driver App - Reset Password Screen
- [ ] A2: Driver App - Fix Home Stats
- [ ] A3: Driver App - Fix Documents Redirect
- [ ] A4: Driver App - Add Permissions
- [ ] A5: Driver App - Fix Profile Handlers
- [ ] A6: Passenger App - Fix API URL
- [ ] A7: Passenger App - Fix Socket Token
- [ ] A8: Passenger App - Fix Service Init
- [ ] A9: Passenger App - Fix Storage Init
- [ ] A10: Admin Dashboard - Maps Key Validation
- [ ] A11: Admin Dashboard - Fix API Call
- [ ] A12: Admin Dashboard - Socket Errors
- [ ] A13: Admin Dashboard - Image Errors

### Major Phase (Week 2)
- [ ] B1: Backend - Scheduled Trip Assignment
- [ ] B2: Passenger App - Fix Promo Endpoint
- [ ] B3: Passenger App - Notifications
- [ ] B4: Driver App - Trips History
- [ ] B5: Driver App - Earnings Connection
- [ ] B6: Admin Dashboard - Server Pagination
- [ ] B7: Admin Dashboard - Error Toasts
- [ ] B8-B24: Remaining Major Issues

### Minor Phase (Week 3)
- [ ] C1-C23: All Minor Fixes

---

## TESTING REQUIREMENTS

After each fix:
1. Run existing tests: `npm test` / `flutter test`
2. Manual testing of affected feature
3. Verify no regressions

After Phase A complete:
- Full E2E test of auth flow
- Full E2E test of trip flow
- Socket connection test

After Phase B complete:
- Load testing with pagination
- Notification delivery test
- Scheduled trip test

---

## ROLLBACK PLAN

If fix introduces regression:
1. Git revert the commit
2. Re-test original functionality
3. Investigate root cause
4. Apply fix with additional safeguards

---

*Plan ready for execution*

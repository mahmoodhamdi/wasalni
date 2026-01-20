# AUTO-FIX PROMPT FOR CLAUDE CODE

**Purpose:** This prompt contains all information needed to automatically fix all identified issues in the Wasalni project.

**Instructions:** Copy this entire prompt and provide it to Claude Code to execute all fixes automatically.

---

## MASTER FIX PROMPT

You are tasked with fixing all identified issues in the Wasalni ride-hailing project. Execute all fixes in order without asking questions. Use your best judgment for implementation details.

### PROJECT CONTEXT

- **Working Directory:** `/media/alash/New Volume/wasalni`
- **Components:** backend, admin-dashboard, passenger-app, driver-app
- **Total Fixes:** 60 (13 Critical, 24 Major, 23 Minor)

### EXECUTION RULES

1. Execute fixes in order (Critical first, then Major, then Minor)
2. Do NOT ask questions - make reasonable decisions
3. Create files when needed
4. Test each fix by checking syntax/types where possible
5. Commit after each phase with descriptive message

---

## CRITICAL FIXES TO EXECUTE

### FIX 1: Create Driver App Reset Password Screen

Create file: `driver-app/lib/screens/auth/reset_password_screen.dart`

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_screenutil/flutter_screenutil.dart';
import 'package:go_router/go_router.dart';

import '../../providers/auth_provider.dart';
import '../../config/theme.dart';

class ResetPasswordScreen extends ConsumerStatefulWidget {
  final String email;
  final String otp;

  const ResetPasswordScreen({
    super.key,
    required this.email,
    required this.otp,
  });

  @override
  ConsumerState<ResetPasswordScreen> createState() => _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends ConsumerState<ResetPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  bool _isLoading = false;

  @override
  void dispose() {
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _handleResetPassword() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      await ref.read(authProvider.notifier).resetPassword(
        widget.email,
        widget.otp,
        _passwordController.text,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('تم تغيير كلمة المرور بنجاح'),
            backgroundColor: Colors.green,
          ),
        );
        context.go('/login');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('فشل في تغيير كلمة المرور: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('كلمة مرور جديدة'),
        centerTitle: true,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.all(24.w),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SizedBox(height: 40.h),
                Icon(
                  Icons.lock_reset,
                  size: 80.sp,
                  color: AppColors.primary,
                ),
                SizedBox(height: 24.h),
                Text(
                  'أدخل كلمة المرور الجديدة',
                  style: TextStyle(
                    fontSize: 18.sp,
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 8.h),
                Text(
                  'يجب أن تكون كلمة المرور 8 أحرف على الأقل',
                  style: TextStyle(
                    fontSize: 14.sp,
                    color: AppColors.textSecondary,
                  ),
                  textAlign: TextAlign.center,
                ),
                SizedBox(height: 32.h),
                TextFormField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  decoration: InputDecoration(
                    labelText: 'كلمة المرور الجديدة',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword ? Icons.visibility_off : Icons.visibility,
                      ),
                      onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'يرجى إدخال كلمة المرور';
                    }
                    if (value.length < 8) {
                      return 'كلمة المرور يجب أن تكون 8 أحرف على الأقل';
                    }
                    return null;
                  },
                ),
                SizedBox(height: 16.h),
                TextFormField(
                  controller: _confirmPasswordController,
                  obscureText: _obscureConfirmPassword,
                  decoration: InputDecoration(
                    labelText: 'تأكيد كلمة المرور',
                    prefixIcon: const Icon(Icons.lock_outline),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscureConfirmPassword ? Icons.visibility_off : Icons.visibility,
                      ),
                      onPressed: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'يرجى تأكيد كلمة المرور';
                    }
                    if (value != _passwordController.text) {
                      return 'كلمتا المرور غير متطابقتين';
                    }
                    return null;
                  },
                ),
                SizedBox(height: 32.h),
                ElevatedButton(
                  onPressed: _isLoading ? null : _handleResetPassword,
                  style: ElevatedButton.styleFrom(
                    padding: EdgeInsets.symmetric(vertical: 16.h),
                    backgroundColor: AppColors.primary,
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text(
                          'تغيير كلمة المرور',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
```

Then add route to `driver-app/lib/config/router.dart`:
Find the routes list and add:
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

### FIX 2: Fix Driver App Documents Screen Redirect

File: `driver-app/lib/screens/auth/documents_screen.dart`

Find line with `context.go('/')` after successful document upload and change to:
```dart
context.go('/pending-approval');
```

---

### FIX 3: Fix Passenger App API Configuration

File: `passenger-app/lib/config/app_config.dart`

Replace the hardcoded ngrok URL with environment-based configuration. Find the apiBaseUrl and replace with:
```dart
static String get apiBaseUrl {
  // Production URL - set via environment or use default
  const String envUrl = String.fromEnvironment('API_BASE_URL', defaultValue: '');
  if (envUrl.isNotEmpty) return envUrl;

  // Development server
  return 'http://localhost:5000/api/v1';
}
```

Also update `driver-app/lib/config/app_config.dart` with the same pattern.

---

### FIX 4: Fix Passenger App Service Initialization

File: `passenger-app/lib/main.dart`

Ensure services are initialized before runApp. The main function should look like:
```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize core services first
  await StorageService.instance.init();
  await ApiService.instance.init();

  // Initialize Firebase
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  runApp(
    const ProviderScope(
      child: WasalniApp(),
    ),
  );
}
```

---

### FIX 5: Fix Passenger App Promo Code Endpoint

File: `passenger-app/lib/providers/trip_provider.dart`

Find the promo validation API call (around line 494-506) that uses `/fare/promo/validate` and change to:
```dart
final response = await _apiService.post('/promo/validate', data: {
  'code': promoCode,
  'fare': fare,
  'rideType': rideType,
});
```

---

### FIX 6: Fix Admin Dashboard Image Error Handling

File: `admin-dashboard/app/dashboard/drivers/pending/page.tsx`

Find the image viewer modal (around lines 401-407) and add error handling:
```tsx
<img
  src={selectedImage}
  alt="Document"
  className="max-w-full max-h-[80vh] object-contain"
  onError={(e) => {
    const target = e.target as HTMLImageElement;
    target.src = '/placeholder-document.png';
    target.onerror = null;
  }}
/>
```

Also create a placeholder image at `admin-dashboard/public/placeholder-document.png` or use a data URL.

---

### FIX 7: Add Backend Scheduled Trip Driver Notification

File: `backend/src/services/scheduled.service.ts`

Find the TODO comments and implement the missing functionality:

1. Find `// TODO: Notify driver if assigned` and add:
```typescript
if (driverId) {
  await notificationService.sendNotification(driverId, {
    title: 'New Scheduled Trip Assignment',
    titleAr: 'تعيين رحلة مجدولة جديدة',
    body: `You have been assigned a scheduled trip for ${scheduledTime}`,
    bodyAr: `تم تعيينك لرحلة مجدولة في ${scheduledTime}`,
    data: { tripId: trip._id.toString(), type: 'scheduled_assignment' },
  });
}
```

2. Find `// TODO: Emit socket event to start matching` and add:
```typescript
const io = getSocketIO();
io.to('drivers:online').emit('trip:scheduled:available', {
  tripId: trip._id,
  pickup: trip.pickup,
  dropoff: trip.dropoff,
  scheduledTime: trip.scheduledTime,
  rideType: trip.rideType,
  fareEstimate: trip.fareEstimate,
});
```

---

### FIX 8: Replace Console.log with Logger in Backend

File: `backend/src/middleware/auth.middleware.ts`

Replace all `console.log` statements with the logger service. Change:
```typescript
console.log('🔐 [Auth] Path: ${req.path}, Method: ${req.method}');
```
To:
```typescript
logger.debug(`[Auth] Path: ${req.path}, Method: ${req.method}`);
```

Import logger at top of file if not present:
```typescript
import { logger } from '../utils/logger';
```

---

### FIX 9: Add Error Toast System to Admin Dashboard

Install react-hot-toast if not present, then:

File: `admin-dashboard/app/dashboard/layout.tsx`

Add Toaster component:
```tsx
import { Toaster } from 'react-hot-toast';

// In the return, add:
<Toaster
  position="top-left"
  toastOptions={{
    duration: 4000,
    style: {
      direction: 'rtl',
    },
  }}
/>
```

Then update API error handling in pages to use:
```tsx
import toast from 'react-hot-toast';

// In catch blocks:
toast.error('فشل في تحميل البيانات');
```

---

### FIX 10: Implement Driver App Trips History Tab

File: `driver-app/lib/screens/home/home_screen.dart`

Find the `_TripsTab` widget (around lines 477-498) and replace the placeholder with:
```dart
class _TripsTab extends ConsumerStatefulWidget {
  const _TripsTab();

  @override
  ConsumerState<_TripsTab> createState() => _TripsTabState();
}

class _TripsTabState extends ConsumerState<_TripsTab> {
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    Future.microtask(() {
      ref.read(earningsProvider.notifier).loadTripHistory(refresh: true);
    });
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    if (_scrollController.position.pixels >=
        _scrollController.position.maxScrollExtent - 200) {
      ref.read(earningsProvider.notifier).loadTripHistory();
    }
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(earningsProvider);

    if (state.isLoading && state.tripHistory.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.tripHistory.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.history, size: 64.sp, color: Colors.grey),
            SizedBox(height: 16.h),
            Text(
              'لا توجد رحلات سابقة',
              style: TextStyle(fontSize: 16.sp, color: Colors.grey),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: () => ref.read(earningsProvider.notifier).loadTripHistory(refresh: true),
      child: ListView.builder(
        controller: _scrollController,
        padding: EdgeInsets.all(16.w),
        itemCount: state.tripHistory.length + (state.hasMoreHistory ? 1 : 0),
        itemBuilder: (context, index) {
          if (index >= state.tripHistory.length) {
            return const Center(child: CircularProgressIndicator());
          }
          final trip = state.tripHistory[index];
          return _TripHistoryCard(trip: trip);
        },
      ),
    );
  }
}
```

---

## MAJOR FIXES SUMMARY

Execute these additional fixes:

1. **Admin Dashboard Server Pagination** - Update all list pages to pass page/limit to API
2. **Driver App Earnings Connection** - Connect home screen _EarningsTab to earningsProvider
3. **Passenger App Notification Integration** - Initialize NotificationService in main.dart
4. **Admin Dashboard Settings Page** - Either implement zones/promos tabs or remove placeholders
5. **Driver App Cancel During Trip** - Add cancel option with SOS in active_trip_screen.dart
6. **Driver App Support Contact** - Implement email/phone support handlers

---

## MINOR FIXES SUMMARY

Execute these cleanup fixes:

1. Remove all debug `print()` statements from Flutter apps
2. Centralize status label mappings in constants files
3. Add consistent loading states across all screens
4. Add form validation for negative numbers
5. Replace browser `alert()` with custom dialogs
6. Add missing TypeScript types where needed
7. Complete Swagger documentation for all endpoints

---

## POST-FIX VERIFICATION

After all fixes:
1. Run `npm run lint` in backend and admin-dashboard
2. Run `flutter analyze` in both Flutter apps
3. Run `npm test` in backend
4. Build all projects to verify no compile errors

---

## COMMIT MESSAGE

After Phase 5 (all fixes executed), create a commit with:
```
fix: Apply comprehensive audit fixes across all projects

CRITICAL FIXES:
- Add driver app reset password screen
- Fix documents screen redirect
- Fix API URL configuration
- Fix service initialization order
- Fix promo code endpoint
- Add image error handling

MAJOR FIXES:
- Complete scheduled trip driver notification
- Add error toast system
- Implement trips history tab
- Replace console.log with logger

MINOR FIXES:
- Remove debug statements
- Improve error handling
- Add form validations

Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>
```

---

*This prompt is ready for automated execution*

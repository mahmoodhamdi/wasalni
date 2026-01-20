# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wasalni (وصّلني) is a local ride-hailing platform for Bagour city and surrounding areas in El-Menofia Governorate, Egypt. The system serves passengers, drivers, and administrators through separate applications.

## Development Commands

### Backend (Node.js 20+ / Express 5 / TypeScript)
```bash
cd backend
npm install
npm run dev          # Development with nodemon (port 5000)
npm run build        # TypeScript compilation
npm start            # Production server
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier formatting
npm test             # Jest tests (uses mongodb-memory-server)
npm test -- --testPathPattern="auth"  # Run single test file
npm test -- --watch  # Watch mode for development
npm run seed         # Seed database with sample data
npm run seed:fresh   # Clear DB and reseed
npm run docs:generate  # Generate Swagger JSON file
```

### Admin Dashboard (Next.js 16 with App Router)
```bash
cd admin-dashboard
npm install
npm run dev          # Development server (port 3000)
npm run build        # Production build
npm run lint         # ESLint check
npm run test:e2e     # Playwright E2E tests (headless)
npm run test:e2e:ui  # Playwright E2E tests with UI
```

### Passenger App (Flutter SDK ^3.6.2)
```bash
cd passenger-app
flutter pub get
dart run build_runner build    # Generate Riverpod providers
flutter analyze                # Static analysis
flutter run                    # Run on connected device
flutter run -d chrome          # Web development
flutter build apk              # Android release
flutter build ios              # iOS release
```

### Driver App (Flutter SDK ^3.6.2)
```bash
cd driver-app
flutter pub get
dart run build_runner build    # Generate Riverpod providers and freezed classes
flutter analyze                # Static analysis
flutter run
flutter build apk
```

### Docker Development
```bash
# Start MongoDB, Redis, Mongo Express, Redis Commander
docker compose -f docker-compose.dev.yml up -d

# Production (includes backend and admin dashboard)
docker compose up -d
```

Development services:
- MongoDB: localhost:27017 (user: wasalni, pass: wasalni123)
- Redis: localhost:6379
- Mongo Express UI: localhost:8081 (admin/admin123)
- Redis Commander: localhost:8082

### Running Full Stack Locally
1. Start Docker services: `docker compose -f docker-compose.dev.yml up -d`
2. In terminal 1: `cd backend && npm run dev` (API on port 5000)
3. In terminal 2: `cd admin-dashboard && npm run dev` (Dashboard on port 3000)
4. In terminal 3: `cd passenger-app && flutter run` or `cd driver-app && flutter run`

## Architecture

### Monorepo Structure
```
wasalni/
├── backend/           # Express API (TypeScript)
├── passenger-app/     # Flutter mobile app for riders
├── driver-app/        # Flutter mobile app for drivers
├── admin-dashboard/   # Next.js web dashboard
├── shared/types/      # Shared TypeScript type definitions
└── scripts/           # MongoDB init and utilities
```

### Backend Architecture (Express 5)
Note: Uses Express 5 which has async error handling built-in and some API changes from Express 4.
- **Entry point:** `backend/src/index.ts` → `backend/src/app.ts`
- **API prefix:** `/api/v1/`
- **API docs:** `/api/docs` (Swagger UI), `/api/docs/redoc` (Redoc)
- **Routes:** `backend/src/routes/` - Express routers
- **Controllers:** `backend/src/controllers/` - Request handlers
- **Services:** `backend/src/services/` - Business logic
- **Models:** `backend/src/models/` - Mongoose schemas
- **Middleware:** `backend/src/middleware/` - Auth, error handling
- **Config:** `backend/src/config/` - Database, Redis, Firebase, Maps setup
- **Sockets:** `backend/src/sockets/` - Socket.io event handlers (e.g., `trip.socket.ts`)

Key patterns:
- **Bilingual responses:** ALL API responses must include both `message` (English) and `messageAr` (Arabic). This applies to success messages, error messages, and validation errors.
```json
{
  "success": true,
  "message": "Trip created successfully",
  "messageAr": "تم إنشاء الرحلة بنجاح",
  "data": { ... }
}
```
- JWT authentication with email/OTP verification and Google Sign-In
- Socket.io for real-time driver location and trip updates
- Redis for caching and driver location tracking (with MongoDB fallback)
- **Error classes:** Use `AppError` subclasses from `backend/src/utils/errors.ts`:
  - `BadRequestError`, `UnauthorizedError`, `ForbiddenError`, `NotFoundError`
  - `ConflictError`, `ValidationError`, `TooManyRequestsError`, `ServiceUnavailableError`
  - All constructors accept `(message, messageAr)` for bilingual support

### Backend Services Layer
Key services in `backend/src/services/`:
- `auth.service.ts` - OTP generation, JWT tokens, user registration
- `trip.service.ts` - Trip lifecycle (create, assign, status updates, cancel, complete)
- `matching.service.ts` - Driver matching with EventEmitter for async events
- `fare.service.ts` - Fare calculation, surge pricing, promo discounts
- `location.service.ts` - Redis GEO for driver locations (MongoDB fallback)
- `maps.service.ts` - Google Maps integration (routes, geocoding, places)
- `notification.service.ts` - FCM push notifications with multi-device support
- `safety.service.ts` - Emergency contacts, SOS, trip sharing
- `scheduled.service.ts` - Scheduled rides with time slot management
- `promo.service.ts` - Promo code validation and usage tracking
- `admin.service.ts` - Dashboard stats, driver approval, finance reports

### Socket.io Room Architecture
Socket rooms are used for targeted real-time communication:
- `user:{userId}` - Personal room for each passenger
- `driver:{driverId}` - Personal room for each driver
- `drivers:online` - All online drivers (for trip broadcasts)
- `trip:{tripId}` - Both passenger and driver join during a trip
- `admin:dashboard` - Admin dashboard for live monitoring
- `admin:emergency` - Admin emergency/SOS alerts

### Auth Middleware Pattern
Role-based access uses composable middleware in `backend/src/middleware/auth.middleware.ts`:
- `authenticate` - Requires valid JWT token
- `passengerOnly`, `driverOnly`, `adminOnly` - Role restrictions
- `authorize('role1', 'role2')` - Custom role combinations

### Flutter Apps Architecture
Both passenger-app and driver-app use:
- **State Management:** Riverpod with riverpod_generator
- **Navigation:** GoRouter
- **Network:** Dio for HTTP, socket_io_client for real-time
- **Storage:** shared_preferences + flutter_secure_storage
- **Maps:** flutter_map (OpenStreetMap) + geolocator
- **Code Generation:** Run `dart run build_runner build` after modifying providers or models

Structure pattern:
```
lib/
├── config/         # app_config.dart, theme.dart, router.dart
├── providers/      # Riverpod providers (*.g.dart generated files)
├── screens/        # UI screens by feature (auth/, home/)
├── services/       # api_service.dart, socket_service.dart
└── widgets/        # Reusable components
```

Driver-app additionally uses:
- **freezed** for immutable data classes
- **sqflite** for local offline storage

### Admin Dashboard Architecture
- **Framework:** Next.js 16 with App Router (React 19)
- **State:** Zustand store (`lib/store.ts`)
- **API Client:** Axios with auth interceptors (`lib/api.ts`)
- **UI:** Tailwind CSS 4 + custom components
- **Routing:** `app/` directory with nested layouts
- **Maps:** Leaflet (react-leaflet) for admin map views
- **Charts:** Recharts for analytics
- **Components:** `components/layout/` (Sidebar, Header), `components/ui/` (StatsCard, DataTable)

### Shared Types
`shared/types/index.ts` contains TypeScript interfaces used across backend and admin dashboard:
- User types: IUser, IPassenger, IDriver
- Trip types: ITrip, TripStatus, IFareBreakdown
- Socket events: SocketEvents interface
- API responses: ApiResponse, PaginatedResponse

## Key Domain Concepts

### Vehicle/Ride Types
`economy` | `comfort` | `family` | `tuktuk` | `motorcycle`

### Trip Status Flow
`pending` → `searching` → `accepted` → `arriving` → `arrived` → `in_progress` → `completed`

### Driver Status
- Approval: `pending` | `approved` | `rejected` | `suspended`
- Online: `offline` | `online` | `busy`

## Environment Configuration

Copy `backend/.env.example` to `backend/.env`. Key variables:
- `MONGODB_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection string (optional, has MongoDB fallback)
- `JWT_SECRET`: JWT signing key
- `GOOGLE_MAPS_API_KEY`: Required for maps functionality
- `FIREBASE_*`: Push notification configuration
- `RESEND_API_KEY`: Email service for OTP delivery
- `SMS_PROVIDER`: `mock` | `twilio` | `unifonic` for SMS OTP

For admin dashboard, set `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:5000/api/v1`).

## Testing

### Backend Tests
```bash
cd backend
npm test                              # Run all tests
npm test -- --testPathPattern="auth"  # Run tests matching "auth"
npm test -- --watch                   # Watch mode
npm test -- --coverage                # With coverage report
```

Tests use `mongodb-memory-server` for in-memory MongoDB - no external database needed.

### Flutter Tests
```bash
cd passenger-app  # or driver-app
flutter test                          # Run all tests
flutter test test/widget_test.dart    # Run specific test file
```

## Documentation

- `docs/API.md` - Full API reference with all endpoints and Socket.io events
- `docs/DEPLOYMENT.md` - Deployment guide for Docker, cloud, and database setup

## Current Development Status

All 8 phases complete (67/67 milestones). The project is production-ready. See `PROJECT_PROGRESS.md` for detailed milestone tracking and implementation history.

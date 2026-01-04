# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Wasalni (وصّلني) is a local ride-hailing platform for Bagour city and surrounding areas in El-Menofia Governorate, Egypt. The system serves passengers, drivers, and administrators through separate applications.

## Development Commands

### Backend (Node.js/Express/TypeScript)
```bash
cd backend
npm install
npm run dev          # Development with nodemon
npm run build        # TypeScript compilation
npm start            # Production server
npm run lint         # ESLint check
npm run lint:fix     # ESLint auto-fix
npm run format       # Prettier formatting
npm test             # Jest tests
npm test -- --testPathPattern="auth"  # Run single test file
```

### Admin Dashboard (Next.js 16)
```bash
cd admin-dashboard
npm install
npm run dev          # Development server (port 3000)
npm run build        # Production build
npm run lint         # ESLint check
```

### Passenger App (Flutter)
```bash
cd passenger-app
flutter pub get
dart run build_runner build    # Generate Riverpod providers
flutter run                    # Run on connected device
flutter run -d chrome          # Web development
flutter build apk              # Android release
flutter build ios              # iOS release
```

### Driver App (Flutter)
```bash
cd driver-app
flutter pub get
dart run build_runner build    # Generate Riverpod providers
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

### Backend Architecture
- **Entry point:** `backend/src/index.ts` → `backend/src/app.ts`
- **API prefix:** `/api/v1/`
- **Routes:** `backend/src/routes/` - Express routers
- **Controllers:** `backend/src/controllers/` - Request handlers
- **Services:** `backend/src/services/` - Business logic
- **Models:** `backend/src/models/` - Mongoose schemas
- **Middleware:** `backend/src/middleware/` - Auth, error handling
- **Config:** `backend/src/config/` - Database, Redis, Firebase, Maps setup

Key patterns:
- Bilingual API responses: Always include both `message` (English) and `messageAr` (Arabic) in all responses
- JWT authentication with phone/OTP verification
- Socket.io for real-time driver location and trip updates
- Redis for caching and driver location tracking (with MongoDB fallback)
- OTP in development: Set `SMS_PROVIDER=mock` in `.env` to skip real SMS; OTP is logged to console

### Flutter Apps Architecture
Both passenger-app and driver-app use:
- **State Management:** Riverpod with riverpod_generator
- **Navigation:** GoRouter
- **Network:** Dio for HTTP, socket_io_client for real-time
- **Storage:** shared_preferences + flutter_secure_storage
- **Maps:** google_maps_flutter + geolocator

Structure pattern:
```
lib/
├── config/         # app_config.dart, theme.dart, router.dart
├── providers/      # Riverpod providers
├── screens/        # UI screens by feature (auth/, home/)
├── services/       # api_service.dart, socket_service.dart
└── widgets/        # Reusable components
```

### Admin Dashboard Architecture
- **Framework:** Next.js 16 with App Router
- **State:** Zustand store (`lib/store.ts`)
- **API Client:** Axios with auth interceptors (`lib/api.ts`)
- **UI:** Tailwind CSS + custom components
- **Routing:** `app/` directory with nested layouts
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

Copy `.env.example` to `.env` in the root. Key variables:
- `MONGODB_URI`: MongoDB connection string
- `REDIS_URL`: Redis connection string
- `JWT_SECRET`: JWT signing key
- `GOOGLE_MAPS_API_KEY`: Required for maps functionality
- `FIREBASE_*`: Push notification configuration
- `NEXT_PUBLIC_API_URL`: Admin dashboard API endpoint

## Documentation

- `docs/API.md` - Full API reference with all endpoints and Socket.io events
- `docs/DEPLOYMENT.md` - Deployment guide for Docker, cloud, and database setup

## Current Development Status

All 8 phases complete (67/67 milestones). The project is production-ready. See `PROJECT_PROGRESS.md` for detailed milestone tracking and implementation history.

# Wasalni (وصّلني)

> توصيلتك علينا - Your ride is on us

Local ride-hailing platform for Bagour city and surrounding areas in Egypt.

## Overview

Wasalni is a comprehensive ride-hailing solution designed specifically for the Bagour area (El-Menofia Governorate), serving over 350,000 residents across the city and 47 surrounding villages.

## Features

### For Passengers
- Request instant or scheduled rides
- Multiple ride types (Economy, Comfort, Family, Tuk-Tuk, Motorcycle)
- Real-time driver tracking
- Trip sharing with family/friends
- Multiple payment methods (Cash, Card, Wallet)
- Fare estimates before booking
- Rate and review drivers
- SOS emergency button

### For Drivers
- Easy registration with document verification
- Online/Offline status control
- Accept/Reject ride requests
- Navigation to pickup and dropoff
- Earnings tracking and withdrawal
- Rating system

### For Admins
- Real-time dashboard with statistics
- Driver approval and management
- Trip monitoring and dispute resolution
- Fare and zone configuration
- Promo code management
- Financial reports

## Tech Stack

| Component | Technology |
|-----------|------------|
| Backend | Node.js, Express, TypeScript, MongoDB, Socket.io, Redis |
| Passenger App | Flutter, Riverpod, Google Maps |
| Driver App | Flutter, Background Location Tracking |
| Admin Dashboard | Next.js 14, Tailwind CSS, shadcn/ui |
| Notifications | Firebase Cloud Messaging |
| Maps | Google Maps API |

## Project Structure

```
wasalni/
├── backend/           # Node.js API server
├── passenger-app/     # Flutter passenger mobile app
├── driver-app/        # Flutter driver mobile app
├── admin-dashboard/   # Next.js admin web dashboard
├── shared/            # Shared types and constants
└── docs/              # Documentation
```

## Ride Types

| Type | Description | Use Case |
|------|-------------|----------|
| Economy | Standard cars (Verna, Lanos) | Daily commute |
| Comfort | Newer, better cars | Better experience |
| Family | 7-seater vehicles (Van, SUV) | Groups and families |
| Tuk-Tuk | Three-wheelers | Short city trips |
| Motorcycle | Motorbikes | Solo, fast travel |

## Service Areas

- **Primary:** Bagour City Center
- **Secondary:** 47 surrounding villages
- **Expansion:** Shebin El-Kom, Ashmoun, Menouf

## Getting Started

### Prerequisites
- Node.js 20+
- MongoDB
- Redis (optional, for real-time)
- Flutter SDK
- Google Maps API Key
- Firebase Project

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Configure .env with your settings
npm run dev
```

### Passenger App Setup
```bash
cd passenger-app
flutter pub get
# Configure Google Maps API key
flutter run
```

### Driver App Setup
```bash
cd driver-app
flutter pub get
# Configure Google Maps API key
flutter run
```

### Admin Dashboard Setup
```bash
cd admin-dashboard
npm install
npm run dev
```

## Revenue Model

- 20% commission per completed trip
- Fixed booking fee (3-5 EGP)
- Surge pricing during peak hours
- Scheduled ride fees
- Cancellation fees
- Intercity trip premium (25%)

## License

Private - All rights reserved

## Contact

For support or inquiries, please contact the development team.

---

Built with dedication for the people of Bagour and El-Menofia

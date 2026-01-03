# Wasalni API Documentation

## Base URL
```
Production: https://api.wasalni.app/api/v1
Development: http://localhost:3001/api/v1
```

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## Auth Endpoints

### Send OTP
```http
POST /auth/send-otp
```

**Request Body:**
```json
{
  "phone": "+201012345678"
}
```

**Response:**
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "messageAr": "تم إرسال رمز التحقق بنجاح"
}
```

### Verify OTP
```http
POST /auth/verify-otp
```

**Request Body:**
```json
{
  "phone": "+201012345678",
  "code": "123456"
}
```

**Response (New User):**
```json
{
  "success": true,
  "data": {
    "isNewUser": true
  }
}
```

**Response (Existing User):**
```json
{
  "success": true,
  "data": {
    "isNewUser": false,
    "tokens": {
      "accessToken": "eyJ...",
      "refreshToken": "eyJ..."
    },
    "user": {
      "_id": "...",
      "phone": "+201012345678",
      "name": "Ahmed",
      "role": "passenger"
    }
  }
}
```

### Register Passenger
```http
POST /auth/register
```

**Request Body:**
```json
{
  "phone": "+201012345678",
  "name": "Ahmed Mohamed",
  "email": "ahmed@example.com",
  "gender": "male"
}
```

### Register Driver
```http
POST /auth/register/driver
```

**Request Body:**
```json
{
  "phone": "+201012345679",
  "name": "Mohamed Ali",
  "nationalId": "12345678901234",
  "vehicleType": "car",
  "vehicleCategory": "economy",
  "vehicle": {
    "make": "Toyota",
    "model": "Corolla",
    "year": 2020,
    "color": "White",
    "plateNumber": "أ ب ج 123"
  }
}
```

### Admin Login
```http
POST /auth/admin/login
```

**Request Body:**
```json
{
  "email": "admin@wasalni.app",
  "password": "password123"
}
```

### Update FCM Token
```http
POST /auth/fcm-token
```

**Request Body:**
```json
{
  "token": "fcm_device_token_here"
}
```

---

## Trip Endpoints

### Create Trip
```http
POST /trips
```

**Request Body:**
```json
{
  "pickup": {
    "address": "شارع التحرير، القاهرة",
    "coordinates": {
      "lat": 30.0444,
      "lng": 31.2357
    }
  },
  "dropoff": {
    "address": "مطار القاهرة",
    "coordinates": {
      "lat": 30.1219,
      "lng": 31.4056
    }
  },
  "rideType": "economy",
  "paymentMethod": "cash",
  "promoCode": "WELCOME20"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "trip": {
      "_id": "...",
      "tripNumber": "TRP-12345",
      "status": "pending",
      "fare": {
        "estimated": 85,
        "baseFare": 10,
        "distanceFare": 55,
        "timeFare": 20
      }
    }
  }
}
```

### Get Trip Details
```http
GET /trips/:tripId
```

### Cancel Trip
```http
POST /trips/:tripId/cancel
```

**Request Body:**
```json
{
  "reason": "Changed my mind"
}
```

### Rate Trip
```http
POST /trips/:tripId/rate
```

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Great driver!"
}
```

### Trigger SOS
```http
POST /trips/:tripId/sos
```

---

## Driver Endpoints

### Go Online
```http
POST /driver/online
```

### Go Offline
```http
POST /driver/offline
```

### Update Location
```http
POST /driver/location
```

**Request Body:**
```json
{
  "lat": 30.0444,
  "lng": 31.2357,
  "heading": 90,
  "speed": 45.5
}
```

### Accept Trip
```http
POST /driver/trips/:tripId/accept
```

### Reject Trip
```http
POST /driver/trips/:tripId/reject
```

### Update Trip Status
```http
PUT /driver/trips/:tripId/status
```

**Request Body:**
```json
{
  "status": "arrived"
}
```

Status values: `arriving`, `arrived`, `in_progress`, `completed`

---

## Fare Endpoints

### Get Fare Estimate
```http
POST /fare/estimate
```

**Request Body:**
```json
{
  "pickup": {
    "lat": 30.0444,
    "lng": 31.2357
  },
  "dropoff": {
    "lat": 30.1219,
    "lng": 31.4056
  },
  "rideType": "economy"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "estimates": [
      {
        "rideType": "economy",
        "fare": 85,
        "duration": 25,
        "distance": 15.5
      },
      {
        "rideType": "comfort",
        "fare": 120,
        "duration": 25,
        "distance": 15.5
      }
    ]
  }
}
```

---

## Scheduled Trips

### Create Scheduled Trip
```http
POST /scheduled
```

**Request Body:**
```json
{
  "scheduledFor": "2024-01-15T10:00:00Z",
  "pickup": {
    "address": "Home",
    "coordinates": { "lat": 30.0444, "lng": 31.2357 }
  },
  "dropoff": {
    "address": "Office",
    "coordinates": { "lat": 30.0500, "lng": 31.2400 }
  },
  "rideType": "economy",
  "paymentMethod": "cash"
}
```

### Get Upcoming Scheduled Trips
```http
GET /scheduled
```

### Cancel Scheduled Trip
```http
POST /scheduled/:tripId/cancel
```

---

## Promo Codes

### Validate Promo Code
```http
POST /promo/validate
```

**Request Body:**
```json
{
  "code": "WELCOME20",
  "fare": 100,
  "rideType": "economy"
}
```

### Get Available Promos
```http
GET /promo/available
```

---

## Safety Endpoints

### Get Emergency Contacts
```http
GET /safety/contacts
```

### Add Emergency Contact
```http
POST /safety/contacts
```

**Request Body:**
```json
{
  "name": "Ahmed",
  "phone": "+201012345678",
  "relationship": "brother",
  "notifyOnTrip": true,
  "notifyOnSOS": true
}
```

### Share Trip
```http
POST /safety/share/:tripId
```

---

## Notifications

### Get Notifications
```http
GET /notifications?page=1&limit=20
```

### Mark as Read
```http
PUT /notifications/:notificationId/read
```

### Mark All as Read
```http
PUT /notifications/read-all
```

---

## Admin Endpoints

### Get Dashboard Stats
```http
GET /admin/stats
```

### Get Drivers
```http
GET /admin/drivers?status=pending&page=1&limit=20
```

### Approve Driver
```http
POST /admin/drivers/:driverId/approve
```

### Reject Driver
```http
POST /admin/drivers/:driverId/reject
```

**Request Body:**
```json
{
  "reason": "Invalid documents"
}
```

### Get Trips
```http
GET /admin/trips?status=completed&page=1&limit=20
```

### Get Finance Stats
```http
GET /admin/finance?period=week
```

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "message": "Error message in English",
  "messageAr": "رسالة الخطأ بالعربية",
  "errors": [
    {
      "field": "phone",
      "message": "Invalid phone number"
    }
  ]
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `422` - Validation Error
- `500` - Internal Server Error

---

## Socket.io Events

### Connection
```javascript
const socket = io('wss://api.wasalni.app', {
  auth: { token: 'Bearer <access_token>' }
});
```

### Passenger Events
- `trip:status:update` - Trip status changed
- `trip:driver:location` - Driver location update
- `trip:driver:assigned` - Driver assigned to trip

### Driver Events
- `trip:request` - New trip request
- `trip:cancelled` - Trip was cancelled

### Admin Events
- `trip:sos` - SOS triggered
- `driver:status:change` - Driver online status changed

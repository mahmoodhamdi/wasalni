import swaggerJsdoc from 'swagger-jsdoc';
import { config } from './index';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Wasalni API',
      version: '1.0.0',
      description: `
# وصّلني - Wasalni Ride-Hailing API

A comprehensive ride-hailing API for Bagour city and surrounding areas in El-Menofia Governorate, Egypt.

## Authentication
All authenticated endpoints require a Bearer token in the Authorization header:
\`\`\`
Authorization: Bearer <your_jwt_token>
\`\`\`

## Rate Limiting
- Global: 100 requests per 15 minutes
- OTP Send: 5 requests per hour
- OTP Verify: 10 requests per 15 minutes

## Error Responses
All errors follow this format:
\`\`\`json
{
  "success": false,
  "message": "Error message in English",
  "messageAr": "رسالة الخطأ بالعربية",
  "error": "ERROR_CODE"
}
\`\`\`

## Common Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized
- 403: Forbidden
- 404: Not Found
- 409: Conflict
- 422: Validation Error
- 429: Too Many Requests
- 500: Internal Server Error
      `,
      contact: {
        name: 'Wasalni Support',
        email: 'support@wasalni.com',
      },
      license: {
        name: 'Private',
        url: 'https://wasalni.com',
      },
    },
    servers: [
      {
        url: `http://localhost:${config.port}/api/${config.apiVersion}`,
        description: 'Development Server',
      },
      {
        url: 'https://api.wasalni.com/api/v1',
        description: 'Production Server',
      },
    ],
    tags: [
      { name: 'Auth', description: 'Authentication & Authorization' },
      { name: 'Passenger', description: 'Passenger-specific endpoints' },
      { name: 'Driver', description: 'Driver-specific endpoints' },
      { name: 'Trip', description: 'Trip management' },
      { name: 'Fare', description: 'Fare calculation & settings' },
      { name: 'Location', description: 'Location & maps services' },
      { name: 'Safety', description: 'Safety features & SOS' },
      { name: 'Promo', description: 'Promotional codes' },
      { name: 'Notification', description: 'Push notifications' },
      { name: 'Scheduled', description: 'Scheduled rides' },
      { name: 'Admin', description: 'Admin dashboard APIs' },
      { name: 'Payment', description: 'Payment & wallet' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT access token obtained from /auth/verify-otp or /auth/admin/login',
        },
      },
      schemas: {
        // Common Schemas
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error message' },
            messageAr: { type: 'string', example: 'رسالة الخطأ' },
            error: { type: 'string', example: 'ERROR_CODE' },
          },
        },
        Success: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Success message' },
            messageAr: { type: 'string', example: 'رسالة النجاح' },
            data: { type: 'object' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer', example: 100 },
            pages: { type: 'integer', example: 5 },
          },
        },
        // Location Schemas
        GeoPoint: {
          type: 'object',
          required: ['lat', 'lng'],
          properties: {
            lat: { type: 'number', example: 30.0444 },
            lng: { type: 'number', example: 31.2357 },
          },
        },
        Location: {
          type: 'object',
          required: ['coordinates', 'address'],
          properties: {
            coordinates: { $ref: '#/components/schemas/GeoPoint' },
            address: { type: 'string', example: 'ميدان التحرير، القاهرة' },
            placeId: { type: 'string', example: 'ChIJL6wn6oAWWBQRw-YTYxV1lsE' },
          },
        },
        // User Schemas
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '507f1f77bcf86cd799439011' },
            name: { type: 'string', example: 'أحمد محمد' },
            phone: { type: 'string', example: '+201111111111' },
            email: { type: 'string', example: 'ahmed@example.com' },
            role: { type: 'string', enum: ['passenger', 'driver', 'admin'] },
            avatar: { type: 'string', example: 'https://...' },
            isPhoneVerified: { type: 'boolean', example: true },
            isActive: { type: 'boolean', example: true },
            language: { type: 'string', enum: ['ar', 'en'], example: 'ar' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // Driver Schemas
        Driver: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { $ref: '#/components/schemas/User' },
            displayName: { type: 'string', example: 'محمد السائق' },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'suspended'] },
            isOnline: { type: 'boolean' },
            isAvailable: { type: 'boolean' },
            vehicle: { $ref: '#/components/schemas/Vehicle' },
            rating: { type: 'number', example: 4.8 },
            totalTrips: { type: 'integer', example: 150 },
            totalEarnings: { type: 'number', example: 15000 },
            currentLocation: { $ref: '#/components/schemas/GeoPoint' },
          },
        },
        Vehicle: {
          type: 'object',
          properties: {
            type: { type: 'string', enum: ['economy', 'comfort', 'family', 'tuktuk', 'motorcycle'] },
            make: { type: 'string', example: 'Toyota' },
            model: { type: 'string', example: 'Corolla' },
            year: { type: 'integer', example: 2020 },
            color: { type: 'string', example: 'أبيض' },
            plateNumber: { type: 'string', example: 'أ ب ج 1234' },
          },
        },
        // Passenger Schemas
        Passenger: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { $ref: '#/components/schemas/User' },
            savedPlaces: {
              type: 'array',
              items: { $ref: '#/components/schemas/SavedPlace' },
            },
            rating: { type: 'number', example: 4.9 },
            totalTrips: { type: 'integer', example: 50 },
            wallet: {
              type: 'object',
              properties: {
                balance: { type: 'number', example: 250 },
                currency: { type: 'string', example: 'EGP' },
              },
            },
          },
        },
        SavedPlace: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'المنزل' },
            address: { type: 'string', example: 'شارع الهرم، الجيزة' },
            location: { $ref: '#/components/schemas/GeoPoint' },
            type: { type: 'string', enum: ['home', 'work', 'other'] },
          },
        },
        // Trip Schemas
        Trip: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            tripNumber: { type: 'string', example: 'WAS-10001' },
            passenger: { $ref: '#/components/schemas/Passenger' },
            driver: { $ref: '#/components/schemas/Driver' },
            status: {
              type: 'string',
              enum: ['pending', 'searching', 'driver_assigned', 'driver_arriving', 'driver_arrived', 'trip_started', 'completed', 'cancelled'],
            },
            rideType: { type: 'string', enum: ['economy', 'comfort', 'family', 'tuktuk', 'motorcycle'] },
            pickup: { $ref: '#/components/schemas/Location' },
            dropoff: { $ref: '#/components/schemas/Location' },
            distance: { type: 'number', example: 12.5, description: 'Distance in km' },
            duration: { type: 'number', example: 25, description: 'Duration in minutes' },
            fare: { $ref: '#/components/schemas/FareBreakdown' },
            paymentMethod: { type: 'string', enum: ['cash', 'card', 'wallet'] },
            paymentStatus: { type: 'string', enum: ['pending', 'paid', 'refunded'] },
            passengerRating: { type: 'number', minimum: 1, maximum: 5 },
            driverRating: { type: 'number', minimum: 1, maximum: 5 },
            createdAt: { type: 'string', format: 'date-time' },
            completedAt: { type: 'string', format: 'date-time' },
          },
        },
        FareBreakdown: {
          type: 'object',
          properties: {
            baseFare: { type: 'number', example: 10 },
            distanceFare: { type: 'number', example: 37.5 },
            timeFare: { type: 'number', example: 12.5 },
            surgeFare: { type: 'number', example: 0 },
            waitingFee: { type: 'number', example: 0 },
            serviceFee: { type: 'number', example: 5 },
            discount: { type: 'number', example: 10 },
            total: { type: 'number', example: 55 },
            driverEarnings: { type: 'number', example: 44 },
            platformFee: { type: 'number', example: 11 },
          },
        },
        // Promo Schemas
        PromoCode: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            code: { type: 'string', example: 'WELCOME50' },
            discountType: { type: 'string', enum: ['percentage', 'fixed'] },
            discountValue: { type: 'number', example: 50 },
            maxDiscount: { type: 'number', example: 30 },
            minFare: { type: 'number', example: 20 },
            maxUses: { type: 'integer', example: 1000 },
            usedCount: { type: 'integer', example: 156 },
            validFrom: { type: 'string', format: 'date-time' },
            validUntil: { type: 'string', format: 'date-time' },
            isActive: { type: 'boolean' },
            descriptionAr: { type: 'string', example: 'خصم 50% للرحلة الأولى' },
          },
        },
        // Notification Schema
        Notification: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            type: { type: 'string', example: 'trip_completed' },
            title: { type: 'string', example: 'اكتملت الرحلة' },
            message: { type: 'string', example: 'شكراً لاستخدامك وصلني' },
            isRead: { type: 'boolean' },
            data: { type: 'object' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        // Emergency Contact
        EmergencyContact: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'أحمد' },
            phone: { type: 'string', example: '+201234567890' },
            relationship: { type: 'string', example: 'أخ' },
            notifyOnTrip: { type: 'boolean' },
            notifyOnSOS: { type: 'boolean' },
          },
        },
        // Zone Schema
        Zone: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            name: { type: 'string', example: 'Downtown Cairo' },
            nameAr: { type: 'string', example: 'وسط القاهرة' },
            isActive: { type: 'boolean' },
            surgeMultiplier: { type: 'number', example: 1.2 },
          },
        },
        // Fare Settings
        FareSettings: {
          type: 'object',
          properties: {
            vehicleType: { type: 'string', enum: ['economy', 'comfort', 'family', 'tuktuk', 'motorcycle'] },
            baseFare: { type: 'number', example: 10 },
            perKmRate: { type: 'number', example: 3 },
            perMinuteRate: { type: 'number', example: 0.5 },
            minimumFare: { type: 'number', example: 15 },
            cancellationFee: { type: 'number', example: 10 },
            platformFeePercentage: { type: 'number', example: 20 },
            isActive: { type: 'boolean' },
          },
        },
      },
      responses: {
        BadRequest: {
          description: 'Bad Request',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        Unauthorized: {
          description: 'Unauthorized - Invalid or missing token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        Forbidden: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
        TooManyRequests: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
            },
          },
        },
      },
    },
    security: [{ bearerAuth: [] }],
  },
  apis: [
    './src/routes/*.ts',
    './src/controllers/*.ts',
    './src/models/*.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);

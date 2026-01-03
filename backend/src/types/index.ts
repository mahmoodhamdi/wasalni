import { Document, Types } from 'mongoose';

// User Roles
export type UserRole = 'passenger' | 'driver' | 'admin';

// Gender
export type Gender = 'male' | 'female';

// Language
export type Language = 'ar' | 'en';

// Driver Status
export type DriverStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

// Vehicle Types
export type VehicleType = 'car' | 'tuktuk' | 'motorcycle';

// Ride Categories
export type RideCategory = 'economy' | 'comfort' | 'family';

// Trip Types
export type TripType = 'instant' | 'scheduled' | 'intercity';

// Trip Status
export type TripStatus =
  | 'searching'
  | 'driver_assigned'
  | 'driver_arriving'
  | 'driver_arrived'
  | 'trip_started'
  | 'trip_completed'
  | 'cancelled';

// Payment Methods
export type PaymentMethod = 'cash' | 'card' | 'wallet';

// Payment Status
export type PaymentStatus = 'pending' | 'paid' | 'refunded';

// Cancellation By
export type CancelledBy = 'passenger' | 'driver' | 'admin' | 'system';

// Promo Types
export type PromoType = 'percentage' | 'fixed';

// Transaction Types
export type TransactionType =
  | 'trip_fare'
  | 'driver_payout'
  | 'wallet_topup'
  | 'refund'
  | 'cancellation_fee'
  | 'bonus';

// Transaction Status
export type TransactionStatus = 'pending' | 'completed' | 'failed';

// Zone Types
export type ZoneType = 'service_area' | 'surge_zone' | 'restricted';

// Issue Status
export type IssueStatus = 'open' | 'resolved';

// Location Point
export interface GeoPoint {
  type: 'Point';
  coordinates: [number, number]; // [longitude, latitude]
}

// Polygon for zones
export interface GeoPolygon {
  type: 'Polygon';
  coordinates: [[[number, number]]];
}

// Emergency Contact
export interface EmergencyContact {
  name: string;
  phone: string;
  relation: string;
}

// Saved Place
export interface SavedPlace {
  _id?: Types.ObjectId;
  name: string;
  address: string;
  location: GeoPoint;
  icon: 'home' | 'work' | 'favorite';
}

// Working Hours
export interface WorkingHours {
  day: number; // 0-6 (Sunday-Saturday)
  isWorking: boolean;
  start: string; // "HH:mm"
  end: string; // "HH:mm"
}

// Driver Documents
export interface DriverDocuments {
  nationalIdFront?: string;
  nationalIdBack?: string;
  nationalIdNumber?: string;
  nationalIdExpiry?: Date;
  drivingLicenseFront?: string;
  drivingLicenseBack?: string;
  drivingLicenseNumber?: string;
  drivingLicenseExpiry?: Date;
  criminalRecord?: string;
}

// Vehicle Info
export interface VehicleInfo {
  type: VehicleType;
  category: RideCategory;
  make: string;
  model: string;
  year: number;
  color: string;
  plateNumber: string;
  plateImage?: string;
  vehicleImage?: string;
  registrationImage?: string;
  insuranceImage?: string;
  insuranceExpiry?: Date;
  seats: number;
}

// Destination Mode
export interface DestinationMode {
  active: boolean;
  destination?: GeoPoint;
  address?: string;
}

// Base Document Interface
export interface IBaseDocument extends Document {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// User Interface
export interface IUser extends IBaseDocument {
  role: UserRole;
  phone: string;
  email?: string;
  password?: string;
  name: string;
  avatar?: string;
  gender?: Gender;
  isPhoneVerified: boolean;
  isActive: boolean;
  emergencyContact?: EmergencyContact;
  fcmTokens: string[];
  language: Language;
  lastLoginAt?: Date;
}

// Passenger Interface
export interface IPassenger extends IBaseDocument {
  userId: Types.ObjectId;
  savedPlaces: SavedPlace[];
  defaultPaymentMethod: PaymentMethod;
  walletBalance: number;
  totalTrips: number;
  totalSpent: number;
  favoriteDrivers: Types.ObjectId[];
  rating: number;
  totalRatings: number;
}

// Driver Interface
export interface IDriver extends IBaseDocument {
  userId: Types.ObjectId;
  documents: DriverDocuments;
  vehicle: VehicleInfo;
  currentLocation?: GeoPoint;
  lastLocationUpdate?: Date;
  heading?: number;
  isOnline: boolean;
  isAvailable: boolean;
  isBusy: boolean;
  currentTripId?: Types.ObjectId;
  destinationMode: DestinationMode;
  workingHours: WorkingHours[];
  acceptedRideTypes: RideCategory[];
  acceptScheduledRides: boolean;
  acceptIntercity: boolean;
  maxDistance: number;
  status: DriverStatus;
  approvedAt?: Date;
  approvedBy?: Types.ObjectId;
  rejectionReason?: string;
  rating: number;
  totalRatings: number;
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  acceptanceRate: number;
  cancellationRate: number;
  onlineHours: number;
  totalEarnings: number;
  currentBalance: number;
  commission: number;
  badges: string[];
}

// OTP Interface
export interface IOTP extends IBaseDocument {
  phone: string;
  code: string;
  expiresAt: Date;
  isUsed: boolean;
  attempts: number;
}

export default {
  UserRole: {} as UserRole,
  Gender: {} as Gender,
  DriverStatus: {} as DriverStatus,
  VehicleType: {} as VehicleType,
  RideCategory: {} as RideCategory,
  TripType: {} as TripType,
  TripStatus: {} as TripStatus,
  PaymentMethod: {} as PaymentMethod,
  PaymentStatus: {} as PaymentStatus,
};

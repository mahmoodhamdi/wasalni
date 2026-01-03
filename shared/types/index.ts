// ==========================================
// Wasalni Shared Types
// ==========================================

// User Types
export type UserRole = 'passenger' | 'driver' | 'admin';
export type Gender = 'male' | 'female';

export interface IUser {
  _id: string;
  phone: string;
  name: string;
  email?: string;
  avatar?: string;
  gender?: Gender;
  role: UserRole;
  isActive: boolean;
  isVerified: boolean;
  fcmToken?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Passenger Types
export interface IPassenger extends IUser {
  role: 'passenger';
  savedPlaces?: ISavedPlace[];
  emergencyContacts?: IEmergencyContact[];
  totalTrips: number;
  rating?: number;
  referralCode?: string;
  referredBy?: string;
}

export interface ISavedPlace {
  _id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: 'home' | 'work' | 'favorite';
}

export interface IEmergencyContact {
  name: string;
  phone: string;
  relationship: string;
}

// Driver Types
export type DriverStatus = 'pending' | 'approved' | 'rejected' | 'suspended';
export type DriverOnlineStatus = 'offline' | 'online' | 'busy';
export type VehicleType = 'economy' | 'comfort' | 'family' | 'tuktuk' | 'motorcycle';

export interface IDriver extends IUser {
  role: 'driver';
  nationalId: string;
  status: DriverStatus;
  driverStatus: DriverOnlineStatus;
  vehicleType: VehicleType;
  vehicle: IVehicle;
  documents: IDriverDocuments;
  location?: IDriverLocation;
  totalTrips: number;
  rating: number;
  completionRate: number;
  acceptanceRate: number;
  cancelRate: number;
  earnings: number;
  wallet: number;
  lastOnline?: Date;
  approvedAt?: Date;
  approvedBy?: string;
  rejectedReason?: string;
  suspendedReason?: string;
}

export interface IVehicle {
  make: string;
  model: string;
  year: number;
  color: string;
  plateNumber: string;
  photos?: string[];
}

export interface IDriverDocuments {
  nationalIdFront?: IDocumentInfo;
  nationalIdBack?: IDocumentInfo;
  driverLicense?: IDocumentInfo;
  vehicleLicense?: IDocumentInfo;
  vehiclePhoto?: IDocumentInfo;
  criminalRecord?: IDocumentInfo;
}

export interface IDocumentInfo {
  url: string;
  uploadedAt: Date;
  verified: boolean;
  verifiedAt?: Date;
  verifiedBy?: string;
  rejectedReason?: string;
}

export interface IDriverLocation {
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  updatedAt: Date;
}

// Trip Types
export type TripStatus =
  | 'pending'
  | 'searching'
  | 'accepted'
  | 'arriving'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type CancellationReason =
  | 'passenger_cancelled'
  | 'driver_cancelled'
  | 'no_drivers'
  | 'timeout'
  | 'payment_failed'
  | 'other';

export type PaymentMethod = 'cash' | 'wallet' | 'card';

export interface ITrip {
  _id: string;
  passenger: string | IPassenger;
  driver?: string | IDriver;
  pickup: ILocation;
  dropoff: ILocation;
  stops?: ILocation[];
  rideType: VehicleType;
  status: TripStatus;
  paymentMethod: PaymentMethod;
  fare: IFareBreakdown;
  distance: number; // in km
  duration: number; // in minutes
  route?: IRouteInfo;
  scheduledAt?: Date;
  acceptedAt?: Date;
  arrivedAt?: Date;
  startedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: CancellationReason;
  cancelledBy?: 'passenger' | 'driver' | 'system';
  rating?: IRating;
  driverRating?: IRating;
  notes?: string;
  promoCode?: string;
  statusHistory: IStatusHistory[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ILocation {
  latitude: number;
  longitude: number;
  address: string;
  placeId?: string;
}

export interface IFareBreakdown {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgeFare: number;
  surgeMultiplier: number;
  discount: number;
  promoDiscount: number;
  total: number;
  driverEarnings: number;
  platformFee: number;
}

export interface IRouteInfo {
  polyline: string;
  distance: number;
  duration: number;
}

export interface IRating {
  score: number;
  comment?: string;
  ratedAt: Date;
}

export interface IStatusHistory {
  status: TripStatus;
  timestamp: Date;
  location?: ILocation;
}

// Promo Code Types
export type PromoType = 'percentage' | 'fixed' | 'free_ride';

export interface IPromoCode {
  _id: string;
  code: string;
  type: PromoType;
  value: number;
  maxDiscount?: number;
  minFare?: number;
  maxUses?: number;
  usedCount: number;
  perUserLimit: number;
  validFrom: Date;
  validUntil: Date;
  isActive: boolean;
  applicableVehicleTypes?: VehicleType[];
  description?: string;
  createdAt: Date;
}

// Transaction Types
export type TransactionType =
  | 'trip_earning'
  | 'trip_payment'
  | 'wallet_topup'
  | 'wallet_withdrawal'
  | 'bonus'
  | 'penalty'
  | 'refund';

export interface ITransaction {
  _id: string;
  user: string;
  userType: 'passenger' | 'driver';
  type: TransactionType;
  amount: number;
  balance: number;
  trip?: string;
  description: string;
  reference?: string;
  createdAt: Date;
}

// Notification Types
export type NotificationType =
  | 'trip_update'
  | 'driver_arrived'
  | 'trip_completed'
  | 'promo_offer'
  | 'system'
  | 'payment';

export interface INotification {
  _id: string;
  user: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: Date;
}

// Fare Settings Types
export interface IFareSettings {
  _id: string;
  vehicleType: VehicleType;
  baseFare: number;
  perKmRate: number;
  perMinuteRate: number;
  minimumFare: number;
  cancellationFee: number;
  waitingFeePerMinute: number;
  freeWaitingMinutes: number;
  platformFeePercentage: number;
  isActive: boolean;
  updatedAt: Date;
}

// Zone Types
export interface IZone {
  _id: string;
  name: string;
  nameAr: string;
  polygon: IPolygon;
  isActive: boolean;
  surgeMultiplier: number;
  isHighDemand: boolean;
  createdAt: Date;
}

export interface IPolygon {
  type: 'Polygon';
  coordinates: number[][][];
}

// Socket Event Types
export interface SocketEvents {
  // Driver events
  'driver:location': IDriverLocation & { driverId: string };
  'driver:status': { driverId: string; status: DriverOnlineStatus };
  'driver:available': { driverId: string; available: boolean };

  // Trip events
  'trip:new': { tripId: string; pickup: ILocation; dropoff: ILocation };
  'trip:accepted': { tripId: string; driver: IDriver };
  'trip:arriving': { tripId: string; eta: number };
  'trip:arrived': { tripId: string };
  'trip:started': { tripId: string };
  'trip:completed': { tripId: string; fare: IFareBreakdown };
  'trip:cancelled': { tripId: string; reason: CancellationReason; by: string };

  // Chat events
  'chat:message': { tripId: string; sender: 'passenger' | 'driver'; message: string };

  // SOS events
  'sos:trigger': { tripId: string; userId: string; location: ILocation };
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

// Dashboard Stats Types
export interface IDashboardStats {
  totalPassengers: number;
  totalDrivers: number;
  activeDrivers: number;
  pendingDrivers: number;
  totalTrips: number;
  todayTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  totalRevenue: number;
  todayRevenue: number;
  averageRating: number;
  averageTripDistance: number;
  averageTripDuration: number;
}

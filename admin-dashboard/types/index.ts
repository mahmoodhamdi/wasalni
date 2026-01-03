// User Types
export interface User {
  _id: string;
  phone: string;
  name: string;
  email?: string;
  role: 'passenger' | 'driver' | 'admin';
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Passenger extends User {
  role: 'passenger';
  savedPlaces?: SavedPlace[];
  totalTrips: number;
  rating?: number;
}

export interface Driver extends User {
  role: 'driver';
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  driverStatus: 'offline' | 'online' | 'busy';
  vehicleType: 'economy' | 'comfort' | 'family' | 'tuktuk' | 'motorcycle';
  vehicle: Vehicle;
  documents: DriverDocuments;
  totalTrips: number;
  rating: number;
  completionRate: number;
  earnings: number;
}

export interface Vehicle {
  make: string;
  model: string;
  year: number;
  color: string;
  plateNumber: string;
}

export interface DriverDocuments {
  nationalIdFront?: DocumentInfo;
  nationalIdBack?: DocumentInfo;
  driverLicense?: DocumentInfo;
  vehicleLicense?: DocumentInfo;
  vehiclePhoto?: DocumentInfo;
}

export interface DocumentInfo {
  url: string;
  uploadedAt: string;
  verified: boolean;
  verifiedAt?: string;
  verifiedBy?: string;
}

// Trip Types
export interface Trip {
  _id: string;
  passenger: Passenger;
  driver?: Driver;
  pickup: Location;
  dropoff: Location;
  rideType: string;
  status: TripStatus;
  fare: FareBreakdown;
  distance: number;
  duration: number;
  rating?: Rating;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
}

export type TripStatus =
  | 'pending'
  | 'searching'
  | 'accepted'
  | 'arriving'
  | 'arrived'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
}

export interface FareBreakdown {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  surgeFare: number;
  discount: number;
  total: number;
}

export interface Rating {
  score: number;
  comment?: string;
  ratedAt: string;
}

// Saved Place
export interface SavedPlace {
  _id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: 'home' | 'work' | 'favorite';
}

// Dashboard Stats
export interface DashboardStats {
  totalPassengers: number;
  totalDrivers: number;
  activeDrivers: number;
  totalTrips: number;
  completedTrips: number;
  cancelledTrips: number;
  totalRevenue: number;
  todayRevenue: number;
  pendingDriverApprovals: number;
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

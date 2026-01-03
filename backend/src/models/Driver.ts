import mongoose, { Schema, Model, Types } from 'mongoose';
import {
  IDriver,
  DriverStatus,
  VehicleType,
  RideCategory,
  GeoPoint,
  DriverDocuments,
  VehicleInfo,
  DestinationMode,
  WorkingHours,
} from '../types';

// GeoPoint Schema
const geoPointSchema = new Schema<GeoPoint>(
  {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  },
  { _id: false }
);

// Driver Documents Schema
const driverDocumentsSchema = new Schema<DriverDocuments>(
  {
    nationalIdFront: String,
    nationalIdBack: String,
    nationalIdNumber: {
      type: String,
      match: [/^[0-9]{14}$/, 'Invalid national ID number'],
    },
    nationalIdExpiry: Date,
    drivingLicenseFront: String,
    drivingLicenseBack: String,
    drivingLicenseNumber: String,
    drivingLicenseExpiry: Date,
    criminalRecord: String,
  },
  { _id: false }
);

// Vehicle Info Schema
const vehicleInfoSchema = new Schema<VehicleInfo>(
  {
    type: {
      type: String,
      enum: ['car', 'tuktuk', 'motorcycle'] as VehicleType[],
      required: true,
    },
    category: {
      type: String,
      enum: ['economy', 'comfort', 'family'] as RideCategory[],
      required: true,
    },
    make: {
      type: String,
      required: true,
      trim: true,
    },
    model: {
      type: String,
      required: true,
      trim: true,
    },
    year: {
      type: Number,
      required: true,
      min: 2000,
      max: new Date().getFullYear() + 1,
    },
    color: {
      type: String,
      required: true,
      trim: true,
    },
    plateNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    plateImage: String,
    vehicleImage: String,
    registrationImage: String,
    insuranceImage: String,
    insuranceExpiry: Date,
    seats: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
      default: 4,
    },
  },
  { _id: false }
);

// Destination Mode Schema
const destinationModeSchema = new Schema<DestinationMode>(
  {
    active: {
      type: Boolean,
      default: false,
    },
    destination: geoPointSchema,
    address: String,
  },
  { _id: false }
);

// Working Hours Schema
const workingHoursSchema = new Schema<WorkingHours>(
  {
    day: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    isWorking: {
      type: Boolean,
      default: true,
    },
    start: {
      type: String,
      default: '08:00',
    },
    end: {
      type: String,
      default: '20:00',
    },
  },
  { _id: false }
);

// Driver Schema
const driverSchema = new Schema<IDriver>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    documents: {
      type: driverDocumentsSchema,
      default: {},
    },
    vehicle: {
      type: vehicleInfoSchema,
      required: true,
    },
    currentLocation: {
      type: geoPointSchema,
      index: '2dsphere',
    },
    lastLocationUpdate: {
      type: Date,
    },
    heading: {
      type: Number,
      min: 0,
      max: 360,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: false,
    },
    isBusy: {
      type: Boolean,
      default: false,
    },
    currentTripId: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
    },
    destinationMode: {
      type: destinationModeSchema,
      default: { active: false },
    },
    workingHours: {
      type: [workingHoursSchema],
      default: Array.from({ length: 7 }, (_, i) => ({
        day: i,
        isWorking: true,
        start: '08:00',
        end: '20:00',
      })),
    },
    acceptedRideTypes: {
      type: [String],
      enum: ['economy', 'comfort', 'family'] as RideCategory[],
      default: ['economy'],
    },
    acceptScheduledRides: {
      type: Boolean,
      default: true,
    },
    acceptIntercity: {
      type: Boolean,
      default: false,
    },
    maxDistance: {
      type: Number,
      default: 5, // km
      min: 1,
      max: 50,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'suspended'] as DriverStatus[],
      default: 'pending',
    },
    approvedAt: Date,
    approvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    rejectionReason: String,
    rating: {
      type: Number,
      default: 5,
      min: 1,
      max: 5,
    },
    totalRatings: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalTrips: {
      type: Number,
      default: 0,
      min: 0,
    },
    completedTrips: {
      type: Number,
      default: 0,
      min: 0,
    },
    cancelledTrips: {
      type: Number,
      default: 0,
      min: 0,
    },
    acceptanceRate: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    cancellationRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    onlineHours: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalEarnings: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentBalance: {
      type: Number,
      default: 0,
    },
    commission: {
      type: Number,
      default: 20, // default 20%
      min: 0,
      max: 100,
    },
    badges: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Indexes
driverSchema.index({ userId: 1 });
driverSchema.index({ status: 1 });
driverSchema.index({ isOnline: 1, isAvailable: 1 });
driverSchema.index({ 'vehicle.type': 1, 'vehicle.category': 1 });
driverSchema.index({ rating: -1 });
driverSchema.index({ currentLocation: '2dsphere' });

// Virtual population for user
driverSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Static: Find by user ID
driverSchema.statics.findByUserId = function (userId: Types.ObjectId) {
  return this.findOne({ userId }).populate('user');
};

// Static: Find nearby available drivers
driverSchema.statics.findNearbyAvailable = function (
  location: { lat: number; lng: number },
  maxDistanceKm: number = 5,
  rideCategory?: RideCategory
) {
  const query: Record<string, unknown> = {
    status: 'approved',
    isOnline: true,
    isAvailable: true,
    isBusy: false,
    currentLocation: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [location.lng, location.lat],
        },
        $maxDistance: maxDistanceKm * 1000, // Convert to meters
      },
    },
  };

  if (rideCategory) {
    query.acceptedRideTypes = rideCategory;
  }

  return this.find(query).populate('user', 'name phone avatar');
};

// Static: Find pending drivers
driverSchema.statics.findPending = function () {
  return this.find({ status: 'pending' })
    .populate('user', 'name phone avatar')
    .sort({ createdAt: 1 });
};

// Method: Go online
driverSchema.methods.goOnline = async function (): Promise<IDriver> {
  if (this.status !== 'approved') {
    throw new Error('Driver must be approved to go online');
  }
  this.isOnline = true;
  this.isAvailable = true;
  return this.save();
};

// Method: Go offline
driverSchema.methods.goOffline = async function (): Promise<IDriver> {
  this.isOnline = false;
  this.isAvailable = false;
  return this.save();
};

// Method: Update location
driverSchema.methods.updateLocation = async function (
  lat: number,
  lng: number,
  heading?: number
): Promise<IDriver> {
  this.currentLocation = {
    type: 'Point',
    coordinates: [lng, lat],
  };
  this.lastLocationUpdate = new Date();
  if (heading !== undefined) {
    this.heading = heading;
  }
  return this.save();
};

// Method: Start trip
driverSchema.methods.startTrip = async function (
  tripId: Types.ObjectId
): Promise<IDriver> {
  this.isAvailable = false;
  this.isBusy = true;
  this.currentTripId = tripId;
  return this.save();
};

// Method: End trip
driverSchema.methods.endTrip = async function (): Promise<IDriver> {
  this.isAvailable = true;
  this.isBusy = false;
  this.currentTripId = undefined;
  this.completedTrips += 1;
  return this.save();
};

// Method: Update rating
driverSchema.methods.updateRating = async function (
  newRating: number
): Promise<IDriver> {
  const totalScore = this.rating * this.totalRatings + newRating;
  this.totalRatings += 1;
  this.rating = totalScore / this.totalRatings;
  return this.save();
};

// Method: Add earnings
driverSchema.methods.addEarnings = async function (
  amount: number
): Promise<IDriver> {
  this.totalEarnings += amount;
  this.currentBalance += amount;
  return this.save();
};

// Interface for Driver model with statics
interface IDriverModel extends Model<IDriver> {
  findByUserId(userId: Types.ObjectId): Promise<IDriver | null>;
  findNearbyAvailable(
    location: { lat: number; lng: number },
    maxDistanceKm?: number,
    rideCategory?: RideCategory
  ): Promise<IDriver[]>;
  findPending(): Promise<IDriver[]>;
}

// Create and export the model
const Driver = mongoose.model<IDriver, IDriverModel>('Driver', driverSchema);

export default Driver;

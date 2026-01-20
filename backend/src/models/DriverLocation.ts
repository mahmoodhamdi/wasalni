import mongoose, { Schema, Model, Types } from 'mongoose';
import { GeoPoint } from '../types';

// Driver Location Interface
export interface IDriverLocation {
  _id: Types.ObjectId;
  driverId: Types.ObjectId;
  location: GeoPoint;
  heading?: number;
  speed?: number;
  accuracy?: number;
  isOnline: boolean;
  isAvailable: boolean;
  updatedAt: Date;
}

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

// Driver Location Schema
const driverLocationSchema = new Schema<IDriverLocation>(
  {
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
      required: true,
      unique: true,
    },
    location: {
      type: geoPointSchema,
      required: true,
    },
    heading: {
      type: Number,
      min: 0,
      max: 360,
    },
    speed: {
      type: Number,
      min: 0,
    },
    accuracy: {
      type: Number,
      min: 0,
    },
    isOnline: {
      type: Boolean,
      default: false,
    },
    isAvailable: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete (ret as any).__v;
        return ret;
      },
    },
  }
);

// Indexes (driverId already indexed via unique: true)
driverLocationSchema.index({ location: '2dsphere' });
driverLocationSchema.index({ isOnline: 1, isAvailable: 1 });
driverLocationSchema.index({ updatedAt: 1 }, { expireAfterSeconds: 3600 }); // TTL: 1 hour

// Static: Update driver location
driverLocationSchema.statics.updateLocation = async function (
  driverId: Types.ObjectId,
  lat: number,
  lng: number,
  heading?: number,
  speed?: number,
  accuracy?: number
): Promise<IDriverLocation> {
  return this.findOneAndUpdate(
    { driverId },
    {
      $set: {
        location: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        heading,
        speed,
        accuracy,
        updatedAt: new Date(),
      },
    },
    { upsert: true, new: true }
  );
};

// Static: Set online status
driverLocationSchema.statics.setOnlineStatus = async function (
  driverId: Types.ObjectId,
  isOnline: boolean,
  isAvailable: boolean = true
): Promise<IDriverLocation | null> {
  return this.findOneAndUpdate(
    { driverId },
    {
      $set: {
        isOnline,
        isAvailable: isOnline ? isAvailable : false,
        updatedAt: new Date(),
      },
      $setOnInsert: {
        location: {
          type: 'Point',
          coordinates: [0, 0], // Will be updated by first location update
        },
      },
    },
    { new: true, upsert: true }
  );
};

// Static: Find nearby available drivers
driverLocationSchema.statics.findNearbyAvailable = function (
  lat: number,
  lng: number,
  maxDistanceKm: number = 5,
  limit: number = 20
) {
  return this.find({
    isOnline: true,
    isAvailable: true,
    location: {
      $near: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
        $maxDistance: maxDistanceKm * 1000,
      },
    },
  })
    .limit(limit)
    .populate({
      path: 'driverId',
      populate: { path: 'userId', select: 'name phone avatar' },
    });
};

// Static: Get driver location
driverLocationSchema.statics.getDriverLocation = function (
  driverId: Types.ObjectId
): Promise<IDriverLocation | null> {
  return this.findOne({ driverId });
};

// Static: Get online drivers count
driverLocationSchema.statics.getOnlineCount = function (): Promise<number> {
  return this.countDocuments({ isOnline: true });
};

// Static: Get available drivers count
driverLocationSchema.statics.getAvailableCount = function (): Promise<number> {
  return this.countDocuments({ isOnline: true, isAvailable: true });
};

// Interface for DriverLocation model with statics
interface IDriverLocationModel extends Model<IDriverLocation> {
  updateLocation(
    driverId: Types.ObjectId,
    lat: number,
    lng: number,
    heading?: number,
    speed?: number,
    accuracy?: number
  ): Promise<IDriverLocation>;
  setOnlineStatus(
    driverId: Types.ObjectId,
    isOnline: boolean,
    isAvailable?: boolean
  ): Promise<IDriverLocation | null>;
  findNearbyAvailable(
    lat: number,
    lng: number,
    maxDistanceKm?: number,
    limit?: number
  ): Promise<IDriverLocation[]>;
  getDriverLocation(driverId: Types.ObjectId): Promise<IDriverLocation | null>;
  getOnlineCount(): Promise<number>;
  getAvailableCount(): Promise<number>;
}

// Create and export the model
const DriverLocation = mongoose.model<IDriverLocation, IDriverLocationModel>(
  'DriverLocation',
  driverLocationSchema
);

export default DriverLocation;

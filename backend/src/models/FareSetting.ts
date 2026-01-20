import mongoose, { Schema, Model, Types } from 'mongoose';
import { RideCategory } from '../types';

// Surge Time
interface SurgeTime {
  dayOfWeek: number[];
  startTime: string;
  endTime: string;
  multiplier: number;
}

// Waiting Fare
interface WaitingFare {
  freeMinutes: number;
  perMinute: number;
}

// Fare Setting Interface
export interface IFareSetting {
  _id: Types.ObjectId;
  rideType: RideCategory | 'tuktuk' | 'motorcycle';
  baseFare: number;
  perKm: number;
  perMinute: number;
  minimumFare: number;
  bookingFee: number;
  waitingFare: WaitingFare;
  surgeTimes: SurgeTime[];
  isActive: boolean;
  updatedAt: Date;
  updatedBy?: Types.ObjectId;
}

// Surge Time Schema
const surgeTimeSchema = new Schema<SurgeTime>(
  {
    dayOfWeek: {
      type: [Number],
      required: true,
      validate: [
        (val: number[]) => val.every((d) => d >= 0 && d <= 6),
        'Day of week must be between 0 and 6',
      ],
    },
    startTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'],
    },
    endTime: {
      type: String,
      required: true,
      match: [/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format (HH:mm)'],
    },
    multiplier: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
  },
  { _id: false }
);

// Waiting Fare Schema
const waitingFareSchema = new Schema<WaitingFare>(
  {
    freeMinutes: {
      type: Number,
      default: 3,
      min: 0,
    },
    perMinute: {
      type: Number,
      default: 0.5,
      min: 0,
    },
  },
  { _id: false }
);

// Fare Setting Schema
const fareSettingSchema = new Schema<IFareSetting>(
  {
    rideType: {
      type: String,
      enum: ['economy', 'comfort', 'family', 'tuktuk', 'motorcycle'],
      required: true,
      unique: true,
    },
    baseFare: {
      type: Number,
      required: true,
      min: 0,
    },
    perKm: {
      type: Number,
      required: true,
      min: 0,
    },
    perMinute: {
      type: Number,
      required: true,
      min: 0,
    },
    minimumFare: {
      type: Number,
      required: true,
      min: 0,
    },
    bookingFee: {
      type: Number,
      required: true,
      min: 0,
    },
    waitingFare: {
      type: waitingFareSchema,
      default: { freeMinutes: 3, perMinute: 0.5 },
    },
    surgeTimes: {
      type: [surgeTimeSchema],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
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

// Indexes (rideType already indexed via unique: true)
fareSettingSchema.index({ isActive: 1 });

// Static: Get fare setting by ride type
fareSettingSchema.statics.getByRideType = function (
  rideType: string
): Promise<IFareSetting | null> {
  return this.findOne({ rideType, isActive: true });
};

// Static: Get current surge multiplier
fareSettingSchema.statics.getCurrentSurgeMultiplier = async function (
  rideType: string
): Promise<number> {
  const setting = await this.findOne({ rideType, isActive: true });
  if (!setting || setting.surgeTimes.length === 0) {
    return 1;
  }

  const now = new Date();
  const currentDay = now.getDay();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  for (const surge of setting.surgeTimes) {
    if (surge.dayOfWeek.includes(currentDay)) {
      if (currentTime >= surge.startTime && currentTime <= surge.endTime) {
        return surge.multiplier;
      }
    }
  }

  return 1;
};

// Static: Initialize default fare settings
fareSettingSchema.statics.initializeDefaults = async function (): Promise<void> {
  const defaults = [
    {
      rideType: 'economy',
      baseFare: 10,
      perKm: 3,
      perMinute: 0.5,
      minimumFare: 15,
      bookingFee: 3,
    },
    {
      rideType: 'comfort',
      baseFare: 15,
      perKm: 4,
      perMinute: 0.75,
      minimumFare: 20,
      bookingFee: 5,
    },
    {
      rideType: 'family',
      baseFare: 20,
      perKm: 5,
      perMinute: 1,
      minimumFare: 30,
      bookingFee: 5,
    },
    {
      rideType: 'tuktuk',
      baseFare: 5,
      perKm: 2,
      perMinute: 0.25,
      minimumFare: 10,
      bookingFee: 2,
    },
    {
      rideType: 'motorcycle',
      baseFare: 7,
      perKm: 2.5,
      perMinute: 0.3,
      minimumFare: 12,
      bookingFee: 2,
    },
  ];

  for (const setting of defaults) {
    await this.findOneAndUpdate(
      { rideType: setting.rideType },
      { $setOnInsert: setting },
      { upsert: true, new: true }
    );
  }
};

// Interface for FareSetting model with statics
interface IFareSettingModel extends Model<IFareSetting> {
  getByRideType(rideType: string): Promise<IFareSetting | null>;
  getCurrentSurgeMultiplier(rideType: string): Promise<number>;
  initializeDefaults(): Promise<void>;
}

// Create and export the model
const FareSetting = mongoose.model<IFareSetting, IFareSettingModel>(
  'FareSetting',
  fareSettingSchema
);

export default FareSetting;

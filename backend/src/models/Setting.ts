import mongoose, { Schema, Model, Types } from 'mongoose';

// Setting Interface
export interface ISetting {
  _id: Types.ObjectId;
  key: string;
  value: unknown;
  type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  isPublic: boolean;
  updatedAt: Date;
}

// Setting Schema
const settingSchema = new Schema<ISetting>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
    },
    type: {
      type: String,
      enum: ['string', 'number', 'boolean', 'json'],
      default: 'string',
    },
    description: {
      type: String,
      trim: true,
    },
    isPublic: {
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

// Indexes
settingSchema.index({ key: 1 });
settingSchema.index({ isPublic: 1 });

// Static: Get setting by key
settingSchema.statics.get = async function <T = unknown>(
  key: string,
  defaultValue?: T
): Promise<T | undefined> {
  const setting = await this.findOne({ key: key.toLowerCase() });
  return setting ? (setting.value as T) : defaultValue;
};

// Static: Set setting
settingSchema.statics.set = async function (
  key: string,
  value: unknown,
  type: string = 'string',
  description?: string,
  isPublic: boolean = false
): Promise<ISetting> {
  return this.findOneAndUpdate(
    { key: key.toLowerCase() },
    {
      $set: {
        value,
        type,
        description,
        isPublic,
      },
    },
    { upsert: true, new: true }
  );
};

// Static: Get all public settings
settingSchema.statics.getPublic = async function (): Promise<
  Record<string, unknown>
> {
  const settings = await this.find({ isPublic: true });
  const result: Record<string, unknown> = {};
  for (const setting of settings) {
    result[setting.key] = setting.value;
  }
  return result;
};

// Static: Get all settings (admin)
settingSchema.statics.getAll = async function (): Promise<ISetting[]> {
  return this.find().sort({ key: 1 });
};

// Static: Initialize default settings
settingSchema.statics.initializeDefaults = async function (): Promise<void> {
  const defaults: Array<{
    key: string;
    value: unknown;
    type: 'string' | 'number' | 'boolean' | 'json';
    description: string;
    isPublic: boolean;
  }> = [
    {
      key: 'default_commission',
      value: 20,
      type: 'number',
      description: 'Default commission percentage for drivers',
      isPublic: false,
    },
    {
      key: 'booking_fee',
      value: 3,
      type: 'number',
      description: 'Booking fee in EGP',
      isPublic: true,
    },
    {
      key: 'max_search_radius',
      value: 5,
      type: 'number',
      description: 'Maximum search radius for drivers in km',
      isPublic: false,
    },
    {
      key: 'driver_search_timeout',
      value: 60,
      type: 'number',
      description: 'Driver search timeout in seconds',
      isPublic: false,
    },
    {
      key: 'cancellation_fee',
      value: 10,
      type: 'number',
      description: 'Cancellation fee in EGP',
      isPublic: true,
    },
    {
      key: 'free_cancellation_minutes',
      value: 2,
      type: 'number',
      description: 'Free cancellation window in minutes',
      isPublic: true,
    },
    {
      key: 'sos_phone',
      value: '122',
      type: 'string',
      description: 'Emergency SOS phone number',
      isPublic: true,
    },
    {
      key: 'support_phone',
      value: '01000000000',
      type: 'string',
      description: 'Customer support phone number',
      isPublic: true,
    },
    {
      key: 'min_app_version_passenger',
      value: '1.0.0',
      type: 'string',
      description: 'Minimum passenger app version',
      isPublic: true,
    },
    {
      key: 'min_app_version_driver',
      value: '1.0.0',
      type: 'string',
      description: 'Minimum driver app version',
      isPublic: true,
    },
    {
      key: 'max_scheduled_days_ahead',
      value: 7,
      type: 'number',
      description: 'Maximum days ahead for scheduled rides',
      isPublic: true,
    },
    {
      key: 'driver_arrival_radius',
      value: 100,
      type: 'number',
      description: 'Radius in meters to mark driver as arrived',
      isPublic: false,
    },
    {
      key: 'waiting_time_threshold',
      value: 180,
      type: 'number',
      description: 'Waiting time threshold in seconds before charging',
      isPublic: false,
    },
  ];

  for (const setting of defaults) {
    const exists = await this.findOne({ key: setting.key });
    if (!exists) {
      await this.create(setting);
    }
  }
};

// Interface for Setting model with statics
interface ISettingModel extends Model<ISetting> {
  get<T = unknown>(key: string, defaultValue?: T): Promise<T | undefined>;
  set(
    key: string,
    value: unknown,
    type?: string,
    description?: string,
    isPublic?: boolean
  ): Promise<ISetting>;
  getPublic(): Promise<Record<string, unknown>>;
  getAll(): Promise<ISetting[]>;
  initializeDefaults(): Promise<void>;
}

// Create and export the model
const Setting = mongoose.model<ISetting, ISettingModel>('Setting', settingSchema);

export default Setting;

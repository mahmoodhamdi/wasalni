import mongoose, { Schema, Model, Types } from 'mongoose';
import { ZoneType, GeoPolygon } from '../types';

// Zone Settings
interface ZoneSettings {
  surgeMultiplier?: number;
  isPickupAllowed: boolean;
  isDropoffAllowed: boolean;
}

// Zone Interface
export interface IZone {
  _id: Types.ObjectId;
  name: string;
  nameAr: string;
  type: ZoneType;
  polygon: GeoPolygon;
  settings: ZoneSettings;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Zone Settings Schema
const zoneSettingsSchema = new Schema<ZoneSettings>(
  {
    surgeMultiplier: {
      type: Number,
      min: 1,
      max: 5,
    },
    isPickupAllowed: {
      type: Boolean,
      default: true,
    },
    isDropoffAllowed: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

// Polygon Schema
const polygonSchema = new Schema<GeoPolygon>(
  {
    type: {
      type: String,
      enum: ['Polygon'],
      default: 'Polygon',
    },
    coordinates: {
      type: [[[Number]]],
      required: true,
    },
  },
  { _id: false }
);

// Zone Schema
const zoneSchema = new Schema<IZone>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    nameAr: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ['service_area', 'surge_zone', 'restricted'] as ZoneType[],
      required: true,
    },
    polygon: {
      type: polygonSchema,
      required: true,
    },
    settings: {
      type: zoneSettingsSchema,
      default: { isPickupAllowed: true, isDropoffAllowed: true },
    },
    isActive: {
      type: Boolean,
      default: true,
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
zoneSchema.index({ polygon: '2dsphere' });
zoneSchema.index({ type: 1 });
zoneSchema.index({ isActive: 1 });

// Static: Find zone containing point
zoneSchema.statics.findZoneContaining = function (
  lat: number,
  lng: number,
  type?: ZoneType
): Promise<IZone | null> {
  const query: Record<string, unknown> = {
    isActive: true,
    polygon: {
      $geoIntersects: {
        $geometry: {
          type: 'Point',
          coordinates: [lng, lat],
        },
      },
    },
  };

  if (type) {
    query.type = type;
  }

  return this.findOne(query);
};

// Static: Check if point is in service area
zoneSchema.statics.isInServiceArea = async function (
  lat: number,
  lng: number
): Promise<boolean> {
  const model = this as unknown as IZoneModel;
  const zone = await model.findZoneContaining(lat, lng, 'service_area');
  return !!zone;
};

// Static: Get surge multiplier for point
zoneSchema.statics.getSurgeMultiplier = async function (
  lat: number,
  lng: number
): Promise<number> {
  const model = this as unknown as IZoneModel;
  const zone = await model.findZoneContaining(lat, lng, 'surge_zone');
  return zone?.settings?.surgeMultiplier || 1;
};

// Static: Check if point is restricted
zoneSchema.statics.isRestricted = async function (
  lat: number,
  lng: number
): Promise<{ restricted: boolean; reason?: string }> {
  const model = this as unknown as IZoneModel;
  const zone = await model.findZoneContaining(lat, lng, 'restricted');
  if (zone) {
    return {
      restricted: true,
      reason: `${zone.nameAr} - منطقة محظورة`,
    };
  }
  return { restricted: false };
};

// Static: Initialize default service area
zoneSchema.statics.initializeDefaultServiceArea = async function (): Promise<void> {
  const exists = await this.findOne({ type: 'service_area' });
  if (exists) return;

  // Bagour approximate polygon
  await this.create({
    name: 'Bagour Service Area',
    nameAr: 'منطقة خدمة الباجور',
    type: 'service_area',
    polygon: {
      type: 'Polygon',
      coordinates: [
        [
          [30.85, 30.35],
          [31.1, 30.35],
          [31.1, 30.55],
          [30.85, 30.55],
          [30.85, 30.35],
        ],
      ],
    },
    settings: {
      isPickupAllowed: true,
      isDropoffAllowed: true,
    },
  });
};

// Interface for Zone model with statics
interface IZoneModel extends Model<IZone> {
  findZoneContaining(
    lat: number,
    lng: number,
    type?: ZoneType
  ): Promise<IZone | null>;
  isInServiceArea(lat: number, lng: number): Promise<boolean>;
  getSurgeMultiplier(lat: number, lng: number): Promise<number>;
  isRestricted(
    lat: number,
    lng: number
  ): Promise<{ restricted: boolean; reason?: string }>;
  initializeDefaultServiceArea(): Promise<void>;
}

// Create and export the model
const Zone = mongoose.model<IZone, IZoneModel>('Zone', zoneSchema);

export default Zone;

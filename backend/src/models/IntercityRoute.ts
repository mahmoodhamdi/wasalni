import mongoose, { Schema, Model, Types } from 'mongoose';
import { GeoPoint } from '../types';

// City Info
interface CityInfo {
  city: string;
  location: GeoPoint;
}

// Route Fare
interface RouteFare {
  economy: number;
  comfort: number;
  family: number;
}

// Intercity Route Interface
export interface IIntercityRoute {
  _id: Types.ObjectId;
  from: CityInfo;
  to: CityInfo;
  distance: number;
  duration: number;
  fare: RouteFare;
  isActive: boolean;
  createdAt: Date;
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

// City Info Schema
const cityInfoSchema = new Schema<CityInfo>(
  {
    city: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: geoPointSchema,
      required: true,
    },
  },
  { _id: false }
);

// Route Fare Schema
const routeFareSchema = new Schema<RouteFare>(
  {
    economy: {
      type: Number,
      required: true,
      min: 0,
    },
    comfort: {
      type: Number,
      required: true,
      min: 0,
    },
    family: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: false }
);

// Intercity Route Schema
const intercityRouteSchema = new Schema<IIntercityRoute>(
  {
    from: {
      type: cityInfoSchema,
      required: true,
    },
    to: {
      type: cityInfoSchema,
      required: true,
    },
    distance: {
      type: Number,
      required: true,
      min: 0,
    },
    duration: {
      type: Number,
      required: true,
      min: 0,
    },
    fare: {
      type: routeFareSchema,
      required: true,
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
intercityRouteSchema.index({ 'from.city': 1, 'to.city': 1 });
intercityRouteSchema.index({ isActive: 1 });
intercityRouteSchema.index({ 'from.location': '2dsphere' });
intercityRouteSchema.index({ 'to.location': '2dsphere' });

// Static: Find route between cities
intercityRouteSchema.statics.findRoute = function (
  fromCity: string,
  toCity: string
): Promise<IIntercityRoute | null> {
  return this.findOne({
    'from.city': { $regex: new RegExp(fromCity, 'i') },
    'to.city': { $regex: new RegExp(toCity, 'i') },
    isActive: true,
  });
};

// Static: Find routes from city
intercityRouteSchema.statics.findRoutesFrom = function (
  city: string
): Promise<IIntercityRoute[]> {
  return this.find({
    'from.city': { $regex: new RegExp(city, 'i') },
    isActive: true,
  });
};

// Static: Initialize default routes
intercityRouteSchema.statics.initializeDefaults = async function (): Promise<void> {
  const defaults = [
    {
      from: {
        city: 'الباجور',
        location: { type: 'Point', coordinates: [30.9667, 30.45] },
      },
      to: {
        city: 'القاهرة',
        location: { type: 'Point', coordinates: [31.2357, 30.0444] },
      },
      distance: 85,
      duration: 90,
      fare: { economy: 150, comfort: 200, family: 250 },
    },
    {
      from: {
        city: 'الباجور',
        location: { type: 'Point', coordinates: [30.9667, 30.45] },
      },
      to: {
        city: 'شبين الكوم',
        location: { type: 'Point', coordinates: [31.0167, 30.55] },
      },
      distance: 15,
      duration: 25,
      fare: { economy: 40, comfort: 55, family: 70 },
    },
    {
      from: {
        city: 'الباجور',
        location: { type: 'Point', coordinates: [30.9667, 30.45] },
      },
      to: {
        city: 'أشمون',
        location: { type: 'Point', coordinates: [30.9833, 30.3] },
      },
      distance: 20,
      duration: 30,
      fare: { economy: 50, comfort: 70, family: 90 },
    },
  ];

  for (const route of defaults) {
    const exists = await this.findOne({
      'from.city': route.from.city,
      'to.city': route.to.city,
    });

    if (!exists) {
      await this.create(route);
    }
  }
};

// Interface for IntercityRoute model with statics
interface IIntercityRouteModel extends Model<IIntercityRoute> {
  findRoute(fromCity: string, toCity: string): Promise<IIntercityRoute | null>;
  findRoutesFrom(city: string): Promise<IIntercityRoute[]>;
  initializeDefaults(): Promise<void>;
}

// Create and export the model
const IntercityRoute = mongoose.model<IIntercityRoute, IIntercityRouteModel>(
  'IntercityRoute',
  intercityRouteSchema
);

export default IntercityRoute;

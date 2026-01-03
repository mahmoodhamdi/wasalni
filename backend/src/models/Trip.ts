import mongoose, { Schema, Model, Types } from 'mongoose';
import {
  TripStatus,
  TripType,
  RideCategory,
  PaymentMethod,
  PaymentStatus,
  CancelledBy,
  GeoPoint,
} from '../types';
import dayjs from 'dayjs';

// Location with address
interface TripLocation {
  address: string;
  location: GeoPoint;
  landmark?: string;
}

// Trip Stop
interface TripStop {
  address: string;
  location: GeoPoint;
  arrivedAt?: Date;
  leftAt?: Date;
}

// Route info
interface RouteInfo {
  encodedPolyline?: string;
  distanceMeters: number;
  durationSeconds: number;
  distanceText: string;
  durationText: string;
}

// Actual route tracked
interface ActualRoute {
  coordinates: [number, number][];
  totalDistance: number;
  totalDuration: number;
}

// Status history entry
interface StatusHistoryEntry {
  status: TripStatus;
  timestamp: Date;
  location?: GeoPoint;
  note?: string;
}

// Fare breakdown
interface FareBreakdown {
  baseFare: number;
  distanceFare: number;
  timeFare: number;
  waitingFare: number;
  surgeMultiplier: number;
  surgeAmount: number;
  bookingFee: number;
  tolls: number;
  discount: number;
  promoCode?: string;
  subtotal: number;
  total: number;
}

// Estimated fare
interface EstimatedFare {
  min: number;
  max: number;
}

// Trip sharing
interface TripShare {
  name: string;
  phone: string;
  sharedAt: Date;
}

// Rating
interface TripRating {
  score: number;
  comment?: string;
  badges: string[];
  createdAt: Date;
}

// Issue
interface TripIssue {
  type: string;
  description: string;
  reportedBy: 'passenger' | 'driver';
  reportedAt: Date;
  status: 'open' | 'resolved';
  resolution?: string;
}

// Trip Interface
export interface ITrip {
  _id: Types.ObjectId;
  tripNumber: string;
  passengerId: Types.ObjectId;
  driverId?: Types.ObjectId;
  rideType: RideCategory | 'tuktuk' | 'motorcycle';
  tripType: TripType;
  pickup: TripLocation;
  dropoff: TripLocation;
  stops: TripStop[];
  route?: RouteInfo;
  actualRoute?: ActualRoute;
  isScheduled: boolean;
  scheduledTime?: Date;
  status: TripStatus;
  statusHistory: StatusHistoryEntry[];
  broadcastedTo: Types.ObjectId[];
  rejectedBy: Types.ObjectId[];
  acceptedBy?: Types.ObjectId;
  requestedAt: Date;
  driverAssignedAt?: Date;
  driverArrivedAt?: Date;
  tripStartedAt?: Date;
  tripCompletedAt?: Date;
  waitingTime: number;
  fare?: FareBreakdown;
  estimatedFare?: EstimatedFare;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paidAt?: Date;
  driverEarnings?: number;
  platformEarnings?: number;
  isCancelled: boolean;
  cancelledBy?: CancelledBy;
  cancelReason?: string;
  cancelledAt?: Date;
  cancellationFee?: number;
  sharedWith: TripShare[];
  sosTriggered: boolean;
  sosAt?: Date;
  sosTriggeredBy?: 'passenger' | 'driver';
  sosLocation?: GeoPoint;
  sosResolved?: boolean;
  sosResolvedAt?: Date;
  sosResolvedBy?: Types.ObjectId;
  sosNotes?: string;
  shareToken?: string;
  shareTokenExpiry?: Date;
  safetyChecks?: {
    type: 'departure' | 'arrival' | 'periodic' | 'route_deviation';
    message: string;
    responseRequired: boolean;
    respondedAt?: Date;
    response?: 'safe' | 'need_help';
  }[];
  lastSafetyCheck?: Date;
  passengerRating?: TripRating;
  driverRating?: TripRating;
  hasIssue: boolean;
  issue?: TripIssue;
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

// Trip Location Schema
const tripLocationSchema = new Schema<TripLocation>(
  {
    address: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: geoPointSchema,
      required: true,
    },
    landmark: String,
  },
  { _id: false }
);

// Trip Stop Schema
const tripStopSchema = new Schema<TripStop>(
  {
    address: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: geoPointSchema,
      required: true,
    },
    arrivedAt: Date,
    leftAt: Date,
  },
  { _id: false }
);

// Route Info Schema
const routeInfoSchema = new Schema<RouteInfo>(
  {
    encodedPolyline: String,
    distanceMeters: {
      type: Number,
      required: true,
    },
    durationSeconds: {
      type: Number,
      required: true,
    },
    distanceText: {
      type: String,
      required: true,
    },
    durationText: {
      type: String,
      required: true,
    },
  },
  { _id: false }
);

// Actual Route Schema
const actualRouteSchema = new Schema<ActualRoute>(
  {
    coordinates: [[Number]],
    totalDistance: Number,
    totalDuration: Number,
  },
  { _id: false }
);

// Status History Schema
const statusHistorySchema = new Schema<StatusHistoryEntry>(
  {
    status: {
      type: String,
      enum: [
        'searching',
        'driver_assigned',
        'driver_arriving',
        'driver_arrived',
        'trip_started',
        'trip_completed',
        'cancelled',
      ] as TripStatus[],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    location: geoPointSchema,
    note: String,
  },
  { _id: false }
);

// Fare Breakdown Schema
const fareBreakdownSchema = new Schema<FareBreakdown>(
  {
    baseFare: { type: Number, required: true, min: 0 },
    distanceFare: { type: Number, required: true, min: 0 },
    timeFare: { type: Number, required: true, min: 0 },
    waitingFare: { type: Number, default: 0, min: 0 },
    surgeMultiplier: { type: Number, default: 1, min: 1 },
    surgeAmount: { type: Number, default: 0, min: 0 },
    bookingFee: { type: Number, required: true, min: 0 },
    tolls: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    promoCode: String,
    subtotal: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

// Estimated Fare Schema
const estimatedFareSchema = new Schema<EstimatedFare>(
  {
    min: { type: Number, required: true, min: 0 },
    max: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

// Trip Share Schema
const tripShareSchema = new Schema<TripShare>(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true },
    sharedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Trip Rating Schema
const tripRatingSchema = new Schema<TripRating>(
  {
    score: { type: Number, required: true, min: 1, max: 5 },
    comment: String,
    badges: { type: [String], default: [] },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// Trip Issue Schema
const tripIssueSchema = new Schema<TripIssue>(
  {
    type: { type: String, required: true },
    description: { type: String, required: true },
    reportedBy: {
      type: String,
      enum: ['passenger', 'driver'],
      required: true,
    },
    reportedAt: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['open', 'resolved'],
      default: 'open',
    },
    resolution: String,
  },
  { _id: false }
);

// Trip Schema
const tripSchema = new Schema<ITrip>(
  {
    tripNumber: {
      type: String,
      required: true,
      unique: true,
    },
    passengerId: {
      type: Schema.Types.ObjectId,
      ref: 'Passenger',
      required: true,
    },
    driverId: {
      type: Schema.Types.ObjectId,
      ref: 'Driver',
    },
    rideType: {
      type: String,
      enum: ['economy', 'comfort', 'family', 'tuktuk', 'motorcycle'],
      required: true,
    },
    tripType: {
      type: String,
      enum: ['instant', 'scheduled', 'intercity'] as TripType[],
      default: 'instant',
    },
    pickup: {
      type: tripLocationSchema,
      required: true,
    },
    dropoff: {
      type: tripLocationSchema,
      required: true,
    },
    stops: {
      type: [tripStopSchema],
      default: [],
      validate: [(val: TripStop[]) => val.length <= 3, 'Maximum 3 stops allowed'],
    },
    route: routeInfoSchema,
    actualRoute: actualRouteSchema,
    isScheduled: {
      type: Boolean,
      default: false,
    },
    scheduledTime: Date,
    status: {
      type: String,
      enum: [
        'searching',
        'driver_assigned',
        'driver_arriving',
        'driver_arrived',
        'trip_started',
        'trip_completed',
        'cancelled',
      ] as TripStatus[],
      default: 'searching',
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
    broadcastedTo: {
      type: [Schema.Types.ObjectId],
      default: [],
    },
    rejectedBy: {
      type: [Schema.Types.ObjectId],
      default: [],
    },
    acceptedBy: Schema.Types.ObjectId,
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    driverAssignedAt: Date,
    driverArrivedAt: Date,
    tripStartedAt: Date,
    tripCompletedAt: Date,
    waitingTime: {
      type: Number,
      default: 0,
      min: 0,
    },
    fare: fareBreakdownSchema,
    estimatedFare: estimatedFareSchema,
    paymentMethod: {
      type: String,
      enum: ['cash', 'card', 'wallet'] as PaymentMethod[],
      default: 'cash',
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'refunded'] as PaymentStatus[],
      default: 'pending',
    },
    paidAt: Date,
    driverEarnings: Number,
    platformEarnings: Number,
    isCancelled: {
      type: Boolean,
      default: false,
    },
    cancelledBy: {
      type: String,
      enum: ['passenger', 'driver', 'admin', 'system'] as CancelledBy[],
    },
    cancelReason: String,
    cancelledAt: Date,
    cancellationFee: Number,
    sharedWith: {
      type: [tripShareSchema],
      default: [],
    },
    sosTriggered: {
      type: Boolean,
      default: false,
    },
    sosAt: Date,
    sosTriggeredBy: {
      type: String,
      enum: ['passenger', 'driver'],
    },
    sosLocation: geoPointSchema,
    sosResolved: {
      type: Boolean,
      default: false,
    },
    sosResolvedAt: Date,
    sosResolvedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    sosNotes: String,
    shareToken: String,
    shareTokenExpiry: Date,
    safetyChecks: [{
      type: {
        type: String,
        enum: ['departure', 'arrival', 'periodic', 'route_deviation'],
      },
      message: String,
      responseRequired: Boolean,
      respondedAt: Date,
      response: {
        type: String,
        enum: ['safe', 'need_help'],
      },
    }],
    lastSafetyCheck: Date,
    passengerRating: tripRatingSchema,
    driverRating: tripRatingSchema,
    hasIssue: {
      type: Boolean,
      default: false,
    },
    issue: tripIssueSchema,
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
tripSchema.index({ tripNumber: 1 });
tripSchema.index({ passengerId: 1 });
tripSchema.index({ driverId: 1 });
tripSchema.index({ status: 1 });
tripSchema.index({ createdAt: -1 });
tripSchema.index({ 'pickup.location': '2dsphere' });
tripSchema.index({ 'dropoff.location': '2dsphere' });
tripSchema.index({ isScheduled: 1, scheduledTime: 1 });

// Generate trip number before save
tripSchema.pre('save', async function (next) {
  if (this.isNew && !this.tripNumber) {
    const date = dayjs().format('YYMMDD');
    const count = await Trip.countDocuments({
      createdAt: {
        $gte: dayjs().startOf('day').toDate(),
        $lt: dayjs().endOf('day').toDate(),
      },
    });
    this.tripNumber = `WAS-${date}-${String(count + 1).padStart(4, '0')}`;
  }

  // Add initial status to history
  if (this.isNew) {
    this.statusHistory.push({
      status: this.status,
      timestamp: new Date(),
    });
  }

  next();
});

// Static: Generate trip number
tripSchema.statics.generateTripNumber = async function (): Promise<string> {
  const date = dayjs().format('YYMMDD');
  const count = await this.countDocuments({
    createdAt: {
      $gte: dayjs().startOf('day').toDate(),
      $lt: dayjs().endOf('day').toDate(),
    },
  });
  return `WAS-${date}-${String(count + 1).padStart(4, '0')}`;
};

// Static: Find active trips for passenger
tripSchema.statics.findActiveForPassenger = function (passengerId: Types.ObjectId) {
  return this.find({
    passengerId,
    status: {
      $in: [
        'searching',
        'driver_assigned',
        'driver_arriving',
        'driver_arrived',
        'trip_started',
      ],
    },
  })
    .populate('driverId')
    .sort({ createdAt: -1 });
};

// Static: Find active trips for driver
tripSchema.statics.findActiveForDriver = function (driverId: Types.ObjectId) {
  return this.find({
    driverId,
    status: {
      $in: ['driver_assigned', 'driver_arriving', 'driver_arrived', 'trip_started'],
    },
  })
    .populate('passengerId')
    .sort({ createdAt: -1 });
};

// Method: Update status
tripSchema.methods.updateStatus = async function (
  newStatus: TripStatus,
  location?: GeoPoint,
  note?: string
): Promise<ITrip> {
  this.status = newStatus;
  this.statusHistory.push({
    status: newStatus,
    timestamp: new Date(),
    location,
    note,
  });

  // Set timestamp fields
  switch (newStatus) {
    case 'driver_assigned':
      this.driverAssignedAt = new Date();
      break;
    case 'driver_arrived':
      this.driverArrivedAt = new Date();
      break;
    case 'trip_started':
      this.tripStartedAt = new Date();
      break;
    case 'trip_completed':
      this.tripCompletedAt = new Date();
      break;
    case 'cancelled':
      this.isCancelled = true;
      this.cancelledAt = new Date();
      break;
  }

  return this.save();
};

// Interface for Trip model with statics
interface ITripModel extends Model<ITrip> {
  generateTripNumber(): Promise<string>;
  findActiveForPassenger(passengerId: Types.ObjectId): Promise<ITrip[]>;
  findActiveForDriver(driverId: Types.ObjectId): Promise<ITrip[]>;
}

// Create and export the model
const Trip = mongoose.model<ITrip, ITripModel>('Trip', tripSchema);

export default Trip;

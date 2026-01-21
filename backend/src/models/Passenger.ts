import mongoose, { Schema, Model, Types } from 'mongoose';
import { IPassenger, PaymentMethod, SavedPlace, GeoPoint, EmergencyContact, SafetyPreferences } from '../types';

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

// Saved Place Schema
const savedPlaceSchema = new Schema<SavedPlace>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: geoPointSchema,
      required: true,
    },
    icon: {
      type: String,
      enum: ['home', 'work', 'favorite'],
      default: 'favorite',
    },
  },
  { _id: true }
);

// Emergency Contact Schema
const emergencyContactSchema = new Schema<EmergencyContact>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    relationship: {
      type: String,
      enum: ['parent', 'spouse', 'sibling', 'friend', 'other'],
      default: 'other',
    },
    notifyOnTrip: {
      type: Boolean,
      default: true,
    },
    notifyOnSOS: {
      type: Boolean,
      default: true,
    },
  },
  { _id: true }
);

// Safety Preferences Schema
const safetyPreferencesSchema = new Schema<SafetyPreferences>(
  {
    autoShareTrips: {
      type: Boolean,
      default: false,
    },
    shareWithContacts: {
      type: [Schema.Types.ObjectId],
      default: [],
    },
    sendETAUpdates: {
      type: Boolean,
      default: true,
    },
    sosGestureEnabled: {
      type: Boolean,
      default: true,
    },
    nightModeAlerts: {
      type: Boolean,
      default: true,
    },
    recordTrips: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

// Passenger Schema
const passengerSchema = new Schema<IPassenger>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    savedPlaces: {
      type: [savedPlaceSchema],
      default: [],
      validate: [
        (val: SavedPlace[]) => val.length <= 10,
        'Maximum 10 saved places allowed',
      ],
    },
    defaultPaymentMethod: {
      type: String,
      enum: ['cash', 'card', 'wallet'] as PaymentMethod[],
      default: 'cash',
    },
    walletBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalTrips: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalSpent: {
      type: Number,
      default: 0,
      min: 0,
    },
    favoriteDrivers: {
      type: [Schema.Types.ObjectId],
      ref: 'Driver',
      default: [],
    },
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
    emergencyContacts: {
      type: [emergencyContactSchema],
      default: [],
      validate: [
        (val: EmergencyContact[]) => val.length <= 5,
        'Maximum 5 emergency contacts allowed',
      ],
    },
    safetyPreferences: {
      type: safetyPreferencesSchema,
      default: () => ({}),
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

// Indexes (userId already indexed via unique: true)
passengerSchema.index({ 'savedPlaces.location': '2dsphere' });

// Virtual population for user
passengerSchema.virtual('user', {
  ref: 'User',
  localField: 'userId',
  foreignField: '_id',
  justOne: true,
});

// Static method to find by userId
passengerSchema.statics.findByUserId = function (userId: Types.ObjectId) {
  return this.findOne({ userId }).populate('user');
};

// Method to add saved place
passengerSchema.methods.addSavedPlace = async function (
  place: Omit<SavedPlace, '_id'>
): Promise<IPassenger> {
  if (this.savedPlaces.length >= 10) {
    throw new Error('Maximum 10 saved places allowed');
  }
  this.savedPlaces.push(place);
  return this.save();
};

// Method to remove saved place
passengerSchema.methods.removeSavedPlace = async function (
  placeId: Types.ObjectId
): Promise<IPassenger> {
  this.savedPlaces = this.savedPlaces.filter(
    (place: SavedPlace) => place._id?.toString() !== placeId.toString()
  );
  return this.save();
};

// Method to add favorite driver
passengerSchema.methods.addFavoriteDriver = async function (
  driverId: Types.ObjectId
): Promise<IPassenger> {
  if (!this.favoriteDrivers.includes(driverId)) {
    this.favoriteDrivers.push(driverId);
    return this.save() as unknown as IPassenger;
  }
  return this as unknown as IPassenger;
};

// Method to remove favorite driver
passengerSchema.methods.removeFavoriteDriver = async function (
  driverId: Types.ObjectId
): Promise<IPassenger> {
  this.favoriteDrivers = this.favoriteDrivers.filter(
    (id: Types.ObjectId) => id.toString() !== driverId.toString()
  );
  return this.save() as unknown as IPassenger;
};

// Method to update rating
passengerSchema.methods.updateRating = async function (
  newRating: number
): Promise<IPassenger> {
  const totalScore = this.rating * this.totalRatings + newRating;
  this.totalRatings += 1;
  this.rating = totalScore / this.totalRatings;
  return this.save() as unknown as IPassenger;
};

// Interface for Passenger model with statics
interface IPassengerModel extends Model<IPassenger> {
  findByUserId(userId: Types.ObjectId): Promise<IPassenger | null>;
}

// Create and export the model
const Passenger = mongoose.model<IPassenger, IPassengerModel>(
  'Passenger',
  passengerSchema
);

export default Passenger;

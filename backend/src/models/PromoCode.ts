import mongoose, { Schema, Model, Types } from 'mongoose';
import { PromoType, RideCategory } from '../types';

// Promo Code Interface
export interface IPromoCode {
  _id: Types.ObjectId;
  code: string;
  type: PromoType;
  value: number;
  maxDiscount?: number;
  minFare?: number;
  usageLimit?: number;
  perUserLimit: number;
  usedCount: number;
  validFrom: Date;
  validUntil: Date;
  rideTypes: (RideCategory | 'tuktuk' | 'motorcycle')[];
  newUsersOnly: boolean;
  userIds: Types.ObjectId[];
  isActive: boolean;
  createdAt: Date;
  createdBy?: Types.ObjectId;
}

// Usage Record
interface PromoUsage {
  promoCodeId: Types.ObjectId;
  userId: Types.ObjectId;
  tripId: Types.ObjectId;
  discount: number;
  usedAt: Date;
}

// Promo Usage Schema (for tracking)
const promoUsageSchema = new Schema<PromoUsage>(
  {
    promoCodeId: {
      type: Schema.Types.ObjectId,
      ref: 'PromoCode',
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tripId: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
      required: true,
    },
    discount: {
      type: Number,
      required: true,
      min: 0,
    },
    usedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Promo Code Schema
const promoCodeSchema = new Schema<IPromoCode>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      minlength: 3,
      maxlength: 20,
    },
    type: {
      type: String,
      enum: ['percentage', 'fixed'] as PromoType[],
      required: true,
    },
    value: {
      type: Number,
      required: true,
      min: 0,
      validate: {
        validator: function (this: IPromoCode, v: number) {
          if (this.type === 'percentage') {
            return v > 0 && v <= 100;
          }
          return v > 0;
        },
        message: 'Invalid value for promo type',
      },
    },
    maxDiscount: {
      type: Number,
      min: 0,
    },
    minFare: {
      type: Number,
      min: 0,
    },
    usageLimit: {
      type: Number,
      min: 1,
    },
    perUserLimit: {
      type: Number,
      default: 1,
      min: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    validFrom: {
      type: Date,
      required: true,
    },
    validUntil: {
      type: Date,
      required: true,
    },
    rideTypes: {
      type: [String],
      enum: ['economy', 'comfort', 'family', 'tuktuk', 'motorcycle'],
      default: [],
    },
    newUsersOnly: {
      type: Boolean,
      default: false,
    },
    userIds: {
      type: [Schema.Types.ObjectId],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    createdBy: {
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

// Indexes (code already indexed via unique: true)
promoCodeSchema.index({ isActive: 1, validFrom: 1, validUntil: 1 });
promoUsageSchema.index({ promoCodeId: 1, userId: 1 });

// Static: Find valid promo by code
promoCodeSchema.statics.findValidByCode = function (
  code: string
): Promise<IPromoCode | null> {
  const now = new Date();
  return this.findOne({
    code: code.toUpperCase(),
    isActive: true,
    validFrom: { $lte: now },
    validUntil: { $gte: now },
    $or: [{ usageLimit: null }, { $expr: { $lt: ['$usedCount', '$usageLimit'] } }],
  });
};

// Static: Validate promo for user
promoCodeSchema.statics.validateForUser = async function (
  code: string,
  userId: Types.ObjectId,
  fare: number,
  rideType: string,
  isNewUser: boolean
): Promise<{
  valid: boolean;
  message: string;
  messageAr: string;
  discount?: number;
}> {
  const model = this as unknown as IPromoCodeModel;
  const promo = await model.findValidByCode(code);

  if (!promo) {
    return {
      valid: false,
      message: 'Invalid or expired promo code',
      messageAr: 'كود خصم غير صالح أو منتهي الصلاحية',
    };
  }

  // Check new users only
  if (promo.newUsersOnly && !isNewUser) {
    return {
      valid: false,
      message: 'This promo is for new users only',
      messageAr: 'هذا الكود للمستخدمين الجدد فقط',
    };
  }

  // Check specific users
  if (promo.userIds.length > 0 && !promo.userIds.includes(userId)) {
    return {
      valid: false,
      message: 'This promo is not available for you',
      messageAr: 'هذا الكود غير متاح لك',
    };
  }

  // Check ride type
  if (promo.rideTypes.length > 0 && !promo.rideTypes.includes(rideType as any)) {
    return {
      valid: false,
      message: 'This promo is not valid for this ride type',
      messageAr: 'هذا الكود غير صالح لهذا النوع من الرحلات',
    };
  }

  // Check minimum fare
  if (promo.minFare && fare < promo.minFare) {
    return {
      valid: false,
      message: `Minimum fare is ${promo.minFare} EGP`,
      messageAr: `الحد الأدنى للأجرة ${promo.minFare} جنيه`,
    };
  }

  // Check user usage limit
  const PromoUsage = mongoose.model('PromoUsage');
  const userUsageCount = await PromoUsage.countDocuments({
    promoCodeId: promo._id,
    userId,
  });

  if (userUsageCount >= promo.perUserLimit) {
    return {
      valid: false,
      message: 'You have already used this promo code',
      messageAr: 'لقد استخدمت هذا الكود من قبل',
    };
  }

  // Calculate discount
  let discount: number;
  if (promo.type === 'percentage') {
    discount = (fare * promo.value) / 100;
    if (promo.maxDiscount && discount > promo.maxDiscount) {
      discount = promo.maxDiscount;
    }
  } else {
    discount = promo.value;
  }

  // Ensure discount doesn't exceed fare
  if (discount > fare) {
    discount = fare;
  }

  return {
    valid: true,
    message: 'Promo code applied successfully',
    messageAr: 'تم تطبيق كود الخصم بنجاح',
    discount,
  };
};

// Static: Use promo
promoCodeSchema.statics.usePromo = async function (
  code: string,
  userId: Types.ObjectId,
  tripId: Types.ObjectId,
  discount: number
): Promise<void> {
  const promo = await this.findOne({ code: code.toUpperCase() });
  if (!promo) return;

  // Increment usage count
  await this.updateOne({ _id: promo._id }, { $inc: { usedCount: 1 } });

  // Record usage
  const PromoUsage = mongoose.model('PromoUsage');
  await PromoUsage.create({
    promoCodeId: promo._id,
    userId,
    tripId,
    discount,
  });
};

// Interface for PromoCode model with statics
interface IPromoCodeModel extends Model<IPromoCode> {
  findValidByCode(code: string): Promise<IPromoCode | null>;
  validateForUser(
    code: string,
    userId: Types.ObjectId,
    fare: number,
    rideType: string,
    isNewUser: boolean
  ): Promise<{
    valid: boolean;
    message: string;
    messageAr: string;
    discount?: number;
  }>;
  usePromo(
    code: string,
    userId: Types.ObjectId,
    tripId: Types.ObjectId,
    discount: number
  ): Promise<void>;
}

// Create models
const PromoCode = mongoose.model<IPromoCode, IPromoCodeModel>(
  'PromoCode',
  promoCodeSchema
);

mongoose.model('PromoUsage', promoUsageSchema);

export default PromoCode;

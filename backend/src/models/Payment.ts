import mongoose, { Schema, Document, Types } from 'mongoose';

// Payment Type
export type PaymentType = 'trip_payment' | 'wallet_topup' | 'driver_payout' | 'refund';

// Payment Status
export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

// Payment Interface
export interface IPayment extends Document {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  tripId?: Types.ObjectId;
  type: PaymentType;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod: 'card' | 'wallet' | 'cash';
  // Paymob specific fields
  paymobOrderId?: number;
  paymobTransactionId?: string;
  paymobPaymentKey?: string;
  // Card details (masked)
  cardLastFour?: string;
  cardBrand?: string;
  // Error info
  errorCode?: string;
  errorMessage?: string;
  // Metadata
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Payment Schema
const paymentSchema = new Schema<IPayment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tripId: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
    },
    type: {
      type: String,
      enum: ['trip_payment', 'wallet_topup', 'driver_payout', 'refund'] as PaymentType[],
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'EGP',
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded'] as PaymentStatus[],
      default: 'pending',
    },
    paymentMethod: {
      type: String,
      enum: ['card', 'wallet', 'cash'],
      default: 'card',
    },
    paymobOrderId: {
      type: Number,
    },
    paymobTransactionId: {
      type: String,
    },
    paymobPaymentKey: {
      type: String,
    },
    cardLastFour: {
      type: String,
    },
    cardBrand: {
      type: String,
    },
    errorCode: {
      type: String,
    },
    errorMessage: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete (ret as any).__v;
        delete (ret as any).paymobPaymentKey;
        return ret;
      },
    },
  }
);

// Indexes
paymentSchema.index({ paymobOrderId: 1 });
paymentSchema.index({ paymobTransactionId: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ createdAt: -1 });

const Payment = mongoose.model<IPayment>('Payment', paymentSchema);

export default Payment;

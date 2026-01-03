import mongoose, { Schema, Model, Types } from 'mongoose';
import { TransactionType, TransactionStatus } from '../types';
import dayjs from 'dayjs';

// Transaction Interface
export interface ITransaction {
  _id: Types.ObjectId;
  transactionNumber: string;
  type: TransactionType;
  tripId?: Types.ObjectId;
  userId: Types.ObjectId;
  amount: number;
  fee: number;
  netAmount: number;
  status: TransactionStatus;
  paymentMethod?: string;
  paymentId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Transaction Schema
const transactionSchema = new Schema<ITransaction>(
  {
    transactionNumber: {
      type: String,
      required: true,
      unique: true,
    },
    type: {
      type: String,
      enum: [
        'trip_fare',
        'driver_payout',
        'wallet_topup',
        'refund',
        'cancellation_fee',
        'bonus',
      ] as TransactionType[],
      required: true,
    },
    tripId: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    fee: {
      type: Number,
      default: 0,
    },
    netAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'] as TransactionStatus[],
      default: 'pending',
    },
    paymentMethod: String,
    paymentId: String,
    notes: String,
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
transactionSchema.index({ transactionNumber: 1 });
transactionSchema.index({ userId: 1 });
transactionSchema.index({ tripId: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ createdAt: -1 });

// Generate transaction number before save
transactionSchema.pre('save', async function (next) {
  if (this.isNew && !this.transactionNumber) {
    const date = dayjs().format('YYMMDD');
    const count = await Transaction.countDocuments({
      createdAt: {
        $gte: dayjs().startOf('day').toDate(),
        $lt: dayjs().endOf('day').toDate(),
      },
    });
    this.transactionNumber = `TXN-${date}-${String(count + 1).padStart(6, '0')}`;
  }
  next();
});

// Static: Create trip fare transaction
transactionSchema.statics.createTripFare = async function (
  tripId: Types.ObjectId,
  passengerId: Types.ObjectId,
  amount: number,
  paymentMethod: string
): Promise<ITransaction> {
  return this.create({
    type: 'trip_fare',
    tripId,
    userId: passengerId,
    amount,
    fee: 0,
    netAmount: amount,
    status: paymentMethod === 'cash' ? 'completed' : 'pending',
    paymentMethod,
  });
};

// Static: Create driver payout transaction
transactionSchema.statics.createDriverPayout = async function (
  tripId: Types.ObjectId,
  driverId: Types.ObjectId,
  amount: number,
  commission: number
): Promise<ITransaction> {
  const netAmount = amount - (amount * commission) / 100;
  return this.create({
    type: 'driver_payout',
    tripId,
    userId: driverId,
    amount,
    fee: (amount * commission) / 100,
    netAmount,
    status: 'pending',
    notes: `Commission: ${commission}%`,
  });
};

// Static: Get user transactions
transactionSchema.statics.getUserTransactions = function (
  userId: Types.ObjectId,
  page: number = 1,
  limit: number = 20
) {
  return this.find({ userId })
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .populate('tripId', 'tripNumber pickup.address dropoff.address');
};

// Static: Get daily summary
transactionSchema.statics.getDailySummary = async function (
  date: Date = new Date()
): Promise<{
  totalFares: number;
  totalPayouts: number;
  totalRevenue: number;
  transactionCount: number;
}> {
  const startOfDay = dayjs(date).startOf('day').toDate();
  const endOfDay = dayjs(date).endOf('day').toDate();

  const result = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startOfDay, $lt: endOfDay },
        status: 'completed',
      },
    },
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' },
        fee: { $sum: '$fee' },
        count: { $sum: 1 },
      },
    },
  ]);

  const summary = {
    totalFares: 0,
    totalPayouts: 0,
    totalRevenue: 0,
    transactionCount: 0,
  };

  for (const item of result) {
    if (item._id === 'trip_fare') {
      summary.totalFares = item.total;
    } else if (item._id === 'driver_payout') {
      summary.totalPayouts = item.total - item.fee;
      summary.totalRevenue += item.fee;
    }
    summary.transactionCount += item.count;
  }

  return summary;
};

// Interface for Transaction model with statics
interface ITransactionModel extends Model<ITransaction> {
  createTripFare(
    tripId: Types.ObjectId,
    passengerId: Types.ObjectId,
    amount: number,
    paymentMethod: string
  ): Promise<ITransaction>;
  createDriverPayout(
    tripId: Types.ObjectId,
    driverId: Types.ObjectId,
    amount: number,
    commission: number
  ): Promise<ITransaction>;
  getUserTransactions(
    userId: Types.ObjectId,
    page?: number,
    limit?: number
  ): Promise<ITransaction[]>;
  getDailySummary(date?: Date): Promise<{
    totalFares: number;
    totalPayouts: number;
    totalRevenue: number;
    transactionCount: number;
  }>;
}

// Create and export the model
const Transaction = mongoose.model<ITransaction, ITransactionModel>(
  'Transaction',
  transactionSchema
);

export default Transaction;

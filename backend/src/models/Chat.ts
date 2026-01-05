import mongoose, { Schema, Document, Types } from 'mongoose';

// Chat Type
export type ChatType = 'trip' | 'support';

// Chat Interface
export interface IChat extends Document {
  _id: Types.ObjectId;
  tripId?: Types.ObjectId;
  participants: Types.ObjectId[];
  type: ChatType;
  lastMessage?: Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Chat Schema
const chatSchema = new Schema<IChat>(
  {
    tripId: {
      type: Schema.Types.ObjectId,
      ref: 'Trip',
    },
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
      },
    ],
    type: {
      type: String,
      enum: ['trip', 'support'] as ChatType[],
      default: 'trip',
    },
    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
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
chatSchema.index({ tripId: 1 });
chatSchema.index({ participants: 1 });
chatSchema.index({ updatedAt: -1 });

// Static: Find or create chat for a trip
chatSchema.statics.findOrCreateForTrip = async function (
  tripId: Types.ObjectId,
  passengerId: Types.ObjectId,
  driverId: Types.ObjectId
): Promise<IChat> {
  let chat = await this.findOne({ tripId });

  if (!chat) {
    chat = await this.create({
      tripId,
      participants: [passengerId, driverId],
      type: 'trip',
    });
  }

  return chat;
};

// Interface for Chat model with statics
interface IChatModel extends mongoose.Model<IChat> {
  findOrCreateForTrip(
    tripId: Types.ObjectId,
    passengerId: Types.ObjectId,
    driverId: Types.ObjectId
  ): Promise<IChat>;
}

const Chat = mongoose.model<IChat, IChatModel>('Chat', chatSchema);

export default Chat;

import mongoose, { Schema, Document } from 'mongoose';

export type TransactionType = 'MATCH_ENTRY' | 'MATCH_REWARD' | 'DAILY_REWARD' | 'BONUS' | 'REFUND';

export interface ITransaction {
  type: TransactionType;
  amount: number;
  description: string;
  matchId?: string;
  createdAt: Date;
}

export interface IWallet extends Document {
  user: mongoose.Types.ObjectId;
  balance: number;
  lastDailyReward?: Date;
  transactions: ITransaction[];
  createdAt: Date;
  updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>({
  type: {
    type: String,
    enum: ['MATCH_ENTRY', 'MATCH_REWARD', 'DAILY_REWARD', 'BONUS', 'REFUND'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  matchId: {
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const WalletSchema = new Schema<IWallet>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    balance: {
      type: Number,
      default: 1000,
      min: 0
    },
    lastDailyReward: {
      type: Date
    },
    transactions: [TransactionSchema]
  },
  {
    timestamps: true
  }
);

export const Wallet = mongoose.model<IWallet>('Wallet', WalletSchema);


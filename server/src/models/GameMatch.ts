import mongoose, { Schema, Document } from 'mongoose';

export interface IGameMatch extends Document {
  matchId: string;
  tableId: string;
  playerAId: string;
  playerBId: string;
  winnerId: string;
  loserId: string;
  winnerColor: string;
  loserColor: string;
  durationSeconds: number;
  entryFee: number;
  rewardCoins: number;
  totalShots: number;
  createdAt: Date;
}

const GameMatchSchema = new Schema<IGameMatch>(
  {
    matchId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    tableId: {
      type: String,
      required: true
    },
    playerAId: {
      type: String,
      required: true,
      index: true
    },
    playerBId: {
      type: String,
      required: true,
      index: true
    },
    winnerId: {
      type: String,
      required: true
    },
    loserId: {
      type: String,
      required: true
    },
    winnerColor: {
      type: String,
      required: true
    },
    loserColor: {
      type: String,
      required: true
    },
    durationSeconds: {
      type: Number,
      default: 0
    },
    entryFee: {
      type: Number,
      default: 0
    },
    rewardCoins: {
      type: Number,
      default: 0
    },
    totalShots: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export const GameMatch = mongoose.model<IGameMatch>('GameMatch', GameMatchSchema);


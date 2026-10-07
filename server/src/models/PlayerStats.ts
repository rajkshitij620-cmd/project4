import mongoose, { Schema, Document } from 'mongoose';

export interface IPlayerStats extends Document {
  user: mongoose.Types.ObjectId;
  matches: number;
  wins: number;
  losses: number;
  winRate: number;
  bestScore: number;
  totalPocketed: number;
  updatedAt: Date;
}

const PlayerStatsSchema = new Schema<IPlayerStats>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true
    },
    matches: {
      type: Number,
      default: 0
    },
    wins: {
      type: Number,
      default: 0
    },
    losses: {
      type: Number,
      default: 0
    },
    winRate: {
      type: Number,
      default: 0
    },
    bestScore: {
      type: Number,
      default: 0
    },
    totalPocketed: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

export const PlayerStats = mongoose.model<IPlayerStats>('PlayerStats', PlayerStatsSchema);


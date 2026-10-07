import mongoose, { Schema, Document } from 'mongoose';

export interface IGameRoom extends Document {
  roomId: string;
  hostId: string;
  guestId?: string;
  tableId: string;
  status: 'WAITING' | 'READY' | 'ACTIVE' | 'FINISHED' | 'ABANDONED';
  hostReady: boolean;
  guestReady: boolean;
  playerAColor: string;
  playerBColor: string;
  currentTurn: 'playerA' | 'playerB';
  createdAt: Date;
  updatedAt: Date;
}

const GameRoomSchema = new Schema<IGameRoom>(
  {
    roomId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    hostId: {
      type: String,
      required: true
    },
    guestId: {
      type: String
    },
    tableId: {
      type: String,
      default: 'table_classic'
    },
    status: {
      type: String,
      enum: ['WAITING', 'READY', 'ACTIVE', 'FINISHED', 'ABANDONED'],
      default: 'WAITING'
    },
    hostReady: {
      type: Boolean,
      default: false
    },
    guestReady: {
      type: Boolean,
      default: false
    },
    playerAColor: {
      type: String,
      default: 'blue'
    },
    playerBColor: {
      type: String,
      default: 'red'
    },
    currentTurn: {
      type: String,
      enum: ['playerA', 'playerB'],
      default: 'playerA'
    }
  },
  {
    timestamps: true
  }
);

export const GameRoom = mongoose.model<IGameRoom>('GameRoom', GameRoomSchema);


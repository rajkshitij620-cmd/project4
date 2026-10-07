import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { GameRoom } from '../models/GameRoom.js';
import { GameMatch } from '../models/GameMatch.js';
import { Wallet } from '../models/Wallet.js';
import { PlayerStats } from '../models/PlayerStats.js';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  playerId?: string;
  username?: string;
}

// Map playerId -> socketId
const playerSockets = new Map<string, string>();
// Map socketId -> roomId
const socketRooms = new Map<string, string>();

const COLOR_PALETTE = ['blue', 'red', 'green', 'yellow', 'purple', 'orange'];

function getRandomColors(): { colorA: string; colorB: string } {
  const shuffled = [...COLOR_PALETTE].sort(() => Math.random() - 0.5);
  return { colorA: shuffled[0], colorB: shuffled[1] };
}

export function setupSocketHandlers(io: Server): void {
  // Socket Auth Middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token;
      const guestId = socket.handshake.auth.guestId;
      const username = socket.handshake.auth.username;

      if (token) {
        const secret = process.env.JWT_SECRET || 'diskslam_secret_key';
        const decoded = jwt.verify(token, secret) as { userId: string };
        const user = await User.findById(decoded.userId);
        if (user) {
          socket.userId = user._id.toString();
          socket.playerId = user.playerId;
          socket.username = user.username;
          return next();
        }
      }

      if (guestId) {
        socket.playerId = guestId;
        socket.username = username || `Guest_${guestId.slice(-4)}`;
        return next();
      }

      next();
    } catch {
      next();
    }
  });

  io.on('connection', async (socket: AuthenticatedSocket) => {
    const playerId = socket.playerId;

    if (playerId) {
      playerSockets.set(playerId, socket.id);
      console.log(`[Socket] Player ${socket.username} (${playerId}) connected [socket: ${socket.id}]`);

      // Update online status in database
      if (socket.userId) {
        await User.findByIdAndUpdate(socket.userId, { isOnline: true });
        io.emit('userOnline', { playerId });
      }
    }

    // 1. Friend Game Invitation
    socket.on('inviteFriend', async (data: { targetPlayerId: string; tableId: string }) => {
      const targetSocketId = playerSockets.get(data.targetPlayerId.toUpperCase());
      const roomId = `room_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

      if (targetSocketId) {
        io.to(targetSocketId).emit('gameInviteReceived', {
          roomId,
          fromPlayerId: socket.playerId,
          fromUsername: socket.username || 'Friend',
          tableId: data.tableId || 'table_classic'
        });
      }
    });

    // 2. Respond to Game Invitation
    socket.on('respondInvite', async (data: { roomId: string; accept: boolean }) => {
      if (!data.accept) {
        // Invite declined
        return;
      }

      const { colorA, colorB } = getRandomColors();

      // Create Game Room in database
      const newRoom = new GameRoom({
        roomId: data.roomId,
        hostId: socket.playerId,
        guestId: socket.playerId,
        status: 'ACTIVE',
        playerAColor: colorA,
        playerBColor: colorB,
        currentTurn: 'playerA'
      });
      await newRoom.save();

      socket.join(data.roomId);
      socketRooms.set(socket.id, data.roomId);

      // Symmetrical initial pieces layout
      const initialPieces = [
        { id: 'piece_a_0', owner: 'playerA', color: colorA, x: -1.6, z: 2.2, radius: 0.4, isPocketed: false },
        { id: 'piece_a_1', owner: 'playerA', color: colorA, x: 0, z: 3.2, radius: 0.4, isPocketed: false },
        { id: 'piece_a_2', owner: 'playerA', color: colorA, x: 1.6, z: 2.2, radius: 0.4, isPocketed: false },
        { id: 'piece_a_3', owner: 'playerA', color: colorA, x: 0, z: 4.6, radius: 0.4, isPocketed: false },
        { id: 'piece_b_0', owner: 'playerB', color: colorB, x: -1.6, z: -2.2, radius: 0.4, isPocketed: false },
        { id: 'piece_b_1', owner: 'playerB', color: colorB, x: 0, z: -3.2, radius: 0.4, isPocketed: false },
        { id: 'piece_b_2', owner: 'playerB', color: colorB, x: 1.6, z: -2.2, radius: 0.4, isPocketed: false },
        { id: 'piece_b_3', owner: 'playerB', color: colorB, x: 0, z: -4.6, radius: 0.4, isPocketed: false }
      ];

      io.to(data.roomId).emit('matchStarted', {
        roomId: data.roomId,
        tableId: 'table_classic',
        playerA: { id: 'playerA', name: 'Host', avatar: '🎯', color: colorA },
        playerB: { id: 'playerB', name: socket.username || 'Challenger', avatar: '⚡', color: colorB },
        myRole: 'playerB',
        initialPieces
      });
    });

    // 3. Shoot Synchronization
    socket.on('sendShoot', (data: { roomId: string; dirX: number; dirZ: number; power: number }) => {
      socket.to(data.roomId).emit('opponentShot', {
        dirX: data.dirX,
        dirZ: data.dirZ,
        power: data.power
      });
    });

    // 4. Pocketed Piece Synchronization
    socket.on('syncPocketedPiece', (data: { roomId: string; pieceId: string; intoOpponentGoal: boolean }) => {
      io.to(data.roomId).emit('piecePocketedSync', {
        pieceId: data.pieceId,
        intoOpponentGoal: data.intoOpponentGoal
      });
    });

    // 5. Physics Simulation Settled Synchronization
    socket.on('syncSettled', (data: { roomId: string }) => {
      io.to(data.roomId).emit('turnSettledSync');
    });

    // Disconnect Handler
    socket.on('disconnect', async () => {
      if (playerId) {
        playerSockets.delete(playerId);
        if (socket.userId) {
          await User.findByIdAndUpdate(socket.userId, {
            isOnline: false,
            lastSeen: new Date()
          });
          io.emit('userOffline', { playerId });
        }
      }
      const roomId = socketRooms.get(socket.id);
      if (roomId) {
        socket.to(roomId).emit('opponentDisconnected');
        socketRooms.delete(socket.id);
      }
      console.log(`[Socket] Socket disconnected: ${socket.id}`);
    });
  });
}


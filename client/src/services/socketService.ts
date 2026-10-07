import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../store/authStore';
import { useGameStore } from '../store/gameStore';
import { TableConfig, GAME_TABLES, PlayerColor } from '@shared/types';
import { PieceData } from '../game/core/GameRules';

class SocketService {
  private socket: Socket | null = null;
  private isConnecting: boolean = false;

  public connect() {
    if (this.socket && this.socket.connected) return;
    if (this.isConnecting) return;

    this.isConnecting = true;
    const token = localStorage.getItem('diskslam_token');
    const guestUser = localStorage.getItem('diskslam_guest_user');
    const guestData = guestUser ? JSON.parse(guestUser) : null;

    const socketUrl =
      window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
        ? 'http://localhost:5001'
        : window.location.origin;

    this.socket = io(socketUrl, {
      auth: {
        token: token || null,
        guestId: guestData?.playerId || null,
        username: guestData?.username || 'Guest'
      },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 2000
    });

    this.setupListeners();
  }

  private setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      this.isConnecting = false;
      console.log('[Socket] Connected to Disk Slam server with ID:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
    });

    // Real-time friend game invite received
    this.socket.on('gameInviteReceived', (invite: {
      roomId: string;
      fromPlayerId: string;
      fromUsername: string;
      tableId: string;
    }) => {
      useAuthStore.getState().setIncomingInvite(invite);
    });

    // Match started in room
    this.socket.on('matchStarted', (data: {
      roomId: string;
      tableId: string;
      playerA: { id: string; name: string; avatar: string; color: PlayerColor };
      playerB: { id: string; name: string; avatar: string; color: PlayerColor };
      myRole: 'playerA' | 'playerB';
      initialPieces: PieceData[];
    }) => {
      const table = GAME_TABLES.find((t) => t.id === data.tableId) || GAME_TABLES[0];
      useGameStore.getState().startOnlineMatch({
        roomId: data.roomId,
        table,
        playerA: data.playerA,
        playerB: data.playerB,
        myRole: data.myRole,
        initialPieces: data.initialPieces
      });
    });

    // Opponent shot executed
    this.socket.on('opponentShot', (data: { dirX: number; dirZ: number; power: number }) => {
      const state = useGameStore.getState();
      if (state.mode === 'ONLINE' && state.currentTurn !== state.myRole) {
        state.registerShot(data.dirX, data.dirZ, data.power);
      }
    });

    // Piece pocketed synced
    this.socket.on('piecePocketedSync', (data: { pieceId: string; intoOpponentGoal: boolean }) => {
      useGameStore.getState().handlePiecePocketed(data.pieceId, data.intoOpponentGoal);
    });

    // Settle confirmation
    this.socket.on('turnSettledSync', () => {
      useGameStore.getState().handleSimulationSettled();
    });
  }

  public inviteFriend(targetPlayerId: string, tableId: string) {
    this.socket?.emit('inviteFriend', { targetPlayerId, tableId });
  }

  public respondToInvite(roomId: string, accept: boolean) {
    this.socket?.emit('respondInvite', { roomId, accept });
    useAuthStore.getState().setIncomingInvite(null);
  }

  public sendShoot(roomId: string, dirX: number, dirZ: number, power: number) {
    this.socket?.emit('sendShoot', { roomId, dirX, dirZ, power });
  }

  public syncPocketedPiece(roomId: string, pieceId: string, intoOpponentGoal: boolean) {
    this.socket?.emit('syncPocketedPiece', { roomId, pieceId, intoOpponentGoal });
  }

  public syncSettled(roomId: string) {
    this.socket?.emit('syncSettled', { roomId });
  }

  public disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const socketService = new SocketService();


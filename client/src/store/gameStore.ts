import { create } from 'zustand';
import { TableConfig, GAME_TABLES, PlayerColor } from '../types/shared';
import { PieceData, GameRulesEngine } from '../game/core/GameRules';
import { AIDifficulty, DiskSlamAI } from '../game/ai/DiskSlamAI';
import { soundEffects } from '../audio/SoundEffects';

export type GameMode = 'OFFLINE' | 'ONLINE';
export type MatchPhase = 'LOBBY' | 'READY' | 'PLAYING' | 'SIMULATING' | 'GAME_OVER';

export interface PlayerInfo {
  id: string;
  name: string;
  avatar: string;
  color: PlayerColor;
  isAI?: boolean;
}

interface GameStoreState {
  mode: GameMode;
  phase: MatchPhase;
  table: TableConfig;
  playerA: PlayerInfo;
  playerB: PlayerInfo;
  myRole: 'playerA' | 'playerB';
  currentTurn: 'playerA' | 'playerB';
  pieces: PieceData[];
  aiDifficulty: AIDifficulty;
  winner: 'playerA' | 'playerB' | null;
  pendingExternalShot: { dirX: number; dirZ: number; power: number; targetPieceId?: string } | null;
  matchStats: {
    shotsA: number;
    shotsB: number;
    pocketedA: number;
    pocketedB: number;
    startTime: number;
    durationSeconds: number;
  };

  // Actions
  setMode: (mode: GameMode) => void;
  setTable: (table: TableConfig) => void;
  setAIDifficulty: (diff: AIDifficulty) => void;
  clearPendingExternalShot: () => void;
  startOfflineMatch: (table?: TableConfig, diff?: AIDifficulty) => void;
  startOnlineMatch: (
    roomData: {
      roomId: string;
      table: TableConfig;
      playerA: PlayerInfo;
      playerB: PlayerInfo;
      myRole: 'playerA' | 'playerB';
      initialPieces: PieceData[];
    }
  ) => void;
  registerShot: (dirX: number, dirZ: number, power: number) => void;
  handleSimulationSettled: () => void;
  handlePiecePocketed: (pieceId: string, intoOpponentGoal: boolean) => void;
  triggerAITurn: () => void;
  resetGame: () => void;
}

let aiTimer: ReturnType<typeof setTimeout> | null = null;

function clearAITimer() {
  if (aiTimer) {
    clearTimeout(aiTimer);
    aiTimer = null;
  }
}

export const useGameStore = create<GameStoreState>((set, get) => ({
  mode: 'OFFLINE',
  phase: 'LOBBY',
  table: GAME_TABLES[0],
  aiDifficulty: 'MEDIUM',
  myRole: 'playerA',
  currentTurn: 'playerA',
  winner: null,
  pendingExternalShot: null,
  playerA: {
    id: 'user_local',
    name: 'You',
    avatar: '🎯',
    color: 'blue'
  },
  playerB: {
    id: 'ai_bot',
    name: 'Bot AI',
    avatar: '🤖',
    color: 'red',
    isAI: true
  },
  pieces: [],
  matchStats: {
    shotsA: 0,
    shotsB: 0,
    pocketedA: 0,
    pocketedB: 0,
    startTime: 0,
    durationSeconds: 0
  },

  setMode: (mode) => set({ mode }),
  setTable: (table) => set({ table }),
  setAIDifficulty: (aiDifficulty) => set({ aiDifficulty }),
  clearPendingExternalShot: () => set({ pendingExternalShot: null }),

  startOfflineMatch: (selectedTable, selectedDiff) => {
    clearAITimer();

    const table = selectedTable || get().table;
    const diff = selectedDiff || get().aiDifficulty;

    const { playerAColor, playerBColor } = GameRulesEngine.pickRandomColors();
    const initialPieces = GameRulesEngine.createInitialPieces(playerAColor, playerBColor);

    set({
      mode: 'OFFLINE',
      phase: 'PLAYING',
      table,
      aiDifficulty: diff,
      myRole: 'playerA',
      currentTurn: 'playerA',
      winner: null,
      pendingExternalShot: null,
      playerA: {
        id: 'player_me',
        name: 'You',
        avatar: '🎯',
        color: playerAColor
      },
      playerB: {
        id: 'player_ai',
        name: `Bot (${diff})`,
        avatar: '🤖',
        color: playerBColor,
        isAI: true
      },
      pieces: initialPieces,
      matchStats: {
        shotsA: 0,
        shotsB: 0,
        pocketedA: 0,
        pocketedB: 0,
        startTime: Date.now(),
        durationSeconds: 0
      }
    });

    soundEffects.playTurnNotification(true);

    // Schedule AI's initial shot with mode-wise comfortable delay
    const initialDelay = DiskSlamAI.getInitialDelay(diff);
    aiTimer = setTimeout(() => {
      get().triggerAITurn();
    }, initialDelay);
  },

  startOnlineMatch: (roomData) => {
    set({
      mode: 'ONLINE',
      phase: 'PLAYING',
      table: roomData.table,
      playerA: roomData.playerA,
      playerB: roomData.playerB,
      myRole: roomData.myRole,
      currentTurn: 'playerA',
      winner: null,
      pendingExternalShot: null,
      pieces: roomData.initialPieces,
      matchStats: {
        shotsA: 0,
        shotsB: 0,
        pocketedA: 0,
        pocketedB: 0,
        startTime: Date.now(),
        durationSeconds: 0
      }
    });

    soundEffects.playTurnNotification(roomData.myRole === 'playerA');
  },

  registerShot: (_dirX, _dirZ, _power) => {
    const { currentTurn, matchStats } = get();
    set({
      phase: 'SIMULATING',
      matchStats: {
        ...matchStats,
        shotsA: currentTurn === 'playerA' ? matchStats.shotsA + 1 : matchStats.shotsA,
        shotsB: currentTurn === 'playerB' ? matchStats.shotsB + 1 : matchStats.shotsB
      }
    });
  },

  handlePiecePocketed: (pieceId: string, intoOpponentGoal: boolean) => {
    const { pieces, matchStats } = get();
    const targetPiece = pieces.find((p) => p.id === pieceId);
    if (!targetPiece || targetPiece.isPocketed) return;

    const updatedPieces = pieces.map((p) =>
      p.id === pieceId ? { ...p, isPocketed: true, pocketedAt: Date.now() } : p
    );

    let pocketedA = matchStats.pocketedA;
    let pocketedB = matchStats.pocketedB;

    if (intoOpponentGoal) {
      if (targetPiece.owner === 'playerA') pocketedA += 1;
      if (targetPiece.owner === 'playerB') pocketedB += 1;
    }

    set({
      pieces: updatedPieces,
      matchStats: { ...matchStats, pocketedA, pocketedB }
    });

    const winEval = GameRulesEngine.evaluateWinCondition(updatedPieces);
    if (winEval.isGameOver && winEval.winner) {
      clearAITimer();
      const duration = Math.round((Date.now() - matchStats.startTime) / 1000);
      set({
        phase: 'GAME_OVER',
        winner: winEval.winner,
        matchStats: { ...get().matchStats, durationSeconds: duration }
      });

      const amIWinner = winEval.winner === get().myRole;
      if (amIWinner) {
        soundEffects.playWin();
      } else {
        soundEffects.playLose();
      }
    }
  },

  handleSimulationSettled: () => {
    const state = get();
    if (state.phase !== 'SIMULATING') return;

    const winEval = GameRulesEngine.evaluateWinCondition(state.pieces);
    if (winEval.isGameOver && winEval.winner) {
      clearAITimer();
      const duration = Math.round((Date.now() - state.matchStats.startTime) / 1000);
      set({
        phase: 'GAME_OVER',
        winner: winEval.winner,
        matchStats: { ...state.matchStats, durationSeconds: duration },
      });
      if (winEval.winner === state.myRole) {
        soundEffects.playWin();
      } else {
        soundEffects.playLose();
      }
      return;
    }

    // REAL SLING PUCK: play is continuous — allow playerA to shoot without restriction
    set({ phase: 'PLAYING', currentTurn: 'playerA' });
    soundEffects.playTurnNotification(true);
  },

  triggerAITurn: () => {
    const state = get();
    // Only fire if game is active in OFFLINE mode
    if (state.mode !== 'OFFLINE' || state.phase === 'GAME_OVER' || state.phase === 'LOBBY') {
      clearAITimer();
      return;
    }

    // AI checks its own remaining pucks on North side (Z < 0.2)
    const myPucks = state.pieces.filter(
      (p) => p.owner === 'playerB' && !p.isPocketed && p.z < 0.2
    );
    if (myPucks.length === 0) {
      clearAITimer();
      return;
    }

    // AI calculates shot with difficulty-based precision, power, and aim
    const strikerPos = { x: 0, z: -3.4 };
    const shot = DiskSlamAI.calculateShot(
      strikerPos,
      state.pieces,
      'playerB',
      state.aiDifficulty,
    );

    if (shot.targetPieceId) {
      set({
        pendingExternalShot: {
          dirX: shot.dirX,
          dirZ: shot.dirZ,
          power: shot.power,
          targetPieceId: shot.targetPieceId,
        },
        matchStats: { ...state.matchStats, shotsB: state.matchStats.shotsB + 1 },
      });
    }

    // Schedule next AI shot based on difficulty (Easy: ~3.5s, Medium: ~2.3s, Hard: ~1.4s)
    clearAITimer();
    const nextDelay = DiskSlamAI.getNextShotDelay(state.aiDifficulty);
    aiTimer = setTimeout(() => {
      get().triggerAITurn();
    }, nextDelay);
  },

  resetGame: () => {
    clearAITimer();
    set({
      phase: 'LOBBY',
      winner: null,
      pendingExternalShot: null,
      pieces: [],
    });
  },
}));


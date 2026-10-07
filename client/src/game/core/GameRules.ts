import { PlayerColor, COLOR_PALETTE } from '../../types/shared';

export interface PieceData {
  id: string;
  owner: 'playerA' | 'playerB';
  color: PlayerColor;
  x: number;
  z: number;
  radius: number;
  isPocketed: boolean;
  pocketedAt?: number;
}

export interface BoardDimensions {
  width: number;       // X axis (e.g., 8 units)
  length: number;      // Z axis (e.g., 14 units)
  wallHeight: number;  // 0.6 units
  goalRadius: number;  // Pocket radius (e.g., 1.1 units)
  strikerRadius: number; // 0.45 units
  pieceRadius: number;   // 0.40 units
}

export const DEFAULT_BOARD_DIMENSIONS: BoardDimensions = {
  width: 7.2,
  length: 12.8,
  wallHeight: 0.6,
  goalRadius: 0.95,
  strikerRadius: 0.45,
  pieceRadius: 0.40
};

// Goals locations:
// Player A goal at +Z end (Z = +5.6)
// Player B goal at -Z end (Z = -5.6)
// Objective: Player A must shoot pieces into Player B's goal (Z = -5.6)
// Objective: Player B must shoot pieces into Player A's goal (Z = +5.6)
export const GOAL_LOCATIONS = {
  playerAGoal: { x: 0, z: 5.6, radius: 0.95, name: 'Goal Alpha (South)' },
  playerBGoal: { x: 0, z: -5.6, radius: 0.95, name: 'Goal Omega (North)' }
};

export class GameRulesEngine {
  /**
   * Randomly pick two distinct colors from the available palette
   */
  public static pickRandomColors(): { playerAColor: PlayerColor; playerBColor: PlayerColor } {
    const allColors: PlayerColor[] = Object.keys(COLOR_PALETTE) as PlayerColor[];
    // Shuffle
    const shuffled = [...allColors].sort(() => Math.random() - 0.5);
    return {
      playerAColor: shuffled[0],
      playerBColor: shuffled[1]
    };
  }

  /**
   * Initialize initial pieces for both players
   * Each player gets 4 pieces positioned tactically on their side,
   * plus a center contested piece or symmetric layout.
   */
  public static createInitialPieces(
    playerAColor: PlayerColor,
    playerBColor: PlayerColor
  ): PieceData[] {
    const pieces: PieceData[] = [];
    const r = DEFAULT_BOARD_DIMENSIONS.pieceRadius;

    // Player A pieces (positioned on South side, Z > 0)
    // Objective: reach North goal (Z = -5.6)
    const playerAPositions = [
      { x: -1.6, z: 2.2 },
      { x: 0, z: 3.2 },
      { x: 1.6, z: 2.2 },
      { x: 0, z: 4.6 }
    ];

    playerAPositions.forEach((pos, idx) => {
      pieces.push({
        id: `piece_a_${idx}`,
        owner: 'playerA',
        color: playerAColor,
        x: pos.x,
        z: pos.z,
        radius: r,
        isPocketed: false
      });
    });

    // Player B pieces (positioned on North side, Z < 0)
    // Objective: reach South goal (Z = +5.6)
    const playerBPositions = [
      { x: -1.6, z: -2.2 },
      { x: 0, z: -3.2 },
      { x: 1.6, z: -2.2 },
      { x: 0, z: -4.6 }
    ];

    playerBPositions.forEach((pos, idx) => {
      pieces.push({
        id: `piece_b_${idx}`,
        owner: 'playerB',
        color: playerBColor,
        x: pos.x,
        z: pos.z,
        radius: r,
        isPocketed: false
      });
    });

    return pieces;
  }

  /**
   * Check if piece position falls within target goal
   */
  public static checkPocketEntry(
    piece: PieceData,
    x: number,
    z: number
  ): { pocketed: boolean; intoOpponentGoal: boolean; goalName?: string } {
    // Player A's target is Player B's goal (North, Z = -5.6)
    const targetGoal = piece.owner === 'playerA' ? GOAL_LOCATIONS.playerBGoal : GOAL_LOCATIONS.playerAGoal;
    const ownGoal = piece.owner === 'playerA' ? GOAL_LOCATIONS.playerAGoal : GOAL_LOCATIONS.playerBGoal;

    const distToTarget = Math.hypot(x - targetGoal.x, z - targetGoal.z);
    const distToOwn = Math.hypot(x - ownGoal.x, z - ownGoal.z);

    if (distToTarget <= targetGoal.radius * 0.95) {
      return {
        pocketed: true,
        intoOpponentGoal: true,
        goalName: targetGoal.name
      };
    }

    // If it enters own goal (foul / accidental pocket)
    if (distToOwn <= ownGoal.radius * 0.95) {
      return {
        pocketed: true,
        intoOpponentGoal: false,
        goalName: ownGoal.name
      };
    }

    return { pocketed: false, intoOpponentGoal: false };
  }

  /**
   * Check win conditions
   * A player wins when ALL of their own colored pieces have entered the opponent's goal
   */
  public static evaluateWinCondition(pieces: PieceData[]): {
    isGameOver: boolean;
    winner: 'playerA' | 'playerB' | null;
    remainingA: number;
    remainingB: number;
  } {
    const remainingA = pieces.filter(p => p.owner === 'playerA' && !p.isPocketed).length;
    const remainingB = pieces.filter(p => p.owner === 'playerB' && !p.isPocketed).length;

    if (remainingA === 0) {
      return { isGameOver: true, winner: 'playerA', remainingA, remainingB };
    }
    if (remainingB === 0) {
      return { isGameOver: true, winner: 'playerB', remainingA, remainingB };
    }

    return { isGameOver: false, winner: null, remainingA, remainingB };
  }
}


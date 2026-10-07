/**
 * GameRules.ts
 * ---------------------------------------------------------------------------
 * Real Sling Puck (Super Winner / Fast Sling Puck) Rules:
 *
 * OBJECTIVE: Apni side ki saari 5 pucks opponent ki side mein pehle bhejo = WIN!
 *
 * SETUP:
 *   - Board ke beech ek divider hoti hai ek chhote gate (slot) ke saath.
 *   - Player A (South, Z > 0) ki 5 pucks apni side par rakhi hain.
 *   - Player B (North, Z < 0) ki 5 pucks apni side par rakhi hain.
 *
 * GAMEPLAY:
 *   - Dono players ek saath (simultaneously) pucks sling karte hain.
 *   - Sirf elastic band se puck kheincho aur center gate ke through opponent side pe bhejo.
 *   - Agar opponent ki puck aapki side par aa jaaye, aap use wapas opponent ki taraf bhej sakte ho.
 *
 * WINNING:
 *   - Jo player apni side ki SAARI pucks pehle opponent ke side mein bhej de = WINNER!
 *   - Jo player apni side khali kar le (0 pucks on own side) = WINNER!
 */

import { PlayerColor, COLOR_PALETTE } from '../../types/shared';

export interface PieceData {
  id: string;
  owner: 'playerA' | 'playerB';
  color: PlayerColor;
  x: number;
  z: number;
  radius: number;
  isPocketed: boolean;        // true = puck has crossed to opponent's side (counted)
  pocketedAt?: number;
}

export interface BoardDimensions {
  width: number;         // X axis
  length: number;        // Z axis (total board length)
  wallHeight: number;
  goalRadius: number;    // Not used as pockets — kept for compatibility
  strikerRadius: number;
  pieceRadius: number;
  dividerZ: number;      // Z = 0 center divider
  gateWidth: number;     // Width of the center gate slot
}

export const DEFAULT_BOARD_DIMENSIONS: BoardDimensions = {
  width: 7.2,
  length: 12.8,
  wallHeight: 0.5,
  goalRadius: 0.95,
  strikerRadius: 0.45,
  pieceRadius: 0.38,
  dividerZ: 0,          // Center of the board
  gateWidth: 1.6,       // Center gate through which pucks slide
};

// In Sling Puck there are no "goal pockets" — the board ends are just walls.
// Pieces crossing the center divider is what matters.
// We keep GOAL_LOCATIONS for any legacy references but they are decorative only.
export const GOAL_LOCATIONS = {
  playerAGoal: { x: 0, z: 5.6, radius: 0.95, name: 'Player A South End' },
  playerBGoal: { x: 0, z: -5.6, radius: 0.95, name: 'Player B North End' },
};

export class GameRulesEngine {
  /**
   * Randomly pick two distinct colors from the available palette
   */
  public static pickRandomColors(): { playerAColor: PlayerColor; playerBColor: PlayerColor } {
    const allColors: PlayerColor[] = Object.keys(COLOR_PALETTE) as PlayerColor[];
    const shuffled = [...allColors].sort(() => Math.random() - 0.5);
    return {
      playerAColor: shuffled[0],
      playerBColor: shuffled[1],
    };
  }

  /**
   * REAL SLING PUCK SETUP:
   * Player A gets 5 pucks on South side (Z > 0)
   * Player B gets 5 pucks on North side (Z < 0)
   * Board divider is at Z = 0 with a gate slot.
   */
  public static createInitialPieces(
    playerAColor: PlayerColor,
    playerBColor: PlayerColor,
  ): PieceData[] {
    const pieces: PieceData[] = [];
    const r = DEFAULT_BOARD_DIMENSIONS.pieceRadius;

    // Player A pucks — South side (Z > 0), scattered in a natural layout
    // 5 pucks in a 2-2-1 triangular formation near Player A's end
    const playerAPositions = [
      { x: -1.5, z: 1.1 },   // Left front
      { x:  1.5, z: 1.1 },   // Right front
      { x: -0.7, z: 2.2 },   // Left mid
      { x:  0.7, z: 2.2 },   // Right mid
      { x:  0.0, z: 3.4 },   // Back center
    ];

    playerAPositions.forEach((pos, idx) => {
      pieces.push({
        id: `piece_a_${idx}`,
        owner: 'playerA',
        color: playerAColor,
        x: pos.x,
        z: pos.z,
        radius: r,
        isPocketed: false,
      });
    });

    // Player B pucks — North side (Z < 0), mirrored layout
    const playerBPositions = [
      { x: -1.5, z: -1.1 },
      { x:  1.5, z: -1.1 },
      { x: -0.7, z: -2.2 },
      { x:  0.7, z: -2.2 },
      { x:  0.0, z: -3.4 },
    ];

    playerBPositions.forEach((pos, idx) => {
      pieces.push({
        id: `piece_b_${idx}`,
        owner: 'playerB',
        color: playerBColor,
        x: pos.x,
        z: pos.z,
        radius: r,
        isPocketed: false,
      });
    });

    return pieces;
  }

  /**
   * SLING PUCK SCORING:
   * A puck is "scored" (counted) when it crosses from its OWN side to the OPPONENT'S side.
   *
   * Player A's puck: lives on Z > 0. If it crosses to Z < 0 = scored (opponent side)!
   * Player B's puck: lives on Z < 0. If it crosses to Z > 0 = scored (opponent side)!
   *
   * Also if a puck falls off the board end (|Z| > halfLength) it is removed.
   */
  public static checkPocketEntry(
    piece: PieceData,
    x: number,
    z: number,
  ): { pocketed: boolean; intoOpponentGoal: boolean; goalName?: string } {
    const halfL = DEFAULT_BOARD_DIMENSIONS.length / 2;

    // If puck falls completely off the board ends — remove it
    if (z < -halfL - 0.3 || z > halfL + 0.3) {
      return {
        pocketed: true,
        intoOpponentGoal: false, // went off edge, not a clean cross — counts as neutral removal
        goalName: 'Out of bounds',
      };
    }

    // REAL SLING PUCK WIN CHECK:
    // Player A's puck crosses center (goes from Z > 0 to Z < -0.3) = scored onto opponent's side
    if (piece.owner === 'playerA' && z < -0.3) {
      return {
        pocketed: true,
        intoOpponentGoal: true,
        goalName: 'Player B side',
      };
    }

    // Player B's puck crosses center (goes from Z < 0 to Z > 0.3) = scored onto opponent's side
    if (piece.owner === 'playerB' && z > 0.3) {
      return {
        pocketed: true,
        intoOpponentGoal: true,
        goalName: 'Player A side',
      };
    }

    return { pocketed: false, intoOpponentGoal: false };
  }

  /**
   * WIN CONDITION (Real Sling Puck):
   * A player WINS when ALL their own pucks have been slung to the opponent's side.
   * i.e., the player whose OWN side has 0 remaining pucks = WINNER!
   *
   * Count of "remaining on own side":
   *   Player A remaining = pucks owned by A that are NOT yet pocketed (still on board, Z > -0.3)
   *   Player B remaining = pucks owned by B that are NOT yet pocketed (still on board, Z < +0.3)
   */
  public static evaluateWinCondition(pieces: PieceData[]): {
    isGameOver: boolean;
    winner: 'playerA' | 'playerB' | null;
    remainingA: number;
    remainingB: number;
  } {
    // Count pucks not yet crossed to opponent's side
    const remainingA = pieces.filter((p) => p.owner === 'playerA' && !p.isPocketed).length;
    const remainingB = pieces.filter((p) => p.owner === 'playerB' && !p.isPocketed).length;

    // Player A wins if all their pucks are gone from their side (slung to opponent's)
    if (remainingA === 0) {
      return { isGameOver: true, winner: 'playerA', remainingA, remainingB };
    }
    // Player B wins if all their pucks are gone from their side
    if (remainingB === 0) {
      return { isGameOver: true, winner: 'playerB', remainingA, remainingB };
    }

    return { isGameOver: false, winner: null, remainingA, remainingB };
  }
}

/**
 * SlingPuckAI.ts
 * ---------------------------------------------------------------------------
 * AI for Real Sling Puck game:
 * - AI plays as Player B (North side, Z < 0)
 * - Goal: Sling own pucks through the center gate (slot) to Player A's side (Z > 0)
 * - Difficulty affects: aim accuracy, power variance, shot frequency, and strategy
 *
 * EASY:   Wide angle errors, inconsistent power, slow reaction
 * MEDIUM: Moderate precision, targets open gate, tactical
 * HARD:   Near-perfect aim through gate slot, aggressive & fast
 */

import { PieceData, DEFAULT_BOARD_DIMENSIONS } from '../core/GameRules';

export type AIDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface AIShotDecision {
  dirX: number;
  dirZ: number;
  power: number; // 0.0 to 1.0
  targetPieceId?: string;
  strategy: 'THROUGH_GATE' | 'ANGLE_SHOT' | 'FALLBACK';
}

// Center gate is at Z = 0, width = 1.6 units from -0.8 to +0.8 in X
const GATE_X_HALF = DEFAULT_BOARD_DIMENSIONS.gateWidth / 2; // 0.8
const GATE_Z = 0; // center divider

export class DiskSlamAI {
  /**
   * Compute the AI's next sling puck shot.
   * AI picks one of its own pucks on its side and aims it through the gate.
   */
  public static calculateShot(
    _strikerPos: { x: number; z: number }, // kept for API compatibility
    pieces: PieceData[],
    aiOwner: 'playerA' | 'playerB',
    difficulty: AIDifficulty = 'MEDIUM',
  ): AIShotDecision {
    // AI's own pucks still on its own side
    const aiZ_sign = aiOwner === 'playerB' ? -1 : 1; // playerB is on Z < 0
    const myPucks = pieces.filter(
      (p) => p.owner === aiOwner && !p.isPocketed && Math.sign(p.z) === aiZ_sign,
    );

    if (myPucks.length === 0) {
      // No pucks to sling — idle fallback
      return { dirX: 0, dirZ: aiZ_sign * -1, power: 0.3, strategy: 'FALLBACK' };
    }

    // ── Difficulty: Strategy parameters ──────────────────────────────────
    let angleErrorRad: number;
    let powerBase: number;
    let powerVariance: number;

    switch (difficulty) {
      case 'EASY':
        // Casual, slow, beginner-friendly: wide misses, gentle power
        angleErrorRad = (Math.random() - 0.5) * 0.68; // ±19.5°
        powerBase = 0.40 + Math.random() * 0.16;      // 0.40 - 0.56
        powerVariance = 0.85 + Math.random() * 0.20;
        break;

      case 'MEDIUM':
        // Balanced, realistic human speed: good accuracy with occasional misses
        angleErrorRad = (Math.random() - 0.5) * 0.18; // ±5.1°
        powerBase = 0.65 + Math.random() * 0.18;      // 0.65 - 0.83
        powerVariance = 0.90 + Math.random() * 0.15;
        break;

      case 'HARD':
        // Fast, tournament precision: near-perfect aim through gate slot
        angleErrorRad = (Math.random() - 0.5) * 0.04; // ±1.1°
        powerBase = 0.85 + Math.random() * 0.15;      // 0.85 - 1.00
        powerVariance = 0.98 + Math.random() * 0.04;
        break;
    }

    // ── Pick a puck to sling ──────────────────────────────────────────────
    let targetPuck: PieceData;

    if (difficulty === 'HARD') {
      // Hard AI: pick the puck closest to the center gate (easiest to sling through)
      targetPuck = [...myPucks].sort((a, b) => {
        const scoreA = -Math.abs(a.x) - Math.abs(a.z) * 0.5; // prefer centered & closer to divider
        const scoreB = -Math.abs(b.x) - Math.abs(b.z) * 0.5;
        return scoreB - scoreA;
      })[0];
    } else {
      // Easy/Medium: pick a random puck from own side
      targetPuck = myPucks[Math.floor(Math.random() * myPucks.length)];
    }

    // ── Aim through the gate ──────────────────────────────────────────────
    // Gate target: aim at a point inside the gate opening (X from -GATE_X_HALF to +GATE_X_HALF)
    let gateTargetX: number;
    if (difficulty === 'HARD') {
      // Hard: aim at center of gate with slight variance
      gateTargetX = (Math.random() - 0.5) * GATE_X_HALF * 0.55;
    } else if (difficulty === 'MEDIUM') {
      // Medium: aim generally within the gate opening
      gateTargetX = (Math.random() - 0.5) * GATE_X_HALF * 1.15;
    } else {
      // Easy: wide aim, often hitting the solid divider wall next to the gate
      gateTargetX = (Math.random() - 0.5) * GATE_X_HALF * 3.0;
    }

    // Direction vector from target puck to gate target point
    const dxToGate = gateTargetX - targetPuck.x;
    const dzToGate = GATE_Z - targetPuck.z;
    const distToGate = Math.hypot(dxToGate, dzToGate);

    if (distToGate < 0.01) {
      // Puck is already at gate — fallback
      return { dirX: 0, dirZ: aiZ_sign * -1, power: powerBase, strategy: 'FALLBACK' };
    }

    let dirX = dxToGate / distToGate;
    let dirZ = dzToGate / distToGate;

    // ── Apply angle error for difficulty ──────────────────────────────────
    const cos = Math.cos(angleErrorRad);
    const sin = Math.sin(angleErrorRad);
    const rotDirX = dirX * cos - dirZ * sin;
    const rotDirZ = dirX * sin + dirZ * cos;
    dirX = rotDirX;
    dirZ = rotDirZ;

    // Power scales with distance to gate (farther pucks need more force)
    const distanceFactor = Math.min(distToGate / 4.0, 1.0);
    const finalPower = Math.min(Math.max(powerBase * powerVariance * (0.7 + distanceFactor * 0.45), 0.28), 1.0);

    return {
      dirX,
      dirZ,
      power: finalPower,
      targetPieceId: targetPuck.id,
      strategy: 'THROUGH_GATE',
    };
  }

  /**
   * Time in milliseconds the AI waits before taking its NEXT shot.
   * Mode-wise pacing:
   * - EASY:   3200ms - 4400ms (slow, casual, gives player plenty of time)
   * - MEDIUM: 2000ms - 2700ms (balanced, natural human reaction)
   * - HARD:   1200ms - 1600ms (fast, competitive, challenging)
   */
  public static getNextShotDelay(difficulty: AIDifficulty): number {
    switch (difficulty) {
      case 'EASY':
        return 3200 + Math.random() * 1200;
      case 'MEDIUM':
        return 2000 + Math.random() * 700;
      case 'HARD':
        return 1200 + Math.random() * 400;
      default:
        return 2200;
    }
  }

  /**
   * Initial delay in milliseconds when match starts before AI shoots.
   * Gives the human player comfortable preparation time.
   */
  public static getInitialDelay(difficulty: AIDifficulty): number {
    switch (difficulty) {
      case 'EASY':
        return 3000 + Math.random() * 800; // ~3.4s
      case 'MEDIUM':
        return 1800 + Math.random() * 500; // ~2.0s
      case 'HARD':
        return 1000 + Math.random() * 300; // ~1.1s
      default:
        return 2000;
    }
  }

  /**
   * Distance from 2D point (px, pz) to line segment (x1, z1) -> (x2, z2)
   * Kept for potential future use
   */
  static distPointToSegment(
    px: number,
    pz: number,
    x1: number,
    z1: number,
    x2: number,
    z2: number,
  ): number {
    const l2 = (x2 - x1) ** 2 + (z2 - z1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, pz - z1);
    let t = ((px - x1) * (x2 - x1) + (pz - z1) * (z2 - z1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), pz - (z1 + t * (z2 - z1)));
  }
}

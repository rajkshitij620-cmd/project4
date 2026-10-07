import { PieceData, DEFAULT_BOARD_DIMENSIONS, GOAL_LOCATIONS } from '../core/GameRules';

export type AIDifficulty = 'EASY' | 'MEDIUM' | 'HARD';

export interface AIShotDecision {
  dirX: number;
  dirZ: number;
  power: number; // 0.0 to 1.0 (will be scaled to physics impulse)
  targetPieceId?: string;
  strategy: 'DIRECT_POCKET' | 'BANK_SHOT' | 'DEFENSIVE_CLEAR' | 'FALLBACK';
}

export class DiskSlamAI {
  /**
   * Compute physics-aware shot for AI player
   */
  public static calculateShot(
    strikerPos: { x: number; z: number },
    pieces: PieceData[],
    aiOwner: 'playerA' | 'playerB',
    difficulty: AIDifficulty = 'MEDIUM'
  ): AIShotDecision {
    const targetGoal = aiOwner === 'playerB' ? GOAL_LOCATIONS.playerAGoal : GOAL_LOCATIONS.playerBGoal;
    const opponentGoal = aiOwner === 'playerB' ? GOAL_LOCATIONS.playerBGoal : GOAL_LOCATIONS.playerAGoal;

    const myPieces = pieces.filter(p => p.owner === aiOwner && !p.isPocketed);
    const opponentPieces = pieces.filter(p => p.owner !== aiOwner && !p.isPocketed);

    if (myPieces.length === 0) {
      return { dirX: 0, dirZ: 1, power: 0.5, strategy: 'FALLBACK' };
    }

    interface CandidateShot {
      piece: PieceData;
      shootDirX: number;
      shootDirZ: number;
      power: number;
      score: number;
      distToPocket: number;
    }

    const candidates: CandidateShot[] = [];

    // Evaluate each of AI's pieces for a direct shot into the goal
    for (const piece of myPieces) {
      // 1. Vector from piece to pocket
      const dxToGoal = targetGoal.x - piece.x;
      const dzToGoal = targetGoal.z - piece.z;
      const distToPocket = Math.hypot(dxToGoal, dzToGoal);
      if (distToPocket < 0.001) continue;

      const normGoalX = dxToGoal / distToPocket;
      const normGoalZ = dzToGoal / distToPocket;

      // 2. Ideal contact point on the piece:
      // The striker must strike the piece on the opposite side of the vector pointing toward the goal
      const combinedRadius = DEFAULT_BOARD_DIMENSIONS.pieceRadius + DEFAULT_BOARD_DIMENSIONS.strikerRadius;
      const contactX = piece.x - normGoalX * combinedRadius;
      const contactZ = piece.z - normGoalZ * combinedRadius;

      // 3. Vector from striker to contact point
      const dxStriker = contactX - strikerPos.x;
      const dzStriker = contactZ - strikerPos.z;
      const distStrikerToContact = Math.hypot(dxStriker, dzStriker);
      if (distStrikerToContact < 0.001) continue;

      const shootDirX = dxStriker / distStrikerToContact;
      const shootDirZ = dzStriker / distStrikerToContact;

      // 4. Dot product between (striker -> contact) and (contact -> piece -> goal)
      // High dot product means a natural straight shot, low means extreme cut shot
      const alignment = shootDirX * normGoalX + shootDirZ * normGoalZ;

      // Obstacle penalty
      let obstaclePenalty = 0;
      for (const obstacle of pieces) {
        if (obstacle.id === piece.id || obstacle.isPocketed) continue;
        // Check distance of obstacle to trajectory
        const d = this.distPointToSegment(
          obstacle.x,
          obstacle.z,
          strikerPos.x,
          strikerPos.z,
          contactX,
          contactZ
        );
        if (d < DEFAULT_BOARD_DIMENSIONS.pieceRadius * 1.8) {
          obstaclePenalty += 40;
        }
      }

      // Check if path from piece to pocket is blocked
      for (const obstacle of pieces) {
        if (obstacle.id === piece.id || obstacle.isPocketed) continue;
        const d = this.distPointToSegment(
          obstacle.x,
          obstacle.z,
          piece.x,
          piece.z,
          targetGoal.x,
          targetGoal.z
        );
        if (d < DEFAULT_BOARD_DIMENSIONS.pieceRadius * 1.8) {
          obstaclePenalty += 50;
        }
      }

      // Calculate score: prefer high alignment, close to pocket, and low obstacle penalty
      // Cut angle penalty if alignment is too low (< 0.2)
      if (alignment < 0.1) continue;

      const score = (alignment * 100) - (distToPocket * 5) - (distStrikerToContact * 3) - obstaclePenalty;

      // Power calculation based on total travel distance and table friction
      const totalDistance = distStrikerToContact + distToPocket * 1.3;
      const calculatedPower = Math.min(Math.max(totalDistance / 14.0 + 0.35, 0.4), 1.0);

      candidates.push({
        piece,
        shootDirX,
        shootDirZ,
        power: calculatedPower,
        score,
        distToPocket
      });
    }

    // Sort candidates by highest score
    candidates.sort((a, b) => b.score - a.score);

    let chosenShot: AIShotDecision;

    if (candidates.length > 0 && candidates[0].score > 0) {
      const best = candidates[0];
      chosenShot = {
        dirX: best.shootDirX,
        dirZ: best.shootDirZ,
        power: best.power,
        targetPieceId: best.piece.id,
        strategy: 'DIRECT_POCKET'
      };
    } else {
      // Defensive fallback: knock opponent's most dangerous piece away
      const dangerousOpponent = [...opponentPieces].sort((a, b) => {
        const distA = Math.hypot(opponentGoal.x - a.x, opponentGoal.z - a.z);
        const distB = Math.hypot(opponentGoal.x - b.x, opponentGoal.z - b.z);
        return distA - distB;
      })[0];

      if (dangerousOpponent) {
        const dx = dangerousOpponent.x - strikerPos.x;
        const dz = dangerousOpponent.z - strikerPos.z;
        const len = Math.hypot(dx, dz) || 1;
        chosenShot = {
          dirX: dx / len,
          dirZ: dz / len,
          power: 0.85,
          targetPieceId: dangerousOpponent.id,
          strategy: 'DEFENSIVE_CLEAR'
        };
      } else {
        // Simple direct center bank shot
        const targetPiece = myPieces[0];
        const dx = targetPiece.x - strikerPos.x;
        const dz = targetPiece.z - strikerPos.z;
        const len = Math.hypot(dx, dz) || 1;
        chosenShot = {
          dirX: dx / len,
          dirZ: dz / len,
          power: 0.65,
          targetPieceId: targetPiece.id,
          strategy: 'FALLBACK'
        };
      }
    }

    // Apply difficulty modifiers (error margin)
    let angleErrorRad = 0;
    let powerVariance = 1.0;

    switch (difficulty) {
      case 'EASY':
        // +/- 10-15 degrees error
        angleErrorRad = (Math.random() - 0.5) * 0.28;
        powerVariance = 0.8 + Math.random() * 0.35;
        break;
      case 'MEDIUM':
        // +/- 3-5 degrees error
        angleErrorRad = (Math.random() - 0.5) * 0.08;
        powerVariance = 0.92 + Math.random() * 0.16;
        break;
      case 'HARD':
        // Near surgical precision: +/- 0.5 degrees
        angleErrorRad = (Math.random() - 0.5) * 0.015;
        powerVariance = 0.98 + Math.random() * 0.04;
        break;
    }

    // Rotate shoot direction by angleErrorRad
    const cos = Math.cos(angleErrorRad);
    const sin = Math.sin(angleErrorRad);
    const finalDirX = chosenShot.dirX * cos - chosenShot.dirZ * sin;
    const finalDirZ = chosenShot.dirX * sin + chosenShot.dirZ * cos;

    return {
      dirX: finalDirX,
      dirZ: finalDirZ,
      power: Math.min(Math.max(chosenShot.power * powerVariance, 0.25), 1.0),
      targetPieceId: chosenShot.targetPieceId,
      strategy: chosenShot.strategy
    };
  }

  /**
   * Distance from 2D point (px, pz) to line segment (x1, z1) -> (x2, z2)
   */
  private static distPointToSegment(
    px: number,
    pz: number,
    x1: number,
    z1: number,
    x2: number,
    z2: number
  ): number {
    const l2 = (x2 - x1) ** 2 + (z2 - z1) ** 2;
    if (l2 === 0) return Math.hypot(px - x1, pz - z1);
    let t = ((px - x1) * (x2 - x1) + (pz - z1) * (z2 - z1)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(px - (x1 + t * (x2 - x1)), pz - (z1 + t * (z2 - z1)));
  }
}

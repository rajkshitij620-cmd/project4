import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics, RapierRigidBody } from '@react-three/rapier';
import { TableConfig, PlayerColor, COLOR_PALETTE } from '../../types/shared';
import { PieceData } from '../core/GameRules';
import { Board } from '../entities/Board';
import { Piece } from '../entities/Piece';
import { AimTrajectory } from '../entities/AimTrajectory';
import { GameCamera } from '../camera/GameCamera';

interface PhysicsWorldProps {
  table: TableConfig;
  pieces: PieceData[];
  playerAColor: PlayerColor;
  playerBColor: PlayerColor;
  currentTurn: 'playerA' | 'playerB';
  isMyTurn: boolean;
  isSimulating: boolean;
  pendingExternalShot?: { dirX: number; dirZ: number; power: number; targetPieceId?: string } | null;
  onClearExternalShot?: () => void;
  onShoot: (dirX: number, dirZ: number, power: number) => void;
  onSimulationSettled: () => void;
  onPiecePocketed: (pieceId: string, intoOpponentGoal: boolean) => void;
}

// Inner physics runner for tick loop & settle detection
const SimulationMonitor: React.FC<{
  isSimulating: boolean;
  rigidBodiesRef: React.MutableRefObject<Map<string, RapierRigidBody>>;
  onSettled: () => void;
}> = ({ isSimulating, rigidBodiesRef, onSettled }) => {
  const settleDurationRef = useRef(0);
  const timeSimulatingRef = useRef(0);

  useFrame((_, delta) => {
    if (!isSimulating) {
      settleDurationRef.current = 0;
      timeSimulatingRef.current = 0;
      return;
    }

    timeSimulatingRef.current += delta;
    // Allow physics simulation at least 0.4s to start moving before checking stationary
    if (timeSimulatingRef.current < 0.4) {
      return;
    }

    let maxSpeed = 0;
    rigidBodiesRef.current.forEach((body) => {
      try {
        const vel = body.linvel();
        const speed = Math.hypot(vel.x, vel.z);
        if (speed > maxSpeed) {
          maxSpeed = speed;
        }
      } catch {}
    });

    // Check if everything has settled to a stop
    if (maxSpeed < 0.08) {
      settleDurationRef.current += delta;
      if (settleDurationRef.current >= 0.35) {
        settleDurationRef.current = 0;
        timeSimulatingRef.current = 0;
        onSettled();
      }
    } else {
      settleDurationRef.current = 0;
    }
  });

  return null;
};

export const PhysicsWorld: React.FC<PhysicsWorldProps> = ({
  table,
  pieces,
  playerAColor,
  playerBColor,
  currentTurn,
  isMyTurn,
  isSimulating,
  pendingExternalShot,
  onClearExternalShot,
  onShoot,
  onSimulationSettled,
  onPiecePocketed
}) => {
  const rigidBodiesRef = useRef<Map<string, RapierRigidBody>>(new Map());

  const [aimState, setAimState] = useState<{
    isAiming: boolean;
    dirX: number;
    dirZ: number;
    power: number;
    strikerPos: [number, number, number];
  }>({
    isAiming: false,
    dirX: 0,
    dirZ: 0,
    power: 0,
    strikerPos: [0, 0, 4.2]
  });

  const handleRegisterBody = useCallback((id: string, body: RapierRigidBody) => {
    rigidBodiesRef.current.set(id, body);
  }, []);

  const handleAimChange = useCallback(
    (isAiming: boolean, dirX: number, dirZ: number, power: number, strikerPos: [number, number, number]) => {
      setAimState({ isAiming, dirX, dirZ, power, strikerPos });
    },
    []
  );

  // Apply AI shot directly to the target puck's rigid body
  useEffect(() => {
    if (!pendingExternalShot?.targetPieceId) return;
    const { dirX, dirZ, power, targetPieceId } = pendingExternalShot;

    // Try immediately, then retry once after a brief delay if body not yet registered
    const applyImpulse = () => {
      const body = rigidBodiesRef.current.get(targetPieceId);
      if (body) {
        const force = power * 18;
        try {
          body.applyImpulse({ x: dirX * force, y: 0, z: dirZ * force }, true);
        } catch {}
        if (onClearExternalShot) onClearExternalShot();
        return true;
      }
      return false;
    };

    if (!applyImpulse()) {
      // Retry after 100ms if body wasn't registered yet
      const t = setTimeout(() => {
        applyImpulse();
      }, 100);
      return () => clearTimeout(t);
    }
  }, [pendingExternalShot, onClearExternalShot]);

  // Player (playerA) can interact when game is in PLAYING phase and not simulating
  const playerCanInteract = isMyTurn && !isSimulating;
  const currentPlayerColor = currentTurn === 'playerA' ? playerAColor : playerBColor;

  return (
    <div className="w-full h-full relative select-none">
      <Canvas shadows gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}>
        <color attach="background" args={['#030712']} />

        {/* Dynamic Lighting — bright enough to see the board clearly */}
        <ambientLight intensity={1.6} color={table.ambientLight} />
        <directionalLight
          position={[0, 16, 6]}
          intensity={2.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-bias={-0.0008}
          shadow-camera-left={-10}
          shadow-camera-right={10}
          shadow-camera-top={12}
          shadow-camera-bottom={-12}
        />
        {/* Fill lights — illuminate both sides of the board */}
        <directionalLight position={[-8, 10, 0]} intensity={1.4} color={table.pointLightColor} />
        <directionalLight position={[ 8, 10, 0]} intensity={1.4} color={table.pointLightColor} />
        <pointLight position={[0, 8, 5]}  intensity={2.0} color={table.pointLightColor} distance={18} />
        <pointLight position={[0, 8, -5]} intensity={2.0} color={table.pointLightColor} distance={18} />


        <GameCamera currentTurn={currentTurn} isSimulating={isSimulating} />

        <Physics gravity={[0, -25, 0]} timeStep="vary">
          {/* Table Arena & Borders */}
          <Board table={table} />

          {/* Pieces — player can drag-sling their own pucks */}
          {pieces.map((piece) => (
            <Piece
              key={piece.id}
              piece={piece}
              isPlayerOwned={piece.owner === 'playerA'}
              canInteract={piece.owner === 'playerA' && playerCanInteract}
              onPiecePocketed={onPiecePocketed}
              onRegisterBody={handleRegisterBody}
              onShoot={onShoot}
              onAimChange={handleAimChange}
            />
          ))}

          {/* Visual Aiming Trajectory (shows when player is pulling a puck) */}
          <AimTrajectory
            isAiming={aimState.isAiming}
            dirX={aimState.dirX}
            dirZ={aimState.dirZ}
            power={aimState.power}
            strikerPos={aimState.strikerPos}
            color={COLOR_PALETTE[currentPlayerColor]?.glowHex ?? '#ffffff'}
          />

          {/* Settle Physics Monitor */}
          <SimulationMonitor
            isSimulating={isSimulating}
            rigidBodiesRef={rigidBodiesRef}
            onSettled={onSimulationSettled}
          />
        </Physics>
      </Canvas>
    </div>
  );
};

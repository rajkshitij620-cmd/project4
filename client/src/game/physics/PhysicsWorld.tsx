import React, { useState, useRef, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Physics, RapierRigidBody } from '@react-three/rapier';
import { TableConfig, PlayerColor, COLOR_PALETTE } from '../../types/shared';
import { PieceData } from '../core/GameRules';
import { Board } from '../entities/Board';
import { Piece } from '../entities/Piece';
import { Striker } from '../entities/Striker';
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
  pendingExternalShot?: { dirX: number; dirZ: number; power: number } | null;
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

  const strikerColor = currentTurn === 'playerA' ? playerAColor : playerBColor;
  const baselineZ = currentTurn === 'playerA' ? 4.2 : -4.2;

  return (
    <div className="w-full h-full relative select-none">
      <Canvas shadows gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}>
        <color attach="background" args={['#030712']} />

        {/* Dynamic Lighting */}
        <ambientLight intensity={0.7} color={table.ambientLight} />
        <directionalLight
          position={[6, 18, 8]}
          intensity={1.2}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-bias={-0.001}
        />
        <pointLight position={[-4, 8, -4]} intensity={0.6} color={table.pointLightColor} />
        <pointLight position={[4, 8, 4]} intensity={0.6} color={table.pointLightColor} />

        <GameCamera currentTurn={currentTurn} isSimulating={isSimulating} />

        <Physics gravity={[0, -25, 0]} timeStep="vary">
          {/* Table Arena & Borders */}
          <Board table={table} />

          {/* Pieces */}
          {pieces.map((piece) => (
            <Piece
              key={piece.id}
              piece={piece}
              onPiecePocketed={onPiecePocketed}
              onRegisterBody={handleRegisterBody}
            />
          ))}

          {/* Active Striker with stable key to prevent unmounting across turns */}
          <Striker
            key="board_striker"
            id="board_striker"
            color={strikerColor}
            isMyTurn={isMyTurn}
            canShoot={!isSimulating}
            baselineZ={baselineZ}
            pendingExternalShot={pendingExternalShot}
            onClearExternalShot={onClearExternalShot}
            onShoot={onShoot}
            onRegisterBody={handleRegisterBody}
            onAimChange={handleAimChange}
          />

          {/* Visual Aiming Trajectory */}
          <AimTrajectory
            isAiming={aimState.isAiming}
            dirX={aimState.dirX}
            dirZ={aimState.dirZ}
            power={aimState.power}
            strikerPos={aimState.strikerPos}
            color={COLOR_PALETTE[strikerColor].glowHex}
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

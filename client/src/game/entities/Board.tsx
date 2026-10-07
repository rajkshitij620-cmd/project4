import React from 'react';
import { CuboidCollider, CylinderCollider, RigidBody } from '@react-three/rapier';
import { TableConfig } from '@shared/types';
import { DEFAULT_BOARD_DIMENSIONS, GOAL_LOCATIONS } from '../core/GameRules';

interface BoardProps {
  table: TableConfig;
  onGoalPocket?: (goalSide: 'playerA' | 'playerB', pieceId: string) => void;
}

export const Board: React.FC<BoardProps> = ({ table }) => {
  const { width, length, wallHeight, goalRadius } = DEFAULT_BOARD_DIMENSIONS;
  const halfW = width / 2;
  const halfL = length / 2;
  const wallThick = 0.5;

  return (
    <group position={[0, 0, 0]}>
      {/* 1. TABLE PLAYING SURFACE (FELT / ARENA FLOOR) */}
      <RigidBody type="fixed" friction={table.friction} restitution={table.restitution}>
        {/* Main Floor Surface */}
        <mesh position={[0, -0.05, 0]} receiveShadow>
          <boxGeometry args={[width, 0.1, length]} />
          <meshStandardMaterial
            color={table.feltColor}
            roughness={table.theme === 'neon' || table.theme === 'cyber' ? 0.2 : 0.6}
            metalness={table.theme === 'cyber' ? 0.7 : 0.1}
          />
        </mesh>
      </RigidBody>

      {/* Surface Decorative Lines & Center Circle */}
      <group position={[0, 0.005, 0]}>
        {/* Center line */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width * 0.9, 0.06]} />
          <meshBasicMaterial
            color={table.theme === 'neon' ? '#38bdf8' : table.theme === 'royal' ? '#fbbf24' : '#64748b'}
            transparent
            opacity={0.5}
          />
        </mesh>

        {/* Center circle ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.3, 1.36, 48]} />
          <meshBasicMaterial
            color={table.theme === 'neon' ? '#ec4899' : table.theme === 'royal' ? '#fbbf24' : '#64748b'}
            transparent
            opacity={0.4}
          />
        </mesh>

        {/* Baseline Player A */}
        <mesh position={[0, 0, 3.8]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width * 0.8, 0.04]} />
          <meshBasicMaterial color={table.borderColor} transparent opacity={0.3} />
        </mesh>

        {/* Baseline Player B */}
        <mesh position={[0, 0, -3.8]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width * 0.8, 0.04]} />
          <meshBasicMaterial color={table.borderColor} transparent opacity={0.3} />
        </mesh>
      </group>

      {/* 2. CUSHION WALLS & BORDERS */}
      {/* Left Wall (-X) */}
      <RigidBody type="fixed" friction={table.friction * 0.8} restitution={table.restitution}>
        <mesh position={[-halfW - wallThick / 2, wallHeight / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[wallThick, wallHeight, length + wallThick * 2]} />
          <meshStandardMaterial
            color={table.boardColor}
            roughness={0.3}
            metalness={table.theme === 'cyber' ? 0.8 : 0.2}
          />
        </mesh>
      </RigidBody>

      {/* Right Wall (+X) */}
      <RigidBody type="fixed" friction={table.friction * 0.8} restitution={table.restitution}>
        <mesh position={[halfW + wallThick / 2, wallHeight / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[wallThick, wallHeight, length + wallThick * 2]} />
          <meshStandardMaterial
            color={table.boardColor}
            roughness={0.3}
            metalness={table.theme === 'cyber' ? 0.8 : 0.2}
          />
        </mesh>
      </RigidBody>

      {/* North End Walls (divided to allow the Goal Pocket opening) */}
      {/* North Left */}
      <RigidBody type="fixed" friction={table.friction * 0.8} restitution={table.restitution}>
        <mesh
          position={[-(halfW + goalRadius) / 2, wallHeight / 2, -halfL - wallThick / 2]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[halfW - goalRadius, wallHeight, wallThick]} />
          <meshStandardMaterial color={table.boardColor} roughness={0.3} />
        </mesh>
      </RigidBody>
      {/* North Right */}
      <RigidBody type="fixed" friction={table.friction * 0.8} restitution={table.restitution}>
        <mesh
          position={[(halfW + goalRadius) / 2, wallHeight / 2, -halfL - wallThick / 2]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[halfW - goalRadius, wallHeight, wallThick]} />
          <meshStandardMaterial color={table.boardColor} roughness={0.3} />
        </mesh>
      </RigidBody>
      {/* North Back Wall (behind goal) */}
      <RigidBody type="fixed" friction={table.friction} restitution={0.3}>
        <mesh position={[0, wallHeight / 2, -halfL - wallThick * 2.2]} receiveShadow>
          <boxGeometry args={[goalRadius * 2.5, wallHeight, wallThick]} />
          <meshStandardMaterial color={table.boardColor} roughness={0.4} />
        </mesh>
      </RigidBody>

      {/* South End Walls (divided to allow Player A's Goal Pocket opening) */}
      {/* South Left */}
      <RigidBody type="fixed" friction={table.friction * 0.8} restitution={table.restitution}>
        <mesh
          position={[-(halfW + goalRadius) / 2, wallHeight / 2, halfL + wallThick / 2]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[halfW - goalRadius, wallHeight, wallThick]} />
          <meshStandardMaterial color={table.boardColor} roughness={0.3} />
        </mesh>
      </RigidBody>
      {/* South Right */}
      <RigidBody type="fixed" friction={table.friction * 0.8} restitution={table.restitution}>
        <mesh
          position={[(halfW + goalRadius) / 2, wallHeight / 2, halfL + wallThick / 2]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[halfW - goalRadius, wallHeight, wallThick]} />
          <meshStandardMaterial color={table.boardColor} roughness={0.3} />
        </mesh>
      </RigidBody>
      {/* South Back Wall (behind goal) */}
      <RigidBody type="fixed" friction={table.friction} restitution={0.3}>
        <mesh position={[0, wallHeight / 2, halfL + wallThick * 2.2]} receiveShadow>
          <boxGeometry args={[goalRadius * 2.5, wallHeight, wallThick]} />
          <meshStandardMaterial color={table.boardColor} roughness={0.4} />
        </mesh>
      </RigidBody>

      {/* 3. GOAL POCKET VISUALS */}
      {/* South Goal (Player A Goal, target for Player B) */}
      <group position={[GOAL_LOCATIONS.playerAGoal.x, 0.01, GOAL_LOCATIONS.playerAGoal.z]}>
        {/* Glow Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[goalRadius * 0.85, goalRadius * 1.05, 32]} />
          <meshStandardMaterial
            color={table.goalGlowColor}
            emissive={table.goalGlowColor}
            emissiveIntensity={table.theme === 'neon' ? 1.5 : 0.8}
            roughness={0.2}
          />
        </mesh>
        {/* Goal Pit Cylinder */}
        <mesh position={[0, -0.25, 0]}>
          <cylinderGeometry args={[goalRadius * 0.88, goalRadius * 0.88, 0.5, 32]} />
          <meshStandardMaterial color="#020617" roughness={0.9} />
        </mesh>
        {/* Goal Area Ambient Light */}
        <pointLight color={table.goalGlowColor} intensity={0.8} distance={3} position={[0, 0.5, 0]} />
      </group>

      {/* North Goal (Player B Goal, target for Player A) */}
      <group position={[GOAL_LOCATIONS.playerBGoal.x, 0.01, GOAL_LOCATIONS.playerBGoal.z]}>
        {/* Glow Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[goalRadius * 0.85, goalRadius * 1.05, 32]} />
          <meshStandardMaterial
            color={table.goalGlowColor}
            emissive={table.goalGlowColor}
            emissiveIntensity={table.theme === 'neon' ? 1.5 : 0.8}
            roughness={0.2}
          />
        </mesh>
        {/* Goal Pit Cylinder */}
        <mesh position={[0, -0.25, 0]}>
          <cylinderGeometry args={[goalRadius * 0.88, goalRadius * 0.88, 0.5, 32]} />
          <meshStandardMaterial color="#020617" roughness={0.9} />
        </mesh>
        {/* Goal Area Ambient Light */}
        <pointLight color={table.goalGlowColor} intensity={0.8} distance={3} position={[0, 0.5, 0]} />
      </group>

      {/* 4. TABLE BASE / PEDESTAL */}
      <mesh position={[0, -0.8, 0]} receiveShadow>
        <boxGeometry args={[width + wallThick * 2.8, 1.4, length + wallThick * 3.2]} />
        <meshStandardMaterial
          color={table.boardColor}
          roughness={0.4}
          metalness={table.theme === 'cyber' ? 0.5 : 0.15}
        />
      </mesh>
    </group>
  );
};


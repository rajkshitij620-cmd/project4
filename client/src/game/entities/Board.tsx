import React from 'react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { TableConfig } from '@shared/types';
import { DEFAULT_BOARD_DIMENSIONS } from '../core/GameRules';

interface BoardProps {
  table: TableConfig;
  onGoalPocket?: (goalSide: 'playerA' | 'playerB', pieceId: string) => void;
}

/**
 * REAL SLING PUCK BOARD:
 * - Rectangular board with 4 solid walls
 * - Center divider (solid) with a gate SLOT in the middle through which pucks pass
 * - No goal pockets (pucks stay on opponent's side after crossing)
 * - Each arena has a distinct vibrant felt + rail color
 */
export const Board: React.FC<BoardProps> = ({ table }) => {
  const { width, length, wallHeight } = DEFAULT_BOARD_DIMENSIONS;
  const halfW = width / 2;
  const halfL = length / 2;
  const wallThick = 0.45;
  const dividerH = 0.4;
  const dividerT = 0.22;
  const gateWidth = 1.6; // center slot opening width

  // Segment of divider on each side of the gate
  const divSegW = (width - gateWidth) / 2;

  // Roughness/metalness by theme
  const surfaceRoughness = table.theme === 'neon' || table.theme === 'cyber' ? 0.15 : 0.5;
  const railMetalness = table.theme === 'cyber' ? 0.8 : table.theme === 'neon' ? 0.5 : 0.15;
  const railRoughness = table.theme === 'cyber' ? 0.2 : table.theme === 'neon' ? 0.3 : 0.4;
  const isCyberOrNeon = table.theme === 'cyber' || table.theme === 'neon';

  return (
    <group position={[0, 0, 0]}>

      {/* ── 1. PLAYING SURFACE (felt / arena floor) ── */}
      <RigidBody type="fixed" friction={table.friction} restitution={table.restitution}>
        <mesh position={[0, -0.05, 0]} receiveShadow>
          <boxGeometry args={[width, 0.1, length]} />
          <meshStandardMaterial
            color={table.feltColor}
            roughness={surfaceRoughness}
            metalness={table.theme === 'cyber' ? 0.35 : 0.0}
            emissive={isCyberOrNeon ? table.feltColor : '#000000'}
            emissiveIntensity={isCyberOrNeon ? 0.05 : 0}
          />
        </mesh>
      </RigidBody>

      {/* ── 2. SURFACE DECORATIVE MARKINGS ── */}
      <group position={[0, 0.005, 0]}>
        {/* Elastic band anchor lines — Player A side (South) */}
        <mesh position={[0, 0, halfL * 0.82]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width * 0.88, 0.05]} />
          <meshBasicMaterial color={table.borderColor} transparent opacity={0.45} />
        </mesh>

        {/* Elastic band anchor lines — Player B side (North) */}
        <mesh position={[0, 0, -halfL * 0.82]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width * 0.88, 0.05]} />
          <meshBasicMaterial color={table.borderColor} transparent opacity={0.45} />
        </mesh>

        {/* Mid-zone stripe (slight visible guide near center) */}
        <mesh position={[0, 0, halfL * 0.42]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width * 0.88, 0.03]} />
          <meshBasicMaterial color={table.borderColor} transparent opacity={0.2} />
        </mesh>
        <mesh position={[0, 0, -halfL * 0.42]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width * 0.88, 0.03]} />
          <meshBasicMaterial color={table.borderColor} transparent opacity={0.2} />
        </mesh>

        {/* Gate highlight on surface */}
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[gateWidth * 0.9, 0.1]} />
          <meshBasicMaterial color={table.goalGlowColor} transparent opacity={0.3} />
        </mesh>
      </group>

      {/* ── 3. ELASTIC BAND PEG INDICATORS ── */}
      {/* Player A pegs (South end) */}
      {[-halfW + 0.15, halfW - 0.15].map((px, i) => (
        <mesh key={`peg_a_${i}`} position={[px, 0.22, halfL * 0.82]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.36, 14]} />
          <meshStandardMaterial
            color={table.borderColor}
            roughness={0.2}
            metalness={0.8}
            emissive={table.borderColor}
            emissiveIntensity={isCyberOrNeon ? 0.5 : 0.15}
          />
        </mesh>
      ))}
      {/* Player B pegs (North end) */}
      {[-halfW + 0.15, halfW - 0.15].map((px, i) => (
        <mesh key={`peg_b_${i}`} position={[px, 0.22, -halfL * 0.82]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 0.36, 14]} />
          <meshStandardMaterial
            color={table.borderColor}
            roughness={0.2}
            metalness={0.8}
            emissive={table.borderColor}
            emissiveIntensity={isCyberOrNeon ? 0.5 : 0.15}
          />
        </mesh>
      ))}

      {/* ── 4. SIDE RAILS (Left & Right walls) ── */}
      <RigidBody type="fixed" friction={table.friction * 0.7} restitution={table.restitution}>
        <mesh position={[-halfW - wallThick / 2, wallHeight / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[wallThick, wallHeight, length + wallThick * 2]} />
          <meshStandardMaterial
            color={table.boardColor}
            roughness={railRoughness}
            metalness={railMetalness}
            emissive={isCyberOrNeon ? table.boardColor : '#000000'}
            emissiveIntensity={isCyberOrNeon ? 0.12 : 0}
          />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" friction={table.friction * 0.7} restitution={table.restitution}>
        <mesh position={[halfW + wallThick / 2, wallHeight / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[wallThick, wallHeight, length + wallThick * 2]} />
          <meshStandardMaterial
            color={table.boardColor}
            roughness={railRoughness}
            metalness={railMetalness}
            emissive={isCyberOrNeon ? table.boardColor : '#000000'}
            emissiveIntensity={isCyberOrNeon ? 0.12 : 0}
          />
        </mesh>
      </RigidBody>

      {/* ── 5. END WALLS (North & South) — solid bumpers ── */}
      <RigidBody type="fixed" friction={table.friction * 0.8} restitution={table.restitution * 0.7}>
        <mesh position={[0, wallHeight / 2, halfL + wallThick / 2]} castShadow receiveShadow>
          <boxGeometry args={[width + wallThick * 2, wallHeight, wallThick]} />
          <meshStandardMaterial color={table.boardColor} roughness={railRoughness} metalness={railMetalness} />
        </mesh>
      </RigidBody>
      <RigidBody type="fixed" friction={table.friction * 0.8} restitution={table.restitution * 0.7}>
        <mesh position={[0, wallHeight / 2, -halfL - wallThick / 2]} castShadow receiveShadow>
          <boxGeometry args={[width + wallThick * 2, wallHeight, wallThick]} />
          <meshStandardMaterial color={table.boardColor} roughness={railRoughness} metalness={railMetalness} />
        </mesh>
      </RigidBody>

      {/* ── 6. CENTER DIVIDER — Left segment (solid wall left of gate) ── */}
      <RigidBody type="fixed" friction={0.05} restitution={table.restitution * 0.9}>
        <mesh
          position={[-(gateWidth / 2 + divSegW / 2), dividerH / 2, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[divSegW, dividerH, dividerT]} />
          <meshStandardMaterial
            color={table.boardColor}
            roughness={railRoughness}
            metalness={railMetalness + 0.1}
            emissive={isCyberOrNeon ? table.borderColor : '#000000'}
            emissiveIntensity={isCyberOrNeon ? 0.18 : 0}
          />
        </mesh>
        <CuboidCollider args={[divSegW / 2, dividerH / 2, dividerT / 2]} position={[-(gateWidth / 2 + divSegW / 2), dividerH / 2, 0]} />
      </RigidBody>

      {/* ── 6b. CENTER DIVIDER — Right segment (solid wall right of gate) ── */}
      <RigidBody type="fixed" friction={0.05} restitution={table.restitution * 0.9}>
        <mesh
          position={[(gateWidth / 2 + divSegW / 2), dividerH / 2, 0]}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[divSegW, dividerH, dividerT]} />
          <meshStandardMaterial
            color={table.boardColor}
            roughness={railRoughness}
            metalness={railMetalness + 0.1}
            emissive={isCyberOrNeon ? table.borderColor : '#000000'}
            emissiveIntensity={isCyberOrNeon ? 0.18 : 0}
          />
        </mesh>
        <CuboidCollider args={[divSegW / 2, dividerH / 2, dividerT / 2]} position={[(gateWidth / 2 + divSegW / 2), dividerH / 2, 0]} />
      </RigidBody>

      {/* ── 7. GATE GLOW MARKER (decorative, no physics) ── */}
      <mesh position={[0, dividerH * 0.5, 0]} rotation={[0, 0, 0]}>
        <boxGeometry args={[gateWidth, dividerH * 0.6, dividerT * 0.4]} />
        <meshStandardMaterial
          color={table.goalGlowColor}
          emissive={table.goalGlowColor}
          emissiveIntensity={0.8}
          transparent
          opacity={0.35}
        />
      </mesh>
      {/* Gate glow point light */}
      <pointLight
        position={[0, 0.8, 0]}
        color={table.goalGlowColor}
        intensity={isCyberOrNeon ? 2.5 : 1.2}
        distance={5}
      />

      {/* ── 8. TABLE BASE / PEDESTAL ── */}
      <mesh position={[0, -0.85, 0]} receiveShadow>
        <boxGeometry args={[width + wallThick * 3, 1.5, length + wallThick * 3]} />
        <meshStandardMaterial
          color={table.boardColor}
          roughness={0.45}
          metalness={table.theme === 'cyber' ? 0.55 : 0.18}
        />
      </mesh>
    </group>
  );
};

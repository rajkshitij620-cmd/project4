import React from 'react';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { TableConfig } from '@shared/types';
import { DEFAULT_BOARD_DIMENSIONS } from '../core/GameRules';

interface BoardProps {
  table: TableConfig;
  onGoalPocket?: (goalSide: 'playerA' | 'playerB', pieceId: string) => void;
}

/**
 * REAL SLING PUCK BOARD — full-screen, bright, realistic.
 *
 * Layout (top-down):
 *   - Thick wooden side rails (left + right)
 *   - Thick end bumpers (north + south)
 *   - Bright, visible playing surface
 *   - Center divider with gate slot
 *   - Elastic band "strap" running across each half (3D cylinder)
 *   - Two small metal pegs where the strap anchors to the rails
 */
export const Board: React.FC<BoardProps> = ({ table }) => {
  const { width, length, wallHeight } = DEFAULT_BOARD_DIMENSIONS;
  const halfW = width / 2;
  const halfL = length / 2;

  // Rail / bumper thickness
  const railThick  = 0.55;
  const railH      = 0.65;

  // Center divider
  const dividerH   = 0.50;
  const dividerT   = 0.28;
  const gateWidth  = 1.6;
  const divSegW    = (width - gateWidth) / 2;

  // Elastic band (strap) Z positions — 78% from center toward each end
  const bandZ_A =  halfL * 0.76;   // Player A side (south)
  const bandZ_B = -halfL * 0.76;   // Player B side (north)
  const bandRadius = 0.045;
  const pegRadius  = 0.09;
  const pegH       = 0.52;

  // Theme flags
  const isCyber = table.theme === 'cyber';
  const isNeon  = table.theme === 'neon';
  const isGlow  = isCyber || isNeon;

  // Surface brightness boost — make felt clearly visible regardless of theme
  const feltEmissive    = isGlow ? table.feltColor : '#000000';
  const feltEmissiveInt = isGlow ? 0.12 : 0.0;

  const railEmissive    = isGlow ? table.boardColor : '#000000';
  const railEmissiveInt = isGlow ? 0.15 : 0.0;

  // Divider accent color
  const dividerColor = isNeon ? '#22d3ee'
    : isCyber ? '#a78bfa'
    : table.theme === 'royal' ? '#fde047'
    : table.borderColor;

  return (
    <group position={[0, 0, 0]}>

      {/* ══════════════════════════════════════════════════════════
          1. PLAYING SURFACE (felt / board floor)
         ══════════════════════════════════════════════════════════ */}
      <RigidBody type="fixed" colliders={false} friction={table.friction} restitution={table.restitution}>
        <mesh position={[0, -0.06, 0]} receiveShadow>
          <boxGeometry args={[width, 0.12, length]} />
          <meshStandardMaterial
            color={table.feltColor}
            roughness={isGlow ? 0.18 : 0.55}
            metalness={isCyber ? 0.4 : 0.0}
            emissive={feltEmissive}
            emissiveIntensity={feltEmissiveInt}
          />
        </mesh>
        <CuboidCollider args={[width / 2 + 0.5, 0.5, length / 2 + 0.5]} position={[0, -0.5, 0]} />
      </RigidBody>

      {/* ══════════════════════════════════════════════════════════
          2. SURFACE LANE MARKINGS (painted lines)
         ══════════════════════════════════════════════════════════ */}
      <group position={[0, 0.002, 0]}>
        {/* Player A court boundary line */}
        <mesh position={[0, 0, bandZ_A]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width * 0.92, 0.06]} />
          <meshBasicMaterial color={dividerColor} transparent opacity={0.55} />
        </mesh>
        {/* Player B court boundary line */}
        <mesh position={[0, 0, bandZ_B]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[width * 0.92, 0.06]} />
          <meshBasicMaterial color={dividerColor} transparent opacity={0.55} />
        </mesh>
        {/* Gate surface highlight */}
        <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[gateWidth * 0.85, 0.18]} />
          <meshBasicMaterial color={table.goalGlowColor} transparent opacity={0.45} />
        </mesh>
      </group>

      {/* ══════════════════════════════════════════════════════════
          3. ELASTIC BANDS (3D stretched straps across each half)
         ══════════════════════════════════════════════════════════ */}
      {/* Band A — Player south side */}
      <mesh position={[0, 0.16, bandZ_A]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[bandRadius, bandRadius, width * 0.88, 8]} />
        <meshStandardMaterial
          color={dividerColor}
          roughness={0.55}
          metalness={0.1}
          emissive={dividerColor}
          emissiveIntensity={isGlow ? 0.4 : 0.18}
        />
      </mesh>
      {/* Band B — Player north side */}
      <mesh position={[0, 0.16, bandZ_B]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[bandRadius, bandRadius, width * 0.88, 8]} />
        <meshStandardMaterial
          color={dividerColor}
          roughness={0.55}
          metalness={0.1}
          emissive={dividerColor}
          emissiveIntensity={isGlow ? 0.4 : 0.18}
        />
      </mesh>

      {/* ══════════════════════════════════════════════════════════
          4. METAL ANCHOR PEGS (where elastic band hooks to rail)
         ══════════════════════════════════════════════════════════ */}
      {([-halfW + 0.12, halfW - 0.12] as number[]).map((px, i) => (
        <React.Fragment key={`pegs_${i}`}>
          {/* Peg A (south band) */}
          <mesh position={[px, pegH / 2, bandZ_A]} castShadow>
            <cylinderGeometry args={[pegRadius, pegRadius * 0.8, pegH, 12]} />
            <meshStandardMaterial
              color={table.borderColor}
              roughness={0.2}
              metalness={0.85}
              emissive={table.borderColor}
              emissiveIntensity={isGlow ? 0.5 : 0.12}
            />
          </mesh>
          {/* Peg cap A */}
          <mesh position={[px, pegH, bandZ_A]}>
            <sphereGeometry args={[pegRadius * 1.15, 10, 10]} />
            <meshStandardMaterial color={table.borderColor} roughness={0.15} metalness={0.9} />
          </mesh>

          {/* Peg B (north band) */}
          <mesh position={[px, pegH / 2, bandZ_B]} castShadow>
            <cylinderGeometry args={[pegRadius, pegRadius * 0.8, pegH, 12]} />
            <meshStandardMaterial
              color={table.borderColor}
              roughness={0.2}
              metalness={0.85}
              emissive={table.borderColor}
              emissiveIntensity={isGlow ? 0.5 : 0.12}
            />
          </mesh>
          {/* Peg cap B */}
          <mesh position={[px, pegH, bandZ_B]}>
            <sphereGeometry args={[pegRadius * 1.15, 10, 10]} />
            <meshStandardMaterial color={table.borderColor} roughness={0.15} metalness={0.9} />
          </mesh>
        </React.Fragment>
      ))}

      {/* ══════════════════════════════════════════════════════════
          5. SIDE RAILS (Left & Right — thick wooden walls)
         ══════════════════════════════════════════════════════════ */}
      <RigidBody type="fixed" colliders={false} friction={table.friction * 0.6} restitution={table.restitution * 1.05}>
        {/* Left rail */}
        <mesh position={[-halfW - railThick / 2, railH / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[railThick, railH, length + railThick * 2]} />
          <meshStandardMaterial
            color={table.boardColor}
            roughness={0.38}
            metalness={isCyber ? 0.7 : isNeon ? 0.45 : 0.1}
            emissive={railEmissive}
            emissiveIntensity={railEmissiveInt}
          />
        </mesh>
        <CuboidCollider
          args={[railThick / 2, railH / 2, (length + railThick * 2) / 2]}
          position={[-halfW - railThick / 2, railH / 2, 0]}
        />
      </RigidBody>
      <RigidBody type="fixed" colliders={false} friction={table.friction * 0.6} restitution={table.restitution * 1.05}>
        {/* Right rail */}
        <mesh position={[halfW + railThick / 2, railH / 2, 0]} castShadow receiveShadow>
          <boxGeometry args={[railThick, railH, length + railThick * 2]} />
          <meshStandardMaterial
            color={table.boardColor}
            roughness={0.38}
            metalness={isCyber ? 0.7 : isNeon ? 0.45 : 0.1}
            emissive={railEmissive}
            emissiveIntensity={railEmissiveInt}
          />
        </mesh>
        <CuboidCollider
          args={[railThick / 2, railH / 2, (length + railThick * 2) / 2]}
          position={[halfW + railThick / 2, railH / 2, 0]}
        />
      </RigidBody>

      {/* ══════════════════════════════════════════════════════════
          6. END BUMPERS (North & South solid walls)
         ══════════════════════════════════════════════════════════ */}
      <RigidBody type="fixed" colliders={false} friction={table.friction * 0.7} restitution={table.restitution * 0.85}>
        <mesh position={[0, railH / 2, halfL + railThick / 2]} castShadow receiveShadow>
          <boxGeometry args={[width + railThick * 2, railH, railThick]} />
          <meshStandardMaterial
            color={table.boardColor}
            roughness={0.38}
            metalness={isCyber ? 0.7 : 0.1}
          />
        </mesh>
        <CuboidCollider
          args={[(width + railThick * 2) / 2, railH / 2, railThick / 2]}
          position={[0, railH / 2, halfL + railThick / 2]}
        />
      </RigidBody>
      <RigidBody type="fixed" colliders={false} friction={table.friction * 0.7} restitution={table.restitution * 0.85}>
        <mesh position={[0, railH / 2, -halfL - railThick / 2]} castShadow receiveShadow>
          <boxGeometry args={[width + railThick * 2, railH, railThick]} />
          <meshStandardMaterial
            color={table.boardColor}
            roughness={0.38}
            metalness={isCyber ? 0.7 : 0.1}
          />
        </mesh>
        <CuboidCollider
          args={[(width + railThick * 2) / 2, railH / 2, railThick / 2]}
          position={[0, railH / 2, -halfL - railThick / 2]}
        />
      </RigidBody>

      {/* ══════════════════════════════════════════════════════════
          7. CENTER DIVIDER — Left segment (solid, no gate here)
         ══════════════════════════════════════════════════════════ */}
      <RigidBody type="fixed" friction={0.04} restitution={table.restitution * 0.95}>
        <mesh
          position={[-(gateWidth / 2 + divSegW / 2), dividerH / 2, 0]}
          castShadow receiveShadow
        >
          <boxGeometry args={[divSegW, dividerH, dividerT]} />
          <meshStandardMaterial
            color={table.boardColor}
            roughness={0.32}
            metalness={isCyber ? 0.75 : isNeon ? 0.5 : 0.15}
            emissive={isGlow ? table.borderColor : '#000000'}
            emissiveIntensity={isGlow ? 0.2 : 0}
          />
        </mesh>
        <CuboidCollider
          args={[divSegW / 2, dividerH / 2, dividerT / 2]}
          position={[-(gateWidth / 2 + divSegW / 2), dividerH / 2, 0]}
        />
      </RigidBody>

      {/* CENTER DIVIDER — Right segment */}
      <RigidBody type="fixed" friction={0.04} restitution={table.restitution * 0.95}>
        <mesh
          position={[(gateWidth / 2 + divSegW / 2), dividerH / 2, 0]}
          castShadow receiveShadow
        >
          <boxGeometry args={[divSegW, dividerH, dividerT]} />
          <meshStandardMaterial
            color={table.boardColor}
            roughness={0.32}
            metalness={isCyber ? 0.75 : isNeon ? 0.5 : 0.15}
            emissive={isGlow ? table.borderColor : '#000000'}
            emissiveIntensity={isGlow ? 0.2 : 0}
          />
        </mesh>
        <CuboidCollider
          args={[divSegW / 2, dividerH / 2, dividerT / 2]}
          position={[(gateWidth / 2 + divSegW / 2), dividerH / 2, 0]}
        />
      </RigidBody>

      {/* ══════════════════════════════════════════════════════════
          8. GATE GLOW MARKER + GATE PIN BALLS
         ══════════════════════════════════════════════════════════ */}
      {/* Glowing gate fill */}
      <mesh position={[0, dividerH * 0.45, 0]}>
        <boxGeometry args={[gateWidth, dividerH * 0.55, dividerT * 0.45]} />
        <meshStandardMaterial
          color={table.goalGlowColor}
          emissive={table.goalGlowColor}
          emissiveIntensity={1.4}
          transparent
          opacity={0.45}
        />
      </mesh>
      {/* Gate pin balls — mark the entry points */}
      {([-gateWidth / 2, gateWidth / 2] as number[]).map((px, i) => (
        <mesh key={`gatepin_${i}`} position={[px, dividerH + 0.06, 0]} castShadow>
          <sphereGeometry args={[0.12, 10, 10]} />
          <meshStandardMaterial
            color={table.goalGlowColor}
            emissive={table.goalGlowColor}
            emissiveIntensity={2.0}
            roughness={0.1}
            metalness={0.6}
          />
        </mesh>
      ))}
      {/* Gate glow point light */}
      <pointLight
        position={[0, 1.2, 0]}
        color={table.goalGlowColor}
        intensity={isGlow ? 4.0 : 2.2}
        distance={6}
      />

      {/* ══════════════════════════════════════════════════════════
          9. OUTER TABLE BASE / FRAME (decorative pedestal)
         ══════════════════════════════════════════════════════════ */}
      <mesh position={[0, -0.75, 0]} receiveShadow>
        <boxGeometry args={[width + railThick * 2.8, 1.35, length + railThick * 2.8]} />
        <meshStandardMaterial
          color={table.boardColor}
          roughness={0.42}
          metalness={isCyber ? 0.55 : 0.15}
        />
      </mesh>

      {/* ══════════════════════════════════════════════════════════
          10. RAIL TOP EDGE STRIPS (thin bright highlight on rail tops)
         ══════════════════════════════════════════════════════════ */}
      {([-halfW - railThick / 2, halfW + railThick / 2] as number[]).map((px, i) => (
        <mesh key={`rail_top_${i}`} position={[px, railH + 0.015, 0]}>
          <boxGeometry args={[railThick * 0.7, 0.03, length + railThick * 1.6]} />
          <meshStandardMaterial
            color={table.borderColor}
            roughness={0.15}
            metalness={0.9}
            emissive={table.borderColor}
            emissiveIntensity={isGlow ? 0.35 : 0.08}
          />
        </mesh>
      ))}
    </group>
  );
};

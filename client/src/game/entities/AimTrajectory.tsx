import React from 'react';
import * as THREE from 'three';

interface AimTrajectoryProps {
  isAiming: boolean;
  dirX: number;
  dirZ: number;
  power: number; // 0 to 1
  strikerPos: [number, number, number];
  color: string;
}

export const AimTrajectory: React.FC<AimTrajectoryProps> = ({
  isAiming,
  dirX,
  dirZ,
  power,
  strikerPos,
  color
}) => {
  if (!isAiming || power <= 0.05) return null;

  const length = 1.5 + power * 4.5;
  const numDots = Math.floor(8 + power * 14);
  const dots: [number, number, number][] = [];

  for (let i = 1; i <= numDots; i++) {
    const frac = i / numDots;
    const x = strikerPos[0] + dirX * length * frac;
    const z = strikerPos[2] + dirZ * length * frac;
    dots.push([x, 0.08, z]);
  }

  // Color tint from green (low power) to amber to vibrant red (max power)
  const powerColor = power < 0.5 ? '#4ade80' : power < 0.8 ? '#facc15' : '#ef4444';

  return (
    <group>
      {/* Trajectory dotted path */}
      {dots.map((pos, idx) => (
        <mesh key={idx} position={pos} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.06 + (idx / numDots) * 0.04, 16]} />
          <meshBasicMaterial
            color={powerColor}
            transparent
            opacity={0.4 + (idx / numDots) * 0.5}
          />
        </mesh>
      ))}

      {/* Target Aim Ring at projected end */}
      <mesh
        position={[strikerPos[0] + dirX * length, 0.09, strikerPos[2] + dirZ * length]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.22, 0.28, 24]} />
        <meshBasicMaterial color={powerColor} transparent opacity={0.8} />
      </mesh>

      {/* Origin Ring around striker */}
      <mesh position={[strikerPos[0], 0.05, strikerPos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.62, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.6} />
      </mesh>
    </group>
  );
};


import React, { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RapierRigidBody, RigidBody, CylinderCollider } from '@react-three/rapier';
import { COLOR_PALETTE } from '../../types/shared';
import { PieceData, GameRulesEngine } from '../core/GameRules';
import { soundEffects } from '../../audio/SoundEffects';

interface PieceProps {
  piece: PieceData;
  isStriker?: boolean;
  onPiecePocketed?: (pieceId: string, intoOpponentGoal: boolean) => void;
  onRegisterBody?: (id: string, body: RapierRigidBody) => void;
}

export const Piece: React.FC<PieceProps> = ({
  piece,
  isStriker = false,
  onPiecePocketed,
  onRegisterBody
}) => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const colorDef = COLOR_PALETTE[piece.color] || COLOR_PALETTE.blue;
  const hasPocketedRef = useRef(false);
  const lastCollisionSoundRef = useRef(0);

  useEffect(() => {
    if (rigidBodyRef.current && onRegisterBody) {
      onRegisterBody(piece.id, rigidBodyRef.current);
    }
  }, [piece.id, onRegisterBody]);

  // Sync state if piece gets pocketed
  useEffect(() => {
    if (piece.isPocketed && rigidBodyRef.current && !hasPocketedRef.current) {
      hasPocketedRef.current = true;
      try {
        rigidBodyRef.current.setTranslation({ x: 0, y: -50, z: 0 }, true);
        rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      } catch {}
    }
  }, [piece.isPocketed]);

  // Check pocket entry in useFrame tick safely
  useFrame(() => {
    if (!rigidBodyRef.current || piece.isPocketed || hasPocketedRef.current) return;

    try {
      const pos = rigidBodyRef.current.translation();
      const pocketResult = GameRulesEngine.checkPocketEntry(piece, pos.x, pos.z);

      if (pocketResult.pocketed) {
        hasPocketedRef.current = true;
        // Move off board immediately to prevent multiple triggers
        rigidBodyRef.current.setTranslation({ x: 0, y: -50, z: 0 }, true);
        rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);

        soundEffects.playGoal();
        if (onPiecePocketed) {
          onPiecePocketed(piece.id, pocketResult.intoOpponentGoal);
        }
      }
    } catch {}
  });

  // Collision callback: DO NOT inspect Rapier body synchronously inside collision event
  const handleCollision = () => {
    if (piece.isPocketed || hasPocketedRef.current) return;
    const now = performance.now();
    // Throttle collision clack sound to avoid audio clipping
    if (now - lastCollisionSoundRef.current > 50) {
      lastCollisionSoundRef.current = now;
      soundEffects.playCollision(0.8);
    }
  };

  const radius = isStriker ? 0.46 : piece.radius;
  const height = isStriker ? 0.22 : 0.18;

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders={false}
      position={[piece.x, height / 2 + 0.01, piece.z]}
      type="dynamic"
      enabledRotations={[false, true, false]}
      linearDamping={1.1}
      angularDamping={1.4}
      restitution={0.88}
      friction={0.12}
      onCollisionEnter={handleCollision}
    >
      <CylinderCollider args={[height / 2, radius]} />

      {/* 3D Puck Mesh: hide if pocketed without unmounting the RigidBody */}
      <group visible={!piece.isPocketed && !hasPocketedRef.current}>
        {/* Main disk body */}
        <mesh castShadow receiveShadow>
          <cylinderGeometry args={[radius, radius, height, 32]} />
          <meshPhysicalMaterial
            color={colorDef.hex}
            roughness={0.15}
            metalness={0.3}
            clearcoat={0.8}
            clearcoatRoughness={0.1}
            reflectivity={0.9}
            emissive={colorDef.emissiveHex}
            emissiveIntensity={isStriker ? 0.35 : 0.15}
          />
        </mesh>

        {/* Top inlay / decorative ring */}
        <mesh position={[0, height / 2 + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 0.45, radius * 0.75, 24]} />
          <meshBasicMaterial color={colorDef.lightHex} />
        </mesh>

        {/* Center gem */}
        <mesh position={[0, height / 2 + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[radius * 0.25, 24]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      </group>
    </RigidBody>
  );
};

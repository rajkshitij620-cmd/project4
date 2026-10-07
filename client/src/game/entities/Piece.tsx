import React, { useRef, useEffect, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { RapierRigidBody, RigidBody, CylinderCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { COLOR_PALETTE } from '../../types/shared';
import { PieceData, GameRulesEngine } from '../core/GameRules';
import { soundEffects } from '../../audio/SoundEffects';

interface PieceProps {
  piece: PieceData;
  isPlayerOwned?: boolean;         // true = player (playerA) can drag this puck
  canInteract?: boolean;            // false during simulation/opponent turn
  pendingImpulse?: { dirX: number; dirZ: number; power: number } | null; // AI shot to apply
  onPiecePocketed?: (pieceId: string, intoOpponentGoal: boolean) => void;
  onRegisterBody?: (id: string, body: RapierRigidBody) => void;
  onShoot?: (dirX: number, dirZ: number, power: number) => void;
  onAimChange?: (isAiming: boolean, dirX: number, dirZ: number, power: number, pos: [number, number, number]) => void;
}

const MAX_DRAG = 2.8;    // world units max pull-back distance
const MAX_IMPULSE = 18;  // physics force scalar

export const Piece: React.FC<PieceProps> = ({
  piece,
  isPlayerOwned = false,
  canInteract = false,
  pendingImpulse,
  onPiecePocketed,
  onRegisterBody,
  onShoot,
  onAimChange,
}) => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const colorDef = COLOR_PALETTE[piece.color] || COLOR_PALETTE.blue;
  const hasPocketedRef = useRef(false);
  const lastCollisionSoundRef = useRef(0);
  const isDraggingRef = useRef(false);
  const dragOriginRef = useRef(new THREE.Vector3());
  const currentDragRef = useRef(new THREE.Vector3());
  const [isBeingDragged, setIsBeingDragged] = useState(false);

  const { camera, raycaster, gl } = useThree();
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

  // Register this body in the parent map
  useEffect(() => {
    if (rigidBodyRef.current && onRegisterBody) {
      onRegisterBody(piece.id, rigidBodyRef.current);
    }
  }, [piece.id, onRegisterBody]);

  // Apply AI impulse directly to this puck when pendingImpulse arrives
  useEffect(() => {
    if (pendingImpulse && rigidBodyRef.current && !piece.isPocketed && !hasPocketedRef.current) {
      const { dirX, dirZ, power } = pendingImpulse;
      const force = power * MAX_IMPULSE;
      try {
        rigidBodyRef.current.applyImpulse({ x: dirX * force, y: 0, z: dirZ * force }, true);
        soundEffects.playShot(power);
      } catch {}
    }
  }, [pendingImpulse, piece.isPocketed]);

  // Sync pocketed state — move off board
  useEffect(() => {
    if (piece.isPocketed && rigidBodyRef.current && !hasPocketedRef.current) {
      hasPocketedRef.current = true;
      try {
        rigidBodyRef.current.setTranslation({ x: 0, y: -50, z: 0 }, true);
        rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      } catch {}
    }
  }, [piece.isPocketed]);

  // Check crossing the center gate (pock = crossing detection)
  useFrame(() => {
    if (!rigidBodyRef.current || piece.isPocketed || hasPocketedRef.current) return;
    try {
      const pos = rigidBodyRef.current.translation();
      const pocketResult = GameRulesEngine.checkPocketEntry(piece, pos.x, pos.z);
      if (pocketResult.pocketed) {
        hasPocketedRef.current = true;
        rigidBodyRef.current.setTranslation({ x: 0, y: -50, z: 0 }, true);
        rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        soundEffects.playGoal();
        if (onPiecePocketed) {
          onPiecePocketed(piece.id, pocketResult.intoOpponentGoal);
        }
      }
    } catch {}
  });

  // Collision clack
  const handleCollision = () => {
    if (piece.isPocketed || hasPocketedRef.current) return;
    const now = performance.now();
    if (now - lastCollisionSoundRef.current > 50) {
      lastCollisionSoundRef.current = now;
      soundEffects.playCollision(0.8);
    }
  };

  // ── Drag/Sling Interaction (player's own pucks only) ──────────────────────
  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    if (!isPlayerOwned || !canInteract || !rigidBodyRef.current || piece.isPocketed) return;

    isDraggingRef.current = true;
    setIsBeingDragged(true);
    // Freeze puck in place while aiming
    try {
      rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
      rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
    } catch {}
    const pos = rigidBodyRef.current.translation();
    dragOriginRef.current.set(pos.x, pos.y, pos.z);
    currentDragRef.current.copy(dragOriginRef.current);
    soundEffects.playClick();
  };

  useEffect(() => {
    if (!isPlayerOwned) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current || !rigidBodyRef.current) return;

      const rect = gl.domElement.getBoundingClientRect();
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(new THREE.Vector2(ndcX, ndcY), camera);

      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersection);
      currentDragRef.current.copy(intersection);

      // Compute pull vector (from drag point back to puck origin)
      const origin = dragOriginRef.current;
      const dx = origin.x - intersection.x;
      const dz = origin.z - intersection.z;
      const dist = Math.hypot(dx, dz);
      const clampedDist = Math.min(dist, MAX_DRAG);
      const power = clampedDist / MAX_DRAG;

      const dirX = dist > 0.05 ? dx / dist : 0;
      const dirZ = dist > 0.05 ? dz / dist : 0;

      if (onAimChange) {
        onAimChange(true, dirX, dirZ, power, [origin.x, origin.y, origin.z]);
      }
    };

    const handlePointerUp = () => {
      if (!isDraggingRef.current || !rigidBodyRef.current) return;
      isDraggingRef.current = false;
      setIsBeingDragged(false);

      const origin = dragOriginRef.current;
      const drag = currentDragRef.current;
      const dx = origin.x - drag.x;
      const dz = origin.z - drag.z;
      const dist = Math.hypot(dx, dz);
      const power = Math.min(dist / MAX_DRAG, 1.0);

      if (onAimChange) onAimChange(false, 0, 0, 0, [origin.x, origin.y, origin.z]);

      if (power > 0.07 && dist > 0.05) {
        const dirX = dx / dist;
        const dirZ = dz / dist;
        const force = power * MAX_IMPULSE;
        try {
          rigidBodyRef.current.applyImpulse({ x: dirX * force, y: 0, z: dirZ * force }, true);
          soundEffects.playShot(power);
          if (onShoot) onShoot(dirX, dirZ, power);
        } catch {}
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [isPlayerOwned, gl, camera, raycaster, onShoot, onAimChange]);

  const radius = piece.radius;
  const height = 0.22;   // taller puck — more visible

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

      {/* 3D Puck Mesh */}
      <group visible={!piece.isPocketed && !hasPocketedRef.current}>

        {/* Main Disk Body */}
        <mesh
          castShadow
          receiveShadow
          onPointerDown={isPlayerOwned && canInteract ? handlePointerDown : undefined}
        >
          <cylinderGeometry args={[radius, radius * 1.05, height, 36]} />
          <meshPhysicalMaterial
            color={colorDef.hex}
            roughness={0.08}
            metalness={0.45}
            clearcoat={1.0}
            clearcoatRoughness={0.05}
            reflectivity={1.0}
            emissive={colorDef.emissiveHex}
            emissiveIntensity={isBeingDragged ? 0.9 : 0.45}
          />
        </mesh>

        {/* Top face bright disc — glowing solid color */}
        <mesh position={[0, height / 2 + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[radius * 0.92, 36]} />
          <meshStandardMaterial
            color={colorDef.hex}
            emissive={colorDef.hex}
            emissiveIntensity={0.6}
            roughness={0.05}
            metalness={0.6}
          />
        </mesh>

        {/* Top decorative ring */}
        <mesh position={[0, height / 2 + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 0.42, radius * 0.72, 28]} />
          <meshBasicMaterial color={colorDef.lightHex} />
        </mesh>

        {/* Center white gem */}
        <mesh position={[0, height / 2 + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[radius * 0.22, 24]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* Owner indicator — small point light for glow effect */}
        <pointLight
          position={[0, 0.3, 0]}
          color={colorDef.glowHex}
          intensity={isBeingDragged ? 1.8 : 0.8}
          distance={1.8}
        />

        {/* Drag/Sling indicator glow ring (player-owned pucks only) */}
        {isPlayerOwned && canInteract && (
          <mesh position={[0, 0.008, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius * 1.15, radius * 1.42, 36]} />
            <meshBasicMaterial
              color={isBeingDragged ? '#ffffff' : colorDef.glowHex}
              transparent
              opacity={isBeingDragged ? 0.95 : 0.55}
            />
          </mesh>
        )}
      </group>
    </RigidBody>
  );
};

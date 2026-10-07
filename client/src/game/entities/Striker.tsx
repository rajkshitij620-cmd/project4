import React, { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { RapierRigidBody, RigidBody, CylinderCollider } from '@react-three/rapier';
import * as THREE from 'three';
import { PlayerColor, COLOR_PALETTE } from '../../types/shared';
import { soundEffects } from '../../audio/SoundEffects';

interface StrikerProps {
  id: string;
  color: PlayerColor;
  isMyTurn: boolean;
  canShoot: boolean;
  baselineZ: number; // +4.2 for Player A, -4.2 for Player B
  pendingExternalShot?: { dirX: number; dirZ: number; power: number } | null;
  onClearExternalShot?: () => void;
  onShoot: (dirX: number, dirZ: number, power: number) => void;
  onRegisterBody?: (id: string, body: RapierRigidBody) => void;
  onAimChange?: (isAiming: boolean, dirX: number, dirZ: number, power: number, strikerPos: [number, number, number]) => void;
}

export const Striker: React.FC<StrikerProps> = ({
  id,
  color,
  isMyTurn,
  canShoot,
  baselineZ,
  pendingExternalShot,
  onClearExternalShot,
  onShoot,
  onRegisterBody,
  onAimChange
}) => {
  const rigidBodyRef = useRef<RapierRigidBody>(null);
  const colorDef = COLOR_PALETTE[color] || COLOR_PALETTE.blue;
  const { camera, raycaster, gl } = useThree();

  const isDraggingRef = useRef(false);
  const currentDragWorldRef = useRef<THREE.Vector3>(new THREE.Vector3());
  const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0); // Y=0 plane

  const radius = 0.50;
  const height = 0.24;

  useEffect(() => {
    if (rigidBodyRef.current && onRegisterBody) {
      onRegisterBody(id, rigidBodyRef.current);
    }
  }, [id, onRegisterBody]);

  // Reset striker to baseline smoothly when turn changes
  useEffect(() => {
    if (rigidBodyRef.current) {
      try {
        rigidBodyRef.current.setTranslation({ x: 0, y: height / 2 + 0.02, z: baselineZ }, true);
        rigidBodyRef.current.setLinvel({ x: 0, y: 0, z: 0 }, true);
        rigidBodyRef.current.setAngvel({ x: 0, y: 0, z: 0 }, true);
      } catch {}
    }
  }, [baselineZ, canShoot]);

  // Handle external shot (Bot AI or Online opponent)
  useEffect(() => {
    if (pendingExternalShot && rigidBodyRef.current) {
      const { dirX, dirZ, power } = pendingExternalShot;
      const maxImpulse = 16.0;
      const impulseForce = power * maxImpulse;

      try {
        rigidBodyRef.current.applyImpulse({ x: dirX * impulseForce, y: 0, z: dirZ * impulseForce }, true);
        soundEffects.playShot(power);
      } catch {}

      if (onClearExternalShot) {
        onClearExternalShot();
      }
    }
  }, [pendingExternalShot, onClearExternalShot]);

  // Pointer Down (Mouse or Touch)
  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    if (!isMyTurn || !canShoot || !rigidBodyRef.current) return;

    isDraggingRef.current = true;
    currentDragWorldRef.current.copy(e.point as THREE.Vector3);
    soundEffects.playClick();
  };

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!isDraggingRef.current || !rigidBodyRef.current) return;

      const rect = gl.domElement.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(new THREE.Vector2(x, y), camera);
      const intersection = new THREE.Vector3();
      raycaster.ray.intersectPlane(plane, intersection);

      currentDragWorldRef.current.copy(intersection);

      const strikerPos = rigidBodyRef.current.translation();
      const dx = strikerPos.x - intersection.x;
      const dz = strikerPos.z - intersection.z;
      const dist = Math.hypot(dx, dz);
      const maxDragDist = 3.0;
      const power = Math.min(dist / maxDragDist, 1.0);

      const dirX = dist > 0.05 ? dx / dist : 0;
      const dirZ = dist > 0.05 ? dz / dist : 0;

      if (onAimChange) {
        onAimChange(true, dirX, dirZ, power, [strikerPos.x, strikerPos.y, strikerPos.z]);
      }
    };

    const handlePointerUp = () => {
      if (!isDraggingRef.current || !rigidBodyRef.current) return;
      isDraggingRef.current = false;

      const strikerPos = rigidBodyRef.current.translation();
      const dx = strikerPos.x - currentDragWorldRef.current.x;
      const dz = strikerPos.z - currentDragWorldRef.current.z;
      const dist = Math.hypot(dx, dz);
      const maxDragDist = 3.0;
      const power = Math.min(dist / maxDragDist, 1.0);

      if (onAimChange) {
        onAimChange(false, 0, 0, 0, [strikerPos.x, strikerPos.y, strikerPos.z]);
      }

      if (power > 0.08) {
        const dirX = dx / dist;
        const dirZ = dz / dist;
        const maxImpulse = 16.0;
        const impulseForce = power * maxImpulse;

        try {
          rigidBodyRef.current.applyImpulse({ x: dirX * impulseForce, y: 0, z: dirZ * impulseForce }, true);
          soundEffects.playShot(power);
          onShoot(dirX, dirZ, power);
        } catch {}
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [gl, camera, raycaster, isMyTurn, canShoot, onShoot, onAimChange]);

  return (
    <RigidBody
      ref={rigidBodyRef}
      colliders={false}
      position={[0, height / 2 + 0.02, baselineZ]}
      type="dynamic"
      enabledRotations={[false, true, false]}
      linearDamping={1.1}
      angularDamping={1.4}
      restitution={0.88}
      friction={0.10}
    >
      <CylinderCollider args={[height / 2, radius]} />

      {/* Striker Mesh */}
      <group>
        {/* Main Body */}
        <mesh onPointerDown={handlePointerDown} castShadow receiveShadow>
          <cylinderGeometry args={[radius, radius, height, 36]} />
          <meshPhysicalMaterial
            color={colorDef.hex}
            roughness={0.1}
            metalness={0.4}
            clearcoat={1.0}
            clearcoatRoughness={0.05}
            emissive={colorDef.emissiveHex}
            emissiveIntensity={isMyTurn && canShoot ? 0.6 : 0.2}
          />
        </mesh>

        {/* Outer Ring Accent */}
        <mesh position={[0, height / 2 + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[radius * 0.72, radius * 0.92, 36]} />
          <meshBasicMaterial color={colorDef.lightHex} />
        </mesh>

        {/* Center Grip Indent */}
        <mesh position={[0, height / 2 + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[radius * 0.42, 32]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>

        {/* Turn Glow Indicator */}
        {isMyTurn && canShoot && (
          <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[radius * 1.1, radius * 1.28, 36]} />
            <meshBasicMaterial color={colorDef.glowHex} transparent opacity={0.65} />
          </mesh>
        )}
      </group>
    </RigidBody>
  );
};

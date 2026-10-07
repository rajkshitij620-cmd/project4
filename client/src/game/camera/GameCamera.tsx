import React, { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

interface GameCameraProps {
  currentTurn: 'playerA' | 'playerB';
  isSimulating: boolean;
}

export const GameCamera: React.FC<GameCameraProps> = ({ currentTurn, isSimulating }) => {
  const { size } = useThree();
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);

  // Target camera position
  const targetPos = useRef(new THREE.Vector3(0, 16, 10));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    if (!cameraRef.current) return;

    const aspect = size.width / size.height;

    // Responsive camera framing
    if (aspect < 0.7) {
      // Very tall portrait phone (e.g., iPhone 15, Samsung Galaxy)
      targetPos.current.set(0, 19.5, 9.5);
      targetLook.current.set(0, 0, 0.4);
    } else if (aspect < 1.0) {
      // Standard tablet portrait
      targetPos.current.set(0, 17.5, 9.0);
      targetLook.current.set(0, 0, 0.2);
    } else if (aspect < 1.6) {
      // Laptop / tablet landscape
      targetPos.current.set(0, 15.0, 8.5);
      targetLook.current.set(0, 0, 0);
    } else {
      // Ultra-wide desktop
      targetPos.current.set(0, 14.5, 8.0);
      targetLook.current.set(0, 0, 0);
    }

    // Subtle gentle camera breathing/animation
    cameraRef.current.position.lerp(targetPos.current, 0.05);
    cameraRef.current.lookAt(targetLook.current);
  });

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      fov={48}
      position={[0, 16, 10]}
      near={0.1}
      far={100}
    />
  );
};


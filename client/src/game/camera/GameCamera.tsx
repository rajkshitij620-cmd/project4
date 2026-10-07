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

    // Phone-only camera framing
    if (aspect < 0.6) {
      // Very tall portrait phone (iPhone 15 Pro Max, Galaxy Ultra, etc.)
      targetPos.current.set(0, 21, 10.5);
      targetLook.current.set(0, 0, 0.6);
    } else if (aspect < 0.75) {
      // Standard Android portrait (most common)
      targetPos.current.set(0, 19.5, 10.0);
      targetLook.current.set(0, 0, 0.4);
    } else if (aspect < 1.0) {
      // Wider phone portrait / small tablet portrait
      targetPos.current.set(0, 18.0, 9.5);
      targetLook.current.set(0, 0, 0.2);
    } else {
      // Phone landscape or tablet landscape
      targetPos.current.set(0, 16.0, 9.0);
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


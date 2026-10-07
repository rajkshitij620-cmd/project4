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

  const targetPos = useRef(new THREE.Vector3(0, 12, 8));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));

  useFrame(() => {
    if (!cameraRef.current) return;

    const aspect = size.width / size.height;

    // Phone portrait (most common use case) — bring camera close so board fills screen
    if (aspect < 0.55) {
      // Very tall portrait (iPhone Pro Max, Galaxy Ultra)
      targetPos.current.set(0, 10.8, 6.2);
      targetLook.current.set(0, 0, 0.2);
    } else if (aspect < 0.70) {
      // Standard Android portrait (most phones)
      targetPos.current.set(0, 10.2, 5.8);
      targetLook.current.set(0, 0, 0.1);
    } else if (aspect < 0.85) {
      // Wider phone portrait / compact tablet
      targetPos.current.set(0, 9.6, 5.4);
      targetLook.current.set(0, 0, 0.0);
    } else if (aspect < 1.0) {
      // Near-square tablet portrait
      targetPos.current.set(0, 9.2, 5.0);
      targetLook.current.set(0, 0, 0);
    } else {
      // Landscape
      targetPos.current.set(0, 11.0, 6.5);
      targetLook.current.set(0, 0, 0);
    }

    cameraRef.current.position.lerp(targetPos.current, 0.08);
    cameraRef.current.lookAt(targetLook.current);
  });

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      fov={58}
      position={[0, 10.2, 5.8]}
      near={0.1}
      far={120}
    />
  );
};

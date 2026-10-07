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

    // Board length is 12.8 + rails ≈ 13.9. Board width is 7.2 + rails ≈ 8.3.
    // Calculate required camera height so both ends (North & South bumpers)
    // and both sides (Left & Right rails) fit comfortably with UI padding.
    const vFovRad = (46 * Math.PI) / 180;
    const tanHalfFov = Math.tan(vFovRad / 2);

    const marginL = 17.5; // vertical span clearance
    const marginW = 9.8;  // horizontal span clearance

    const yForLength = marginL / (2 * tanHalfFov);
    const yForWidth  = marginW / (2 * tanHalfFov * aspect);
    const targetY    = Math.max(yForLength, yForWidth);

    // Subtle perspective tilt (Z: 1.2) so 3D depth looks realistic without hiding either end
    targetPos.current.set(0, targetY, 1.2);
    targetLook.current.set(0, 0, 0);

    cameraRef.current.position.lerp(targetPos.current, 0.12);
    cameraRef.current.lookAt(targetLook.current);
  });

  return (
    <PerspectiveCamera
      ref={cameraRef}
      makeDefault
      fov={46}
      position={[0, 22.0, 1.2]}
      near={0.1}
      far={150}
    />
  );
};

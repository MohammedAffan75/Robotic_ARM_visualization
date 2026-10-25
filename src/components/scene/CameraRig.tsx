import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { useUIStore } from '../../store/uiStore';
import { useArmStore } from '../../store/armStore';
import { getArmDefinition } from '../../core/arms';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';

export const CameraRig: React.FC = () => {
  const { camera } = useThree();
  const controlsRef = useRef<OrbitControlsImpl>(null);

  const armType = useArmStore((s) => s.armType);
  const parameters = useArmStore((s) => s.parameters);

  const cameraPreset = useUIStore((s) => s.cameraPreset);
  const cameraTrigger = useUIStore((s) => s.cameraTrigger);

  // Default initial position and lookAt (Z-up)
  const targetCamPos = useRef(new THREE.Vector3(4.5, -4.5, 3.2));
  const targetLookAt = useRef(new THREE.Vector3(0, 0, 0.8));

  // Initialize camera Z-up once
  useEffect(() => {
    camera.up.set(0, 0, 1);
  }, [camera]);

  // Compute arm bounding sphere radius for auto-fit on armType or parameter change
  useEffect(() => {
    const armDef = getArmDefinition(armType);
    const specs = armDef.specs(parameters);
    const baseHeight = parameters.baseHeight ?? 0.4;
    const radius = Math.max(0.6, specs.maxReach + baseHeight * 0.5);
    const dist = radius * 2.2;
    const centerZ = Math.min(1.2, Math.max(0.35, baseHeight + specs.maxReach * 0.3));

    targetLookAt.current.set(0, 0, centerZ);

    switch (cameraPreset) {
      case 'front':
        targetCamPos.current.set(0, -dist * 1.1, centerZ);
        break;
      case 'side':
        targetCamPos.current.set(dist * 1.1, 0, centerZ);
        break;
      case 'top':
        targetCamPos.current.set(0.001, 0.001, centerZ + dist * 1.15);
        break;
      case 'iso':
      default: {
        // Isometric 3/4 view in Z-up
        const normFactor = dist / Math.sqrt(1 + 1 + 0.5);
        targetCamPos.current.set(normFactor, -normFactor, centerZ + normFactor * 0.7);
        break;
      }
      case 'followEE':
        // Cam pos stays at offset relative to lookAt
        break;
    }
  }, [armType, parameters, cameraPreset, cameraTrigger]);

  useFrame((_, delta) => {
    const ee = useArmStore.getState().fkResult.endEffector;
    if (cameraPreset === 'followEE') {
      targetLookAt.current.lerp(new THREE.Vector3(ee[0], ee[1], ee[2]), delta * 4);
    }

    const t = Math.min(1.0, delta * 4.5);
    camera.position.lerp(targetCamPos.current, t);

    if (controlsRef.current) {
      controlsRef.current.target.lerp(targetLookAt.current, t);
      controlsRef.current.update();
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={0.5}
      maxDistance={12.0}
    />
  );
};

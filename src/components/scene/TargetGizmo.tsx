import React, { useRef } from 'react';
import * as THREE from 'three';
import { TransformControls } from '@react-three/drei';
import { Vec3 } from '../../core/math/matrix';
import { useArmStore } from '../../store/armStore';

interface TargetGizmoProps {
  position: Vec3;
  onChange: (newPos: Vec3) => void;
  status: 'ok' | 'warning' | 'error';
  enabled?: boolean;
}

export const TargetGizmo: React.FC<TargetGizmoProps> = ({
  position,
  onChange,
  status,
  enabled = true
}) => {
  const meshRef = useRef<THREE.Group>(null);
  const targetPos = useArmStore((s) => s.target);

  const statusColor =
    status === 'error' ? '#ef4444' : status === 'warning' ? '#f59e0b' : '#10b981';

  return (
    <>
      {enabled && (
        <TransformControls
          position={targetPos}
          mode="translate"
          size={0.65}
          onObjectChange={(e) => {
            const controls = e?.target as unknown as { object?: THREE.Object3D };
            if (controls?.object) {
              const obj = controls.object;
              onChange([obj.position.x, obj.position.y, obj.position.z]);
            }
          }}
        >
          <group ref={meshRef}>
            {/* Core Target Sphere */}
            <mesh>
              <sphereGeometry args={[0.028, 16, 16]} />
              <meshStandardMaterial
                color={statusColor}
                emissive={statusColor}
                emissiveIntensity={0.8}
                roughness={0.2}
              />
            </mesh>

            {/* Translucent Target Halo with depthWrite={false} */}
            <mesh>
              <sphereGeometry args={[0.05, 16, 16]} />
              <meshBasicMaterial
                color={statusColor}
                transparent
                opacity={0.25}
                depthWrite={false}
                wireframe
              />
            </mesh>

            {/* Target Crosshair Rings */}
            <mesh>
              <ringGeometry args={[0.045, 0.05, 24]} />
              <meshBasicMaterial
                color={statusColor}
                transparent
                opacity={0.35}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
          </group>
        </TransformControls>
      )}

      {/* Target Floor Projection Disc in XY plane (Z = 0.002) */}
      <mesh position={[position[0], position[1], 0.002]}>
        <ringGeometry args={[0.015, 0.07, 32]} />
        <meshBasicMaterial
          color={statusColor}
          transparent
          opacity={0.3}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
    </>
  );
};

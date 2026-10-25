import React from 'react';
import { Vec3 } from '../../core/math/matrix';

interface FrameAxesProps {
  position?: Vec3;
  rotation?: [number, number, number];
  scale?: number;
  label?: string;
}

export const FrameAxes: React.FC<FrameAxesProps> = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 0.14,
  label: _label
}) => {
  const shaftRadius = scale * 0.045;
  const tipRadius = scale * 0.11;
  const tipHeight = scale * 0.22;
  const shaftLength = scale * 0.78;

  const matProps = {
    transparent: true,
    opacity: 0.35,
    depthWrite: false
  };

  return (
    <group position={position} rotation={rotation}>
      {/* Central sphere */}
      <mesh>
        <sphereGeometry args={[shaftRadius * 1.5, 12, 12]} />
        <meshBasicMaterial color="#ffffff" {...matProps} />
      </mesh>

      {/* X Axis (Red) */}
      <group rotation={[0, 0, -Math.PI / 2]}>
        <mesh position={[0, shaftLength / 2, 0]}>
          <cylinderGeometry args={[shaftRadius, shaftRadius, shaftLength, 8]} />
          <meshBasicMaterial color="#ef4444" {...matProps} />
        </mesh>
        <mesh position={[0, shaftLength + tipHeight / 2, 0]}>
          <coneGeometry args={[tipRadius, tipHeight, 8]} />
          <meshBasicMaterial color="#ef4444" {...matProps} />
        </mesh>
      </group>

      {/* Y Axis (Green) */}
      <group>
        <mesh position={[0, shaftLength / 2, 0]}>
          <cylinderGeometry args={[shaftRadius, shaftRadius, shaftLength, 8]} />
          <meshBasicMaterial color="#22c55e" {...matProps} />
        </mesh>
        <mesh position={[0, shaftLength + tipHeight / 2, 0]}>
          <coneGeometry args={[tipRadius, tipHeight, 8]} />
          <meshBasicMaterial color="#22c55e" {...matProps} />
        </mesh>
      </group>

      {/* Z Axis (Blue) */}
      <group rotation={[Math.PI / 2, 0, 0]}>
        <mesh position={[0, shaftLength / 2, 0]}>
          <cylinderGeometry args={[shaftRadius, shaftRadius, shaftLength, 8]} />
          <meshBasicMaterial color="#3b82f6" {...matProps} />
        </mesh>
        <mesh position={[0, shaftLength + tipHeight / 2, 0]}>
          <coneGeometry args={[tipRadius, tipHeight, 8]} />
          <meshBasicMaterial color="#3b82f6" {...matProps} />
        </mesh>
      </group>
    </group>
  );
};

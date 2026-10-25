import React from 'react';
import { Vec3 } from '../../core/math/matrix';

interface RotaryArrowProps {
  position: Vec3;
  radius?: number;
  angleDeg: number;
  axis?: 'x' | 'y' | 'z';
}

export const RotaryArrow: React.FC<RotaryArrowProps> = ({
  position,
  radius = 0.1,
  angleDeg: _angleDeg,
  axis = 'z'
}) => {
  const rotation: [number, number, number] =
    axis === 'z' ? [0, 0, 0] : axis === 'y' ? [Math.PI / 2, 0, 0] : [0, Math.PI / 2, 0];

  const overlayMat = {
    transparent: true,
    opacity: 0.35,
    depthWrite: false
  };

  return (
    <group position={position} rotation={rotation}>
      {/* Curved torus segment */}
      <mesh rotation={[0, 0, 0]}>
        <torusGeometry args={[radius, 0.007, 8, 24, Math.PI * 0.85]} />
        <meshBasicMaterial color="#38bdf8" {...overlayMat} />
      </mesh>
      {/* Arrowhead cone */}
      <mesh
        position={[
          radius * Math.cos(Math.PI * 0.85),
          radius * Math.sin(Math.PI * 0.85),
          0
        ]}
        rotation={[0, 0, Math.PI * 0.85 + Math.PI / 2]}
      >
        <coneGeometry args={[0.016, 0.038, 8]} />
        <meshBasicMaterial color="#38bdf8" {...overlayMat} />
      </mesh>
    </group>
  );
};

interface LinearArrowProps {
  position: Vec3;
  length?: number;
  axis?: 'x' | 'y' | 'z';
  currentVal: number;
}

export const LinearArrow: React.FC<LinearArrowProps> = ({
  position,
  length = 0.18,
  axis = 'z',
  currentVal: _currentVal
}) => {
  const rotation: [number, number, number] =
    axis === 'z' ? [0, 0, 0] : axis === 'x' ? [0, 0, -Math.PI / 2] : [Math.PI / 2, 0, 0];

  const overlayMat = {
    transparent: true,
    opacity: 0.35,
    depthWrite: false
  };

  return (
    <group position={position} rotation={rotation}>
      {/* Double ended sliding arrow */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.006, 0.006, length, 8]} />
        <meshBasicMaterial color="#f97316" {...overlayMat} />
      </mesh>
      <mesh position={[0, length / 2, 0]}>
        <coneGeometry args={[0.014, 0.032, 8]} />
        <meshBasicMaterial color="#f97316" {...overlayMat} />
      </mesh>
      <mesh position={[0, -length / 2, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.014, 0.032, 8]} />
        <meshBasicMaterial color="#f97316" {...overlayMat} />
      </mesh>
    </group>
  );
};

import React from 'react';
import { Vec3 } from '../../core/math/matrix';

interface AngleArcProps {
  position: Vec3;
  angleDeg: number;
  minDeg: number;
  maxDeg: number;
  radius?: number;
  axis?: 'x' | 'y' | 'z';
}

export const AngleArc: React.FC<AngleArcProps> = ({
  position,
  angleDeg,
  minDeg,
  maxDeg,
  radius = 0.1,
  axis = 'z'
}) => {
  const rotation: [number, number, number] =
    axis === 'z' ? [0, 0, 0] : axis === 'y' ? [Math.PI / 2, 0, 0] : [0, Math.PI / 2, 0];

  const totalRange = (maxDeg - minDeg) * (Math.PI / 180);
  const currentSweep = (angleDeg - minDeg) * (Math.PI / 180);

  const overlayMat = {
    transparent: true,
    opacity: 0.25,
    depthWrite: false
  };

  return (
    <group position={position} rotation={rotation}>
      {/* Background limit range ring (translucent grey) */}
      <mesh rotation={[0, 0, minDeg * (Math.PI / 180)]}>
        <ringGeometry args={[radius - 0.003, radius + 0.003, 32, 1, 0, totalRange]} />
        <meshBasicMaterial color="#94a3b8" {...overlayMat} side={2} />
      </mesh>

      {/* Active swept angle arc */}
      <mesh rotation={[0, 0, minDeg * (Math.PI / 180)]}>
        <ringGeometry args={[radius - 0.004, radius + 0.004, 32, 1, 0, Math.max(0.01, currentSweep)]} />
        <meshBasicMaterial color="#38bdf8" {...overlayMat} opacity={0.35} side={2} />
      </mesh>

      {/* Indicator needle at current position */}
      <mesh rotation={[0, 0, angleDeg * (Math.PI / 180)]} position={[0, 0, 0.001]}>
        <planeGeometry args={[radius * 1.15, 0.004]} />
        <meshBasicMaterial color="#f59e0b" {...overlayMat} opacity={0.35} side={2} />
      </mesh>
    </group>
  );
};

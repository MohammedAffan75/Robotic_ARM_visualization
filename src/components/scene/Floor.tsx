import React from 'react';
import { Grid } from '@react-three/drei';

export const Floor: React.FC = () => {
  return (
    <group position={[0, 0, 0]}>
      {/* Grid rotated into XY plane (Z-up) */}
      <Grid
        position={[0, 0, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        cellSize={0.5}
        sectionSize={2.5}
        cellColor="#334155"
        sectionColor="#64748b"
        fadeDistance={25}
        infiniteGrid
      />

      {/* Large receiving-shadow circular plane at z = -0.001 in XY plane */}
      <mesh receiveShadow position={[0, 0, -0.001]}>
        <circleGeometry args={[6, 64]} />
        <meshStandardMaterial
          color="#1f2937"
          roughness={0.8}
          metalness={0.2}
        />
      </mesh>
    </group>
  );
};

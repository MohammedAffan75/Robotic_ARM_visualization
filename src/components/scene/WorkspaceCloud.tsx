import React, { useMemo } from 'react';
import * as THREE from 'three';
import { ArmDefinition } from '../../core/arms/types';

interface WorkspaceCloudProps {
  armDef: ArmDefinition;
  parameters: Record<string, number>;
  visible?: boolean;
}

export const WorkspaceCloud: React.FC<WorkspaceCloudProps> = ({
  armDef,
  parameters,
  visible = true
}) => {
  const points = useMemo(() => {
    if (!visible) return [];
    return armDef.workspaceSampler(parameters, 800);
  }, [armDef, parameters, visible]);

  const geometry = useMemo(() => {
    if (!points.length) return null;
    const geom = new THREE.BufferGeometry();
    const positions = new Float32Array(points.length * 3);
    for (let i = 0; i < points.length; i++) {
      positions[i * 3] = points[i][0];
      positions[i * 3 + 1] = points[i][1];
      positions[i * 3 + 2] = points[i][2];
    }
    geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geom;
  }, [points]);

  if (!visible || !geometry) return null;

  return (
    <points geometry={geometry}>
      <pointsMaterial
        size={0.016}
        color="#38bdf8"
        transparent
        opacity={0.25}
        depthWrite={false}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

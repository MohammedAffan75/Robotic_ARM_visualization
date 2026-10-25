import { ArmDefinition } from '../arms/types';
import { Vec3 } from '../math/matrix';

export interface WorkspaceEstimate {
  points: Vec3[];
  estimatedVolumeM3: number;
  boundingBox: {
    min: Vec3;
    max: Vec3;
    dimensions: Vec3;
  };
  maxReach: number;
}

/**
 * Monte Carlo workspace volume estimation and point cloud generation
 */
export function estimateWorkspace(
  armDef: ArmDefinition,
  params: Record<string, number>,
  numSamples = 1200
): WorkspaceEstimate {
  const points: Vec3[] = [];
  const minBox: Vec3 = [Infinity, Infinity, Infinity];
  const maxBox: Vec3 = [-Infinity, -Infinity, -Infinity];
  let maxReach = 0;

  // 1. Generate boundary points using armDef's custom sampler
  const boundaryPoints = armDef.workspaceSampler(params, Math.floor(numSamples * 0.4));
  for (const pt of boundaryPoints) {
    points.push(pt);
    updateBox(pt);
  }

  // 2. Monte Carlo interior & surface random joint sampling
  const jDefs = armDef.joints;
  const mcSamples = Math.floor(numSamples * 0.6);

  for (let i = 0; i < mcSamples; i++) {
    const q: number[] = [];
    for (let j = 0; j < 3; j++) {
      const min = jDefs[j].min;
      const max = jDefs[j].max;
      q.push(min + Math.random() * (max - min));
    }

    const fkRes = armDef.fk(q, params);
    const pt = fkRes.endEffector;
    points.push(pt);
    updateBox(pt);
  }

  function updateBox(pt: Vec3) {
    for (let c = 0; c < 3; c++) {
      if (pt[c] < minBox[c]) minBox[c] = pt[c];
      if (pt[c] > maxBox[c]) maxBox[c] = pt[c];
    }
    const reach = Math.sqrt(pt[0] * pt[0] + pt[1] * pt[1] + pt[2] * pt[2]);
    if (reach > maxReach) maxReach = reach;
  }

  const dimensions: Vec3 = [
    maxBox[0] - minBox[0],
    maxBox[1] - minBox[1],
    maxBox[2] - minBox[2]
  ];

  // Voxel-based volume estimate
  const voxelGridSize = 24;
  const occupiedVoxels = new Set<string>();
  const dx = dimensions[0] / voxelGridSize;
  const dy = dimensions[1] / voxelGridSize;
  const dz = dimensions[2] / voxelGridSize;

  for (const p of points) {
    const ix = Math.floor((p[0] - minBox[0]) / Math.max(1e-4, dx));
    const iy = Math.floor((p[1] - minBox[1]) / Math.max(1e-4, dy));
    const iz = Math.floor((p[2] - minBox[2]) / Math.max(1e-4, dz));
    occupiedVoxels.add(`${ix},${iy},${iz}`);
  }

  const voxelVol = dx * dy * dz;
  const estimatedVolumeM3 = parseFloat((occupiedVoxels.size * voxelVol).toFixed(3));

  return {
    points,
    estimatedVolumeM3,
    boundingBox: {
      min: minBox,
      max: maxBox,
      dimensions
    },
    maxReach
  };
}

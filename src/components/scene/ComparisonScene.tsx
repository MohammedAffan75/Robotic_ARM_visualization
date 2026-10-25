import React from 'react';
import { getArmDefinition } from '../../core/arms';
import { ArmModel } from './ArmModel';
import { useArmStore } from '../../store/armStore';
import { useUIStore } from '../../store/uiStore';

export const ComparisonScene: React.FC = () => {
  const primaryType = useArmStore((s) => s.armType);
  const primaryJoints = useArmStore((s) => s.joints);
  const primaryParams = useArmStore((s) => s.parameters);
  const primaryFk = useArmStore((s) => s.fkResult);
  const target = useArmStore((s) => s.target);
  const overlays = useUIStore((s) => s.overlays);
  const compareType = useUIStore((s) => s.compareArmType);

  const primaryDef = getArmDefinition(primaryType);
  const secondaryDef = getArmDefinition(compareType);

  // Solve secondary arm IK towards the same target position
  const secParams = secondaryDef.defaultParameters;
  const secIkSols = secondaryDef.ik(target, secParams);
  const secSol = secIkSols.find((s) => s.valid) || secIkSols[0];
  const secJoints: [number, number, number] = secSol
    ? [secSol.joints[0], secSol.joints[1], secSol.joints[2]]
    : [secondaryDef.joints[0].defaultVal, secondaryDef.joints[1].defaultVal, secondaryDef.joints[2].defaultVal];
  const secFk = secondaryDef.fk(secJoints, secParams);

  return (
    <group>
      {/* Primary Arm (Left Offset) */}
      <group position={[-0.75, 0, 0]}>
        <ArmModel
          armDef={primaryDef}
          joints={primaryJoints}
          parameters={primaryParams}
          fkResult={primaryFk}
          overlays={overlays}
          highlightColor="#38bdf8"
          isComparison
        />
      </group>

      {/* Secondary Comparison Arm (Right Offset) */}
      <group position={[0.75, 0, 0]}>
        <ArmModel
          armDef={secondaryDef}
          joints={secJoints}
          parameters={secParams}
          fkResult={secFk}
          overlays={overlays}
          highlightColor="#a855f7"
          isComparison
        />
      </group>
    </group>
  );
};

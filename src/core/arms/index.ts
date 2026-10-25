import { ArmDefinition, ArmTypeId } from './types';
import { CartesianArm } from './cartesian';
import { CylindricalArm } from './cylindrical';
import { PolarArm } from './polar';
import { JointedArm } from './jointed';
import { ScaraArm } from './scara';
import { CustomArm } from './custom';

export * from './types';
export { CartesianArm, CylindricalArm, PolarArm, JointedArm, ScaraArm, CustomArm };

export const ARM_REGISTRY: Record<ArmTypeId, ArmDefinition> = {
  cartesian: CartesianArm,
  cylindrical: CylindricalArm,
  polar: PolarArm,
  jointed: JointedArm,
  scara: ScaraArm,
  custom: CustomArm
};

export const ARM_TYPES: ArmTypeId[] = [
  'cartesian',
  'cylindrical',
  'polar',
  'jointed',
  'scara',
  'custom'
];

export function getArmDefinition(type: ArmTypeId): ArmDefinition {
  return ARM_REGISTRY[type] ?? ARM_REGISTRY.jointed;
}

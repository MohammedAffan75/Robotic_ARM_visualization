import { ArmTypeId } from '../arms/types';

export interface ArmLimitations {
  type: ArmTypeId;
  name: string;
  inherentLimitations: string[];
  singularityProfiles: string[];
  practicalTips: string[];
  bestSuitedFor: string[];
  leastSuitedFor: string[];
}

export const ARM_LIMITATIONS_DATA: Record<ArmTypeId, ArmLimitations> = {
  cartesian: {
    type: 'cartesian',
    name: 'Cartesian (Gantry / Rectilinear)',
    inherentLimitations: [
      'Very large physical footprint relative to reachable workspace',
      'Exposed linear rails and lead screws prone to debris and chips',
      'Lower dynamic speeds and acceleration due to heavy moving gantries'
    ],
    singularityProfiles: [
      'Singularity-free throughout the entire operational envelope (det(J) = 1)'
    ],
    practicalTips: [
      'Keep linear carriage guides lubricated and dust-shielded',
      'Leverage for tasks requiring uniform orthogonal precision like 3D printing and milling'
    ],
    bestSuitedFor: ['CNC Milling', 'Laser Cutting', 'Heavy Gantry Pick-and-Place', 'Additive Manufacturing'],
    leastSuitedFor: ['Reaching into tight or angled enclosures', 'High-speed assembly lines']
  },
  cylindrical: {
    type: 'cylindrical',
    name: 'Cylindrical (R-P-P)',
    inherentLimitations: [
      'Unusable central dead zone around the structural column (r < r_min)',
      'Linear boom extends outward backwards during retraction, creating rear pinch hazards',
      'Limited angular dexterity for angled parts handling'
    ],
    singularityProfiles: [
      'Singular at r = 0 (telescoping boom collapsed to central axis, waist rotation has zero positional effect)'
    ],
    practicalTips: [
      'Maintain adequate clearance around the rear of the telescoping arm',
      'Operate near mid-boom extension to avoid near-column singularities'
    ],
    bestSuitedFor: ['Semiconductor wafer transfer', 'Machine tending around circular stations', 'Foundry casting'],
    leastSuitedFor: ['High-flexibility continuous path contouring', 'Reaching around upright obstacles']
  },
  polar: {
    type: 'polar',
    name: 'Polar / Spherical (R-R-P)',
    inherentLimitations: [
      'Gimbal lock when shoulder elevation points straight up or down (φ = ±90°)',
      'Telescoping boom flexes under heavy cantilever loads at maximum extension',
      'Non-intuitive coordinate transform compared to Cartesian beds'
    ],
    singularityProfiles: [
      'Shoulder singularity at φ = ±90° (azimuth θ aligns with boom, losing 1 Cartesian DOF)',
      'Collapsed boom singularity at r = 0'
    ],
    practicalTips: [
      'Limit elevation trajectories between -30° and +75° to stay safely away from gimbal lock',
      'Account for cantilever boom droop when handling rated heavy payloads'
    ],
    bestSuitedFor: ['Heavy automotive spot welding', 'Forging and die casting handling', 'Large radial cranes'],
    leastSuitedFor: ['Precision high-speed PCB insertion', 'Narrow vertical slot navigation']
  },
  jointed: {
    type: 'jointed',
    name: 'Articulated / Jointed (R-R-R)',
    inherentLimitations: [
      'Non-linear kinematic mapping with multiple coupled inverse solutions (elbow up/down)',
      'Positional stiffness and repeatability diminish near maximum reach',
      'Elbow lock and overhead singularities require trajectory avoidance'
    ],
    singularityProfiles: [
      'Boundary singularity: Elbow fully extended (θ₃ = 0°) or folded back (θ₃ = ±180°)',
      'Overhead / Shoulder singularity: Wrist point collinear with central base axis (r_xy = 0)'
    ],
    practicalTips: [
      'Plan trajectories to cross near-overhead zones with offset wrist postures',
      'Use Elbow-Up configuration for table-top operations to maximize downward clearance'
    ],
    bestSuitedFor: ['Automotive assembly & welding', 'Surface painting & spraying', 'Flexible material handling'],
    leastSuitedFor: ['Low-cost simple open-loop pick-and-place without controller compensation']
  },
  scara: {
    type: 'scara',
    name: 'SCARA (R-R-P)',
    inherentLimitations: [
      'Short vertical Z travel stroke (typically limited to 150 - 400 mm)',
      'Purely top-down insertion orientation; cannot tilt or pitch end-effector',
      'Singular when links are collinear (elbow lock)'
    ],
    singularityProfiles: [
      'Elbow singularity at θ₂ = 0° (fully extended) or θ₂ = ±180° (fully folded)'
    ],
    practicalTips: [
      'Take advantage of natural XY compliance to absorb micro-misalignments in pin insertions',
      'Switch between Lefty and Righty branches to navigate around vertical assembly jigs'
    ],
    bestSuitedFor: ['PCB component placement', 'Screw driving & peg insertion', 'Electronics packaging'],
    leastSuitedFor: ['Tall vertical stacking operations', 'Side-approach machining']
  },
  custom: {
    type: 'custom',
    name: 'Custom Configurable 3-DOF',
    inherentLimitations: [
      'Numerical IK convergence depends on local optimization seed pose',
      'Dynamic singularities vary depending on chosen joint types and axis configurations'
    ],
    singularityProfiles: [
      'Monitored dynamically via condition number and Yoshikawa manipulability index'
    ],
    practicalTips: [
      'Experiment with Revolute vs. Prismatic combinations to analyze workspace trade-offs',
      'Watch condition number readout to detect poor kinematic conditioning'
    ],
    bestSuitedFor: ['Kinematic research & experimentation', 'Mechanism prototyping', 'Education'],
    leastSuitedFor: ['Production turnkey deployments without specialized calibration']
  }
};

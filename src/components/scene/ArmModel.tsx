import React from 'react';
import { ArmDefinition, FKResult } from '../../core/arms/types';
import { Vec3 } from '../../core/math/matrix';
import { FrameAxes } from './FrameAxes';
import { RotaryArrow, LinearArrow } from './JointArrows';
import { AngleArc } from './AngleArcs';

interface ArmModelProps {
  armDef: ArmDefinition;
  joints: [number, number, number];
  parameters: Record<string, number>;
  fkResult: FKResult;
  overlays: {
    jointFrames: boolean;
    angleArcs: boolean;
    linkLabels: boolean;
    motionArrows: boolean;
    jointLimitRings: boolean;
  };
  highlightColor?: string;
  isComparison?: boolean;
}

// Standard PBR Material specifications requested:
// base #94a3b8, joints #e2e8f0, link 1 #3b82f6, link 2 #f59e0b, link 3 #10b981, end effector #ef4444
// metalness 0.35, roughness 0.45, emissive #000000
const PBR_BASE = { color: '#94a3b8', metalness: 0.35, roughness: 0.45, emissive: '#000000' };
const PBR_JOINTS = { color: '#e2e8f0', metalness: 0.35, roughness: 0.45, emissive: '#000000' };
const PBR_LINK1 = { color: '#3b82f6', metalness: 0.35, roughness: 0.45, emissive: '#000000' };
const PBR_LINK2 = { color: '#f59e0b', metalness: 0.35, roughness: 0.45, emissive: '#000000' };
const PBR_LINK3 = { color: '#10b981', metalness: 0.35, roughness: 0.45, emissive: '#000000' };
const PBR_EE = { color: '#ef4444', metalness: 0.35, roughness: 0.45, emissive: '#000000' };

/**
 * Universal End Effector Gripper in Z-up
 */
const GripperEndEffector: React.FC<{ position: Vec3; color?: string }> = ({
  position,
  color
}) => {
  const eeMat = color ? { color, metalness: 0.35, roughness: 0.45, emissive: '#000000' } : PBR_EE;

  return (
    <group position={position}>
      {/* Tool Mounting Flange */}
      <mesh castShadow receiveShadow position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.032, 0.032, 0.016, 20]} />
        <meshStandardMaterial {...PBR_JOINTS} />
      </mesh>
      {/* Gripper Body */}
      <mesh castShadow receiveShadow position={[0, 0, -0.02]}>
        <boxGeometry args={[0.045, 0.045, 0.028]} />
        <meshStandardMaterial {...eeMat} />
      </mesh>
      {/* Left Finger */}
      <mesh castShadow receiveShadow position={[-0.018, 0, -0.042]}>
        <boxGeometry args={[0.008, 0.024, 0.022]} />
        <meshStandardMaterial {...PBR_BASE} />
      </mesh>
      {/* Right Finger */}
      <mesh castShadow receiveShadow position={[0.018, 0, -0.042]}>
        <boxGeometry args={[0.008, 0.024, 0.022]} />
        <meshStandardMaterial {...PBR_BASE} />
      </mesh>
      {/* Tool Center Point (TCP) glowing tip marker */}
      <mesh position={[0, 0, -0.055]}>
        <sphereGeometry args={[0.006, 12, 12]} />
        <meshStandardMaterial color="#38bdf8" emissive="#38bdf8" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
};

export const ArmModel: React.FC<ArmModelProps> = ({
  armDef,
  joints,
  parameters,
  fkResult,
  overlays,
  highlightColor
}) => {
  const [q1, q2, q3] = joints;
  const positions = fkResult.jointPositions;
  const ee = fkResult.endEffector;
  const jDefs = armDef.joints;

  return (
    <group>
      {/* Base Foundation Plinth (Z-up: in XY plane, height 0.04 along Z) */}
      <mesh castShadow receiveShadow position={[0, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.22, 0.26, 0.04, 32]} />
        <meshStandardMaterial {...PBR_BASE} />
      </mesh>

      {/* --- 1. CARTESIAN (GANTRY) --- */}
      {armDef.id === 'cartesian' && (
        <group>
          {/* Gantry 4 corner posts along Z */}
          {[-0.65, 0.65].map((x) =>
            [-0.65, 0.65].map((y) => (
              <mesh key={`post-${x}-${y}`} castShadow receiveShadow position={[x, y, 0.55]}>
                <boxGeometry args={[0.05, 0.05, 1.1]} />
                <meshStandardMaterial {...PBR_BASE} />
              </mesh>
            ))
          )}
          {/* Top rectangular frame beams */}
          <mesh castShadow receiveShadow position={[0, -0.65, 1.1]}>
            <boxGeometry args={[1.35, 0.05, 0.05]} />
            <meshStandardMaterial {...PBR_JOINTS} />
          </mesh>
          <mesh castShadow receiveShadow position={[0, 0.65, 1.1]}>
            <boxGeometry args={[1.35, 0.05, 0.05]} />
            <meshStandardMaterial {...PBR_JOINTS} />
          </mesh>
          <mesh castShadow receiveShadow position={[-0.65, 0, 1.1]}>
            <boxGeometry args={[0.05, 1.35, 0.05]} />
            <meshStandardMaterial {...PBR_JOINTS} />
          </mesh>
          <mesh castShadow receiveShadow position={[0.65, 0, 1.1]}>
            <boxGeometry args={[0.05, 1.35, 0.05]} />
            <meshStandardMaterial {...PBR_JOINTS} />
          </mesh>

          {/* Link 1: X Bridge Carriage (moves along X, spans Y) */}
          <mesh castShadow receiveShadow position={[q1, 0, 1.05]}>
            <boxGeometry args={[0.09, 1.3, 0.07]} />
            <meshStandardMaterial {...PBR_LINK1} />
          </mesh>

          {/* Link 2: Y Cross-slide (moves along Y on the X bridge) */}
          <mesh castShadow receiveShadow position={[q1, q2, 1.05]}>
            <boxGeometry args={[0.13, 0.13, 0.09]} />
            <meshStandardMaterial {...PBR_LINK2} />
          </mesh>

          {/* Link 3: Z Quill (moves along Z) */}
          <mesh
            castShadow
            receiveShadow
            position={[q1, q2, (1.05 + q3) / 2]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.022, 0.022, Math.max(0.1, 1.05 - q3), 16]} />
            <meshStandardMaterial {...PBR_LINK3} />
          </mesh>
        </group>
      )}

      {/* --- 2. CYLINDRICAL (R-P-P) --- */}
      {armDef.id === 'cylindrical' && (
        <group>
          {/* Central Vertical Guide Column along Z */}
          <mesh castShadow receiveShadow position={[0, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.055, 0.055, 1.0, 24]} />
            <meshStandardMaterial {...PBR_BASE} />
          </mesh>

          {/* Rotating Waist Sleeve on the column (Joint 1 yaw + Joint 3 elevation) */}
          <group position={[0, 0, q3]} rotation={[0, 0, (q1 * Math.PI) / 180]}>
            {/* Sliding collar (Joint 1 / 3 hub) */}
            <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.15, 24]} />
              <meshStandardMaterial {...PBR_JOINTS} />
            </mesh>

            {/* Link 1 / 2: Horizontal Telescoping Outer Housing along X */}
            <mesh
              castShadow
              receiveShadow
              position={[q2 * 0.35, 0, 0]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.038, 0.038, q2 * 0.7, 16]} />
              <meshStandardMaterial {...PBR_LINK1} />
            </mesh>

            {/* Link 2: Telescoping Inner Rod along X */}
            <mesh
              castShadow
              receiveShadow
              position={[q2 * 0.75, 0, 0]}
              rotation={[0, 0, Math.PI / 2]}
            >
              <cylinderGeometry args={[0.024, 0.024, q2 * 0.55, 16]} />
              <meshStandardMaterial {...PBR_LINK2} />
            </mesh>
          </group>
        </group>
      )}

      {/* --- 3. POLAR / SPHERICAL (R-R-P) --- */}
      {armDef.id === 'polar' && (
        <group>
          {/* Base Pedestal Column along Z */}
          <mesh
            castShadow
            receiveShadow
            position={[0, 0, (parameters.baseHeight ?? 0.4) / 2]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.1, 0.13, parameters.baseHeight ?? 0.4, 24]} />
            <meshStandardMaterial {...PBR_BASE} />
          </mesh>

          {/* Waist Yaw Rotation (around Z) */}
          <group
            position={[0, 0, parameters.baseHeight ?? 0.4]}
            rotation={[0, 0, (q1 * Math.PI) / 180]}
          >
            {/* Link 1: Shoulder Turret */}
            <mesh castShadow receiveShadow position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.085, 0.085, 0.08, 20]} />
              <meshStandardMaterial {...PBR_LINK1} />
            </mesh>

            {/* Shoulder Pitch Pivot (φ around horizontal Y axis) */}
            <group rotation={[0, (-q2 * Math.PI) / 180, 0]} position={[0, 0, 0.08]}>
              {/* Joint 2 Pitch Pivot Hub along Y */}
              <mesh castShadow receiveShadow rotation={[0, 0, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 0.1, 20]} />
                <meshStandardMaterial {...PBR_JOINTS} />
              </mesh>

              {/* Link 2: Outer Telescoping Sleeve along X */}
              <mesh
                castShadow
                receiveShadow
                position={[q3 * 0.35, 0, 0]}
                rotation={[0, 0, Math.PI / 2]}
              >
                <boxGeometry args={[0.07, q3 * 0.7, 0.07]} />
                <meshStandardMaterial {...PBR_LINK2} />
              </mesh>

              {/* Link 3: Inner Extending Rod along X */}
              <mesh
                castShadow
                receiveShadow
                position={[q3 * 0.75, 0, 0]}
                rotation={[0, 0, Math.PI / 2]}
              >
                <cylinderGeometry args={[0.024, 0.024, q3 * 0.55, 16]} />
                <meshStandardMaterial {...PBR_LINK3} />
              </mesh>
            </group>
          </group>
        </group>
      )}

      {/* --- 4. JOINTED / ARTICULATED (R-R-R) --- */}
      {armDef.id === 'jointed' && (
        <group>
          {/* Base Pedestal Column along Z */}
          <mesh
            castShadow
            receiveShadow
            position={[0, 0, (parameters.baseHeight ?? 0.35) / 2]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.11, 0.14, parameters.baseHeight ?? 0.35, 24]} />
            <meshStandardMaterial {...PBR_BASE} />
          </mesh>

          {/* Waist Rotation J1 (Yaw around Z) */}
          <group
            position={[0, 0, parameters.baseHeight ?? 0.35]}
            rotation={[0, 0, (q1 * Math.PI) / 180]}
          >
            {/* Turret Hub */}
            <mesh castShadow receiveShadow position={[0, 0, 0.04]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.09, 0.09, 0.08, 24]} />
              <meshStandardMaterial {...PBR_JOINTS} />
            </mesh>

            {/* Shoulder Pitch J2 (around horizontal Y axis) */}
            <group position={[0, 0, 0.08]} rotation={[0, (-q2 * Math.PI) / 180, 0]}>
              {/* Shoulder Pivot Hub along Y */}
              <mesh castShadow receiveShadow rotation={[0, 0, 0]}>
                <cylinderGeometry args={[0.05, 0.05, 0.11, 20]} />
                <meshStandardMaterial {...PBR_JOINTS} />
              </mesh>

              {/* Link 1: Upper Arm Link (L1) extending along X */}
              <mesh
                castShadow
                receiveShadow
                position={[(parameters.lengthL1 ?? 0.45) / 2, 0, 0]}
                rotation={[0, 0, Math.PI / 2]}
              >
                <boxGeometry args={[0.065, parameters.lengthL1 ?? 0.45, 0.075]} />
                <meshStandardMaterial {...PBR_LINK1} />
              </mesh>

              {/* Elbow Pitch J3 (around horizontal Y axis) */}
              <group
                position={[parameters.lengthL1 ?? 0.45, 0, 0]}
                rotation={[0, (-q3 * Math.PI) / 180, 0]}
              >
                {/* Elbow Pivot Hub along Y */}
                <mesh castShadow receiveShadow rotation={[0, 0, 0]}>
                  <cylinderGeometry args={[0.044, 0.044, 0.09, 20]} />
                  <meshStandardMaterial {...PBR_JOINTS} />
                </mesh>

                {/* Link 2: Forearm Link (L2) extending along X */}
                <mesh
                  castShadow
                  receiveShadow
                  position={[(parameters.lengthL2 ?? 0.4) / 2, 0, 0]}
                  rotation={[0, 0, Math.PI / 2]}
                >
                  <boxGeometry args={[0.05, parameters.lengthL2 ?? 0.4, 0.06]} />
                  <meshStandardMaterial {...PBR_LINK2} />
                </mesh>
              </group>
            </group>
          </group>
        </group>
      )}

      {/* --- 5. SCARA (R-R-P) --- */}
      {armDef.id === 'scara' && (
        <group>
          {/* Base Pedestal Column along Z */}
          <mesh
            castShadow
            receiveShadow
            position={[0, 0, (parameters.baseHeight ?? 0.65) / 2]}
            rotation={[Math.PI / 2, 0, 0]}
          >
            <cylinderGeometry args={[0.11, 0.14, parameters.baseHeight ?? 0.65, 24]} />
            <meshStandardMaterial {...PBR_BASE} />
          </mesh>

          {/* Link 1: First Horizontal Arm Link (J1 yaw around Z) */}
          <group
            position={[0, 0, parameters.baseHeight ?? 0.65]}
            rotation={[0, 0, (q1 * Math.PI) / 180]}
          >
            {/* Joint 1 Base Hub */}
            <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.075, 0.075, 0.09, 20]} />
              <meshStandardMaterial {...PBR_JOINTS} />
            </mesh>

            {/* Link 1 Arm Body along X */}
            <mesh
              castShadow
              receiveShadow
              position={[(parameters.lengthL1 ?? 0.4) / 2, 0, 0]}
            >
              <boxGeometry args={[parameters.lengthL1 ?? 0.4, 0.08, 0.065]} />
              <meshStandardMaterial {...PBR_LINK1} />
            </mesh>

            {/* Link 2: Second Horizontal Arm Link (J2 elbow yaw around Z) */}
            <group
              position={[parameters.lengthL1 ?? 0.4, 0, 0]}
              rotation={[0, 0, (q2 * Math.PI) / 180]}
            >
              {/* Elbow Joint Hub */}
              <mesh castShadow receiveShadow rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.065, 0.065, 0.09, 20]} />
                <meshStandardMaterial {...PBR_JOINTS} />
              </mesh>

              {/* Link 2 Arm Body along X */}
              <mesh
                castShadow
                receiveShadow
                position={[(parameters.lengthL2 ?? 0.35) / 2, 0, 0]}
              >
                <boxGeometry args={[parameters.lengthL2 ?? 0.35, 0.07, 0.055]} />
                <meshStandardMaterial {...PBR_LINK2} />
              </mesh>

              {/* Link 3: Vertical Linear Quill Plunge (J3 along Z) */}
              <group position={[parameters.lengthL2 ?? 0.35, 0, 0]}>
                {/* Quill Guide Housing */}
                <mesh castShadow receiveShadow position={[0, 0, 0.02]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.038, 0.038, 0.13, 16]} />
                  <meshStandardMaterial {...PBR_JOINTS} />
                </mesh>
                {/* Moving Quill Shaft along Z */}
                <mesh
                  castShadow
                  receiveShadow
                  position={[0, 0, -q3 / 2]}
                  rotation={[Math.PI / 2, 0, 0]}
                >
                  <cylinderGeometry args={[0.018, 0.018, q3 + 0.16, 16]} />
                  <meshStandardMaterial {...PBR_LINK3} />
                </mesh>
              </group>
            </group>
          </group>
        </group>
      )}

      {/* --- 6. CUSTOM 3-DOF --- */}
      {armDef.id === 'custom' && (
        <group>
          {/* Base */}
          <mesh castShadow receiveShadow position={[0, 0, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.11, 0.14, 0.3, 20]} />
            <meshStandardMaterial {...PBR_BASE} />
          </mesh>

          {/* Links chaining between joint positions */}
          {positions.slice(1).map((pos, idx) => {
            const prevPos = positions[idx];
            const mid: Vec3 = [(pos[0] + prevPos[0]) / 2, (pos[1] + prevPos[1]) / 2, (pos[2] + prevPos[2]) / 2];

            const linkMat = idx === 0 ? PBR_LINK1 : idx === 1 ? PBR_LINK2 : PBR_LINK3;

            return (
              <group key={`link-${idx}`}>
                {/* Joint Sphere Hub */}
                <mesh castShadow receiveShadow position={prevPos}>
                  <sphereGeometry args={[0.048, 20, 20]} />
                  <meshStandardMaterial {...PBR_JOINTS} />
                </mesh>
                {/* Connecting Link Beam */}
                <mesh castShadow receiveShadow position={mid}>
                  <sphereGeometry args={[0.03, 12, 12]} />
                  <meshStandardMaterial {...linkMat} />
                </mesh>
              </group>
            );
          })}
        </group>
      )}

      {/* Universal Gripper at End Effector */}
      <GripperEndEffector
        position={ee}
        color={highlightColor}
      />

      {/* --- OVERLAYS: Joint Frames, Motion Arrows & Angle Arcs --- */}
      {overlays.jointFrames && (
        <group>
          <FrameAxes position={[0, 0, 0]} scale={0.16} label="Base Frame {0}" />
          {positions.slice(1).map((p, i) => (
            <FrameAxes key={`frame-${i}`} position={p} scale={0.12} label={`Joint ${i + 1}`} />
          ))}
          <FrameAxes position={ee} scale={0.14} label="Tool Frame {TCP}" />
        </group>
      )}

      {overlays.motionArrows && (
        <group>
          {jDefs.map((j, i) => {
            const pos = positions[Math.min(positions.length - 1, i + 1)] || positions[i];
            const val = joints[i];
            if (j.type === 'R') {
              return (
                <RotaryArrow
                  key={`arrow-${i}`}
                  position={pos}
                  radius={0.11}
                  angleDeg={val}
                  axis={j.axis}
                />
              );
            } else {
              return (
                <LinearArrow
                  key={`arrow-${i}`}
                  position={pos}
                  length={0.18}
                  axis={j.axis}
                  currentVal={val}
                />
              );
            }
          })}
        </group>
      )}

      {overlays.angleArcs && (
        <group>
          {jDefs.map((j, i) => {
            if (j.type !== 'R') return null;
            const pos = positions[i];
            return (
              <AngleArc
                key={`arc-${i}`}
                position={pos}
                angleDeg={joints[i]}
                minDeg={j.min}
                maxDeg={j.max}
                radius={0.12}
                axis={j.axis}
              />
            );
          })}
        </group>
      )}
    </group>
  );
};

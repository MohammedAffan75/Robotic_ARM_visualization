# RoboKin 3-DOF | Interactive Robot Arm Kinematics Simulator

# Live Link : https://robotic-arm-visualization.vercel.app/

A web-based 3-DOF robot arm kinematics and singularity simulator built with **Vite**, **React 18**, **TypeScript (Strict Mode)**, **Three.js**, **@react-three/fiber**, **@react-three/drei**, **Zustand**, and **Tailwind CSS**.

Deployable to Vercel as a 100% frontend static application with zero backend or server dependencies.

---

## 🚀 Key Features

1. **6 Industrial Robot Arm Architectures (Selectable at Runtime)**
   - **Cartesian / Gantry (P-P-P):** Constant identity Jacobian matrix $\det(J) = 1$, zero singularities, rectangular bounding volume.
   - **Cylindrical (R-P-P):** Revolute waist, radial horizontal extension, and vertical elevation column. $\det(J) = -r$, singular at $r = 0$.
   - **Polar / Spherical (R-R-P):** Unimate-style heritage architecture with waist yaw $\theta$, shoulder pitch elevation $\phi$, and telescoping boom $r$. $\det(J) = r^2 \cos\phi$, singular at $\phi = \pm 90^\circ$ and $r = 0$.
   - **Jointed / Articulated (R-R-R):** Anthropomorphic waist, shoulder, and elbow. Analytical closed-form dual-branch IK (Elbow-Up and Elbow-Down). Singular when fully extended, folded, or on central axis ($r_{xy} = 0$).
   - **SCARA (R-R-P):** Selective compliance dual horizontal revolute links with vertical plunge quill. Dual IK branches (Righty and Lefty). Singular when links are collinear ($\sin\theta_2 = 0$).
   - **Custom Configurable 3-DOF:** User-selectable Revolute (R) or Prismatic (P) joints with Damped Least Squares (DLS) numerical inverse kinematics and dynamic condition number evaluation.

2. **Kinematic Precision & Solvers**
   - **Forward Kinematics (FK):** $4 \times 4$ homogeneous transformation matrices using standard Denavit-Hartenberg (DH) parameters.
   - **Inverse Kinematics (IK):** Analytical closed-form branch solvers + Damped Least Squares ($J_{dls} = J^T (J J^T + \lambda^2 I)^{-1}$).
   - **Velocity Jacobian ($3 \times 3$):** Analytical formulation cross-checked against central difference numerical differentiation ($h = 10^{-5}$).
   - **Singularity Detection:** Yoshikawa manipulability index $w = \sqrt{\det(J J^T)} = |\det(J)|$.

3. **3D Interactive Scene (React Three Fiber v8 & Drei)**
   - Draggable 3D target sphere using `TransformControls` with smooth follower interpolation.
   - Reactive color feedback:
     - 🟢 **Optimal / Reachable:** Emerald / Cyan
     - 🟡 **Near Singularity:** Amber
     - 🔴 **Target Unreachable / Inner Deadzone / Hard Limit:** Rose Red
   - Overlays: RGB joint frames, motion arrows (curved blue for rotary, double-ended orange for linear), angle arcs, fading end-effector trajectory trail, and reachable workspace point cloud.
   - Camera Presets: **Front**, **Side**, **Top**, **Isometric**, and **Follow TCP** with animated transitions.
   - Side-by-Side Comparison Mode: Run two different arm architectures following the exact same target simultaneously.

4. **Telemetry, Trajectory Sequencing & Data Export**
   - 10-second rolling telemetry buffer (sampled at 10–20 Hz without React 60 FPS re-render overhead).
   - Industrial Waypoint Sequencer: record poses, reorder steps, loop playback, and choose Joint Space or Cartesian Space interpolation.
   - Trajectory CSV Export (`time, q1, q2, q3, x, y, z`).
   - Full robot state JSON Export/Import with **Zod** schema validation.
   - Undo/Redo history stack for all pose and parameter edits.

---

## 🛠 Tech Stack

- **Framework:** React 18 + Vite + TypeScript (Strict Mode)
- **3D Graphics:** Three.js + `@react-three/fiber` (v8) + `@react-three/drei`
- **State Management:** Zustand (with custom history stack & local storage persistence)
- **Validation Engine:** Zod + Pure TypeScript Kinematics Rules Engine
- **Styling:** Tailwind CSS (Dark Cyberpunk / Industrial palette) + Lucide Icons
- **Testing:** Vitest (13 tests including 20 random reachable round-trip poses per arm type)

---

## 📁 Architecture

```
src/
  core/                        <- PURE TypeScript, zero React/Three imports
    arms/                      <- Arm definitions + registry
      cartesian.ts
      cylindrical.ts
      polar.ts
      jointed.ts
      scara.ts
      custom.ts
      types.ts
      index.ts
    math/                      <- Matrices, DH transforms, Jacobian, DLS solver
      matrix.ts
      dh.ts
      jacobian.ts
      dls.ts
    validation/                <- Rules engine returning typed issues
      types.ts
      rules.ts
      index.ts
    workspace/                 <- Monte Carlo point cloud sampler & volume estimate
      sampler.ts
    specs/                     <- Spec-sheet generator, limitations matrix
      generator.ts
      limitations.ts
  store/                       <- Zustand stores
    armStore.ts                <- Kinematics state, undo/redo history, local storage
    uiStore.ts                 <- Panel states, camera presets, overlays, units
    logStore.ts                <- Chronological timestamped event & error logger
    waypointStore.ts           <- Trajectory recorder, presets, CSV export
    schemas.ts                 <- Zod validation schemas
  components/
    scene/                     <- React Three Fiber 3D Scene
      ArmModel.tsx             <- High-fidelity procedural meshes per arm type
      TargetGizmo.tsx          <- Draggable TransformControls target
      JointArrows.tsx          <- Rotary curved & linear sliding motion arrows
      AngleArcs.tsx            <- Swept angle sectors & limit tick marks
      FrameAxes.tsx            <- RGB XYZ coordinate frames
      Floor.tsx                <- Contact shadows and grid floor
      CameraRig.tsx            <- Smooth camera preset transitions
      TrailLine.tsx            <- Fading end-effector trail
      WorkspaceCloud.tsx       <- Translucent boundary point cloud
      ComparisonScene.tsx      <- Dual-arm side-by-side comparison
      ViewportToolbar.tsx      <- Floating camera & overlay HUD
      SceneCanvas.tsx          <- Canvas container with Error Boundary
    panels/                    <- UI Panels & Modals
      Header.tsx               <- Arm selector, status badge, undo/redo, import/export
      SidebarNavigation.tsx    <- Main tab rail
      ControlsPanel.tsx        <- Forward & Inverse Kinematics controls
      ParametersPanel.tsx      <- Link lengths, stroke ranges, limits, units
      DHTablePanel.tsx         <- Standard DH table & 4x4 transform matrices
      LiveDataPanel.tsx        <- Rolling telemetry plots, speed, Jacobian readouts
      SpecsPanel.tsx           <- Live spec sheet & limitations comparison
      LearnCard.tsx            <- Interactive educational card with math equations
      ComparePanel.tsx         <- Side-by-side comparative metric cards
      WaypointPanel.tsx        <- Trajectory recorder & playback sequencer
      LogPanel.tsx             <- Persistent Info/Warning/Error log
      HelpModal.tsx            <- Keyboard shortcuts & terminology guide
      Onboarding.tsx           <- Guided interactive introduction tour
    ui/                        <- Reusable UI components
      StatusBadge.tsx
      Toast.tsx
      Slider.tsx
      NumberInput.tsx
  hooks/
    useRollingBuffer.ts        <- High-speed 10s ring buffer hook
    useKeyboardShortcuts.ts    <- Global hotkeys handler
  tests/                       <- Vitest unit test suites
    kinematics.test.ts
    validation.test.ts
    schema.test.ts
```

---

## ⚡ Quickstart

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Run Kinematics & Validation Unit Tests
```bash
npm test
```

### 4. Build Production Bundle
```bash
npm run build
```

---

## 🚢 Deploy to Vercel

RoboKin 3-DOF is fully static:
1. Push your repository to GitHub / GitLab.
2. Import the repository into [Vercel](https://vercel.com).
3. Vercel will automatically detect `vite` and set:
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
4. Click **Deploy**. The `vercel.json` rewrite configuration handles all client routing.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| <kbd>H</kbd> | Return robot arm to Home Pose |
| <kbd>R</kbd> | Generate a random reachable pose within limits |
| <kbd>Space</kbd> | Play / Pause Waypoint Trajectory |
| <kbd>Ctrl</kbd> + <kbd>Z</kbd> | Undo pose or parameter change |
| <kbd>Ctrl</kbd> + <kbd>Y</kbd> | Redo pose or parameter change |
| <kbd>1</kbd> | Camera Front view |
| <kbd>2</kbd> | Camera Side view |
| <kbd>3</kbd> | Camera Top-down plan view |
| <kbd>4</kbd> | Camera Isometric view |
| <kbd>5</kbd> | Camera Follow End-Effector (TCP) |
| <kbd>?</kbd> | Open Documentation & Shortcuts Guide |

---

## 🔬 Assumptions & Engineering Notes

1. **Denavit-Hartenberg (DH) Convention:** The implementation follows standard Craig/Spong Denavit-Hartenberg conventions where coordinate frame $Z_i$ is aligned with joint axis $i+1$, and $X_i$ is collinear with the common normal.
2. **Units:** Default linear measurements are in **meters (m)** and angular measurements in **degrees (deg)** for human readability, with live conversions to radians, centimeters, and millimeters available in the Parameters panel.
3. **Collision Detection:** A ground-plane boundary ($Z \ge 0$) and arm-specific inner deadzones are monitored continuously by the pure TypeScript validation rules engine.

---

## 💡 Suggested Future Extensions

1. **6-DOF Spherical Wrist Extension:** Add a 3-axis decoupled spherical wrist (Roll-Pitch-Roll / Yaw-Pitch-Roll) to the 3-DOF arm base to enable full 6-DOF spatial orientation ($SE(3)$ position + orientation).
2. **Dynamic Obstacle Avoidance:** Integrate convex bounding volumes (cylinders/OBBs) into the 3D scene and use Null-Space Projection ($I - J^\dagger J$) to evade obstacles while maintaining primary TCP position.
3. **Dynamics & Actuator Torque Estimator:** Implement the Newton-Euler or Euler-Lagrange recursive formulation to calculate gravity loading, Coriolis torques, and joint motor torque curves based on link masses and payload.
4. **Closed-Loop PID Control Simulation:** Model motor servo dynamics, torque saturation, and encoder quantization noise with a tunable PID controller in a sub-millisecond physics loop.
5. **ROS 2 & URDF Exporter:** Add one-click export of generated kinematics chains into standard URDF (Unified Robot Description Format) XML files with Xacro macros and ROS 2 MoveIt configuration packages.

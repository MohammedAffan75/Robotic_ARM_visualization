import { useEffect, useRef, useState } from 'react';
import { useArmStore } from '../store/armStore';
import { Vec3 } from '../core/math/matrix';

export interface DataPoint {
  time: number;
  q1: number;
  q2: number;
  q3: number;
  eeX: number;
  eeY: number;
  eeZ: number;
  speed: number;
  manipulability: number;
}

/**
 * High-performance 10-second rolling buffer for live telemetry charts.
 * Samples at 10-20 Hz on an interval without triggering 60 Hz React rerenders.
 */
export function useRollingBuffer(bufferSeconds = 10, sampleRateHz = 10) {
  const [data, setData] = useState<DataPoint[]>([]);
  const lastEePosRef = useRef<Vec3>([0, 0, 0]);
  const lastSampleTimeRef = useRef<number>(Date.now());
  const bufferRef = useRef<DataPoint[]>([]);

  useEffect(() => {
    const maxEntries = bufferSeconds * sampleRateHz;
    const intervalMs = 1000 / sampleRateHz;

    const timer = setInterval(() => {
      const armState = useArmStore.getState();
      const now = Date.now();
      const dt = Math.max(1e-3, (now - lastSampleTimeRef.current) / 1000);
      lastSampleTimeRef.current = now;

      const currentEe = armState.fkResult.endEffector;
      const dx = currentEe[0] - lastEePosRef.current[0];
      const dy = currentEe[1] - lastEePosRef.current[1];
      const dz = currentEe[2] - lastEePosRef.current[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
      const speed = parseFloat((dist / dt).toFixed(3));
      lastEePosRef.current = currentEe;

      const point: DataPoint = {
        time: parseFloat((now % 100000 / 1000).toFixed(1)),
        q1: parseFloat(armState.joints[0].toFixed(2)),
        q2: parseFloat(armState.joints[1].toFixed(2)),
        q3: parseFloat(armState.joints[2].toFixed(2)),
        eeX: parseFloat(currentEe[0].toFixed(3)),
        eeY: parseFloat(currentEe[1].toFixed(3)),
        eeZ: parseFloat(currentEe[2].toFixed(3)),
        speed: Math.min(speed, 5.0),
        manipulability: parseFloat(armState.singularityInfo.manipulability.toFixed(4))
      };

      bufferRef.current.push(point);
      if (bufferRef.current.length > maxEntries) {
        bufferRef.current.shift();
      }

      // Update state at ~5-10 Hz for smooth UI plot
      setData([...bufferRef.current]);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [bufferSeconds, sampleRateHz]);

  return data;
}

import React, { useEffect, useRef, useState } from 'react';
import { Line } from '@react-three/drei';
import { Vec3 } from '../../core/math/matrix';

interface TrailLineProps {
  currentPos: Vec3;
  enabled?: boolean;
  maxPoints?: number;
}

export const TrailLine: React.FC<TrailLineProps> = ({
  currentPos,
  enabled = true,
  maxPoints = 60
}) => {
  const [points, setPoints] = useState<Vec3[]>([currentPos]);
  const lastPosRef = useRef<Vec3>(currentPos);

  useEffect(() => {
    if (!enabled) return;

    const dx = currentPos[0] - lastPosRef.current[0];
    const dy = currentPos[1] - lastPosRef.current[1];
    const dz = currentPos[2] - lastPosRef.current[2];
    const distSq = dx * dx + dy * dy + dz * dz;

    // Only add if moved at least 5mm
    if (distSq > 0.000025) {
      lastPosRef.current = currentPos;
      setPoints((prev) => {
        const next = [...prev, currentPos];
        if (next.length > maxPoints) next.shift();
        return next;
      });
    }
  }, [currentPos, enabled, maxPoints]);

  if (!enabled || points.length < 2) return null;

  return (
    <Line
      points={points}
      color="#38bdf8"
      lineWidth={2.5}
      transparent
      opacity={0.35}
      depthWrite={false}
    />
  );
};

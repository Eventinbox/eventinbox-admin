"use client";

import { Box, Flex, Text } from "@chakra-ui/react";
import { useId } from "react";

export interface TrendPoint {
  label: string;
  value: number; // 0..1 ratio
}

/**
 * Dependency-free SVG area+line chart for a small time series (e.g. the 7-day
 * delivery-success trend). Values are ratios in [0,1]; the axis is fixed to a
 * tight band around the data so day-to-day movement is legible rather than a
 * flat line pinned near 100%.
 */
export function TrendChart({
  points,
  height = 160,
}: {
  points: TrendPoint[];
  height?: number;
}) {
  const gradientId = useId();
  const W = 720;
  const H = height;
  const padX = 8;
  const padY = 16;

  const values = points.map((p) => p.value);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  // Pad the band a little so the line never touches the edges; clamp to [0,1].
  const lo = Math.max(0, rawMin - (rawMax - rawMin || 0.02) * 0.4 - 0.005);
  const hi = Math.min(1, rawMax + (rawMax - rawMin || 0.02) * 0.4 + 0.005);
  const span = hi - lo || 1;

  const x = (i: number) =>
    padX + (i * (W - padX * 2)) / Math.max(1, points.length - 1);
  const y = (v: number) => padY + (1 - (v - lo) / span) * (H - padY * 2);

  const line = points.map((p, i) => `${x(i)},${y(p.value)}`).join(" ");
  const area = `${padX},${H - padY} ${line} ${x(points.length - 1)},${H - padY}`;

  return (
    <Box>
      <Box
        as="svg"
        width="100%"
        height={`${H}px`}
        // @ts-expect-error -- forward SVG-only attrs through Chakra's Box
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="Delivery success rate, last 7 days"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#00E5FF" stopOpacity="0.30" />
            <stop offset="100%" stopColor="#00E5FF" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* baseline grid */}
        {[0.25, 0.5, 0.75].map((f) => (
          <line
            key={f}
            x1={padX}
            x2={W - padX}
            y1={padY + f * (H - padY * 2)}
            y2={padY + f * (H - padY * 2)}
            stroke="#202327"
            strokeWidth="1"
            strokeDasharray="3 5"
          />
        ))}

        <polygon points={area} fill={`url(#${gradientId})`} />
        <polyline
          points={line}
          fill="none"
          stroke="#00E5FF"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
        {points.map((p, i) => (
          <circle key={i} cx={x(i)} cy={y(p.value)} r="3" fill="#00E5FF" />
        ))}
      </Box>

      <Flex justify="space-between" mt="2" px="1">
        {points.map((p, i) => (
          <Text key={i} fontFamily="mono" fontSize="0.6rem" color="muted">
            {p.label}
          </Text>
        ))}
      </Flex>
    </Box>
  );
}

/**
 * ERD Custom Edge with Cardinality Symbols
 */

import { EdgeProps, getBezierPath } from "@xyflow/react";
import { CardinalityEdgeData } from "../../types";

export function CardinalityEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  style,
}: EdgeProps) {
  const edgeData = data as CardinalityEdgeData | undefined;
  const isHighlighted = edgeData?.isHighlighted ?? false;

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  // Calculate positions along the edge for cardinality symbols
  // Source side: 15% along the path (near source but not touching)
  // Target side: 85% along the path (near target but not touching)
  const sourceOffset = 40; // pixels from source
  const targetOffset = 40; // pixels from target

  // Calculate direction vectors
  const dx = targetX - sourceX;
  const dy = targetY - sourceY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const unitX = dx / length;
  const unitY = dy / length;

  // Position for "many" symbol (near source - FK side)
  const manyX = sourceX + unitX * sourceOffset;
  const manyY = sourceY + unitY * sourceOffset;

  // Position for "one" symbol (near target - PK side)
  const oneX = targetX - unitX * targetOffset;
  const oneY = targetY - unitY * targetOffset;

  // Calculate rotation angle for symbols
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);

  const strokeColor = '#6366f1';
  const strokeOpacity = isHighlighted ? 1 : 0.7;
  const strokeWidth = isHighlighted ? 2.5 : 2;

  return (
    <>
      {/* Main edge path */}
      <path
        id={id}
        d={edgePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={strokeWidth}
        strokeOpacity={strokeOpacity}
        style={{
          ...style,
          filter: isHighlighted ? 'drop-shadow(0 0 6px var(--accent-purple))' : 'none',
        }}
      />

      {/* "Many" symbol (o<) at source side - FK side */}
      <g transform={`translate(${manyX}, ${manyY}) rotate(${angle})`}>
        {/* Circle (o) */}
        <circle
          cx="-18"
          cy="0"
          r="5"
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth * 0.8}
          strokeOpacity={strokeOpacity}
        />
        {/* Crow's foot (<) pointing outward */}
        <path
          d="M -8 0 L -22 -6 M -8 0 L -22 0 M -8 0 L -22 6"
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth * 0.8}
          strokeLinecap="round"
          strokeOpacity={strokeOpacity}
        />
      </g>

      {/* "One" symbol (||) at target side - PK side */}
      <g transform={`translate(${oneX}, ${oneY}) rotate(${angle})`}>
        {/* Two vertical lines */}
        <path
          d="M 6 -6 L 6 6 M 12 -6 L 12 6"
          fill="none"
          stroke={strokeColor}
          strokeWidth={strokeWidth * 0.8}
          strokeLinecap="round"
          strokeOpacity={strokeOpacity}
        />
      </g>

      {/* Edge label */}
      {edgeData?.fkColumn && (
        <g transform={`translate(${labelX}, ${labelY})`}>
          <rect
            x="-20"
            y="-8"
            width="40"
            height="16"
            rx="3"
            fill="var(--secondary)"
            fillOpacity="0.95"
          />
          <text
            x="0"
            y="4"
            textAnchor="middle"
            fill="var(--foreground)"
            fontSize="9"
            fontWeight="500"
          >
            {edgeData.fkColumn}
          </text>
        </g>
      )}
    </>
  );
}


import React, { useMemo } from "react";
import { Arrow as KArrow, Circle } from "react-konva";
import { connectPoints } from "../../../utils/arrowHelpers.js";

function Arrow({
  obj,
  selected,
  onSelect,
  objectsMap,
  onReconnectStart
}) {
  const startObj = objectsMap[obj.startId];
  const endObj = objectsMap[obj.endId];
  if (!startObj || !endObj) return null;

  // Compute connection line
  const pts = connectPoints(startObj, endObj);
  const [sx, sy, ex, ey] = pts;

  return (
    <>
      <KArrow
        id={obj.id}
        points={pts}
        stroke={selected ? "#ff2d55" : obj.stroke}
        fill={selected ? "#ff2d55" : obj.stroke}
        strokeWidth={selected ? 4 : (obj.strokeWidth || 3)}
        pointerLength={12}
        pointerWidth={12}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelect([obj.id]);
        }}
        onTap={(e) => { // Add tap for mobile
          e.cancelBubble = true;
          onSelect([obj.id]);
        }}
        hitStrokeWidth={20}
      />

      {/* ---------- START RECONNECT HANDLE (FIXED) ---------- */}
      {selected && (
        <Circle
          x={sx}
          y={sy}
          radius={7}
          fill="#fff"
          stroke="#ff2d55"
          strokeWidth={2}
          draggable
          onDragStart={(e) => {
            e.cancelBubble = true; // Stop stage from dragging
            // Pass the exact handle position
            onReconnectStart("start", { x: sx, y: sy });
          }}
          // Prevent drag end from firing on the stage
          onDragEnd={(e) => e.cancelBubble = true}
        />
      )}

      {/* ---------- END RECONNECT HANDLE (FIXED) ---------- */}
      {selected && (
        <Circle
          x={ex}
          y={ey}
          radius={7}
          fill="#fff"
          stroke="#ff2d55"
          strokeWidth={2}
          draggable
          onDragStart={(e) => {
            e.cancelBubble = true; // Stop stage from dragging
            // Pass the exact handle position
            onReconnectStart("end", { x: ex, y: ey });
          }}
          // Prevent drag end from firing on the stage
          onDragEnd={(e) => e.cancelBubble = true}
        />
      )}
    </>
  );
}

export default React.memo(Arrow);
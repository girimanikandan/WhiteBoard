import React, { useMemo } from "react";
import { Arrow as KArrow, Circle } from "react-konva";
import { connectPoints } from "../../../utils/arrowHelpers";

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
        strokeWidth={selected ? 4 : obj.strokeWidth}
        pointerLength={12}
        pointerWidth={12}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelect([obj.id]);
        }}
        hitStrokeWidth={20}
      />

      {/* ---------- START RECONNECT HANDLE ---------- */}
      {selected && (
        <Circle
          x={sx}
          y={sy}
          radius={7}
          fill="#fff"
          stroke="#ff2d55"
          strokeWidth={2}
          draggable
          onDragStart={() => onReconnectStart("start")}
        />
      )}

      {/* ---------- END RECONNECT HANDLE ---------- */}
      {selected && (
        <Circle
          x={ex}
          y={ey}
          radius={7}
          fill="#fff"
          stroke="#ff2d55"
          strokeWidth={2}
          draggable
          onDragStart={() => onReconnectStart("end")}
        />
      )}
    </>
  );
}

export default React.memo(Arrow);

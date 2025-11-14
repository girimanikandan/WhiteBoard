import React, { useState } from "react";
import { Arrow as KArrow, Circle, Line } from "react-konva";
import { connectPoints, getNearestObj } from "../../../utils/arrowHelpers.js";

function Arrow({
  obj, selected, onSelect, objectsMap, onReconnectStart,
  isDraggingEndpoint, dragInProgress, dragPosition, hoveringObj
}) {
  const startObj = objectsMap[obj.startId];
  const endObj = objectsMap[obj.endId];
  if (!startObj || !endObj) return null;

  // Default endpoints
  const pts = connectPoints(startObj, endObj);
  const [sx, sy, ex, ey] = pts;

  // If dragging, use dragPosition for preview
  const previewPts = isDraggingEndpoint
    ? (isDraggingEndpoint === "start"
        ? [dragPosition.x, dragPosition.y, ex, ey]
        : [sx, sy, dragPosition.x, dragPosition.y])
    : pts;

  return (
    <>
      <KArrow
        id={obj.id}
        points={previewPts}
        stroke={selected ? "#ff2d55" : obj.stroke}
        fill={selected ? "#ff2d55" : obj.stroke}
        strokeWidth={selected ? 4 : (obj.strokeWidth || 3)}
        pointerLength={12}
        pointerWidth={12}
        onClick={(e) => {
          e.cancelBubble = true;
          onSelect([obj.id]);
        }}
        onTap={(e) => { e.cancelBubble = true; onSelect([obj.id]); }}
        hitStrokeWidth={20}
      />

      {selected && !isDraggingEndpoint && (
        <>
          <Circle
            x={sx} y={sy} radius={7} fill="#fff" stroke="#ff2d55" strokeWidth={2}
            draggable
            onDragStart={(e) => {
              e.cancelBubble = true;
              onReconnectStart("start", { x: sx, y: sy });
            }}
            onDragMove={(e) => dragInProgress("start", e.target.position())}
            onDragEnd={(e) => {
              e.cancelBubble = true;
              const targetObj = getNearestObj(objectsMap, e.target.position());
              onReconnectStart("start", targetObj ? { objId: targetObj.id } : e.target.position());
            }}
          />
          <Circle
            x={ex} y={ey} radius={7} fill="#fff" stroke="#ff2d55" strokeWidth={2}
            draggable
            onDragStart={(e) => {
              e.cancelBubble = true;
              onReconnectStart("end", { x: ex, y: ey });
            }}
            onDragMove={(e) => dragInProgress("end", e.target.position())}
            onDragEnd={(e) => {
              e.cancelBubble = true;
              const targetObj = getNearestObj(objectsMap, e.target.position());
              onReconnectStart("end", targetObj ? { objId: targetObj.id } : e.target.position());
            }}
          />
        </>
      )}

      {hoveringObj && (
        <Circle
          x={hoveringObj.x}
          y={hoveringObj.y}
          radius={hoveringObj.radius + 5}
          fill="rgba(255,45,85,0.2)"
          stroke="#ff2d55"
          strokeWidth={2}
        />
      )}
    </>
 );
}
export default React.memo(Arrow);

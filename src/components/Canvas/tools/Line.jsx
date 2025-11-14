// src/components/Canvas/tools/Line.jsx
import React, { useCallback } from "react";
import { Line as KonvaLine } from "react-konva";

const Line = React.memo(({ obj, selected, onSelect, onUpdate }) => {
  const handleClick = useCallback((e) => {
    e.cancelBubble = true;
    onSelect([obj.id]);
  }, [obj.id, onSelect]);

  const handleDragEnd = useCallback((e) => {
    const node = e.target;
    onUpdate(obj.id, {
      x: node.x(),
      y: node.y(),
    });
  }, [obj.id, onUpdate]);

  return (
    <KonvaLine
      id={obj.id}
      points={obj.points}
      x={obj.x || 0}
      y={obj.y || 0}
      stroke={selected ? "#EF4444" : (obj.stroke || "#000000")}
      strokeWidth={selected ? (obj.strokeWidth || 3) + 2 : (obj.strokeWidth || 3)}
      lineCap="round"
      lineJoin="round"
      draggable
      perfectDrawEnabled={false}
      shadowForStrokeEnabled={false}
      hitStrokeWidth={15}
      onClick={handleClick}
      onDragEnd={handleDragEnd}
    />
  );
});

export default Line;
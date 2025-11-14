// src/components/Canvas/tools/Arrow.jsx
import React, { useMemo, useCallback } from "react";
import { Arrow as KonvaArrow } from "react-konva";

// Helper function moved OUTSIDE the component for stable reference
const getObjectCenter = (object) => {
  if (!object) return { x: 0, y: 0 };
  
  switch (object.type) {
    // These types use obj.x/y as their center (due to offsetX/Y)
    case 'sticky':
    case 'image':
    case 'circle':
      return { 
        x: object.x || 0, 
        y: object.y || 0 
      };

    // These types use obj.x/y as top-left
    case 'rect':
      return {
        x: (object.x || 0) + (object.width / 2 || 0),
        y: (object.y || 0) + (object.height / 2 || 0)
      };
    case 'text':
      return {
        x: (object.x || 0) + (object.width / 2 || 50),
        y: (object.y || 0) + 12 // Approx center for text
      };

    // Fallback for line, freehand, etc.
    default:
      return { 
        x: object.x || 0, 
        y: object.y || 0 
      };
  }
};

const Arrow = React.memo(function Arrow({ 
  obj, 
  selected, 
  onSelect, 
  onUpdate,
  objectsMap = {} // Default to empty object
}) {

  // Calculate connection points based on connected objects
  const points = useMemo(() => {
    // If arrow has manual points, use them
    if (obj.points && obj.points.length >= 4) {
      return obj.points;
    }

    // If connected to objects, calculate points
    if (obj.startId && obj.endId) {
      const startObj = objectsMap[obj.startId];
      const endObj = objectsMap[obj.endId];
      
      if (!startObj || !endObj) {
        return obj.points || [obj.x || 0, obj.y || 0, (obj.x || 0) + 100, (obj.y || 0) + 100];
      }

      // Get center points of connected objects
      const startCenter = getObjectCenter(startObj);
      const endCenter = getObjectCenter(endObj);

      return [startCenter.x, startCenter.y, endCenter.x, endCenter.y];
    }

    // Fallback to default points
    return obj.points || [obj.x || 0, obj.y || 0, (obj.x || 0) + 100, (obj.y || 0) + 100];
  // getObjectCenter removed from dependency array
  }, [obj.startId, obj.endId, obj.points, obj.x, obj.y, objectsMap]);


  const handleClick = useCallback((e) => {
    e.cancelBubble = true;
    onSelect(obj.id);
  }, [obj.id, onSelect]);

  const handleDrag = useCallback((e) => {
    // For manual arrows (not connected), allow dragging
    if (!obj.startId && !obj.endId) {
      const node = e.target;
      onUpdate(obj.id, {
        x: node.x(),
        y: node.y(),
        points: [
          node.x(),
          node.y(),
          node.x() + (obj.points?.[2] - obj.points?.[0] || 100),
          node.y() + (obj.points?.[3] - obj.points?.[1] || 100)
        ]
      });
    }
  }, [obj.id, obj.startId, obj.endId, obj.points, onUpdate]);

  // Determine if arrow is draggable
  const isDraggable = !obj.startId && !obj.endId;

  // Calculate stroke color - selected arrows are red, others use their color
  const strokeColor = selected ? "#EF4444" : (obj.stroke || "#3B82F6");

  return (
    <KonvaArrow
      id={obj.id}
      points={points}
      // x/y should be 0 for connected arrows, as points are absolute
      x={isDraggable ? (obj.x || 0) : 0}
      y={isDraggable ? (obj.y || 0) : 0}
      stroke={strokeColor}
      strokeWidth={selected ? (obj.strokeWidth || 3) + 2 : (obj.strokeWidth || 3)}
      fill={strokeColor}
      pointerLength={10}
      pointerWidth={8}
      lineCap="round"
      lineJoin="round"
      
      // Performance optimizations
      perfectDrawEnabled={false}
      shadowForStrokeEnabled={false}
      listening={true}
      hitStrokeWidth={20}
      
      // Events
      onClick={handleClick}
      onDragMove={isDraggable ? handleDrag : undefined}
      onDragEnd={isDraggable ? handleDrag : undefined}
      
      // Draggable only if not connected to objects
      draggable={isDraggable}
    />
  );
}, (prevProps, nextProps) => {
  // --- CORRECTED MEMO FUNCTION ---
  // Custom comparison for memoization
  if (prevProps.obj.id !== nextProps.obj.id) return false;
  if (prevProps.selected !== nextProps.selected) return false;

  const prevObj = prevProps.obj;
  const nextObj = nextProps.obj;

  if (prevObj.stroke !== nextObj.stroke) return false;
  if (prevObj.strokeWidth !== nextObj.strokeWidth) return false;
  if (prevObj.startId !== nextObj.startId) return false;
  if (prevObj.endId !== nextObj.endId) return false;
  
  // Check if connected objects' positions have changed
  const prevStart = prevProps.objectsMap[prevProps.obj.startId];
  const nextStart = nextProps.objectsMap[nextProps.obj.startId];
  if (prevStart?.x !== nextStart?.x || prevStart?.y !== nextStart?.y) {
    return false;
  }
  
  const prevEnd = prevProps.objectsMap[prevProps.obj.endId];
  const nextEnd = nextProps.objectsMap[nextProps.obj.endId];
  if (prevEnd?.x !== nextEnd?.x || prevEnd?.y !== nextEnd?.y) {
    return false;
  }

  // Check if component is switching from/to manual points
  if ((prevObj.points && !nextObj.points) || (!prevObj.points && nextObj.points)) {
    return false;
  }

  // If not connected, check manual position
  if (!prevObj.startId) {
    if (prevObj.x !== nextObj.x || prevObj.y !== nextObj.y) return false;
  }
  
  return true;
});

Arrow.displayName = "Arrow";

export default Arrow;
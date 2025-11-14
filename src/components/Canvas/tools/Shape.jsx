// src/components/Canvas/tools/Shape.jsx
import React, { useRef, useCallback, useMemo } from "react";
import { Rect, Circle } from "react-konva";

// --- FIX: Add onLiveUpdate to props ---
function Shape({ obj, selected, onSelect, onUpdate, onLiveUpdate }) {
  const shapeRef = useRef();
  const lastUpdateRef = useRef(0); // Renamed for drag + transform
  const THROTTLE_MS = 16; // Throttle updates to ~60fps
  const isDraggingRef = useRef(false);

  // Memoized shape configuration
  const shapeConfig = useMemo(() => {
    // Determine fill color
    const fill = obj.fill || (obj.type === "circle" ? "#8ECAE6" : "#D1D1D1");
    // Determine stroke
    const stroke = selected ? "#EF4444" : "transparent";
    const strokeWidth = selected ? 2 : 0;

    const baseConfig = {
      id: obj.id,
      ref: shapeRef,
      x: obj.x,
      y: obj.y,
      rotation: obj.rotation || 0,
      fill: fill,
      stroke: stroke,
      strokeWidth: strokeWidth,
      draggable: true,
      perfectDrawEnabled: false,
      shadowForStrokeEnabled: false,
      listening: true,
      hitStrokeWidth: 15,
      _useStrictMode: false,
    };

    if (obj.type === "rect") {
      return {
        ...baseConfig,
        width: obj.width,
        height: obj.height,
        cornerRadius: 4, // Add some rounding
      };
    } else {
      return {
        ...baseConfig,
        radius: obj.radius,
      };
    }
  }, [obj.id, obj.x, obj.y, obj.rotation, obj.fill, obj.type, obj.width, obj.height, obj.radius, selected]);

  // Optimized click handler
  const handleClick = useCallback((e) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      return;
    }
    e.cancelBubble = true;
    onSelect(obj.id);
  }, [obj.id, onSelect]);

  // Track drag start
  const handleDragStart = useCallback(() => {
    isDraggingRef.current = true;
  }, []);

  // --- START: MODIFIED handleDragMove ---
  // Throttled drag move handler
  const handleDragMove = useCallback((e) => {
    // --- THIS IS THE FIX: Uncommented and changed to onLiveUpdate ---
    
    const now = Date.now();
    if (now - lastUpdateRef.current < THROTTLE_MS) {
      return;
    }
    lastUpdateRef.current = now;

    const node = e.target;
    // --- FIX: Use onLiveUpdate ---
    if (onLiveUpdate) {
      onLiveUpdate(obj.id, {
        x: node.x(),
        y: node.y(),
      });
    }
    
    // --- END OF FIX ---
  }, [obj.id, onLiveUpdate]); // --- FIX: Add onLiveUpdate to dependencies ---
  // --- END: MODIFIED handleDragMove ---

  // Optimized drag end handler
  const handleDragEnd = useCallback((e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;

    const node = e.target;
    onUpdate(obj.id, {
      x: node.x(),
      y: node.y(),
    });
  }, [obj.id, onUpdate]);

  // Throttled transform handler
  const handleTransformEnd = useCallback((e) => {
    const now = Date.now();
    if (now - lastUpdateRef.current < THROTTLE_MS) {
      return;
    }
    lastUpdateRef.current = now;

    const node = shapeRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    node.scaleX(1);
    node.scaleY(1);

    if (obj.type === "rect") {
      onUpdate(obj.id, {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        width: Math.max(20, obj.width * scaleX),
        height: Math.max(20, obj.height * scaleY),
      });
    } else if (obj.type === "circle") {
      const averageScale = (scaleX + scaleY) / 2;
      const newRadius = Math.max(10, obj.radius * averageScale);
      
      onUpdate(obj.id, {
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
        radius: newRadius,
      });
    }
  }, [obj.id, obj.type, obj.width, obj.height, obj.radius, onUpdate]);

  const renderRect = () => (
    <Rect
      {...shapeConfig}
      onClick={handleClick}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove} // Added for live arrow updates
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
    />
  );

  const renderCircle = () => (
    <Circle
      {...shapeConfig}
      onClick={handleClick}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove} // Added for live arrow updates
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
    />
  );

  return obj.type === "circle" ? renderCircle() : renderRect();
}

const areEqual = (prevProps, nextProps) => {
  if (prevProps === nextProps) return true;
  
  const prevObj = prevProps.obj;
  const nextObj = nextProps.obj;

  if (prevProps.selected !== nextProps.selected) return false;
  if (prevObj.id !== nextObj.id) return false;
  if (prevObj.type !== nextObj.type) return false;
  if (prevObj.x !== nextObj.x) return false;
  if (prevObj.y !== nextObj.y) return false;
  if (prevObj.rotation !== nextObj.rotation) return false;
  if (prevObj.fill !== nextObj.fill) return false;

  if (prevObj.type === "rect") {
    if (prevObj.width !== nextObj.width) return false;
    if (prevObj.height !== nextObj.height) return false;
  } else if (prevObj.type === "circle") {
    if (prevObj.radius !== nextObj.radius) return false;
  }

  if (prevProps.onSelect !== nextProps.onSelect) return false;
  if (prevProps.onUpdate !== nextProps.onUpdate) return false;
  // --- FIX: Add check for onLiveUpdate ---
  if (prevProps.onLiveUpdate !== nextProps.onLiveUpdate) return false;

  return true;
};

export default React.memo(Shape, areEqual);
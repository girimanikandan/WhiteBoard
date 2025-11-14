// src/components/Canvas/tools/Shape.jsx
import React, { useRef, useCallback, useMemo } from "react";
import { Rect, Circle } from "react-konva";

/**
 * Shape.jsx — Ultra Optimized Version
 * Performance features:
 *  - Throttled transform updates
 *  - Optimized event handlers
 *  - Smart re-rendering
 *  - Memory leak prevention
 */

function Shape({ obj, selected, onSelect, onUpdate }) {
  const shapeRef = useRef();
  const lastTransformRef = useRef(0);
  const TRANSFORM_THROTTLE_MS = 32; // ~30fps for transforms
  const isDraggingRef = useRef(false);

  // Memoized shape configuration to prevent re-renders
  const shapeConfig = useMemo(() => {
    const baseConfig = {
      id: obj.id,
      ref: shapeRef,
      x: obj.x,
      y: obj.y,
      rotation: obj.rotation || 0,
      fill: obj.fill || (obj.type === "circle" ? "#8ECAE6" : "#D1D1D1"),
      draggable: true,
      perfectDrawEnabled: false,
      shadowForStrokeEnabled: false,
      listening: true,
      hitStrokeWidth: 15, // Larger hit area for better UX
      _useStrictMode: false,
    };

    if (obj.type === "rect") {
      return {
        ...baseConfig,
        width: obj.width,
        height: obj.height,
      };
    } else {
      return {
        ...baseConfig,
        radius: obj.radius,
      };
    }
  }, [obj.id, obj.x, obj.y, obj.rotation, obj.fill, obj.type, obj.width, obj.height, obj.radius]);

  // Optimized click handler with drag detection
  const handleClick = useCallback((e) => {
    // Ignore clicks that are part of drag operations
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
    if (now - lastTransformRef.current < TRANSFORM_THROTTLE_MS) {
      return;
    }
    lastTransformRef.current = now;

    const node = shapeRef.current;
    if (!node) return;

    const scaleX = node.scaleX();
    const scaleY = node.scaleY();

    // Reset scale to avoid distortion
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
      // For circles, use average scale to maintain aspect ratio
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

  // Render rectangle with optimized props
  const renderRect = () => (
    <Rect
      {...shapeConfig}
      onClick={handleClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
    />
  );

  // Render circle with optimized props
  const renderCircle = () => (
    <Circle
      {...shapeConfig}
      onClick={handleClick}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onTransformEnd={handleTransformEnd}
    />
  );

  return obj.type === "circle" ? renderCircle() : renderRect();
}

// Advanced memoization with custom comparison
const areEqual = (prevProps, nextProps) => {
  // Quick reference comparison
  if (prevProps === nextProps) return true;
  
  const prevObj = prevProps.obj;
  const nextObj = nextProps.obj;

  // Check if essential properties changed
  if (prevProps.selected !== nextProps.selected) return false;
  if (prevObj.id !== nextObj.id) return false;
  if (prevObj.type !== nextObj.type) return false;
  if (prevObj.x !== nextObj.x) return false;
  if (prevObj.y !== nextObj.y) return false;
  if (prevObj.rotation !== nextObj.rotation) return false;
  if (prevObj.fill !== nextObj.fill) return false;

  // Type-specific property checks
  if (prevObj.type === "rect") {
    if (prevObj.width !== nextObj.width) return false;
    if (prevObj.height !== nextObj.height) return false;
  } else if (prevObj.type === "circle") {
    if (prevObj.radius !== nextObj.radius) return false;
  }

  // Check if event handlers changed (should be stable with useCallback)
  if (prevProps.onSelect !== nextProps.onSelect) return false;
  if (prevProps.onUpdate !== nextProps.onUpdate) return false;

  return true;
};

export default React.memo(Shape, areEqual);
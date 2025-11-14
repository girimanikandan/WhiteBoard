// src/components/Canvas/tools/Freehand.jsx
import React, { useMemo, useCallback } from "react";
import { Line } from "react-konva";

/**
 * Freehand.jsx - Optimized Version
 * 
 * Props:
 * - obj: { id, type:"freehand", points[], stroke, strokeWidth }
 * - onSelect(id)
 * - selected
 */

const Freehand = React.memo(({ obj, selected, onSelect }) => {
  // Optimize points array - simplify if too many points
  const optimizedPoints = useMemo(() => {
    if (!obj.points || obj.points.length < 10) {
      return obj.points;
    }
    
    // Use Ramer-Douglas-Peucker algorithm for complex paths
    return simplifyPoints(obj.points, 0.5);
  }, [obj.points]);

  // Memoized click handler
  const handleClick = useCallback((e) => {
    e.cancelBubble = true;
    onSelect(obj.id);
  }, [obj.id, onSelect]);

  // Calculate if this freehand is worth rendering (very small strokes)
  const shouldRender = useMemo(() => {
    if (!optimizedPoints || optimizedPoints.length < 4) return false;
    
    // Check if the stroke has meaningful size
    const bounds = calculateBounds(optimizedPoints);
    const width = bounds.maxX - bounds.minX;
    const height = bounds.maxY - bounds.minY;
    
    // Don't render very tiny strokes (likely accidental clicks)
    return width > 2 && height > 2;
  }, [optimizedPoints]);

  if (!shouldRender) {
    return null;
  }

  return (
    <Line
      id={obj.id}
      points={optimizedPoints}
      stroke={selected ? "#EF4444" : (obj.stroke || "#000")}
      strokeWidth={selected ? (obj.strokeWidth || 3) + 2 : (obj.strokeWidth || 3)}
      tension={0.4}
      lineCap="round"
      lineJoin="round"
      
      // ULTRA Performance optimizations:
      listening={false} // No hit detection
      perfectDrawEnabled={false} // Faster rendering
      shadowForStrokeEnabled={false} // No shadows
      hitStrokeWidth={0} // No hit area
      globalCompositeOperation="source-over"
      
      // Optimize rendering quality vs performance
      strokeScaleEnabled={false} // Don't scale stroke with zoom
      dashEnabled={false}
      
      // Event handlers
      onClick={handleClick}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison function for React.memo
  if (prevProps.obj.id !== nextProps.obj.id) return false;
  if (prevProps.selected !== nextProps.selected) return false;
  
  // Deep compare points array (most important for freehand)
  const prevPoints = prevProps.obj.points;
  const nextPoints = nextProps.obj.points;
  
  if (prevPoints === nextPoints) return true;
  if (!prevPoints || !nextPoints) return false;
  if (prevPoints.length !== nextPoints.length) return false;
  
  // Only re-render if points actually changed significantly
  for (let i = 0; i < prevPoints.length; i += 10) { // Sample every 10th point
    if (prevPoints[i] !== nextPoints[i]) return false;
  }
  
  return true;
});

// Point simplification algorithm (Ramer-Douglas-Peucker)
function simplifyPoints(points, tolerance = 1.0) {
  if (points.length <= 4) return points; // Too short to simplify
  
  const firstPoint = 0;
  const lastPoint = points.length - 2; // Last x coordinate
  const simplifiedIndices = [firstPoint];
  
  function simplifySegment(start, end) {
    let maxDistance = 0;
    let maxIndex = 0;
    
    const startX = points[start];
    const startY = points[start + 1];
    const endX = points[end];
    const endY = points[end + 1];
    
    // Find point with maximum distance from segment
    for (let i = start + 2; i < end; i += 2) {
      const distance = perpendicularDistance(
        points[i], points[i + 1],
        startX, startY,
        endX, endY
      );
      
      if (distance > maxDistance) {
        maxDistance = distance;
        maxIndex = i;
      }
    }
    
    // If max distance is greater than tolerance, recursively simplify
    if (maxDistance > tolerance && maxIndex > 0) {
      simplifySegment(start, maxIndex);
      simplifiedIndices.push(maxIndex);
      simplifySegment(maxIndex, end);
    }
  }
  
  simplifySegment(firstPoint, lastPoint);
  simplifiedIndices.push(lastPoint);
  
  // Build simplified points array
  const simplified = [];
  simplifiedIndices.forEach(index => {
    simplified.push(points[index], points[index + 1]);
  });
  
  return simplified;
}

// Calculate perpendicular distance from point to line
function perpendicularDistance(px, py, x1, y1, x2, y2) {
  const numerator = Math.abs((y2 - y1) * px - (x2 - x1) * py + x2 * y1 - y2 * x1);
  const denominator = Math.sqrt((y2 - y1) ** 2 + (x2 - x1) ** 2);
  return numerator / denominator;
}

// Calculate bounding box of points
function calculateBounds(points) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  for (let i = 0; i < points.length; i += 2) {
    const x = points[i];
    const y = points[i + 1];
    
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  
  return { minX, minY, maxX, maxY };
}

Freehand.displayName = "Freehand";

export default Freehand;
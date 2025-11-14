// ========================================================
// konvaHelpers.js - Optimized Version
// Common utilities for Konva board logic with performance enhancements
// ========================================================

// Cache for frequently used calculations
const calculationCache = new Map();
const CACHE_TTL = 1000; // 1 second cache

/**
 * Get pointer position corrected for zoom & pan (optimized)
 * Uses caching for frequent calls during drag operations
 */
export function getRelativePointer(stage) {
  if (!stage) return { x: 0, y: 0 };
  
  const cacheKey = `pointer_${stage._id}`;
  const now = Date.now();
  const cached = calculationCache.get(cacheKey);
  
  // Return cached value if recent (for drag operations)
  if (cached && now - cached.timestamp < 16) { // ~60fps
    return cached.value;
  }
  
  const pointer = stage.getPointerPosition();
  if (!pointer) return { x: 0, y: 0 };
  
  const scale = stage.scaleX();
  const result = {
    x: (pointer.x - stage.x()) / scale,
    y: (pointer.y - stage.y()) / scale,
  };
  
  // Cache the result
  calculationCache.set(cacheKey, {
    value: result,
    timestamp: now
  });
  
  return result;
}

/**
 * Get optimized bounding box of any Konva node
 * Uses direct property access for better performance
 */
export function getNodeBox(node) {
  if (!node) return { x: 0, y: 0, width: 0, height: 0 };
  
  try {
    // For common node types, use direct property access
    if (node.getClientRect) {
      const box = node.getClientRect({ skipTransform: true }); // Skip transform for performance
      return {
        x: box.x,
        y: box.y,
        width: box.width,
        height: box.height,
      };
    }
    
    // Fallback for nodes without getClientRect
    return {
      x: node.x ? node.x() : 0,
      y: node.y ? node.y() : 0,
      width: node.width ? node.width() : 0,
      height: node.height ? node.height() : 0,
    };
  } catch (error) {
    console.warn('Error getting node box:', error);
    return { x: 0, y: 0, width: 0, height: 0 };
  }
}

/**
 * Fast intersection check between two boxes
 * Optimized for minimal operations
 */
export function isIntersecting(boxA, boxB) {
  if (!boxA || !boxB) return false;
  
  return (
    boxA.x < boxB.x + boxB.width &&
    boxA.x + boxA.width > boxB.x &&
    boxA.y < boxB.y + boxB.height &&
    boxA.y + boxA.height > boxB.y
  );
}

/**
 * Enhanced intersection check with tolerance
 */
export function isIntersectingWithTolerance(boxA, boxB, tolerance = 0) {
  if (!boxA || !boxB) return false;
  
  return (
    boxA.x - tolerance < boxB.x + boxB.width + tolerance &&
    boxA.x + boxA.width + tolerance > boxB.x - tolerance &&
    boxA.y - tolerance < boxB.y + boxB.height + tolerance &&
    boxA.y + boxA.height + tolerance > boxB.y - tolerance
  );
}

/**
 * Convert screen coordinates to canvas coordinates (optimized)
 */
export function screenToCanvas(stage, x, y) {
  if (!stage) return { x: 0, y: 0 };
  
  const scale = stage.scaleX();
  return {
    x: (x - stage.x()) / scale,
    y: (y - stage.y()) / scale,
  };
}

/**
 * Batch transformer attachment for multiple nodes
 * Reduces layer redraws
 */
export function attachTransformer(layer, selectedIds) {
  if (!layer) return;
  
  const transformer = layer.findOne("Transformer");
  if (!transformer) return;
  
  const nodes = [];
  
  // Use faster node finding for multiple selections
  for (let i = 0; i < selectedIds.length; i++) {
    const node = layer.findOne("#" + selectedIds[i]);
    if (node) {
      nodes.push(node);
    }
  }
  
  if (nodes.length > 0) {
    transformer.nodes(nodes);
  } else {
    transformer.nodes([]);
  }
  
  // Use batchDraw for better performance
  layer.batchDraw();
}

/**
 * Optimized grid snapping with configurable grid size
 */
export function snapToGrid(value, gridSize = 10) {
  return Math.round(value / gridSize) * gridSize;
}

/**
 * Vector-based grid snapping for better performance
 */
export function snapVectorToGrid(vector, gridSize = 10) {
  return {
    x: snapToGrid(vector.x, gridSize),
    y: snapToGrid(vector.y, gridSize),
  };
}

/**
 * Safe object drag movement with boundary constraints
 */
export function applyDragBounds(pos, bounds = {
  minX: -10000, maxX: 10000, 
  minY: -10000, maxY: 10000
}) {
  return {
    x: Math.max(bounds.minX, Math.min(pos.x, bounds.maxX)),
    y: Math.max(bounds.minY, Math.min(pos.y, bounds.maxY)),
  };
}

/**
 * Calculate distance between two points (optimized)
 */
export function distance(pointA, pointB) {
  const dx = pointB.x - pointA.x;
  const dy = pointB.y - pointA.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Fast distance check without square root (for comparisons)
 */
export function distanceSquared(pointA, pointB) {
  const dx = pointB.x - pointA.x;
  const dy = pointB.y - pointA.y;
  return dx * dx + dy * dy;
}

/**
 * Check if point is inside rectangle (optimized)
 */
export function isPointInRect(point, rect, tolerance = 0) {
  return (
    point.x >= rect.x - tolerance &&
    point.x <= rect.x + rect.width + tolerance &&
    point.y >= rect.y - tolerance &&
    point.y <= rect.y + rect.height + tolerance
  );
}

/**
 * Find the closest point on a line segment to a given point
 * Useful for connector tools
 */
export function closestPointOnLine(point, lineStart, lineEnd) {
  const A = point.x - lineStart.x;
  const B = point.y - lineStart.y;
  const C = lineEnd.x - lineStart.x;
  const D = lineEnd.y - lineStart.y;
  
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let param = -1;
  
  if (lenSq !== 0) {
    param = dot / lenSq;
  }
  
  let xx, yy;
  
  if (param < 0) {
    xx = lineStart.x;
    yy = lineStart.y;
  } else if (param > 1) {
    xx = lineEnd.x;
    yy = lineEnd.y;
  } else {
    xx = lineStart.x + param * C;
    yy = lineStart.y + param * D;
  }
  
  return { x: xx, y: yy };
}

/**
 * Calculate center point of a bounding box
 */
export function getCenter(box) {
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
  };
}

/**
 * Merge multiple bounding boxes into a union
 */
export function mergeBoundingBoxes(boxes) {
  if (!boxes.length) return { x: 0, y: 0, width: 0, height: 0 };
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  for (let i = 0; i < boxes.length; i++) {
    const box = boxes[i];
    minX = Math.min(minX, box.x);
    minY = Math.min(minY, box.y);
    maxX = Math.max(maxX, box.x + box.width);
    maxY = Math.max(maxY, box.y + box.height);
  }
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Check if a node is visible in the viewport
 * Useful for virtual scrolling/rendering
 */
export function isNodeInViewport(node, viewport, padding = 100) {
  const nodeBox = getNodeBox(node);
  return isIntersectingWithTolerance(nodeBox, viewport, padding);
}

/**
 * Calculate scale with constraints
 */
export function calculateScale(newScale, minScale = 0.1, maxScale = 10) {
  return Math.max(minScale, Math.min(newScale, maxScale));
}

/**
 * Clear calculation cache (call periodically)
 */
export function clearCalculationCache() {
  calculationCache.clear();
}

/**
 * Clean up old cache entries (call in useEffect cleanup)
 */
export function cleanupOldCacheEntries() {
  const now = Date.now();
  for (let [key, value] of calculationCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      calculationCache.delete(key);
    }
  }
}

/**
 * Performance measurement utility
 */
export function withPerformanceTimer(name, fn) {
  if (process.env.NODE_ENV === 'development') {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${name} took ${end - start}ms`);
    return result;
  }
  return fn();
}

// Export performance utilities for monitoring
export const PerformanceUtils = {
  clearCalculationCache,
  cleanupOldCacheEntries,
  withPerformanceTimer,
};
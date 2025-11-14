// src/components/Presence/PresenceCursors.jsx
import React, { useMemo, useRef, useEffect } from "react";
import { Group, Circle, Text } from "react-konva";

// Color palette for user cursors
const USER_COLORS = [
  "#EF4444", "#F59E0B", "#10B981", "#3B82F6", 
  "#8B5CF6", "#EC4899", "#6366F1", "#14B8A6"
];

// Color cache for consistent user colors
const colorCache = new Map();

const getColorForUser = (userId) => {
  if (!userId) return "#3B82F6";
  
  if (colorCache.has(userId)) {
    return colorCache.get(userId);
  }
  
  // Generate consistent color based on user ID
  const hash = userId.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const colorIndex = Math.abs(hash) % USER_COLORS.length;
  const color = USER_COLORS[colorIndex];
  
  colorCache.set(userId, color);
  return color;
};

// Animated cursor with smooth movement
const AnimatedCursor = React.memo(({ cursor }) => {
  const groupRef = useRef();
  const animationRef = useRef();
  const targetPosition = useRef({ x: cursor.x, y: cursor.y - 10 });
  const currentPosition = useRef(targetPosition.current);
  
  const userColor = useMemo(() => 
    cursor.color || getColorForUser(cursor.userId),
    [cursor.color, cursor.userId]
  );

  // Smooth animation for cursor movement
  useEffect(() => {
    targetPosition.current = { x: cursor.x, y: cursor.y - 10 };
    
    const animate = () => {
      if (!groupRef.current) return;
      
      const current = currentPosition.current;
      const target = targetPosition.current;
      
      // Smooth interpolation (easing)
      const dx = target.x - current.x;
      const dy = target.y - current.y;
      
      if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
        current.x += dx * 0.3; // Adjust smoothing factor as needed
        current.y += dy * 0.3;
        
        groupRef.current.position(current);
        groupRef.current.getLayer()?.batchDraw();
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    
    animationRef.current = requestAnimationFrame(animate);
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [cursor.x, cursor.y]);

  // Clean up animation on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <Group
      ref={groupRef}
      listening={false}
      perfectDrawEnabled={false}
      shadowForStrokeEnabled={false}
    >
      {/* Cursor pointer */}
      <Circle
        radius={6}
        fill={userColor}
        stroke="#ffffff"
        strokeWidth={1.5}
        shadowColor="rgba(0,0,0,0.3)"
        shadowBlur={4}
        shadowOffset={{ x: 0, y: 1 }}
        perfectDrawEnabled={false}
        listening={false}
      />
      
      {/* User name label */}
      <Text
        text={cursor.name || "User"}
        x={10}
        y={-8}
        fontSize={12}
        fontFamily="Arial, sans-serif"
        fill={userColor}
        fontStyle="bold"
        perfectDrawEnabled={false}
        listening={false}
        padding={4}
        background={userColor}
        cornerRadius={3}
      />
      
      {/* Pointer line */}
      <Group
        points={[0, 0, 0, 10]}
        stroke={userColor}
        strokeWidth={1.5}
        lineCap="round"
        perfectDrawEnabled={false}
        listening={false}
      />
    </Group>
  );
}, (prevProps, nextProps) => {
  const prev = prevProps.cursor;
  const next = nextProps.cursor;
  
  // Only re-render if user data changes, not on every position change
  return (
    prev.userId === next.userId &&
    prev.name === next.name &&
    prev.color === next.color
    // Note: We're not comparing x,y here because we handle animation separately
  );
});

AnimatedCursor.displayName = "AnimatedCursor";

function PresenceCursors({ cursors = [] }) {
  // Optimized cursor processing with throttling
  const processedCursors = useMemo(() => {
    const uniqueCursors = [];
    const seen = new Set();
    
    for (const cursor of cursors) {
      if (!cursor || !cursor.userId || seen.has(cursor.userId)) continue;
      
      // Basic validation
      if (typeof cursor.x !== 'number' || typeof cursor.y !== 'number') continue;
      if (!isFinite(cursor.x) || !isFinite(cursor.y)) continue;
      
      // Filter out invalid positions
      if (cursor.x < -1000 || cursor.x > 5000 || cursor.y < -1000 || cursor.y > 5000) continue;
      
      seen.add(cursor.userId);
      uniqueCursors.push({
        ...cursor,
        name: cursor.name || `User${cursor.userId.slice(-4)}`,
        color: cursor.color || getColorForUser(cursor.userId)
      });
    }
    
    return uniqueCursors.sort((a, b) => a.userId.localeCompare(b.userId));
  }, [cursors]);

  // Don't render if no cursors
  if (processedCursors.length === 0) {
    return null;
  }

  return (
    <>
      {processedCursors.map((cursor) => (
        <AnimatedCursor
          key={cursor.userId}
          cursor={cursor}
        />
      ))}
    </>
  );
}

// Custom comparison for memoization
const areEqual = (prevProps, nextProps) => {
  // Only re-render if cursors array reference changes
  // The individual cursor comparisons are handled in AnimatedCursor
  return prevProps.cursors === nextProps.cursors;
};

export default React.memo(PresenceCursors, areEqual);
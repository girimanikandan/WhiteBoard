// src/hooks/useLayerPerformance.js
import { useRef, useCallback } from 'react';

export function useLayerPerformance() {
  const renderStatsRef = useRef({
    totalRenders: 0,
    lastRenderTime: 0,
    averageRenderTime: 0,
  });

  const measureRender = useCallback((componentName) => {
    if (process.env.NODE_ENV !== 'development') return;

    const now = performance.now();
    const stats = renderStatsRef.current;
    
    if (stats.lastRenderTime > 0) {
      const renderTime = now - stats.lastRenderTime;
      stats.averageRenderTime = (stats.averageRenderTime * stats.totalRenders + renderTime) / (stats.totalRenders + 1);
    }
    
    stats.totalRenders++;
    stats.lastRenderTime = now;

    if (stats.totalRenders % 60 === 0) { // Log every 60 renders
      console.log(`[${componentName}] Render ${stats.totalRenders}: ${stats.averageRenderTime.toFixed(2)}ms avg`);
    }
  }, []);

  return { measureRender, getStats: () => renderStatsRef.current };
}
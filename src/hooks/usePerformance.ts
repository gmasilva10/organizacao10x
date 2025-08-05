import { useEffect, useRef } from 'react';

interface PerformanceEntry {
  componentName: string;
  renderTime: number;
  timestamp: number;
}

const performanceLog: PerformanceEntry[] = [];

export const usePerformance = (componentName: string) => {
  const renderStart = useRef<number>(0);

  useEffect(() => {
    renderStart.current = performance.now();
  });

  useEffect(() => {
    if (renderStart.current > 0) {
      const renderTime = performance.now() - renderStart.current;
      
      if (renderTime > 16) { // Log if render takes more than one frame (16ms)
        const entry: PerformanceEntry = {
          componentName,
          renderTime,
          timestamp: Date.now()
        };
        
        performanceLog.push(entry);
        
        // Keep only last 100 entries
        if (performanceLog.length > 100) {
          performanceLog.shift();
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.warn(`🐌 Slow render detected: ${componentName} took ${renderTime.toFixed(2)}ms`);
        }
      }
    }
  });
};

export const getPerformanceReport = () => {
  const slowComponents = performanceLog
    .filter(entry => entry.renderTime > 50)
    .sort((a, b) => b.renderTime - a.renderTime);
    
  return {
    totalEntries: performanceLog.length,
    slowComponents: slowComponents.slice(0, 10),
    averageRenderTime: performanceLog.length > 0 
      ? performanceLog.reduce((sum, entry) => sum + entry.renderTime, 0) / performanceLog.length 
      : 0
  };
};

export const clearPerformanceLog = () => {
  performanceLog.length = 0;
};
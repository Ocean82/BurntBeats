
import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  memoryUsage?: number;
  connectionLatency: number;
  renderTime: number;
  lastUpdate: Date;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    connectionLatency: 0,
    renderTime: 0,
    lastUpdate: new Date()
  });

  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (process.env.NODE_ENV === 'development') {
      interval = setInterval(() => {
        measurePerformance();
      }, 10000); // Every 10 seconds in development
    } else {
      interval = setInterval(() => {
        measurePerformance();
      }, 60000); // Every minute in production
    }

    return () => clearInterval(interval);
  }, []);

  const measurePerformance = async () => {
    const startTime = performance.now();
    
    try {
      // Measure connection latency
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      const latency = performance.now() - startTime;

      // Get memory usage if available
      const memoryInfo = (performance as any).memory;
      const memoryUsage = memoryInfo ? 
        Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024) : undefined;

      // Measure render time
      const renderStart = performance.now();
      // Trigger a small re-render to measure
      setMetrics(prev => ({ ...prev }));
      const renderTime = performance.now() - renderStart;

      setMetrics({
        memoryUsage,
        connectionLatency: latency,
        renderTime,
        lastUpdate: new Date()
      });

      // Log performance issues
      if (latency > 1000) {
        console.warn(`High latency detected: ${Math.round(latency)}ms`);
      }
      
      if (memoryUsage && memoryUsage > 100) {
        console.warn(`High memory usage: ${memoryUsage}MB`);
      }

    } catch (error) {
      console.error('Performance measurement failed:', error);
    }
  };

  // Show performance overlay in development or when explicitly enabled
  const shouldShow = process.env.NODE_ENV === 'development' || 
    localStorage.getItem('show-performance') === 'true' || 
    isVisible;

  if (!shouldShow) {
    return (
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 w-3 h-3 bg-green-500 rounded-full opacity-50 hover:opacity-100 transition-opacity"
        title="Show performance metrics"
      />
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-80 text-white text-xs p-3 rounded-lg font-mono min-w-48">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">Performance</span>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-white"
          title="Hide metrics"
        >
          ×
        </button>
      </div>
      
      <div className="space-y-1">
        <div className="flex justify-between">
          <span>Latency:</span>
          <span className={metrics.connectionLatency > 500 ? 'text-red-400' : 'text-green-400'}>
            {Math.round(metrics.connectionLatency)}ms
          </span>
        </div>
        
        <div className="flex justify-between">
          <span>Render:</span>
          <span className={metrics.renderTime > 16 ? 'text-yellow-400' : 'text-green-400'}>
            {metrics.renderTime.toFixed(1)}ms
          </span>
        </div>
        
        {metrics.memoryUsage && (
          <div className="flex justify-between">
            <span>Memory:</span>
            <span className={metrics.memoryUsage > 100 ? 'text-red-400' : 'text-green-400'}>
              {metrics.memoryUsage}MB
            </span>
          </div>
        )}
        
        <div className="flex justify-between text-gray-400 text-xs">
          <span>Updated:</span>
          <span>{metrics.lastUpdate.toLocaleTimeString()}</span>
        </div>
      </div>
      
      <div className="mt-2 pt-2 border-t border-gray-600">
        <button
          onClick={measurePerformance}
          className="text-xs bg-blue-600 hover:bg-blue-700 px-2 py-1 rounded transition-colors"
        >
          Refresh
        </button>
      </div>
    </div>
  );
}

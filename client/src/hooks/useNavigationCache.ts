import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';

interface CacheEntry {
  data: any;
  timestamp: number;
  route: string;
  scrollPosition: { x: number; y: number };
}

interface NavigationCache {
  set: (key: string, data: any) => void;
  get: (key: string) => any;
  clear: () => void;
  has: (key: string) => boolean;
  getScrollPosition: (route: string) => { x: number; y: number };
  setScrollPosition: (route: string, position: { x: number; y: number }) => void;
}

class NavigationCacheManager {
  private cache = new Map<string, CacheEntry>();
  private readonly maxAge = 5 * 60 * 1000; // 5 minutes
  private readonly maxEntries = 50;

  set(key: string, data: any, route: string = '') {
    // Clean up old entries if we're at capacity
    if (this.cache.size >= this.maxEntries) {
      this.cleanup();
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      route,
      scrollPosition: { x: window.scrollX, y: window.scrollY }
    });
  }

  get(key: string): any {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    // Check if expired
    if (Date.now() - entry.timestamp > this.maxAge) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  clear() {
    this.cache.clear();
  }

  getScrollPosition(route: string): { x: number; y: number } {
    const entries = Array.from(this.cache.entries());
    for (const [, entry] of entries) {
      if (entry.route === route) {
        return entry.scrollPosition;
      }
    }
    return { x: 0, y: 0 };
  }

  setScrollPosition(route: string, position: { x: number; y: number }) {
    const entries = Array.from(this.cache.entries());
    for (const [key, entry] of entries) {
      if (entry.route === route) {
        entry.scrollPosition = position;
        this.cache.set(key, entry);
        break;
      }
    }
  }

  private cleanup() {
    // Remove oldest entries first
    const entries = Array.from(this.cache.entries());
    entries.sort(([, a], [, b]) => a.timestamp - b.timestamp);
    
    // Remove oldest 25% of entries
    const toRemove = Math.floor(entries.length * 0.25);
    for (let i = 0; i < toRemove; i++) {
      this.cache.delete(entries[i][0]);
    }
  }

  // Get cache statistics for debugging
  getStats() {
    return {
      size: this.cache.size,
      maxEntries: this.maxEntries,
      maxAge: this.maxAge,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Global cache instance
const globalCache = new NavigationCacheManager();

export function useNavigationCache(): NavigationCache {
  const [location] = useLocation();
  const previousLocationRef = useRef<string>('');

  // Save scroll position when leaving a route
  useEffect(() => {
    const handleBeforeUnload = () => {
      globalCache.setScrollPosition(previousLocationRef.current, {
        x: window.scrollX,
        y: window.scrollY
      });
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Handle route changes
  useEffect(() => {
    // Save scroll position of previous route
    if (previousLocationRef.current && previousLocationRef.current !== location) {
      globalCache.setScrollPosition(previousLocationRef.current, {
        x: window.scrollX,
        y: window.scrollY
      });
    }

    // Restore scroll position for current route after a brief delay
    const timer = setTimeout(() => {
      const savedPosition = globalCache.getScrollPosition(location);
      if (savedPosition.x !== 0 || savedPosition.y !== 0) {
        window.scrollTo(savedPosition.x, savedPosition.y);
      }
    }, 100);

    previousLocationRef.current = location;

    return () => clearTimeout(timer);
  }, [location]);

  const set = useCallback((key: string, data: any) => {
    globalCache.set(key, data, location);
  }, [location]);

  const get = useCallback((key: string) => {
    return globalCache.get(key);
  }, []);

  const clear = useCallback(() => {
    globalCache.clear();
  }, []);

  const has = useCallback((key: string) => {
    return globalCache.has(key);
  }, []);

  const getScrollPosition = useCallback((route: string) => {
    return globalCache.getScrollPosition(route);
  }, []);

  const setScrollPosition = useCallback((route: string, position: { x: number; y: number }) => {
    globalCache.setScrollPosition(route, position);
  }, []);

  return {
    set,
    get,
    clear,
    has,
    getScrollPosition,
    setScrollPosition
  };
}

// Export cache manager for advanced usage
export { globalCache };
import { useCallback, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { useNavigationCache } from './useNavigationCache';

interface NavigationState {
  canGoBack: boolean;
  canGoForward: boolean;
  goBack: () => void;
  goForward: () => void;
  currentIndex: number;
  historyLength: number;
}

interface HistoryEntry {
  path: string;
  timestamp: number;
  state?: any;
}

class NavigationHistory {
  private history: HistoryEntry[] = [];
  private currentIndex = -1;
  private maxHistorySize = 50;

  addEntry(path: string, state?: any) {
    const entry: HistoryEntry = {
      path,
      timestamp: Date.now(),
      state
    };

    // If we're not at the end of history, remove forward entries
    if (this.currentIndex < this.history.length - 1) {
      this.history = this.history.slice(0, this.currentIndex + 1);
    }

    this.history.push(entry);
    this.currentIndex = this.history.length - 1;

    // Limit history size
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
      this.currentIndex = this.history.length - 1;
    }
  }

  canGoBack(): boolean {
    return this.currentIndex > 0;
  }

  canGoForward(): boolean {
    return this.currentIndex < this.history.length - 1;
  }

  goBack(): HistoryEntry | null {
    if (this.canGoBack()) {
      this.currentIndex--;
      return this.history[this.currentIndex];
    }
    return null;
  }

  goForward(): HistoryEntry | null {
    if (this.canGoForward()) {
      this.currentIndex++;
      return this.history[this.currentIndex];
    }
    return null;
  }

  getCurrentEntry(): HistoryEntry | null {
    return this.history[this.currentIndex] || null;
  }

  getHistoryLength(): number {
    return this.history.length;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  clear() {
    this.history = [];
    this.currentIndex = -1;
  }

  // Get history for debugging
  getFullHistory(): HistoryEntry[] {
    return [...this.history];
  }
}

// Global navigation history
const globalNavHistory = new NavigationHistory();

export function useBackForwardNavigation(): NavigationState {
  const [location, setLocation] = useLocation();
  const cache = useNavigationCache();
  const isNavigatingRef = useRef(false);
  const lastLocationRef = useRef(location);

  // Handle route changes
  useEffect(() => {
    // Only add to history if this is a new navigation (not back/forward)
    if (!isNavigatingRef.current && location !== lastLocationRef.current) {
      globalNavHistory.addEntry(location);
    }
    
    isNavigatingRef.current = false;
    lastLocationRef.current = location;
  }, [location]);

  const goBack = useCallback(() => {
    const prevEntry = globalNavHistory.goBack();
    if (prevEntry) {
      isNavigatingRef.current = true;
      setLocation(prevEntry.path);
      
      // Restore any cached state for this route
      setTimeout(() => {
        const savedPosition = cache.getScrollPosition(prevEntry.path);
        if (savedPosition.x !== 0 || savedPosition.y !== 0) {
          window.scrollTo(savedPosition.x, savedPosition.y);
        }
      }, 50);
    }
  }, [setLocation, cache]);

  const goForward = useCallback(() => {
    const nextEntry = globalNavHistory.goForward();
    if (nextEntry) {
      isNavigatingRef.current = true;
      setLocation(nextEntry.path);
      
      // Restore any cached state for this route
      setTimeout(() => {
        const savedPosition = cache.getScrollPosition(nextEntry.path);
        if (savedPosition.x !== 0 || savedPosition.y !== 0) {
          window.scrollTo(savedPosition.x, savedPosition.y);
        }
      }, 50);
    }
  }, [setLocation, cache]);

  // Handle browser back/forward buttons
  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      // Browser handled the navigation, just update our internal state
      const currentPath = window.location.pathname;
      
      // Find this path in our history and update current index
      const historyEntries = globalNavHistory.getFullHistory();
      const foundIndex = historyEntries.findIndex(entry => entry.path === currentPath);
      
      if (foundIndex !== -1) {
        // Update internal pointer without adding new entry
        isNavigatingRef.current = true;
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Keyboard shortcuts for back/forward
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt + Left Arrow = Back
      if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault();
        goBack();
      }
      
      // Alt + Right Arrow = Forward
      if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault();
        goForward();
      }

      // Ctrl/Cmd + [ = Back (like browsers)
      if ((event.ctrlKey || event.metaKey) && event.key === '[') {
        event.preventDefault();
        goBack();
      }

      // Ctrl/Cmd + ] = Forward (like browsers)
      if ((event.ctrlKey || event.metaKey) && event.key === ']') {
        event.preventDefault();
        goForward();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goBack, goForward]);

  return {
    canGoBack: globalNavHistory.canGoBack(),
    canGoForward: globalNavHistory.canGoForward(),
    goBack,
    goForward,
    currentIndex: globalNavHistory.getCurrentIndex(),
    historyLength: globalNavHistory.getHistoryLength()
  };
}

// Export history manager for debugging
export { globalNavHistory };
import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';

const CACHING_ENABLED_KEY = 'cachingEnabled';
const LAST_CACHE_DATE_KEY = 'lastCacheDate';

export function usePageCaching() {
  const [cachingEnabled, setCachingEnabledState] = useState<boolean>(() => {
    const stored = localStorage.getItem(CACHING_ENABLED_KEY);
    return stored !== 'false'; // Default true
  });
  const [lastCacheDate, setLastCacheDate] = useState<string | null>(() => {
    return localStorage.getItem(LAST_CACHE_DATE_KEY);
  });

  const setCachingEnabled = useCallback((enabled: boolean) => {
    setCachingEnabledState(enabled);
    localStorage.setItem(CACHING_ENABLED_KEY, String(enabled));
    
    if (!enabled) {
      // Clear cache when disabled
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            if (name.includes('workbox') || name.includes('precache')) {
              caches.delete(name);
            }
          });
        });
      }
    }
  }, []);

  const checkAndCachePages = useCallback(async () => {
    if (!cachingEnabled) return;
    
    const today = format(new Date(), 'yyyy-MM-dd');
    if (lastCacheDate === today) return;
    
    // Service worker will handle the actual caching via workbox
    // Here we just track that we've attempted caching today
    localStorage.setItem(LAST_CACHE_DATE_KEY, today);
    setLastCacheDate(today);
    
    // Trigger service worker cache update
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_PAGES',
        date: today
      });
    }
  }, [cachingEnabled, lastCacheDate]);

  useEffect(() => {
    // Check and cache on first load
    const timer = setTimeout(() => {
      checkAndCachePages();
    }, 3000); // Wait 3 seconds after app loads
    
    return () => clearTimeout(timer);
  }, [checkAndCachePages]);

  const clearCache = useCallback(async () => {
    if ('caches' in window) {
      const names = await caches.keys();
      await Promise.all(names.map(name => caches.delete(name)));
      localStorage.removeItem(LAST_CACHE_DATE_KEY);
      setLastCacheDate(null);
    }
  }, []);

  return {
    cachingEnabled,
    setCachingEnabled,
    lastCacheDate,
    clearCache,
    checkAndCachePages
  };
}

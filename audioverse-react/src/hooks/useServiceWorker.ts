// ─── useServiceWorker ──────────────────────────────────────────────────────────
// Hook to interact with the registered service worker from React components.
// Provides update detection, cache management, and offline status.

import { useCallback, useEffect, useState } from 'react';

export interface ServiceWorkerState {
  /** Whether a service worker is supported & registered */
  isSupported: boolean;
  /** Whether an update is waiting to be activated */
  updateAvailable: boolean;
  /** Whether the browser is offline */
  isOffline: boolean;
  /** Trigger immediate activation of the waiting SW */
  applyUpdate: () => void;
  /** Cache a list of URLs for offline use (e.g. song audio) */
  cacheUrls: (urls: string[]) => void;
}

export function useServiceWorker(): ServiceWorkerState {
  const [isSupported] = useState(() => 'serviceWorker' in navigator);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isOffline, setIsOffline] = useState(() => !navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  useEffect(() => {
    if (!isSupported) return;

    navigator.serviceWorker.ready.then((reg) => {
      // Check for waiting SW on mount
      if (reg.waiting) setUpdateAvailable(true);

      // Listen for new SW arriving
      reg.addEventListener('updatefound', () => {
        const newSw = reg.installing;
        newSw?.addEventListener('statechange', () => {
          if (newSw.state === 'installed' && navigator.serviceWorker.controller) {
            setUpdateAvailable(true);
          }
        });
      });
    });

    // When new SW takes control, reload
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  }, [isSupported]);

  const applyUpdate = useCallback(() => {
    if (!isSupported) return;
    navigator.serviceWorker.ready.then((reg) => {
      reg.waiting?.postMessage({ type: 'SKIP_WAITING' });
    });
  }, [isSupported]);

  const cacheUrls = useCallback(
    (urls: string[]) => {
      if (!isSupported || !navigator.serviceWorker.controller) return;
      navigator.serviceWorker.controller.postMessage({ type: 'CACHE_URLS', urls });
    },
    [isSupported],
  );

  return { isSupported, updateAvailable, isOffline, applyUpdate, cacheUrls };
}

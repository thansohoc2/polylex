import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater } from '@capgo/capacitor-updater';
import toast from 'react-hot-toast';

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api/v1';

// Current bundle version injected at build time via VITE_APP_VERSION env var.
// Falls back to '0.0.0+dev' for web/dev builds.
const CURRENT_VERSION =
  (import.meta.env.VITE_APP_VERSION as string | undefined) ?? '0.0.0+dev';

/**
 * Checks for an OTA bundle update 3 seconds after mount.
 * - Only runs on native platforms (iOS / Android).
 * - Downloads the bundle silently in the background.
 * - Applies the update the next time the app goes to background,
 *   so active review / dialogue sessions are never interrupted.
 * - Silent-fails on network errors to avoid impacting cold-start UX.
 */
export function useOtaUpdate() {
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let removeListener: (() => void) | null = null;

    const checkForUpdate = async () => {
      try {
        const res = await fetch(
          `${API_BASE}/updates/latest?currentVersion=${encodeURIComponent(CURRENT_VERSION)}`,
        );
        if (!res.ok) return;

        const data = (await res.json()) as {
          version: string;
          url: string | null;
          hasUpdate: boolean;
        };

        if (!data.hasUpdate || !data.url) return;

        // Download bundle in the background — does NOT apply yet.
        const bundle = await CapacitorUpdater.download({
          url: data.url,
          version: data.version,
        });

        toast('🚀 Cập nhật mới sẵn sàng — khởi động lại để áp dụng', {
          duration: 6000,
        });

        // Apply on next background transition to avoid disrupting active session.
        const handle = await App.addListener(
          'appStateChange',
          async ({ isActive }) => {
            if (!isActive) {
              await CapacitorUpdater.set(bundle);
              // App will reload automatically after set()
            }
          },
        );
        removeListener = handle.remove;
      } catch {
        // Silent fail — handles offline, CORS, or server errors gracefully.
      }
    };

    // Delay by 3 seconds to avoid impacting cold-start performance.
    const timer = setTimeout(checkForUpdate, 3000);

    return () => {
      clearTimeout(timer);
      removeListener?.();
    };
  }, []);
}

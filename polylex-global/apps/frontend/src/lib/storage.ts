/**
 * Platform-aware Zustand storage adapter.
 *
 * - Native (iOS/Android via Capacitor) → @capacitor/preferences (persistent, survives
 *   app kills and system storage pressure).
 * - Web → localStorage (standard browser behaviour).
 *
 * The returned object satisfies Zustand's `StateStorage` interface.
 */

import type { StateStorage } from 'zustand/middleware';
import { Preferences } from '@capacitor/preferences';

/**
 * Detect whether we are running inside a Capacitor native shell.
 * Safe to call before Capacitor is fully initialised in web builds.
 */
function isNative(): boolean {
  try {
    // @ts-expect-error — Capacitor global injected by the native shell
    return typeof window !== 'undefined' && window.Capacitor?.isNativePlatform?.() === true;
  } catch {
    return false;
  }
}

/**
 * Async wrapper around @capacitor/preferences that satisfies the synchronous
 * Zustand StateStorage interface by returning Promises.
 * Zustand's `persist` middleware accepts both sync and async storage.
 */
function createCapacitorStorage(): StateStorage {
  return {
    getItem: async (key: string): Promise<string | null> => {
      const { value } = await Preferences.get({ key });
      return value;
    },
    setItem: async (key: string, value: string): Promise<void> => {
      await Preferences.set({ key, value });
    },
    removeItem: async (key: string): Promise<void> => {
      await Preferences.remove({ key });
    },
  };
}

function createLocalStorage(): StateStorage {
  return {
    getItem: (key) => localStorage.getItem(key),
    setItem: (key, value) => localStorage.setItem(key, value),
    removeItem: (key) => localStorage.removeItem(key),
  };
}

/**
 * Call once when creating each Zustand `persist` store.
 * Returns the appropriate storage backend for the current platform.
 */
export function createPlatformStorage(): StateStorage {
  return isNative() ? createCapacitorStorage() : createLocalStorage();
}

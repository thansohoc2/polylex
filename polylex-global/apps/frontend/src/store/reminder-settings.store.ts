import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createPlatformStorage } from '@/lib/storage';

interface ReminderSettingsState {
  enabled: boolean;
  time: string;
  setEnabled: (enabled: boolean) => void;
  setTime: (time: string) => void;
}

function normalizeTime(value: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value.trim());
  if (!match) return '20:00';
  const hour = Math.max(0, Math.min(23, Number(match[1])));
  const minute = Math.max(0, Math.min(59, Number(match[2])));
  return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
}

export const useReminderSettingsStore = create<ReminderSettingsState>()(
  persist(
    (set) => ({
      enabled: false,
      time: '20:00',
      setEnabled: (enabled) => set({ enabled }),
      setTime: (time) => set({ time: normalizeTime(time) }),
    }),
    {
      name: 'polylex_reminder_settings',
      storage: createJSONStorage(createPlatformStorage),
      partialize: (state) => ({ enabled: state.enabled, time: state.time }),
    },
  ),
);

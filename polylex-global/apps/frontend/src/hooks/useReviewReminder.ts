import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { LocalNotifications } from '@capacitor/local-notifications';
import i18n from '@/i18n';
import { gamificationApi, reviewApi } from '@/api/client';
import { useReminderSettingsStore } from '@/store/reminder-settings.store';
import { useAuthStore } from '@/store/auth.store';

const REVIEW_REMINDER_ID = 42001;

function parseTime(value: string): { hour: number; minute: number } {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return { hour: 20, minute: 0 };
  return {
    hour: Math.max(0, Math.min(23, Number(match[1]))),
    minute: Math.max(0, Math.min(59, Number(match[2]))),
  };
}

async function cancelReminder() {
  try {
    await LocalNotifications.cancel({ notifications: [{ id: REVIEW_REMINDER_ID }] });
    await LocalNotifications.removeAllDeliveredNotifications();
  } catch {
    // noop
  }
}

async function ensureNotificationPermission(): Promise<boolean> {
  const current = await LocalNotifications.checkPermissions();
  if (current.display === 'granted') {
    return true;
  }
  const asked = await LocalNotifications.requestPermissions();
  return asked.display === 'granted';
}

async function scheduleReminder(time: string) {
  const [{ items }, stats] = await Promise.all([
    reviewApi.getQueue({ limit: 100 }),
    gamificationApi.getStats(),
  ]);

  const dueCount = items.length;
  const streak = stats.currentStreak ?? 0;
  const title = i18n.t('reminder.title');

  let body = i18n.t('reminder.bodyGeneric');
  if (dueCount > 0 && streak > 0) {
    body = i18n.t('reminder.bodyDueAndStreak', { due: dueCount, streak });
  } else if (dueCount > 0) {
    body = i18n.t('reminder.bodyDueOnly', { due: dueCount });
  } else if (streak > 0) {
    body = i18n.t('reminder.bodyStreakOnly', { streak });
  }

  const { hour, minute } = parseTime(time);
  await cancelReminder();
  await LocalNotifications.schedule({
    notifications: [
      {
        id: REVIEW_REMINDER_ID,
        title,
        body,
        schedule: {
          on: { hour, minute },
          repeats: true,
          allowWhileIdle: true,
        },
      },
    ],
  });
}

export function useReviewReminder() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const enabled = useReminderSettingsStore((s) => s.enabled);
  const time = useReminderSettingsStore((s) => s.time);

  useEffect(() => {
    if (!accessToken) return;
    if (!Capacitor.isNativePlatform()) return;

    let disposed = false;

    const refreshSchedule = async () => {
      if (disposed) return;
      if (!enabled) {
        await cancelReminder();
        return;
      }

      try {
        const granted = await ensureNotificationPermission();
        if (!granted) {
          return;
        }
        await scheduleReminder(time);
      } catch {
        // Graceful no-op: reminder is optional and should never break the app flow.
      }
    };

    void refreshSchedule();

    let removeListener: (() => void) | null = null;
    void App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        void refreshSchedule();
      }
    }).then((handler) => {
      removeListener = handler.remove;
    });

    return () => {
      disposed = true;
      removeListener?.();
    };
  }, [accessToken, enabled, time]);
}

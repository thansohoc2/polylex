import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import { useAudioSettingsStore } from '@/store/audio-settings.store';
import { useReminderSettingsStore } from '@/store/reminder-settings.store';
import { authApi, gamificationApi, languageApi, userApi, vocabularyApi } from '@/api/client';
import AppShell from '@/components/layout/AppShell';
import { LanguageBadge } from '@/components/ui/Badge';
import { CefrBadge } from '@/components/ui/Badge';
import type { GamificationStats, LanguageDto, UserProfile } from '@polylex/shared-types';

export default function ProfilePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout, setUser } = useAuthStore();
  const [editMode, setEditMode] = useState(false);
  const [nativeLangCode, setNativeLangCode] = useState('');
  const [languages, setLanguages] = useState<LanguageDto[]>([]);
  const [saving, setSaving] = useState(false);
  const [settingPrimaryCode, setSettingPrimaryCode] = useState<string | null>(null);
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [voiceGender, setVoiceGender] = useState<'MALE' | 'FEMALE'>('FEMALE');
  const { rate, setRate, japanesePhoneticMode, setJapanesePhoneticMode } = useAudioSettingsStore();
  const [previewLoading, setPreviewLoading] = useState(false);
  const [voiceSaving, setVoiceSaving] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const {
    enabled: reminderEnabled,
    time: reminderTime,
    setEnabled: setReminderEnabled,
    setTime: setReminderTime,
  } = useReminderSettingsStore();

  useEffect(() => {
    setNativeLangCode(user?.nativeLanguageCode ?? '');
  }, [user?.nativeLanguageCode]);

  useEffect(() => {
    userApi.getTtsPreferences()
      .then((d) => setVoiceGender(d.ttsVoiceGender as 'MALE' | 'FEMALE'))
      .catch(() => {});
  }, []);

  useEffect(() => {
    gamificationApi.getStats().then((s) => setStats(s as GamificationStats)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!editMode) return;
    languageApi.getAll().then((data: LanguageDto[]) => setLanguages(data)).catch(() => {});
  }, [editMode]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    }
    logout();
    navigate('/login');
  };

  const initials = user?.displayName
    ? user.displayName.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const handleSave = async () => {
    if (!nativeLangCode) return;
    setSaving(true);
    try {
      await userApi.updateMe({ nativeLanguageCode: nativeLangCode });
      const refreshed = await userApi.getMe();
      setUser(refreshed as UserProfile);
      setEditMode(false);
      toast.success(t('profile.saveSuccess'));
    } catch {
      toast.error(t('profile.saveFailed'));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setNativeLangCode(user?.nativeLanguageCode ?? '');
    setEditMode(false);
  };

  const handleSaveVoice = async () => {
    setVoiceSaving(true);
    try {
      const result = await userApi.updateTtsPreferences({ ttsVoiceGender: voiceGender });
      setVoiceGender(result.ttsVoiceGender as 'MALE' | 'FEMALE');
    } finally {
      setVoiceSaving(false);
    }
  };

  const handlePreviewVoice = async () => {
    setPreviewLoading(true);
    try {
      const langCode = user?.nativeLanguageCode ?? 'en';
      const arrayBuffer = await vocabularyApi.ttsPreview({ term: 'Hello', languageCode: langCode });
      const audioCtx = new AudioContext();
      const decoded = await audioCtx.decodeAudioData(arrayBuffer);
      const source = audioCtx.createBufferSource();
      source.buffer = decoded;
      source.playbackRate.value = rate;
      source.connect(audioCtx.destination);
      source.start();
    } catch {
      // silently ignore preview errors
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleSetPrimary = async (languageCode: string) => {
    setSettingPrimaryCode(languageCode);
    try {
      const updated = await userApi.updateMe({ primaryLearningLanguageCode: languageCode }) as UserProfile;
      setUser(updated);
    } finally {
      setSettingPrimaryCode(null);
    }
  };

  const handleDeleteAccount = async () => {
    setShowDeleteModal(false);
    setDeletingAccount(true);
    try {
      await userApi.deleteMe();
      logout();
      navigate('/login');
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <AppShell title={t('profile.title')} theme="light">
      {/* ── Delete Account Confirmation Modal ── */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center p-4"
          style={{ background: 'rgba(34,27,46,0.55)', backdropFilter: 'blur(4px)' }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            className="w-full max-w-md rounded-[var(--radius-card)] p-6 animate-pop"
            style={{ background: 'var(--color-card)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-3xl text-center mb-3">⚠️</p>
            <h3 className="text-h2 text-[var(--color-ink)] text-center mb-2">{t('profile.deleteTitle')}</h3>
            <p className="text-sm text-[var(--color-ink-3)] text-center mb-6">{t('profile.deleteWarning')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="press flex-1 rounded-2xl py-3 text-sm font-semibold bg-[var(--color-card-2)] text-[var(--color-ink-2)] border border-[var(--color-line)]"
              >
                {t('profile.cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deletingAccount}
                className="press flex-1 rounded-2xl py-3 text-sm font-semibold text-white disabled:opacity-60"
                style={{ background: 'var(--color-bad)' }}
              >
                {deletingAccount ? '…' : t('profile.deleteConfirm')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 space-y-6 pb-6">

        {/* ── ZONE 1: PROFILE + STATS (read-only) ── */}
        <div
          className="rounded-[var(--radius-card)] p-5 text-white shadow-coral"
          style={{ background: 'linear-gradient(135deg, var(--color-coral) 0%, var(--color-coral-2) 100%)' }}
        >
          {/* Avatar + name */}
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-display font-extrabold text-white flex-shrink-0"
              style={{ background: 'rgba(255,255,255,0.22)' }}>
              {initials}
            </div>
            <div>
              <h2 className="text-h2 text-white">{user?.displayName}</h2>
              <p className="text-sm text-white/80">{user?.email}</p>
            </div>
          </div>

          {/* Gamification stats row */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.18)' }}>
              <p className="text-xl font-display font-extrabold">{stats?.currentStreak ?? 0}</p>
              <p className="text-xs text-white/80">🔥 {t('greeting.dayStreak')}</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.18)' }}>
              <p className="text-xl font-display font-extrabold">{stats?.level ?? 1}</p>
              <p className="text-xs text-white/80">⭐ {t('profile.levelLabel', { level: '' }).trim()}</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,255,255,0.18)' }}>
              <p className="text-xl font-display font-extrabold">{stats?.masteredWordCount ?? 0}</p>
              <p className="text-xs text-white/80">📚 {t('greeting.words')}</p>
            </div>
          </div>

          {/* Level XP bar */}
          {stats && (
            <div className="mt-4">
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.25)' }}>
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(100, Math.round((stats.xpInLevel / Math.max(1, stats.xpForNextLevel)) * 100))}%`,
                    background: 'rgba(255,255,255,0.9)',
                  }}
                />
              </div>
              <p className="text-xs text-white/75 mt-1">
                {t('profile.levelProgress', { xp: stats.xpInLevel, next: stats.xpForNextLevel })}
              </p>
            </div>
          )}
        </div>

        {/* ── ZONE 2: SETTINGS ── */}

        {/* Native language */}
        <section>
          <h3 className="text-xs font-semibold text-[var(--color-ink-3)] uppercase tracking-wider mb-2">
            {t('profile.nativeLanguage')}
          </h3>
          <div className="bg-[var(--color-card)] rounded-[var(--radius-card)] px-4 py-3 shadow-soft space-y-3">
            <div className="flex items-center justify-between">
              <LanguageBadge light
                code={user?.nativeLanguageCode ?? 'en'}
                name={user?.nativeLanguageName ?? user?.nativeLanguageCode ?? 'English'}
              />
              <button
                onClick={() => setEditMode((prev) => !prev)}
                className="inline-flex items-center gap-1 text-xs font-semibold press"
                style={{ color: 'var(--color-coral)' }}
                disabled={saving}
              >
                <Pencil size={13} />
                {editMode ? t('profile.close') : t('profile.edit')}
              </button>
            </div>

            {editMode && (
              <>
                <select
                  value={nativeLangCode}
                  onChange={(e) => setNativeLangCode(e.target.value)}
                  className="w-full bg-[var(--color-card-2)] border border-[var(--color-line)] rounded-xl px-3 py-2.5 text-sm text-[var(--color-ink)] focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': 'var(--color-coral)' } as React.CSSProperties}
                  disabled={saving}
                >
                  {languages.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.flagEmoji ? `${l.flagEmoji} ` : ''}{l.name}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    disabled={saving || !nativeLangCode}
                    className="press flex-1 rounded-xl py-2.5 text-sm font-display font-bold text-white disabled:opacity-50 shadow-coral"
                    style={{ background: 'linear-gradient(135deg, var(--color-coral), var(--color-coral-2))' }}
                  >
                    {saving ? t('profile.saving') : t('profile.save')}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={saving}
                    className="press flex-1 rounded-xl py-2.5 text-sm font-semibold text-[var(--color-ink-2)] bg-[var(--color-card-2)] border border-[var(--color-line)]"
                  >
                    {t('profile.cancel')}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Streak protection */}
        <section>
          <h3 className="text-xs font-semibold text-[var(--color-ink-3)] uppercase tracking-wider mb-2">
            {t('profile.streakProtection')}
          </h3>
          <div className="bg-[var(--color-card)] rounded-[var(--radius-card)] px-4 py-3 shadow-soft">
            <div className="flex items-center justify-between">
              <p className="text-sm text-[var(--color-ink)]">{t('profile.freezeLeft')}</p>
              <p className="text-base font-display font-bold" style={{ color: 'var(--color-info)' }}>
                🧊 {stats?.streakFreezes ?? 0}
              </p>
            </div>
            <p className="text-xs text-[var(--color-ink-3)] mt-2">{t('profile.freezeRule')}</p>
          </div>
        </section>

        {/* Voice settings */}
        <section>
          <h3 className="text-xs font-semibold text-[var(--color-ink-3)] uppercase tracking-wider mb-2">
            {t('profile.voiceSettings')}
          </h3>
          <div className="bg-[var(--color-card)] rounded-[var(--radius-card)] px-4 py-3 shadow-soft space-y-3">
            <div className="flex items-center gap-3">
              <select
                value={voiceGender}
                onChange={(e) => setVoiceGender(e.target.value as 'MALE' | 'FEMALE')}
                className="flex-1 bg-[var(--color-card-2)] border border-[var(--color-line)] rounded-xl px-3 py-2.5 text-sm text-[var(--color-ink)] focus:outline-none"
              >
                <option value="FEMALE">{t('profile.female')}</option>
                <option value="MALE">{t('profile.male')}</option>
              </select>
              <button onClick={handleSaveVoice} disabled={voiceSaving}
                className="press px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: 'var(--color-ok)' }}>
                {voiceSaving ? t('profile.savingVoice') : t('profile.saveVoice')}
              </button>
              <button onClick={handlePreviewVoice} disabled={previewLoading}
                className="press px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
                style={{ background: 'var(--color-grape)' }}>
                {previewLoading ? '…' : t('profile.preview')}
              </button>
            </div>
            <div>
              <p className="text-xs text-[var(--color-ink-3)] mb-2">{t('profile.playbackSpeed')}</p>
              <div className="grid grid-cols-4 gap-2">
                {([{ labelKey: 'profile.slow', value: 0.6 }, { labelKey: 'profile.moderate', value: 0.85 }, { labelKey: 'profile.normal', value: 1.0 }, { labelKey: 'profile.fast', value: 1.25 }] as const).map(({ labelKey, value }) => (
                  <button key={value} onClick={() => setRate(value)}
                    className={`press py-2 rounded-xl text-xs font-semibold transition-colors border ${rate === value ? 'text-white shadow-coral' : 'bg-[var(--color-card-2)] text-[var(--color-ink-3)] border-[var(--color-line)]'}`}
                    style={rate === value ? { background: 'linear-gradient(135deg, var(--color-coral), var(--color-coral-2))', borderColor: 'transparent' } : undefined}>
                    {t(labelKey)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Reminder settings */}
        <section>
          <h3 className="text-xs font-semibold text-[var(--color-ink-3)] uppercase tracking-wider mb-2">
            {t('profile.reminderSettings')}
          </h3>
          <div className="bg-[var(--color-card)] rounded-[var(--radius-card)] px-4 py-3 shadow-soft space-y-3">
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm text-[var(--color-ink)]">{t('profile.reminderEnabled')}</span>
              <button
                type="button"
                onClick={() => setReminderEnabled(!reminderEnabled)}
                className={`w-12 h-7 rounded-full p-1 transition-colors ${reminderEnabled ? '' : ''}`}
                style={{ background: reminderEnabled ? 'var(--color-ok)' : 'var(--color-line)' }}
                aria-label={t('profile.reminderEnabled')}
              >
                <span className={`block w-5 h-5 rounded-full bg-white transition-transform shadow ${reminderEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
              </button>
            </label>
            <label className="block">
              <span className="text-xs text-[var(--color-ink-3)]">{t('profile.reminderTime')}</span>
              <input
                type="time"
                value={reminderTime}
                onChange={(e) => setReminderTime(e.target.value)}
                disabled={!reminderEnabled}
                className="mt-1.5 w-full bg-[var(--color-card-2)] border border-[var(--color-line)] rounded-xl px-3 py-2.5 text-sm text-[var(--color-ink)] focus:outline-none disabled:opacity-50"
              />
            </label>
            <p className="text-xs text-[var(--color-ink-3)]">{t('profile.reminderNote')}</p>
          </div>
        </section>

        {/* Japanese phonetic mode */}
        {user?.learningLanguages?.some((l) => l.code === 'ja') && (
          <section>
            <h3 className="text-xs font-semibold text-[var(--color-ink-3)] uppercase tracking-wider mb-2">
              {t('profile.japaneseReading')}
            </h3>
            <div className="bg-[var(--color-card)] rounded-[var(--radius-card)] px-4 py-3 shadow-soft">
              <div className="grid grid-cols-2 gap-2">
                {(['hiragana', 'kanji'] as const).map((mode) => (
                  <button key={mode} onClick={() => setJapanesePhoneticMode(mode)}
                    className={`press py-2.5 rounded-xl text-xs font-semibold transition-colors border ${japanesePhoneticMode === mode ? 'text-white' : 'bg-[var(--color-card-2)] text-[var(--color-ink-3)] border-[var(--color-line)]'}`}
                    style={japanesePhoneticMode === mode ? { background: 'var(--color-grape)', borderColor: 'transparent' } : undefined}>
                    {mode === 'hiragana' ? t('profile.kanaOnly') : t('profile.fullKanji')}
                  </button>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Learning languages */}
        {user?.learningLanguages && user.learningLanguages.length > 0 && (
          <section>
            <h3 className="text-xs font-semibold text-[var(--color-ink-3)] uppercase tracking-wider mb-2">
              {t('profile.learning')}
            </h3>
            <div className="space-y-2">
              {user.learningLanguages.map((l) => (
                <div key={l.code}
                  className="bg-[var(--color-card)] rounded-[var(--radius-card)] px-4 py-3 flex items-center justify-between shadow-soft">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { if (!l.isPrimary) void handleSetPrimary(l.code); }}
                      disabled={Boolean(settingPrimaryCode) || l.isPrimary}
                      className="disabled:opacity-100"
                      aria-label={l.isPrimary ? t('profile.primaryLang') : t('profile.setPrimaryLang')}
                    >
                      <Star size={15} className={l.isPrimary ? '' : ''} style={{ fill: l.isPrimary ? 'var(--color-gold)' : 'none', color: l.isPrimary ? 'var(--color-gold)' : 'var(--color-ink-3)' }} />
                    </button>
                    <LanguageBadge light code={l.code} name={l.name} />
                  </div>
                  {l.currentCefrLevel && <CefrBadge light level={l.currentCefrLevel} />}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Settings menu rows */}
        <section>
          <h3 className="text-xs font-semibold text-[var(--color-ink-3)] uppercase tracking-wider mb-2">
            {t('profile.settings')}
          </h3>
          <div className="bg-[var(--color-card)] rounded-[var(--radius-card)] shadow-soft overflow-hidden divide-y divide-[var(--color-line)]">
            {[
              { label: t('profile.vocabularyMenu'), icon: '📚', path: '/vocabulary' },
              { label: t('profile.analyticsMenu'), icon: '📊', path: '/analytics' },
              { label: t('profile.leaderboardMenu'), icon: '🏆', path: '/leaderboard' },
            ].map(({ label, icon, path }) => (
              <button key={path} onClick={() => navigate(path)}
                className="press w-full px-4 py-3.5 flex items-center gap-3 text-left">
                <span className="text-lg">{icon}</span>
                <span className="flex-1 text-[var(--color-ink)] text-sm font-medium">{label}</span>
                <span className="text-[var(--color-ink-3)] text-lg">›</span>
              </button>
            ))}
          </div>
        </section>

        {/* Legal */}
        <section>
          <h3 className="text-xs font-semibold text-[var(--color-ink-3)] uppercase tracking-wider mb-2">Legal</h3>
          <div className="bg-[var(--color-card)] rounded-[var(--radius-card)] shadow-soft overflow-hidden divide-y divide-[var(--color-line)]">
            {[
              { label: 'Privacy Policy', icon: '🔒', path: '/privacy' },
              { label: 'Support', icon: '💬', path: '/support' },
            ].map(({ label, icon, path }) => (
              <button key={path} onClick={() => navigate(path)}
                className="press w-full px-4 py-3.5 flex items-center gap-3 text-left">
                <span className="text-lg">{icon}</span>
                <span className="flex-1 text-[var(--color-ink)] text-sm font-medium">{label}</span>
                <span className="text-[var(--color-ink-3)] text-lg">›</span>
              </button>
            ))}
          </div>
        </section>

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className="press w-full rounded-[var(--radius-card)] py-4 text-sm font-semibold border"
          style={{ background: 'color-mix(in srgb, var(--color-coral) 10%, white)', color: 'var(--color-coral)', borderColor: 'color-mix(in srgb, var(--color-coral) 25%, white)' }}
        >
          {t('profile.signOut')}
        </button>

        {/* ── DANGER ZONE ── */}
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--color-bad)' }}>
            Danger Zone
          </h3>
          <button
            onClick={() => setShowDeleteModal(true)}
            disabled={deletingAccount}
            className="press w-full rounded-[var(--radius-card)] py-4 text-sm font-semibold border disabled:opacity-60"
            style={{ background: 'color-mix(in srgb, var(--color-bad) 8%, white)', color: 'var(--color-bad)', borderColor: 'color-mix(in srgb, var(--color-bad) 22%, white)' }}
          >
            {deletingAccount ? 'Deleting account…' : t('profile.deleteAccount')}
          </button>
        </section>

      </div>
    </AppShell>
  );
}

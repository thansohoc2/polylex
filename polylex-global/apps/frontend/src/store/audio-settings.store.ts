import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AudioSettingsState {
  /** Playback rate for both MP3 and Web Speech API. Clamped to [0.5, 1.5]. */
  rate: number;
  setRate: (r: number) => void;
  /** Japanese phonetic display mode. 'kanji' = full format; 'hiragana' = kana only. */
  japanesePhoneticMode: 'hiragana' | 'kanji';
  setJapanesePhoneticMode: (mode: 'hiragana' | 'kanji') => void;
}

export const useAudioSettingsStore = create<AudioSettingsState>()(
  persist(
    (set) => ({
      rate: 1.0,
      setRate: (r: number) => set({ rate: Math.min(1.5, Math.max(0.5, r)) }),
      japanesePhoneticMode: 'kanji',
      setJapanesePhoneticMode: (mode) => set({ japanesePhoneticMode: mode }),
    }),
    {
      name: 'polylex_audio_settings',
      partialize: (state) => ({ rate: state.rate, japanesePhoneticMode: state.japanesePhoneticMode }),
    },
  ),
);

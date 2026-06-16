import { useAudioSettingsStore } from '@/store/audio-settings.store';
import { extractJapanesePhonetic } from '@/utils/japanese';

interface PhoneticDisplayProps {
  phonetic?: string | null;
  phoneticRomaji?: string | null;
  className?: string;
  languageCode?: string;
}

/**
 * Displays phonetics for a vocabulary entry.
 * - phoneticRomaji is the primary reading aid (Pinyin, Romaji+Kanji, etc.)
 * - phonetic (IPA) is shown as smaller secondary text when also present
 * - For Japanese (languageCode='ja'), applies japanesePhoneticMode from store
 */
export function PhoneticDisplay({ phonetic, phoneticRomaji, className = '', languageCode }: PhoneticDisplayProps) {
  const japanesePhoneticMode = useAudioSettingsStore((s) => s.japanesePhoneticMode);
  const displayRomaji = phoneticRomaji && languageCode === 'ja'
    ? extractJapanesePhonetic(phoneticRomaji, japanesePhoneticMode)
    : phoneticRomaji;

  if (!displayRomaji && !phonetic) return null;

  return (
    <span className={`inline-flex flex-col gap-0.5 ${className}`}>
      {displayRomaji && (
        <span className="font-mono text-[#475569]">{displayRomaji}</span>
      )}
      {phonetic && (
        <span className={`font-mono text-[#94A3B8] ${displayRomaji ? 'text-xs' : ''}`}>
          {phonetic}
        </span>
      )}
    </span>
  );
}

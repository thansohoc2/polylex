// Voice names verified against https://cloud.google.com/text-to-speech/docs/voices
// Neural2 = higher quality; Wavenet = fallback. Both available on free tier.
// ⚠️  If a voice name is incorrect for your GCP region, TTS will throw a 400 at runtime.

export interface VoiceConfig {
  languageCode: string; // BCP-47: 'en-US', 'vi-VN'
  name: string; // Google TTS voice name
  ssmlGender: number; // 1 = MALE, 2 = FEMALE
}

const GENDER_MALE = 1; // SsmlVoiceGender.MALE
const GENDER_FEMALE = 2; // SsmlVoiceGender.FEMALE

// Keys must be lowercase. For locale variants (e.g. 'zh-TW'), use the full lowercase form ('zh-tw').
// getVoiceConfig() normalises the incoming code before lookup.
const VOICE_MAP: Record<string, { MALE: VoiceConfig; FEMALE: VoiceConfig }> = {
  // ── Tier 1: Neural2 voices ──────────────────────────────────────────────────
  en: {
    MALE: { languageCode: 'en-US', name: 'en-US-Neural2-D', ssmlGender: GENDER_MALE },
    FEMALE: { languageCode: 'en-US', name: 'en-US-Neural2-F', ssmlGender: GENDER_FEMALE },
  },
  vi: {
    MALE: { languageCode: 'vi-VN', name: 'vi-VN-Neural2-D', ssmlGender: GENDER_MALE },
    FEMALE: { languageCode: 'vi-VN', name: 'vi-VN-Neural2-A', ssmlGender: GENDER_FEMALE },
  },
  ja: {
    MALE: { languageCode: 'ja-JP', name: 'ja-JP-Neural2-C', ssmlGender: GENDER_MALE },
    FEMALE: { languageCode: 'ja-JP', name: 'ja-JP-Neural2-B', ssmlGender: GENDER_FEMALE },
  },
  ko: {
    MALE: { languageCode: 'ko-KR', name: 'ko-KR-Neural2-C', ssmlGender: GENDER_MALE },
    FEMALE: { languageCode: 'ko-KR', name: 'ko-KR-Neural2-A', ssmlGender: GENDER_FEMALE },
  },
  fr: {
    MALE: { languageCode: 'fr-FR', name: 'fr-FR-Neural2-B', ssmlGender: GENDER_MALE },
    FEMALE: { languageCode: 'fr-FR', name: 'fr-FR-Neural2-A', ssmlGender: GENDER_FEMALE },
  },
  de: {
    MALE: { languageCode: 'de-DE', name: 'de-DE-Neural2-B', ssmlGender: GENDER_MALE },
    FEMALE: { languageCode: 'de-DE', name: 'de-DE-Neural2-F', ssmlGender: GENDER_FEMALE },
  },
  es: {
    MALE: { languageCode: 'es-ES', name: 'es-ES-Neural2-B', ssmlGender: GENDER_MALE },
    FEMALE: { languageCode: 'es-ES', name: 'es-ES-Neural2-A', ssmlGender: GENDER_FEMALE },
  },
  it: {
    MALE: { languageCode: 'it-IT', name: 'it-IT-Neural2-C', ssmlGender: GENDER_MALE },
    FEMALE: { languageCode: 'it-IT', name: 'it-IT-Neural2-A', ssmlGender: GENDER_FEMALE },
  },
  hi: {
    MALE: { languageCode: 'hi-IN', name: 'hi-IN-Neural2-B', ssmlGender: GENDER_MALE },
    FEMALE: { languageCode: 'hi-IN', name: 'hi-IN-Neural2-A', ssmlGender: GENDER_FEMALE },
  },
  // pt = European Portuguese (🇵🇹 seed flag). Switch to pt-BR-Neural2 if Brazilian preferred.
  pt: {
    MALE: { languageCode: 'pt-PT', name: 'pt-PT-Wavenet-B', ssmlGender: GENDER_MALE },
    FEMALE: { languageCode: 'pt-PT', name: 'pt-PT-Wavenet-A', ssmlGender: GENDER_FEMALE },
  },

  // ── Tier 2: Wavenet voices ───────────────────────────────────────────────────
  // Chinese Simplified — cmn-CN Wavenet (Neural2 not available on free tier)
  zh: {
    MALE: { languageCode: 'cmn-CN', name: 'cmn-CN-Wavenet-B', ssmlGender: GENDER_MALE },
    FEMALE: { languageCode: 'cmn-CN', name: 'cmn-CN-Wavenet-A', ssmlGender: GENDER_FEMALE },
  },
  // Chinese Traditional — seed code is 'zh-TW', normalised to 'zh-tw' by getVoiceConfig
  'zh-tw': {
    MALE: { languageCode: 'cmn-TW', name: 'cmn-TW-Wavenet-B', ssmlGender: GENDER_MALE },
    FEMALE: { languageCode: 'cmn-TW', name: 'cmn-TW-Wavenet-A', ssmlGender: GENDER_FEMALE },
  },
  ru: {
    MALE: { languageCode: 'ru-RU', name: 'ru-RU-Wavenet-B', ssmlGender: GENDER_MALE },
    FEMALE: { languageCode: 'ru-RU', name: 'ru-RU-Wavenet-A', ssmlGender: GENDER_FEMALE },
  },
  ar: {
    MALE: { languageCode: 'ar-XA', name: 'ar-XA-Wavenet-B', ssmlGender: GENDER_MALE },
    FEMALE: { languageCode: 'ar-XA', name: 'ar-XA-Wavenet-A', ssmlGender: GENDER_FEMALE },
  },
  nl: {
    MALE: { languageCode: 'nl-NL', name: 'nl-NL-Wavenet-B', ssmlGender: GENDER_MALE },
    FEMALE: { languageCode: 'nl-NL', name: 'nl-NL-Wavenet-A', ssmlGender: GENDER_FEMALE },
  },
  pl: {
    MALE: { languageCode: 'pl-PL', name: 'pl-PL-Wavenet-B', ssmlGender: GENDER_MALE },
    FEMALE: { languageCode: 'pl-PL', name: 'pl-PL-Wavenet-A', ssmlGender: GENDER_FEMALE },
  },
  sv: {
    MALE: { languageCode: 'sv-SE', name: 'sv-SE-Wavenet-B', ssmlGender: GENDER_MALE },
    FEMALE: { languageCode: 'sv-SE', name: 'sv-SE-Wavenet-A', ssmlGender: GENDER_FEMALE },
  },
  tr: {
    MALE: { languageCode: 'tr-TR', name: 'tr-TR-Wavenet-B', ssmlGender: GENDER_MALE },
    FEMALE: { languageCode: 'tr-TR', name: 'tr-TR-Wavenet-A', ssmlGender: GENDER_FEMALE },
  },
  id: {
    MALE: { languageCode: 'id-ID', name: 'id-ID-Wavenet-B', ssmlGender: GENDER_MALE },
    FEMALE: { languageCode: 'id-ID', name: 'id-ID-Wavenet-A', ssmlGender: GENDER_FEMALE },
  },
  ms: {
    MALE: { languageCode: 'ms-MY', name: 'ms-MY-Wavenet-B', ssmlGender: GENDER_MALE },
    FEMALE: { languageCode: 'ms-MY', name: 'ms-MY-Wavenet-A', ssmlGender: GENDER_FEMALE },
  },
  uk: {
    // Only one Wavenet voice available for Ukrainian
    MALE: { languageCode: 'uk-UA', name: 'uk-UA-Wavenet-A', ssmlGender: GENDER_MALE },
    FEMALE: { languageCode: 'uk-UA', name: 'uk-UA-Wavenet-A', ssmlGender: GENDER_FEMALE },
  },
  th: {
    MALE: { languageCode: 'th-TH', name: 'th-TH-Neural2-C', ssmlGender: GENDER_MALE },
    FEMALE: { languageCode: 'th-TH', name: 'th-TH-Neural2-A', ssmlGender: GENDER_FEMALE },
  },
  bn: {
    MALE: { languageCode: 'bn-IN', name: 'bn-IN-Wavenet-B', ssmlGender: GENDER_MALE },
    FEMALE: { languageCode: 'bn-IN', name: 'bn-IN-Wavenet-A', ssmlGender: GENDER_FEMALE },
  },
  el: {
    MALE: { languageCode: 'el-GR', name: 'el-GR-Wavenet-B', ssmlGender: GENDER_MALE },
    FEMALE: { languageCode: 'el-GR', name: 'el-GR-Wavenet-A', ssmlGender: GENDER_FEMALE },
  },
  fi: {
    MALE: { languageCode: 'fi-FI', name: 'fi-FI-Wavenet-B', ssmlGender: GENDER_MALE },
    FEMALE: { languageCode: 'fi-FI', name: 'fi-FI-Wavenet-A', ssmlGender: GENDER_FEMALE },
  },
  cs: {
    MALE: { languageCode: 'cs-CZ', name: 'cs-CZ-Wavenet-A', ssmlGender: GENDER_MALE },
    FEMALE: { languageCode: 'cs-CZ', name: 'cs-CZ-Wavenet-A', ssmlGender: GENDER_FEMALE },
  },
  da: {
    MALE: { languageCode: 'da-DK', name: 'da-DK-Wavenet-C', ssmlGender: GENDER_MALE },
    FEMALE: { languageCode: 'da-DK', name: 'da-DK-Wavenet-A', ssmlGender: GENDER_FEMALE },
  },
  no: {
    MALE: { languageCode: 'nb-NO', name: 'nb-NO-Wavenet-D', ssmlGender: GENDER_MALE },
    FEMALE: { languageCode: 'nb-NO', name: 'nb-NO-Wavenet-A', ssmlGender: GENDER_FEMALE },
  },
  hu: {
    MALE: { languageCode: 'hu-HU', name: 'hu-HU-Wavenet-B', ssmlGender: GENDER_MALE },
    FEMALE: { languageCode: 'hu-HU', name: 'hu-HU-Wavenet-A', ssmlGender: GENDER_FEMALE },
  },
  ro: {
    MALE: { languageCode: 'ro-RO', name: 'ro-RO-Wavenet-B', ssmlGender: GENDER_MALE },
    FEMALE: { languageCode: 'ro-RO', name: 'ro-RO-Wavenet-A', ssmlGender: GENDER_FEMALE },
  },
  he: {
    MALE: { languageCode: 'he-IL', name: 'he-IL-Wavenet-D', ssmlGender: GENDER_MALE },
    FEMALE: { languageCode: 'he-IL', name: 'he-IL-Wavenet-A', ssmlGender: GENDER_FEMALE },
  },

  // ── Not yet supported by Google TTS (free tier) ─────────────────────────────
  // fa (Persian), sw (Swahili), tl (Filipino), ur (Urdu) — will fallback to en-US with warning
};

const FALLBACK = VOICE_MAP['en'];

/**
 * Returns the Google TTS VoiceConfig for the given language code and gender.
 *
 * Lookup order:
 *   1. Exact lowercase match — handles locale variants like 'zh-tw' or 'pt-br'
 *   2. Base language code   — handles 'en-us' → 'en', 'zh-cn' → 'zh'
 *   3. Fallback             — en-US with a console warning
 */
export function getVoiceConfig(langCode: string, gender: 'MALE' | 'FEMALE'): VoiceConfig {
  const normalized = langCode.toLowerCase(); // 'zh-TW' → 'zh-tw', 'en-US' → 'en-us'
  const map =
    VOICE_MAP[normalized] ??                    // exact match: 'zh-tw', 'pt', 'vi'
    VOICE_MAP[normalized.split('-')[0]] ??      // base code:   'en' from 'en-us'
    null;

  if (!map) {
    console.warn(
      `[VoiceMap] No TTS voice configured for language: "${langCode}" — falling back to en-US. ` +
        `Add an entry to VOICE_MAP in voice-map.constants.ts to fix this.`,
    );
    return FALLBACK[gender];
  }

  return map[gender];
}

// ─── Voice cache ─────────────────────────────────────────────────────────────
// On mobile WebViews (iOS/Android) getVoices() returns [] synchronously on the
// first call. We must wait for the voiceschanged event, then cache the list so
// subsequent calls can pick the right voice immediately.
let _voices: SpeechSynthesisVoice[] = [];
let _voicesLoaded = false;

export function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  if (_voicesLoaded) return Promise.resolve(_voices);
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const voices = synth.getVoices();
    if (voices.length > 0) {
      _voices = voices;
      _voicesLoaded = true;
      return resolve(voices);
    }
    const onChanged = () => {
      _voices = synth.getVoices();
      _voicesLoaded = true;
      synth.removeEventListener('voiceschanged', onChanged);
      resolve(_voices);
    };
    synth.addEventListener('voiceschanged', onChanged);
    // Safety timeout — some browsers never fire voiceschanged
    setTimeout(() => {
      if (!_voicesLoaded) {
        _voices = synth.getVoices();
        _voicesLoaded = true;
        synth.removeEventListener('voiceschanged', onChanged);
        resolve(_voices);
      }
    }, 1500);
  });
}

/**
 * Picks the best SpeechSynthesisVoice for a given BCP-47 / ISO 639-1 lang code.
 * Priority: exact match → language-prefix match → first non-Vietnamese fallback.
 */
export function pickVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | null {
  // Normalise short codes: "en" → "en-", "fr" → "fr-", etc.
  const prefix = lang.toLowerCase().split('-')[0];

  // 1. Exact match (e.g. "en-US" === "en-US")
  const exact = voices.find((v) => v.lang.toLowerCase() === lang.toLowerCase());
  if (exact) return exact;

  // 2. Same language family, prefer non-"vi" voices
  const family = voices.filter(
    (v) => v.lang.toLowerCase().startsWith(prefix) && !v.lang.toLowerCase().startsWith('vi')
  );
  if (family.length > 0) return family[0];

  // 3. Absolute fallback: any voice that isn't Vietnamese
  const nonVi = voices.find((v) => !v.lang.toLowerCase().startsWith('vi'));
  return nonVi ?? null;
}

/**
 * Manages a pool of pre-warmed HTMLAudioElement instances.
 * Pre-warming forces the browser to start DNS/TLS/buffering early,
 * so playback starts immediately when the user taps Play.
 */
class AudioPreloadCache {
  private cache = new Map<string, HTMLAudioElement>();

  preload(audioUrl: string): void {
    if (this.cache.has(audioUrl)) return;
    const audio = new Audio(audioUrl);
    audio.preload = 'auto';
    this.cache.set(audioUrl, audio);
  }

  get(audioUrl: string): HTMLAudioElement | undefined {
    return this.cache.get(audioUrl);
  }

  evict(audioUrl: string): void {
    this.cache.delete(audioUrl);
  }

  clear(): void {
    this.cache.clear();
  }
}

export const audioPreloadCache = new AudioPreloadCache();

/** Pre-warm an audio URL so it is ready to play without startup latency. */
export function preloadAudio(audioUrl: string | null | undefined): void {
  if (!audioUrl) return;
  audioPreloadCache.preload(audioUrl);
}

/**
 * Plays a vocabulary term using cached MP3 from Cloudflare R2 when available,
 * falling back to the Web Speech API on error or when audioUrl is absent.
 *
 * @param rate - Playback speed multiplier (default 1.0). Applied to both MP3 and Web Speech.
 */
export function playAudio(term: string, lang: string, audioUrl?: string | null, rate?: number): void {
  if (audioUrl) {
    const audio = audioPreloadCache.get(audioUrl) ?? new Audio(audioUrl);
    audio.playbackRate = rate ?? 1.0;
    const t0 = import.meta.env.DEV ? performance.now() : 0;
    audio.play().then(() => {
      if (import.meta.env.DEV) {
        console.debug(`[audio] play started in ${(performance.now() - t0).toFixed(1)}ms`, audioUrl);
      }
    }).catch(() => {
      audioPreloadCache.evict(audioUrl); // remove broken entry
      // R2 CORS / network failure — degrade gracefully to Web Speech
      speakText(term, lang, rate);
    });
  } else {
    speakText(term, lang, rate);
  }
}

/**
 * Speaks arbitrary text via the Web Speech API (used for example sentences
 * and translation buttons that have no cached audio).
 *
 * @param rate - Playback speed multiplier (default 1.0).
 */
export function speakText(text: string, lang: string, rate?: number): void {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();

  loadVoices().then((voices) => {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = rate ?? 1.0;
    const voice = pickVoice(voices, lang);
    if (voice) u.voice = voice;
    window.speechSynthesis.speak(u);
  });
}

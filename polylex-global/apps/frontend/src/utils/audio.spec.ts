import { describe, it, expect, vi, beforeEach } from 'vitest';
import { audioPreloadCache, preloadAudio, playAudio } from './audio';

// Mock HTMLAudioElement — jsdom does not implement audio playback
const mockPlay = vi.fn().mockResolvedValue(undefined);
const mockAudioInstances: Record<string, ReturnType<typeof createMockAudio>> = {};

function createMockAudio(src: string) {
  return {
    src,
    crossOrigin: '',
    preload: '',
    playbackRate: 1,
    play: mockPlay,
  };
}

vi.stubGlobal(
  'Audio',
  vi.fn().mockImplementation((src: string) => {
    const instance = createMockAudio(src);
    mockAudioInstances[src] = instance;
    return instance;
  }),
);

describe('AudioPreloadCache', () => {
  beforeEach(() => {
    audioPreloadCache.clear();
    mockPlay.mockClear();
    vi.mocked(globalThis.Audio).mockClear();
  });

  it('preload() adds url to cache', () => {
    audioPreloadCache.preload('https://media.ebms.store/tts/abc.mp3');
    expect(audioPreloadCache.get('https://media.ebms.store/tts/abc.mp3')).toBeDefined();
  });

  it('get() returns undefined for unknown url', () => {
    expect(audioPreloadCache.get('https://media.ebms.store/tts/unknown.mp3')).toBeUndefined();
  });

  it('get() returns Audio element for preloaded url', () => {
    const url = 'https://media.ebms.store/tts/def.mp3';
    audioPreloadCache.preload(url);
    const el = audioPreloadCache.get(url);
    expect(el).toBeDefined();
    expect((el as { src: string }).src).toBe(url);
  });

  it('preload() is idempotent — does not create a second Audio for same url', () => {
    const url = 'https://media.ebms.store/tts/ghi.mp3';
    audioPreloadCache.preload(url);
    audioPreloadCache.preload(url);
    expect(vi.mocked(globalThis.Audio)).toHaveBeenCalledTimes(1);
  });

  it('evict() removes entry from cache', () => {
    const url = 'https://media.ebms.store/tts/jkl.mp3';
    audioPreloadCache.preload(url);
    audioPreloadCache.evict(url);
    expect(audioPreloadCache.get(url)).toBeUndefined();
  });

  it('clear() empties entire cache', () => {
    audioPreloadCache.preload('https://media.ebms.store/tts/mno.mp3');
    audioPreloadCache.preload('https://media.ebms.store/tts/pqr.mp3');
    audioPreloadCache.clear();
    expect(audioPreloadCache.get('https://media.ebms.store/tts/mno.mp3')).toBeUndefined();
    expect(audioPreloadCache.get('https://media.ebms.store/tts/pqr.mp3')).toBeUndefined();
  });
});

describe('preloadAudio()', () => {
  beforeEach(() => {
    audioPreloadCache.clear();
    vi.mocked(globalThis.Audio).mockClear();
  });

  it('is a no-op for null', () => {
    preloadAudio(null);
    expect(vi.mocked(globalThis.Audio)).not.toHaveBeenCalled();
  });

  it('is a no-op for undefined', () => {
    preloadAudio(undefined);
    expect(vi.mocked(globalThis.Audio)).not.toHaveBeenCalled();
  });

  it('pre-warms audio for a valid url', () => {
    preloadAudio('https://media.ebms.store/tts/stu.mp3');
    expect(audioPreloadCache.get('https://media.ebms.store/tts/stu.mp3')).toBeDefined();
  });
});

describe('playAudio()', () => {
  beforeEach(() => {
    audioPreloadCache.clear();
    mockPlay.mockClear();
    vi.mocked(globalThis.Audio).mockClear();
  });

  it('reuses cached Audio element when available — does not create a new Audio', () => {
    const url = 'https://media.ebms.store/tts/vwx.mp3';
    audioPreloadCache.preload(url);
    vi.mocked(globalThis.Audio).mockClear(); // reset after preload

    playAudio('hello', 'en', url, 1.0);
    expect(vi.mocked(globalThis.Audio)).not.toHaveBeenCalled();
    expect(mockPlay).toHaveBeenCalled();
  });

  it('creates a new Audio element when url is not preloaded', () => {
    const url = 'https://media.ebms.store/tts/yz.mp3';
    playAudio('hello', 'en', url, 1.0);
    expect(vi.mocked(globalThis.Audio)).toHaveBeenCalledWith(url);
    expect(mockPlay).toHaveBeenCalled();
  });

  it('falls back to speakText when audioUrl is absent', () => {
    // speechSynthesis not available in jsdom — just check no Audio is created
    playAudio('hello', 'en', null, 1.0);
    expect(vi.mocked(globalThis.Audio)).not.toHaveBeenCalled();
  });
});

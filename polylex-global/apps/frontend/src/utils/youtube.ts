import { Capacitor } from '@capacitor/core';

/**
 * Production origin that serves the /youtube.html proxy page.
 * Native (Capacitor) builds must load the proxy from a real HTTPS domain so
 * that YouTube receives a valid `origin`/referrer — loading it from the local
 * `capacitor://localhost` bundle triggers YouTube Error 153.
 */
const PROXY_ORIGIN = 'https://ebms.store';

/**
 * Build the URL for the YouTube HTML proxy (`public/youtube.html`).
 * - Native builds use the absolute production HTTPS URL.
 * - Web builds use a relative URL (same-origin).
 */
export function youtubeProxyUrl(
  videoId: string,
  params: Record<string, string | number> = {},
): string {
  const base = Capacitor.isNativePlatform()
    ? `${PROXY_ORIGIN}/youtube.html`
    : '/youtube.html';

  const search = new URLSearchParams({
    v: videoId,
    modestbranding: '1',
    controls: '1',
    rel: '0',
    playsinline: '1',
    ...Object.fromEntries(
      Object.entries(params).map(([key, value]) => [key, String(value)]),
    ),
  });

  return `${base}?${search.toString()}`;
}

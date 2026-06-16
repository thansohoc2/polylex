/**
 * Extracts the appropriate Japanese phonetic string based on display mode.
 *
 * Input formats from AI:
 *   - With kanji: "食べる (たべる, taberu)"
 *   - Kana-only:  "ありがとう (arigatou)"
 *
 * Mode 'kanji'    → returns raw string unchanged
 * Mode 'hiragana' → returns only the kana part:
 *   "食べる (たべる, taberu)" → "たべる"
 *   "ありがとう (arigatou)"  → "ありがとう"  (text before '(' is already kana)
 */
const KANA_RE = /^[\u3040-\u309F\u30A0-\u30FF\uFF65-\uFF9F\s]+$/;

export function extractJapanesePhonetic(
  raw: string,
  mode: 'hiragana' | 'kanji',
): string {
  if (!raw || mode === 'kanji') return raw;

  const parenIdx = raw.indexOf('(');
  if (parenIdx === -1) return raw; // no parens → return as-is

  const beforeParen = raw.slice(0, parenIdx).trim();

  // If text before '(' is already pure kana, return it directly
  if (KANA_RE.test(beforeParen)) return beforeParen;

  // Extract content inside parens: "たべる, taberu" or "arigatou"
  const closeIdx = raw.indexOf(')', parenIdx);
  const inner = closeIdx === -1
    ? raw.slice(parenIdx + 1).trim()
    : raw.slice(parenIdx + 1, closeIdx).trim();

  // Take portion before the first comma (the kana reading)
  const commaIdx = inner.indexOf(',');
  const kana = commaIdx === -1 ? inner : inner.slice(0, commaIdx).trim();

  return kana || raw; // fallback to raw if parse fails
}

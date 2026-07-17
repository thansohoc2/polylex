export const MAX_SPEECH_AUDIO_BYTES = 5 * 1024 * 1024;

// Base64 expands binary data by 4/3. Preserve the data-URI form already
// accepted by SpeechToTextService with a small MIME-header allowance.
export const MAX_SPEECH_AUDIO_BASE64_LENGTH =
  Math.ceil(MAX_SPEECH_AUDIO_BYTES / 3) * 4 + 256;
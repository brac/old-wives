// Which dictation path the review desk's talk button takes (plan phase-4, 4c round 4).
// Pure so it can be unit-tested (site/test/desk-talk.test.ts); desk-client.ts feeds it
// what the browser offers.

export type TalkEnv = {
  /** `SpeechRecognition` or `webkitSpeechRecognition` exists. */
  hasSpeech: boolean;
  /** `navigator.mediaDevices.getUserMedia` and `MediaRecorder` exist (needed to record for Whisper). */
  hasGetUserMedia: boolean;
  /** `window.isSecureContext`: https, or localhost. */
  secure: boolean;
  /** The Whisper checkbox, a manual override. */
  whisperOverride: boolean;
  /** A Web Speech error code from earlier in this page session that ruled speech out, if any. */
  speechError: string | null;
  /** `location.host`, for the https hint. */
  host: string;
};

export type TalkChoice =
  | { path: "speech"; note?: string }
  | { path: "whisper"; note?: string }
  | { path: "none"; message: string };

/** Web Speech errors after which this session switches to server transcription. */
export const SWITCHING_SPEECH_ERRORS: readonly string[] = ["not-allowed", "service-not-allowed", "network", "audio-capture"];

export const switchesToWhisper = (error: string): boolean => SWITCHING_SPEECH_ERRORS.includes(error);

/** Why neither path can run here. */
function noMic(env: TalkEnv): TalkChoice {
  if (!env.secure) return { path: "none", message: `the mic needs https or localhost; open https://${env.host} (npm run desk:https)` };
  return { path: "none", message: "this browser has no mic access; type instead" };
}

/**
 * Order: the Web Speech API when present (unless overridden or it failed earlier this
 * session), then server transcription when the browser can record, then a message naming
 * the cause.
 */
export function chooseTalkPath(env: TalkEnv): TalkChoice {
  const speechUsable = env.hasSpeech && env.speechError === null;
  if (env.whisperOverride) {
    if (env.hasGetUserMedia) return { path: "whisper" };
    if (speechUsable) return { path: "speech", note: "Whisper cannot record here; using browser speech" };
    return noMic(env);
  }
  if (speechUsable) return { path: "speech" };
  if (env.hasGetUserMedia) {
    return env.speechError === null
      ? { path: "whisper" }
      : { path: "whisper", note: `browser speech failed (${env.speechError}); using server transcription` };
  }
  return noMic(env);
}

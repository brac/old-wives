// The review desk's dictation path choice (plan phase-4, 4c round 4). Pure logic; no build needed.
import { describe, expect, it } from "vitest";
import { SWITCHING_SPEECH_ERRORS, chooseTalkPath, switchesToWhisper, type TalkEnv } from "../src/desk/talk-path.ts";

const env = (over: Partial<TalkEnv>): TalkEnv => ({
  hasSpeech: true,
  hasGetUserMedia: true,
  secure: true,
  whisperOverride: false,
  speechError: null,
  host: "192.168.1.5:4321",
  ...over,
});

describe("chooseTalkPath", () => {
  it("prefers the Web Speech API when present", () => {
    expect(chooseTalkPath(env({}))).toEqual({ path: "speech" });
    expect(chooseTalkPath(env({ hasGetUserMedia: false }))).toEqual({ path: "speech" });
  });
  it("falls back to server transcription when there is no speech API but the browser can record", () => {
    expect(chooseTalkPath(env({ hasSpeech: false }))).toEqual({ path: "whisper" });
  });
  it("names an insecure context as the cause and points at desk:https", () => {
    expect(chooseTalkPath(env({ hasSpeech: false, hasGetUserMedia: false, secure: false }))).toEqual({
      path: "none",
      message: "the mic needs https or localhost; open https://192.168.1.5:4321 (npm run desk:https)",
    });
  });
  it("says there is no mic access in a secure context without the APIs", () => {
    expect(chooseTalkPath(env({ hasSpeech: false, hasGetUserMedia: false }))).toEqual({
      path: "none",
      message: "this browser has no mic access; type instead",
    });
  });
  it("honours the Whisper override when the browser can record", () => {
    expect(chooseTalkPath(env({ whisperOverride: true }))).toEqual({ path: "whisper" });
  });
  it("uses speech with a note when Whisper is ticked but cannot record", () => {
    expect(chooseTalkPath(env({ whisperOverride: true, hasGetUserMedia: false }))).toEqual({
      path: "speech",
      note: "Whisper cannot record here; using browser speech",
    });
    expect(chooseTalkPath(env({ whisperOverride: true, hasGetUserMedia: false, hasSpeech: false, secure: false })).path).toBe("none");
  });
  it("switches to Whisper with a note after a runtime speech failure", () => {
    expect(chooseTalkPath(env({ speechError: "not-allowed" }))).toEqual({
      path: "whisper",
      note: "browser speech failed (not-allowed); using server transcription",
    });
  });
  it("gives the cause when speech failed and the browser cannot record", () => {
    expect(chooseTalkPath(env({ speechError: "not-allowed", hasGetUserMedia: false, secure: false }))).toEqual({
      path: "none",
      message: "the mic needs https or localhost; open https://192.168.1.5:4321 (npm run desk:https)",
    });
    expect(chooseTalkPath(env({ speechError: "network", hasGetUserMedia: false })).path).toBe("none");
  });
});

describe("switchesToWhisper", () => {
  it("switches on mic, permission and network errors only", () => {
    expect(SWITCHING_SPEECH_ERRORS).toEqual(["not-allowed", "service-not-allowed", "network", "audio-capture"]);
    for (const e of SWITCHING_SPEECH_ERRORS) expect(switchesToWhisper(e)).toBe(true);
    for (const e of ["no-speech", "aborted", "language-not-supported"]) expect(switchesToWhisper(e)).toBe(false);
  });
});

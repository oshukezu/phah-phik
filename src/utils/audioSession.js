export function requestPlaybackAudioSession() {
  if (typeof navigator === 'undefined' || !('audioSession' in navigator)) return;
  try {
    navigator.audioSession.type = 'playback';
  } catch {
    // ignore unsupported or failed session promotion
  }
}

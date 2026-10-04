import { send, wait, evaluate, screenshot, ws } from './cdp_helper.mjs';

try {
  const result = await evaluate(`(async () => {
    let micStatus = 'unknown';
    let micError = null;

    // Check navigator.mediaDevices
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      micStatus = 'NOT_SUPPORTED';
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStatus = 'GRANTED';
        stream.getTracks().forEach(t => t.stop());
      } catch (err) {
        micStatus = 'DENIED_OR_BLOCKED';
        micError = err.name + ': ' + err.message;
      }
    }

    // Check Web Audio Context
    const audioCtxState = window.AudioContext ? 'AVAILABLE' : 'UNAVAILABLE';
    const audioStore = window.__ECHO_AUDIO_STORE__ || null;

    return {
      micStatus,
      micError,
      audioCtxState
    };
  })()`);

  console.log('Microphone & Audio Evaluation:', JSON.stringify(result, null, 2));
} finally {
  ws.close();
}

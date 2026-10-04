// ============================================================
// VOICE PIPELINE — Mic → Web Speech API → transcript → command
// Push-to-talk: startListening() on keydown, stopAndProcess() on keyup
// ============================================================

import { useWorldStore } from '../core/WorldState';
import { parseVoiceCommand } from './CommandParser';
import { dispatchCommand } from './CommandDispatcher';

interface WindowWithSpeech extends Window {
  SpeechRecognition?: any;
  webkitSpeechRecognition?: any;
}

class VoicePipelineClass {
  private recognition: any = null;
  private isListening = false;
  private transcript = '';
  private liveTranscript = '';

  constructor() {
    this.init();
  }

  private init() {
    const win = typeof window !== 'undefined' ? (window as unknown as WindowWithSpeech) : null;
    const SR = win?.SpeechRecognition ?? win?.webkitSpeechRecognition;
    if (!SR) {
      console.warn('[VoicePipeline] Web Speech API not supported in this browser.');
      return;
    }

    this.recognition = new SR();
    this.recognition.continuous = true;      // keep listening while key is held
    this.recognition.interimResults = true;  // show live transcript
    this.recognition.lang = 'en-US';

    this.recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0]?.transcript || '';
        if (event.results[i].isFinal) final += t;
        else interim += t;
      }
      // Keep accumulating final transcripts
      if (final) {
        this.transcript = (this.transcript ? this.transcript + ' ' : '') + final.trim();
      }
      const display = ((this.transcript ? this.transcript + ' ' : '') + interim).trim();
      this.liveTranscript = display;
      useWorldStore.getState().setVoiceTranscript(display);
    };

    this.recognition.onend = () => {
      // If still holding PTT key, restart to handle browser auto-stop
      if (this.isListening) {
        try { this.recognition?.start(); } catch (_) { /* already started */ }
      }
    };

    this.recognition.onerror = (event: any) => {
      if (event.error === 'no-speech' || event.error === 'aborted') return;
      console.warn('[VoicePipeline] Error:', event.error);
    };
  }

  get supported(): boolean {
    const win = typeof window !== 'undefined' ? (window as unknown as WindowWithSpeech) : null;
    return !!(win?.SpeechRecognition ?? win?.webkitSpeechRecognition);
  }

  /** Call on PTT keydown */
  startListening(): void {
    if (!this.recognition || this.isListening) return;
    this.isListening = true;
    this.transcript = '';
    this.liveTranscript = '';
    useWorldStore.getState().setVoiceStatus('listening');
    useWorldStore.getState().setVoiceTranscript('');
    useWorldStore.getState().setVoiceError('');
    try {
      this.recognition.start();
    } catch (e) {
      console.warn('[VoicePipeline] Could not start recognition:', e);
    }
  }

  /** Call on PTT keyup — stops listening, runs full pipeline */
  async stopAndProcess(): Promise<void> {
    if (!this.recognition || !this.isListening) return;
    this.isListening = false;

    try {
      this.recognition.stop();
    } catch (_) { /* ignore */ }

    // Short buffer to let speech recognition engine flush trailing words
    await new Promise((r) => setTimeout(r, 350));

    // Prefer final transcript; fallback to whatever live transcript was heard and displayed
    const transcript = (this.transcript || this.liveTranscript).trim();
    this.transcript = '';
    this.liveTranscript = '';

    if (!transcript) {
      useWorldStore.getState().setVoiceStatus('idle');
      return;
    }

    await this.executeTranscript(transcript);
  }

  /** Direct execution of text (for quick testing chips or text fallback) */
  async executeTranscript(rawTranscript: string): Promise<void> {
    const transcript = rawTranscript.trim();
    if (!transcript) return;

    const store = useWorldStore.getState();
    store.setVoiceStatus('processing');
    store.setVoiceTranscript(transcript);

    try {
      // Build minimal entity context for the parser
      const entitySnap = Object.fromEntries(
        Object.entries(store.entities).map(([id, e]) => [
          id,
          { id: e.id, name: e.name, type: e.type },
        ])
      );

      const command = await parseVoiceCommand(transcript, entitySnap);

      if (command) {
        store.setVoiceCommand(command.type);
        dispatchCommand(command);
        store.setVoiceStatus('success');
      } else {
        store.setVoiceError('Command not understood');
        store.setVoiceStatus('error');
      }
    } catch (err) {
      console.error('[VoicePipeline] Pipeline error:', err);
      store.setVoiceError(String(err));
      store.setVoiceStatus('error');
    }

    // Auto-reset to idle after feedback display
    setTimeout(() => {
      useWorldStore.getState().setVoiceStatus('idle');
    }, 2500);
  }
}

/** Singleton — one pipeline for the whole app */
export const VoicePipeline = new VoicePipelineClass();

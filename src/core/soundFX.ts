// ============================================================
// SOUND FX ENGINE — Procedural Web Audio API Sound System
// Zero external asset downloads; 100% reliable, zero-latency synthesis
// for UI interactions, footsteps, landings, water splashes, swimming strokes,
// underwater muffled drone, combat impacts, destruction, fire hissing, and thunder.
// ============================================================

class SoundFXEngine {
  private ctx: AudioContext | null = null;
  private underwaterFilter: BiquadFilterNode | null = null;
  private masterGain: GainNode | null = null;
  private isUnderwater = false;
  private lastFootstepTime = 0;
  private lastSwimTime = 0;
  private ambienceOsc: OscillatorNode | null = null;
  private ambienceGain: GainNode | null = null;

  private init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      this.ctx = new AudioCtx();

      // Master output gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.8, this.ctx.currentTime);

      // Master underwater biquad filter (bypassed by default)
      this.underwaterFilter = this.ctx.createBiquadFilter();
      this.underwaterFilter.type = 'lowpass';
      this.underwaterFilter.frequency.setValueAtTime(22000, this.ctx.currentTime);

      this.underwaterFilter.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);
    } catch {
      // AudioContext unavailable or restricted
    }
  }

  private ensureContext(): AudioContext | null {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /**
   * Helper to generate a short burst of filtered white noise
   */
  private createNoiseBuffer(duration: number): AudioBuffer | null {
    const ctx = this.ensureContext();
    if (!ctx) return null;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    return buffer;
  }

  // ─── UI Sounds ──────────────────────────────────────────────

  playMenuHover() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(750, t);
    osc.frequency.exponentialRampToValueAtTime(950, t + 0.04);

    gain.gain.setValueAtTime(0.06, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.04);
  }

  playMenuSelect() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(520, t);
    osc.frequency.exponentialRampToValueAtTime(880, t + 0.12);

    gain.gain.setValueAtTime(0.14, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  playMenuBack() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, t);
    osc.frequency.exponentialRampToValueAtTime(260, t + 0.09);

    gain.gain.setValueAtTime(0.1, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  startTitleAmbience() {
    const ctx = this.ensureContext();
    if (!ctx || this.ambienceOsc) return;
    try {
      const t = ctx.currentTime;
      this.ambienceOsc = ctx.createOscillator();
      this.ambienceGain = ctx.createGain();

      this.ambienceOsc.type = 'sine';
      this.ambienceOsc.frequency.setValueAtTime(110, t);

      this.ambienceGain.gain.setValueAtTime(0.001, t);
      this.ambienceGain.gain.linearRampToValueAtTime(0.04, t + 2.0);

      this.ambienceOsc.connect(this.ambienceGain);
      this.ambienceGain.connect(ctx.destination);
      this.ambienceOsc.start(t);
    } catch {}
  }

  stopTitleAmbience() {
    if (!this.ctx || !this.ambienceGain || !this.ambienceOsc) return;
    try {
      const t = this.ctx.currentTime;
      this.ambienceGain.gain.linearRampToValueAtTime(0.001, t + 1.0);
      const osc = this.ambienceOsc;
      setTimeout(() => {
        try { osc.stop(); } catch {}
      }, 1050);
      this.ambienceOsc = null;
      this.ambienceGain = null;
    } catch {}
  }

  // ─── 1. Footsteps on Grass, Stone, or Shallow Water ─────────

  playFootstep(surface: 'grass' | 'stone' | 'water') {
    const ctx = this.ensureContext();
    if (!ctx || !this.underwaterFilter) return;

    const now = performance.now();
    if (now - this.lastFootstepTime < 240) return; // Prevent spam
    this.lastFootstepTime = now;

    const t = ctx.currentTime;

    if (surface === 'water') {
      // Shallow water wading slosh / splash
      const noise = this.createNoiseBuffer(0.12);
      if (!noise) return;
      const src = ctx.createBufferSource();
      src.buffer = noise;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400, t);
      filter.Q.setValueAtTime(2.5, t);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.16, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.underwaterFilter);

      src.start(t);
      src.stop(t + 0.12);
    } else if (surface === 'stone') {
      // Crisp stone click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(160 + Math.random() * 40, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.05);

      gain.gain.setValueAtTime(0.09, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

      osc.connect(gain);
      gain.connect(this.underwaterFilter);
      osc.start(t);
      osc.stop(t + 0.05);
    } else {
      // Soft earthy grass thud
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(95 + Math.random() * 25, t);
      osc.frequency.exponentialRampToValueAtTime(35, t + 0.07);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

      osc.connect(gain);
      gain.connect(this.underwaterFilter);
      osc.start(t);
      osc.stop(t + 0.07);
    }
  }

  // ─── 2. Landing Impact Thud ──────────────────────────────────
  playLanding(surface: 'grass' | 'stone' = 'grass') {
    const ctx = this.ensureContext();
    if (!ctx || !this.underwaterFilter) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = surface === 'stone' ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(28, t + 0.16);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.16);

    osc.connect(gain);
    gain.connect(this.underwaterFilter);
    osc.start(t);
    osc.stop(t + 0.16);
  }

  // ─── 3. Water Splashes (Entry / Exit / Body Impact) ──────────
  playWaterSplash(strength = 1.0) {
    const ctx = this.ensureContext();
    if (!ctx || !this.underwaterFilter) return;
    const t = ctx.currentTime;

    const dur = 0.28 * Math.max(0.4, strength);
    const noise = this.createNoiseBuffer(dur);
    if (!noise) return;

    const src = ctx.createBufferSource();
    src.buffer = noise;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(400, t + dur);
    filter.Q.setValueAtTime(2.0, t);

    const gain = ctx.createGain();
    const vol = Math.min(0.4, 0.22 * strength);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.underwaterFilter);

    src.start(t);
    src.stop(t + dur);
  }

  // ─── 4. Swimming Stroke Flutter ──────────────────────────────
  playSwimStroke() {
    const ctx = this.ensureContext();
    if (!ctx || !this.underwaterFilter) return;

    const now = performance.now();
    if (now - this.lastSwimTime < 450) return;
    this.lastSwimTime = now;

    const t = ctx.currentTime;
    const noise = this.createNoiseBuffer(0.24);
    if (!noise) return;

    const src = ctx.createBufferSource();
    src.buffer = noise;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.exponentialRampToValueAtTime(250, t + 0.24);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.18, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.underwaterFilter);

    src.start(t);
    src.stop(t + 0.24);
  }

  // ─── 5. Underwater Lowpass Filter & Audio Muffling ───────────
  setUnderwaterAudio(active: boolean) {
    if (this.isUnderwater === active) return;
    this.isUnderwater = active;

    const ctx = this.ensureContext();
    if (!ctx || !this.underwaterFilter) return;

    const t = ctx.currentTime;
    this.underwaterFilter.frequency.cancelScheduledValues(t);

    if (active) {
      // Muffle high frequencies heavily: cut off at 380Hz
      this.underwaterFilter.frequency.linearRampToValueAtTime(380, t + 0.25);
    } else {
      // Smoothly restore full acoustic frequency spectrum
      this.underwaterFilter.frequency.linearRampToValueAtTime(22000, t + 0.35);
    }
  }

  // ─── 6. Physical Prop Impact (Crate / Barrel / Rock) ─────────
  playPropImpact(speed = 1.0) {
    const ctx = this.ensureContext();
    if (!ctx || !this.underwaterFilter) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140 + Math.random() * 40, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.12);

    const vol = Math.min(0.35, 0.16 * Math.max(0.4, speed));
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    osc.connect(gain);
    gain.connect(this.underwaterFilter);
    osc.start(t);
    osc.stop(t + 0.12);
  }

  // ─── 7. Combat Hit Impact & Flesh/Armor Thud ─────────────────
  playCombatHit() {
    const ctx = this.ensureContext();
    if (!ctx || !this.underwaterFilter) return;
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(180, t);
    osc.frequency.exponentialRampToValueAtTime(60, t + 0.1);

    gain.gain.setValueAtTime(0.24, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.underwaterFilter);
    osc.start(t);
    osc.stop(t + 0.1);
  }

  // ─── 8. Structural Destruction (Bridge Collapse Rumble) ──────
  playDestructionSound() {
    const ctx = this.ensureContext();
    if (!ctx || !this.underwaterFilter) return;
    const t = ctx.currentTime;

    // Low rumble
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 1.2);

    gain.gain.setValueAtTime(0.45, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.2);

    // Stone fracture noise
    const noise = this.createNoiseBuffer(1.1);
    if (noise) {
      const src = ctx.createBufferSource();
      src.buffer = noise;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(450, t);
      filter.Q.setValueAtTime(2.0, t);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, t);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 1.1);

      src.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.underwaterFilter);
      src.start(t);
      src.stop(t + 1.1);
    }

    osc.connect(gain);
    gain.connect(this.underwaterFilter);
    osc.start(t);
    osc.stop(t + 1.2);
  }

  // ─── 9. Water Extinguishing Fire Hiss ────────────────────────
  playFireHiss() {
    const ctx = this.ensureContext();
    if (!ctx || !this.underwaterFilter) return;
    const t = ctx.currentTime;

    const noise = this.createNoiseBuffer(1.4);
    if (!noise) return;
    const src = ctx.createBufferSource();
    src.buffer = noise;

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2600, t);
    filter.frequency.exponentialRampToValueAtTime(1200, t + 1.4);
    filter.Q.setValueAtTime(3.0, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.24, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.underwaterFilter);
    src.start(t);
    src.stop(t + 1.4);
  }

  // ─── 10. Thunder Crack / Distant Storm Rumble ───────────────
  playThunder() {
    const ctx = this.ensureContext();
    if (!ctx || !this.underwaterFilter) return;
    const t = ctx.currentTime;

    const noise = this.createNoiseBuffer(1.8);
    if (!noise) return;
    const src = ctx.createBufferSource();
    src.buffer = noise;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(450, t);
    filter.frequency.linearRampToValueAtTime(180, t + 1.8);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.02, t);
    gain.gain.linearRampToValueAtTime(0.45, t + 0.08); // Sharp thunder crack
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.8);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.underwaterFilter);
    src.start(t);
    src.stop(t + 1.8);
  }

  // ─── Splash Screen Audio ────────────────────────────────────

  playKeystroke(variation = 0) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    // 1. Subtle mechanical click (filtered burst)
    const noise = this.createNoiseBuffer(0.015);
    if (noise) {
      const src = ctx.createBufferSource();
      src.buffer = noise;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(2800 + variation * 300, t);
      bp.Q.setValueAtTime(4.5, t);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.042, t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.014);

      src.connect(bp);
      bp.connect(gain);
      gain.connect(ctx.destination);
      src.start(t);
      src.stop(t + 0.015);
    }

    // 2. Subtle bottoming key body thud
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140 + variation * 20, t);
    osc.frequency.exponentialRampToValueAtTime(45, t + 0.025);

    oscGain.gain.setValueAtTime(0.028, t);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.025);

    osc.connect(oscGain);
    oscGain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.025);
  }

  playGlitchDistortion() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(180, t);
    osc1.frequency.setValueAtTime(320, t + 0.025);
    osc1.frequency.setValueAtTime(140, t + 0.05);

    osc2.frequency.setValueAtTime(194, t);
    osc2.frequency.setValueAtTime(308, t + 0.025);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(400, t + 0.07);

    gain.gain.setValueAtTime(0.038, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(t);
    osc2.start(t);
    osc1.stop(t + 0.07);
    osc2.stop(t + 0.07);
  }

  playEchoChime() {
    const ctx = this.ensureContext();
    if (!ctx) return;
    const t = ctx.currentTime;

    // Warm deep resonance (E2 = 82.4Hz, B2 = 123.5Hz, E3 = 164.8Hz, E4 = 329.6Hz)
    const freqs = [82.4, 123.47, 164.81, 329.63];
    const gains = [0.12, 0.08, 0.05, 0.025];

    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.001, t);
      gain.gain.linearRampToValueAtTime(gains[idx], t + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 2.5);
    });
  }
}

export const soundFX = new SoundFXEngine();

// Named helper exports for ergonomic calling
export const playMenuHover = () => soundFX.playMenuHover();
export const playMenuSelect = () => soundFX.playMenuSelect();
export const playMenuBack = () => soundFX.playMenuBack();
export const startTitleAmbience = () => soundFX.startTitleAmbience();
export const stopTitleAmbience = () => soundFX.stopTitleAmbience();
export const playFootstep = (surface: 'grass' | 'stone' | 'water') => soundFX.playFootstep(surface);
export const playLanding = (surface: 'grass' | 'stone' = 'grass') => soundFX.playLanding(surface);
export const playWaterSplash = (strength = 1.0) => soundFX.playWaterSplash(strength);
export const playSwimStroke = () => soundFX.playSwimStroke();
export const setUnderwaterAudio = (active: boolean) => soundFX.setUnderwaterAudio(active);
export const playPropImpact = (speed = 1.0) => soundFX.playPropImpact(speed);
export const playCombatHit = () => soundFX.playCombatHit();
export const playDestructionSound = () => soundFX.playDestructionSound();
export const playFireHiss = () => soundFX.playFireHiss();
export const playThunder = () => soundFX.playThunder();
export const playKeystroke = (variation?: number) => soundFX.playKeystroke(variation);
export const playGlitchDistortion = () => soundFX.playGlitchDistortion();
export const playEchoChime = () => soundFX.playEchoChime();

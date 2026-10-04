// ============================================================
// SETTINGS STORE — Game Options & Preferences Persistence
// Persisted in localStorage ('echo_settings')
// ============================================================

import { create } from 'zustand';
import { type TimeScale, DEFAULT_TIME_SCALE } from './timeConfig';
import { useWorldStore } from './WorldState';

export type GraphicsQuality = 'low' | 'medium' | 'high' | 'ultra';
export type ShadowQuality = 'off' | 'low' | 'high';
export type EffectsQuality = 'low' | 'high';
export type VoiceSensitivity = 'low' | 'medium' | 'high';
export type UIScale = 'small' | 'normal' | 'large';

export interface GameSettings {
  graphicsQuality: GraphicsQuality;
  shadows: ShadowQuality;
  effects: EffectsQuality;
  masterVolume: number;       // 0–100
  musicVolume: number;        // 0–100
  sfxVolume: number;          // 0–100
  cameraSensitivity: number;  // 0.5–2.0
  voiceSensitivity: VoiceSensitivity;
  subtitles: boolean;
  uiScale: UIScale;
  timeScale: TimeScale;       // 0.5x, 1.0x, 2.0x (authoritative world-time progression)
}

const DEFAULT_SETTINGS: GameSettings = {
  graphicsQuality: 'high',
  shadows: 'low',
  effects: 'high',
  masterVolume: 80,
  musicVolume: 60,
  sfxVolume: 85,
  cameraSensitivity: 1.0,
  voiceSensitivity: 'medium',
  subtitles: true,
  uiScale: 'normal',
  timeScale: DEFAULT_TIME_SCALE,
};

const STORAGE_KEY = 'echo_settings_v1';

function loadStoredSettings(): GameSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Validate timeScale
      if (parsed.timeScale !== 0.5 && parsed.timeScale !== 1.0 && parsed.timeScale !== 2.0) {
        parsed.timeScale = DEFAULT_TIME_SCALE;
      }
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    // Fall back to default
  }
  return DEFAULT_SETTINGS;
}

interface SettingsStore extends GameSettings {
  updateSettings: (patch: Partial<GameSettings>) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsStore>((set) => ({
  ...loadStoredSettings(),

  updateSettings: (patch) =>
    set((state) => {
      const next = { ...state, ...patch };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // storage quota/disabled
      }
      if (patch.timeScale !== undefined) {
        useWorldStore.getState().setTime({
          speed: patch.timeScale,
          timeScale: patch.timeScale,
        });
      }
      return next;
    }),

  resetSettings: () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SETTINGS));
    } catch {
      // ignore
    }
    useWorldStore.getState().setTime({
      speed: DEFAULT_TIME_SCALE,
      timeScale: DEFAULT_TIME_SCALE,
    });
    set(DEFAULT_SETTINGS);
  },
}));

if (typeof window !== 'undefined') {
  (window as any).__useSettingsStore = useSettingsStore;
}

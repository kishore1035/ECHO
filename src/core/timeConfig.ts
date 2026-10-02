// ============================================================
// ECHO — WORLD TIME CONFIGURATION
// Authoritative time scaling for the game world.
//
// Target: 1 real-world minute = 1 in-game hour
// A full 24-hour in-game day takes approximately 24 real minutes.
// ============================================================

/** Real-world seconds per 1 in-game hour at 1.0x time scale */
export const REAL_SECONDS_PER_IN_GAME_HOUR = 60.0;

/** Base in-game hours advanced per 1 real-world second (1 / 60) */
export const BASE_HOURS_PER_REAL_SECOND = 1.0 / REAL_SECONDS_PER_IN_GAME_HOUR;

/** Supported user time-scale settings */
export type TimeScale = 0.5 | 1.0 | 2.0;

export const TIME_SCALE_OPTIONS: { label: string; value: TimeScale; description: string }[] = [
  { label: '0.5x', value: 0.5, description: 'Slower (48 min per day)' },
  { label: '1.0x', value: 1.0, description: 'Default (24 min per day, 1m = 1h)' },
  { label: '2.0x', value: 2.0, description: 'Faster (12 min per day)' },
];

export const DEFAULT_TIME_SCALE: TimeScale = 1.0;

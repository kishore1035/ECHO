// ============================================================
// CONTROLS STORE — User Input Mappings & Persistence
// Completely isolated from WorldState & Timeline snapshots.
// Persisted under 'echo_controls_v1' in localStorage.
// ============================================================

import { create } from 'zustand';
import type {
  ActionId,
  ActionBindingsMap,
  ConflictCheckResult,
} from './types';
import { ACTION_DEFINITIONS, ACTION_DEFINITION_MAP } from './actionDefinitions';

const STORAGE_KEY = 'echo_controls_v1';

/**
 * Builds the default bindings map from ACTION_DEFINITIONS
 */
export function getDefaultBindings(): ActionBindingsMap {
  const map = {} as ActionBindingsMap;
  for (const def of ACTION_DEFINITIONS) {
    map[def.id] = {
      primary: def.defaultPrimary,
      alt: def.defaultAlt,
    };
  }
  return map;
}

/**
 * Normalizes and cleans browser key codes for friendly display
 */
export function formatKeyCodeDisplay(code: string | undefined): string {
  if (!code) return '—';

  // Standard alphanumeric
  if (code.startsWith('Key')) {
    return code.slice(3).toUpperCase();
  }
  if (code.startsWith('Digit')) {
    return code.slice(5);
  }
  if (code.startsWith('Numpad')) {
    return `NUM ${code.slice(6)}`;
  }

  // Common special keys
  switch (code) {
    case 'Space':
      return 'SPACE';
    case 'Escape':
      return 'ESC';
    case 'Enter':
      return 'ENTER';
    case 'Tab':
      return 'TAB';
    case 'ShiftLeft':
      return 'L-SHIFT';
    case 'ShiftRight':
      return 'R-SHIFT';
    case 'ControlLeft':
      return 'L-CTRL';
    case 'ControlRight':
      return 'R-CTRL';
    case 'AltLeft':
      return 'L-ALT';
    case 'AltRight':
      return 'R-ALT';
    case 'ArrowUp':
      return 'UP';
    case 'ArrowDown':
      return 'DOWN';
    case 'ArrowLeft':
      return 'LEFT';
    case 'ArrowRight':
      return 'RIGHT';
    case 'Backspace':
      return 'BACKSPACE';
    case 'Delete':
      return 'DEL';
    case 'Mouse0':
      return 'L-CLICK';
    case 'Mouse1':
      return 'R-CLICK';
    case 'Mouse2':
      return 'M-CLICK';
    default:
      return code.toUpperCase();
  }
}

function loadStoredBindings(): ActionBindingsMap {
  const defaults = getDefaultBindings();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Migrate legacy Space voice binding if present (to avoid conflict with jump)
      if (parsed.voicePushToTalk?.primary === 'Space') {
        parsed.voicePushToTalk.primary = 'KeyM';
      }
      // Merge with defaults in case new actions were added
      return { ...defaults, ...parsed };
    }
  } catch {
    // LocalStorage unavailable
  }
  return defaults;
}

function persistBindings(bindings: ActionBindingsMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
  } catch {
    // Ignore storage quota
  }
}

interface ControlsStore {
  bindings: ActionBindingsMap;

  // Conflict Checking
  checkConflict: (actionId: ActionId, candidateCode: string) => ConflictCheckResult;

  // Rebinding
  rebindAction: (
    actionId: ActionId,
    newCode: string,
    replaceConflict?: boolean
  ) => { success: boolean; conflict?: ConflictCheckResult };

  // Reset
  resetToDefaults: () => void;

  // Lookups & Display
  getBindingDisplay: (actionId: ActionId) => string;
  getPrimaryCode: (actionId: ActionId) => string;
  getCodesForAction: (actionId: ActionId) => string[];
}

export const useControlsStore = create<ControlsStore>((set, get) => ({
  bindings: loadStoredBindings(),

  checkConflict: (actionId, candidateCode) => {
    const targetDef = ACTION_DEFINITION_MAP[actionId];
    if (!targetDef) return { hasConflict: false };

    const normCandidate = candidateCode.toLowerCase();
    const currentBindings = get().bindings;

    // Check all actions that share the SAME input context
    for (const [otherIdStr, binding] of Object.entries(currentBindings)) {
      const otherId = otherIdStr as ActionId;
      if (otherId === actionId) continue;

      const otherDef = ACTION_DEFINITION_MAP[otherId];
      if (!otherDef || otherDef.context !== targetDef.context) continue;

      const matchesPrimary = binding.primary.toLowerCase() === normCandidate;
      const matchesAlt = Boolean(binding.alt && binding.alt.toLowerCase() === normCandidate);

      if (matchesPrimary || matchesAlt) {
        return {
          hasConflict: true,
          conflictActionId: otherId,
          conflictActionName: otherDef.name,
        };
      }
    }

    return { hasConflict: false };
  },

  rebindAction: (actionId, newCode, replaceConflict = false) => {
    const conflict = get().checkConflict(actionId, newCode);

    if (conflict.hasConflict && !replaceConflict) {
      return { success: false, conflict };
    }

    set((state) => {
      const nextBindings: ActionBindingsMap = { ...state.bindings };

      // If replacing a conflicting action, clear that key from the conflicting action
      if (conflict.hasConflict && conflict.conflictActionId) {
        const conflictingId = conflict.conflictActionId;
        const confBinding = nextBindings[conflictingId];
        if (confBinding) {
          const normCandidate = newCode.toLowerCase();
          if (confBinding.primary.toLowerCase() === normCandidate) {
            // Demote alt to primary or leave empty
            nextBindings[conflictingId] = {
              primary: confBinding.alt || 'Unbound',
              alt: undefined,
            };
          } else if (confBinding.alt && confBinding.alt.toLowerCase() === normCandidate) {
            nextBindings[conflictingId] = {
              primary: confBinding.primary,
              alt: undefined,
            };
          }
        }
      }

      // Update target action binding
      const current = nextBindings[actionId] || { primary: newCode };
      nextBindings[actionId] = {
        ...current,
        primary: newCode,
      };

      persistBindings(nextBindings);
      return { bindings: nextBindings };
    });

    return { success: true };
  },

  resetToDefaults: () => {
    const defaults = getDefaultBindings();
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    set({ bindings: defaults });
  },

  getBindingDisplay: (actionId) => {
    const binding = get().bindings[actionId];
    if (!binding || !binding.primary || binding.primary === 'Unbound') return '—';
    const primaryDisplay = formatKeyCodeDisplay(binding.primary);
    if (binding.alt) {
      return `${primaryDisplay} / ${formatKeyCodeDisplay(binding.alt)}`;
    }
    return primaryDisplay;
  },

  getPrimaryCode: (actionId) => {
    const binding = get().bindings[actionId];
    return binding?.primary || '';
  },

  getCodesForAction: (actionId) => {
    const binding = get().bindings[actionId];
    if (!binding) return [];
    const codes = [binding.primary];
    if (binding.alt) codes.push(binding.alt);
    return codes;
  },
}));

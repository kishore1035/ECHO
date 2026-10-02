// ============================================================
// ECHO TREE STATE — Singular Physical Timeline Anchor in ECHO
// Coordinates the contextual interaction, camera communion,
// and state-driven visual variations of the Echo Tree.
// ============================================================

import { create } from 'zustand';

export const ECHO_TREE_COORDS = {
  x: -13.0,
  z: -1.5,
  interactionRadius: 4.2,
} as const;

interface EchoTreeState {
  isNear: boolean;
  isInteracting: boolean;
  lastInteractedAt: number;

  setNear: (near: boolean) => void;
  checkProximity: (pos: { x: number; z: number }) => boolean;
  openInteraction: () => void;
  closeInteraction: () => void;
  toggleInteraction: () => void;
}

export const useEchoTreeStore = create<EchoTreeState>((set, get) => ({
  isNear: false,
  isInteracting: false,
  lastInteractedAt: 0,

  setNear: (isNear) => set({ isNear }),

  checkProximity: (pos) => {
    const dist = Math.hypot(pos.x - ECHO_TREE_COORDS.x, pos.z - ECHO_TREE_COORDS.z);
    const isNear = dist <= ECHO_TREE_COORDS.interactionRadius;
    set({ isNear });
    return isNear;
  },

  openInteraction: () => {
    set({ isInteracting: true, lastInteractedAt: Date.now() });
  },

  closeInteraction: () => {
    set({ isInteracting: false });
  },

  toggleInteraction: () => {
    const curr = get().isInteracting;
    if (curr) {
      get().closeInteraction();
    } else {
      get().openInteraction();
    }
  },
}));

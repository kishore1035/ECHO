// ============================================================
// INPUT MANAGER — Central Action-Based Input Resolution Engine
// Replaces hard-coded key checks across ECHO with action queries:
// isActionHeld("moveForward"), isActionPressed("jump"), matchesAction("pause", e)
// ============================================================

import type { ActionId } from './types';
import { useControlsStore } from './controlsStore';

class InputManagerEngine {
  private activeKeys = new Set<string>();
  private activeMouseButtons = new Set<number>();
  private isListeningForRebind = false;

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('keydown', this.handleKeyDown, { capture: true });
      window.addEventListener('keyup', this.handleKeyUp, { capture: true });
      window.addEventListener('mousedown', this.handleMouseDown, { capture: true });
      window.addEventListener('mouseup', this.handleMouseUp, { capture: true });
      window.addEventListener('blur', this.handleBlur);
    }
  }

  public setListeningForRebind(listening: boolean) {
    this.isListeningForRebind = listening;
    if (listening) {
      this.activeKeys.clear();
      this.activeMouseButtons.clear();
    }
  }

  public getIsListeningForRebind(): boolean {
    return this.isListeningForRebind;
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (this.isListeningForRebind) return;
    if (e.code) this.activeKeys.add(e.code.toLowerCase());
    if (e.key) this.activeKeys.add(e.key.toLowerCase());
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    if (e.code) this.activeKeys.delete(e.code.toLowerCase());
    if (e.key) this.activeKeys.delete(e.key.toLowerCase());
  };

  private handleMouseDown = (e: MouseEvent) => {
    if (this.isListeningForRebind) return;
    this.activeMouseButtons.add(e.button);
    this.activeKeys.add(`mouse${e.button}`.toLowerCase());
  };

  private handleMouseUp = (e: MouseEvent) => {
    this.activeMouseButtons.delete(e.button);
    this.activeKeys.delete(`mouse${e.button}`.toLowerCase());
  };

  private handleBlur = () => {
    this.activeKeys.clear();
    this.activeMouseButtons.clear();
  };

  /**
   * Checks whether the physical key(s) mapped to an action are currently held down
   */
  public isActionHeld(actionId: ActionId): boolean {
    if (this.isListeningForRebind) return false;
    const codes = useControlsStore.getState().getCodesForAction(actionId);
    for (const code of codes) {
      if (!code || code === 'Unbound') continue;
      const lower = code.toLowerCase();
      if (this.activeKeys.has(lower)) return true;

      // Handle KeyX vs x
      if (lower.startsWith('key') && this.activeKeys.has(lower.slice(3))) return true;
      if (lower === 'space' && (this.activeKeys.has(' ') || this.activeKeys.has('space'))) return true;
      if (lower === 'escape' && (this.activeKeys.has('escape') || this.activeKeys.has('esc'))) return true;
      if (lower === 'enter' && (this.activeKeys.has('enter') || this.activeKeys.has('return'))) return true;
    }
    return false;
  }

  /**
   * Tests whether an incoming KeyboardEvent matches the configured action
   */
  public matchesAction(actionId: ActionId, eventOrCode: KeyboardEvent | string): boolean {
    const codes = useControlsStore.getState().getCodesForAction(actionId);
    if (!codes.length) return false;

    let targetCode = '';
    let targetKey = '';

    if (typeof eventOrCode === 'string') {
      targetCode = eventOrCode.toLowerCase();
    } else {
      targetCode = (eventOrCode.code || '').toLowerCase();
      targetKey = (eventOrCode.key || '').toLowerCase();
    }

    for (const configuredCode of codes) {
      if (!configuredCode || configuredCode === 'Unbound') continue;
      const confLower = configuredCode.toLowerCase();

      // Direct code match (e.g. 'keyw' === 'keyw')
      if (targetCode && targetCode === confLower) return true;

      // Alphanumeric key match (e.g. 'w' matches 'KeyW')
      if (confLower.startsWith('key') && targetKey && targetKey === confLower.slice(3)) return true;

      // Special key normalization
      if (confLower === 'space' && (targetKey === ' ' || targetCode === 'space')) return true;
      if (confLower === 'escape' && (targetKey === 'escape' || targetCode === 'escape')) return true;
      if (confLower === 'enter' && (targetKey === 'enter' || targetCode === 'enter')) return true;
      if (confLower === 'arrowup' && (targetKey === 'arrowup' || targetCode === 'arrowup')) return true;
      if (confLower === 'arrowdown' && (targetKey === 'arrowdown' || targetCode === 'arrowdown')) return true;
      if (confLower === 'arrowleft' && (targetKey === 'arrowleft' || targetCode === 'arrowleft')) return true;
      if (confLower === 'arrowright' && (targetKey === 'arrowright' || targetCode === 'arrowright')) return true;
    }

    return false;
  }

  /**
   * Resets active depressed keys
   */
  public clearState(): void {
    this.activeKeys.clear();
    this.activeMouseButtons.clear();
  }
}

export const InputManager = new InputManagerEngine();

// Ergonomic helper exports
export const isActionHeld = (action: ActionId) => InputManager.isActionHeld(action);
export const matchesAction = (action: ActionId, e: KeyboardEvent | string) =>
  InputManager.matchesAction(action, e);

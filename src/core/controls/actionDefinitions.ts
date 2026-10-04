// ============================================================
// ACTION DEFINITIONS — Master Registry of ECHO Actions
// Defines context, category, default bindings, and human labels
// ============================================================

import type { ActionDefinition, ActionId, ActionCategory } from './types';

export const ACTION_DEFINITIONS: ActionDefinition[] = [
  // ── MOVEMENT (Gameplay Context) ──
  {
    id: 'moveForward',
    name: 'Move Forward',
    category: 'MOVEMENT',
    context: 'gameplay',
    defaultPrimary: 'KeyW',
    defaultAlt: 'ArrowUp',
  },
  {
    id: 'moveBackward',
    name: 'Move Backward',
    category: 'MOVEMENT',
    context: 'gameplay',
    defaultPrimary: 'KeyS',
    defaultAlt: 'ArrowDown',
  },
  {
    id: 'moveLeft',
    name: 'Move Left',
    category: 'MOVEMENT',
    context: 'gameplay',
    defaultPrimary: 'KeyA',
    defaultAlt: 'ArrowLeft',
  },
  {
    id: 'moveRight',
    name: 'Move Right',
    category: 'MOVEMENT',
    context: 'gameplay',
    defaultPrimary: 'KeyD',
    defaultAlt: 'ArrowRight',
  },
  {
    id: 'jump',
    name: 'Jump',
    category: 'MOVEMENT',
    context: 'gameplay',
    defaultPrimary: 'Space',
    defaultAlt: 'KeyJ',
  },
  {
    id: 'sprint',
    name: 'Sprint',
    category: 'MOVEMENT',
    context: 'gameplay',
    defaultPrimary: 'ShiftLeft',
    defaultAlt: 'ShiftRight',
  },

  // ── CAMERA (Gameplay Context) ──
  {
    id: 'toggleCamera',
    name: 'Toggle Camera',
    category: 'CAMERA',
    context: 'gameplay',
    defaultPrimary: 'KeyV',
  },
  {
    id: 'cameraReset',
    name: 'Camera Reset',
    category: 'CAMERA',
    context: 'gameplay',
    defaultPrimary: 'KeyZ',
  },

  // ── INTERACTION (Gameplay Context) ──
  {
    id: 'interact',
    name: 'Interact',
    category: 'INTERACTION',
    context: 'gameplay',
    defaultPrimary: 'KeyE',
  },
  {
    id: 'pause',
    name: 'Pause',
    category: 'INTERACTION',
    context: 'gameplay',
    defaultPrimary: 'Escape',
  },

  // ── VOICE (Gameplay Context) ──
  {
    id: 'voicePushToTalk',
    name: 'Push To Talk / Voice Command',
    category: 'VOICE',
    context: 'gameplay',
    defaultPrimary: 'KeyM',
  },

  // ── DIALOGUE (Dialogue Context) ──
  {
    id: 'dialogueAdvance',
    name: 'Advance Dialogue',
    category: 'DIALOGUE',
    context: 'dialogue',
    defaultPrimary: 'Enter',
    defaultAlt: 'Space',
  },
  {
    id: 'dialoguePrevChoice',
    name: 'Previous Choice',
    category: 'DIALOGUE',
    context: 'dialogue',
    defaultPrimary: 'ArrowUp',
    defaultAlt: 'KeyW',
  },
  {
    id: 'dialogueNextChoice',
    name: 'Next Choice',
    category: 'DIALOGUE',
    context: 'dialogue',
    defaultPrimary: 'ArrowDown',
    defaultAlt: 'KeyS',
  },
  {
    id: 'dialogueConfirm',
    name: 'Confirm Choice',
    category: 'DIALOGUE',
    context: 'dialogue',
    defaultPrimary: 'Enter',
    defaultAlt: 'Space',
  },
  {
    id: 'dialogueBack',
    name: 'Back',
    category: 'DIALOGUE',
    context: 'dialogue',
    defaultPrimary: 'Escape',
  },

  // ── TIMELINE (Timeline Context) ──
  {
    id: 'timelineRewind',
    name: 'Open Timeline / Rewind',
    category: 'TIMELINE',
    context: 'timeline',
    defaultPrimary: 'KeyR',
  },
  {
    id: 'timelineBack',
    name: 'Back',
    category: 'TIMELINE',
    context: 'timeline',
    defaultPrimary: 'Escape',
  },
];

export const ACTION_DEFINITION_MAP: Record<ActionId, ActionDefinition> =
  ACTION_DEFINITIONS.reduce((acc, def) => {
    acc[def.id] = def;
    return acc;
  }, {} as Record<ActionId, ActionDefinition>);

export const ACTION_CATEGORIES: ActionCategory[] = [
  'MOVEMENT',
  'CAMERA',
  'INTERACTION',
  'VOICE',
  'DIALOGUE',
  'TIMELINE',
];

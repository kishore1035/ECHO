// ============================================================
// CONTROLS SYSTEM TYPES — Action-Based Input Mapping for ECHO
// Centralized schema for input contexts, actions, and key codes
// ============================================================

export type InputContext = 'gameplay' | 'dialogue' | 'timeline' | 'menu';

export type ActionCategory =
  | 'MOVEMENT'
  | 'CAMERA'
  | 'INTERACTION'
  | 'VOICE'
  | 'DIALOGUE'
  | 'TIMELINE';

export type ActionId =
  // Movement
  | 'moveForward'
  | 'moveBackward'
  | 'moveLeft'
  | 'moveRight'
  | 'jump'
  // Camera
  | 'toggleCamera'
  | 'cameraReset'
  // Interaction
  | 'interact'
  | 'pause'
  // Voice
  | 'voicePushToTalk'
  // Dialogue
  | 'dialogueAdvance'
  | 'dialoguePrevChoice'
  | 'dialogueNextChoice'
  | 'dialogueConfirm'
  | 'dialogueBack'
  // Timeline
  | 'timelineRewind'
  | 'timelineBack';

export interface ActionDefinition {
  id: ActionId;
  name: string;
  category: ActionCategory;
  context: InputContext;
  defaultPrimary: string; // e.g. 'KeyW', 'Space', 'Escape'
  defaultAlt?: string;     // e.g. 'ArrowUp', 'KeyJ'
  description?: string;
}

export interface ActionBinding {
  primary: string;
  alt?: string;
}

export type ActionBindingsMap = Record<ActionId, ActionBinding>;

export interface ConflictCheckResult {
  hasConflict: boolean;
  conflictActionId?: ActionId;
  conflictActionName?: string;
}

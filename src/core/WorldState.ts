// ============================================================
// WORLD STATE — Single Zustand store, single source of truth
// Renderer reads from here. Voice commands write to here.
// All mutations are pure and serialization-safe (for M4 branching).
// ============================================================

import { create } from 'zustand';
import type {
  Entity, WorldStateData, WeatherState, WorldTime,
  VoiceState, VoiceStatus, PlayerState, Faction, FactionRelation,
  StoryState, WorldEvent, WorldSnapshot, DynamicProp,
} from './types';
import { registerObstacle, clearObstacles, unregisterObstacle } from './collision';
import { createInitialProps } from './physicsWorld';
import { playDestructionSound } from './soundFX';

function generateId(): string {
  return `e_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

// ─── Store shape (world data + UI-only voice state) ──────────

interface WorldStore extends WorldStateData {
  voice: VoiceState;

  // ── Player avatar mutations ────────────────────────────────
  updatePlayer: (patch: Partial<PlayerState>) => void;

  // ── Faction & Story mutations ──────────────────────────────
  setFactionRelation: (factionA: string, factionB: string, relation: FactionRelation) => void;
  setStory: (patch: Partial<StoryState>) => void;
  addStoryLog: (entry: string) => void;

  // ── Entity mutations ───────────────────────────────────────
  addEntity: (data: Omit<Entity, 'id'>) => string;
  removeEntity: (entityId: string) => void;
  removeEntityByName: (name: string) => void;
  removeAllEntities: () => void;
  updateEntity: (entityId: string, patch: Partial<Entity>) => void;

  // ── World mutations ────────────────────────────────────────
  setWeather: (patch: Partial<WeatherState>) => void;
  setTime: (patch: Partial<WorldTime>) => void;
  advanceTime: (deltaHours: number) => void;
  setChaosScore: (score: number) => void;
  addChaos: (delta: number) => void;

  // ── Memory mutations (M3) ─────────────────────────────────
  recordEvent: (event: Omit<WorldEvent, 'id'>) => void;
  clearEvents: () => void;

  // ── Voice UI mutations ─────────────────────────────────────
  setVoiceStatus: (status: VoiceStatus) => void;
  setVoiceTranscript: (text: string) => void;
  setVoiceError: (error: string) => void;
  setVoiceCommand: (command: string) => void;

  // ── M5 World Physics & Destruction mutations ──────────────
  setBridgeDestroyed: (destroyed: boolean) => void;
  setCampfireBurning: (burning: boolean) => void;
  updateProp: (id: string, patch: Partial<DynamicProp>) => void;
  setDynamicProps: (props: Record<string, DynamicProp>) => void;

  // ── Timeline mutations (M4) ─────────────────────────────────
  timelineRestoreVersion: number;
  restoreSnapshot: (snapshot: WorldSnapshot) => void;
}

// ─── Initial Factions ─────────────────────────────────────────

const INITIAL_FACTIONS: Record<string, Faction> = {
  suncrest: {
    id: 'suncrest',
    name: 'Suncrest Realm',
    color: '#3878e8',
    bannerColor: '#f0c030',
    leaderName: 'King Aldric the Just',
    homeRegion: 'Eastern Ridge',
  },
  shadowfang: {
    id: 'shadowfang',
    name: 'Shadowfang Legion',
    color: '#c82828',
    bannerColor: '#404040',
    leaderName: 'Warlord Vorn the Ironclast',
    homeRegion: 'Western Pass',
  },
  neutral: {
    id: 'neutral',
    name: 'Meadowlands Enclave',
    color: '#40a858',
    bannerColor: '#d8b060',
    leaderName: 'Rowan the Miller',
    homeRegion: 'River Valley',
  },
};

const INITIAL_RELATIONS: Record<string, Record<string, FactionRelation>> = {
  suncrest: {
    suncrest: 'allied',
    shadowfang: 'neutral', // Tense border standoff
    neutral: 'allied',
  },
  shadowfang: {
    suncrest: 'neutral',
    shadowfang: 'allied',
    neutral: 'neutral',
  },
  neutral: {
    suncrest: 'allied',
    shadowfang: 'neutral',
    neutral: 'allied',
  },
};

const INITIAL_STORY: StoryState = {
  currentAct: 'ACT I: THE GATHERING CLOUDS',
  branch: 'STANDOFF',
  tension: 65,
  title: 'The Standoff of the Two Thrones',
  objective: 'Two kingdoms face each other across the river. Speak to forge an alliance or declare war!',
  log: [
    'King Aldric has positioned Suncrest Paladins atop the Eastern Ridge.',
    'Warlord Vorn and the Shadowfang Berserkers have established a forward camp.',
    'The Meadowlands villagers watch in fearful silence.',
  ],
};

// ─── Initial living population with Factions & VIPs ───────────

function createInitialEntities(): Record<string, Entity> {
  const initialList: Omit<Entity, 'id'>[] = [
    // ── Neutral Meadowlands (Center) ──
    {
      type: 'windmill',
      name: 'Old Mill',
      position: { x: 7, y: 0, z: 6 },
      rotationY: 0.3,
      health: 200,
      maxHealth: 200,
      factionId: 'neutral',
      category: 'structure',
    },
    {
      type: 'house',
      name: 'Miller Cottage',
      position: { x: 3, y: 0, z: 8 },
      rotationY: -0.4,
      health: 150,
      maxHealth: 150,
      factionId: 'neutral',
      category: 'structure',
    },
    {
      type: 'bridge',
      name: 'The River Bridge',
      position: { x: -8, y: 0, z: 5 },
      rotationY: 0.35,
      health: 200,
      maxHealth: 200,
      factionId: 'neutral',
      category: 'structure',
    },
    {
      type: 'villager',
      name: 'Rowan the Miller',
      position: { x: 3.8, y: 0, z: 4.0 },
      rotationY: -2.3, // Facing South-West toward the river path where the player arrives
      health: 100,
      maxHealth: 100,
      factionId: 'neutral',
      aiState: 'idle',
      idleTimer: 6,
      moveSpeed: 1.6,
      category: 'character',
      isVIP: true,
      dialogBark: 'I hope the kingdoms find peace...',
    },
    {
      type: 'villager',
      name: 'Elspeth the Herbalist',
      position: { x: 2, y: 0, z: 6 },
      rotationY: 1.2,
      health: 100,
      maxHealth: 100,
      factionId: 'neutral',
      aiState: 'idle',
      idleTimer: 3,
      moveSpeed: 1.5,
      category: 'character',
      dialogBark: 'The river waters are uneasy today.',
    },
    {
      type: 'guard',
      name: 'Meadowlands Sentinel',
      position: { x: 0.5, y: 0, z: 5.5 },
      rotationY: -1.4,
      health: 120,
      maxHealth: 120,
      factionId: 'neutral',
      aiState: 'wandering',
      idleTimer: 4,
      moveSpeed: 1.4,
      category: 'character',
      dialogBark: 'Keep your footing near the riverbank, traveler.',
    },
    {
      type: 'villager',
      name: 'Bram the Carpenter',
      position: { x: 3.5, y: 0, z: 9.2 },
      rotationY: 0.5,
      health: 100,
      maxHealth: 100,
      factionId: 'neutral',
      aiState: 'idle',
      idleTimer: 4,
      moveSpeed: 1.2,
      category: 'character',
      dialogBark: 'These sturdy timbers keep the cottage roofs warm.',
    },
    {
      type: 'mage',
      name: 'Mira the Seer',
      position: { x: -4, y: 0, z: 9 },
      rotationY: 0.8,
      health: 120,
      maxHealth: 120,
      factionId: 'neutral',
      aiState: 'idle',
      idleTimer: 4,
      moveSpeed: 1.6,
      category: 'character',
      isVIP: true,
      dialogBark: 'The river remembers words that have not yet been spoken...',
    },
    {
      type: 'sheep',
      name: 'Woolly',
      position: { x: -6, y: 0, z: -2 },
      rotationY: 2.1,
      health: 50,
      maxHealth: 50,
      factionId: null,
      aiState: 'wandering',
      idleTimer: 4,
      moveSpeed: 1.2,
      category: 'creature',
    },
    {
      type: 'deer',
      name: 'Fleetfoot',
      position: { x: -16, y: 0, z: 12 },
      rotationY: -1.0,
      health: 70,
      maxHealth: 70,
      factionId: null,
      aiState: 'wandering',
      idleTimer: 2,
      moveSpeed: 2.6,
      category: 'creature',
    },

    // ── Suncrest Realm (East) ──
    {
      type: 'castle',
      name: 'Suncrest Citadel',
      position: { x: 18, y: 0, z: -14 },
      rotationY: -0.4,
      health: 500,
      maxHealth: 500,
      factionId: 'suncrest',
      category: 'structure',
    },
    {
      type: 'king',
      name: 'King Aldric the Just',
      position: { x: 14, y: 0, z: -12 },
      rotationY: -1.2,
      health: 200,
      maxHealth: 200,
      factionId: 'suncrest',
      aiState: 'idle',
      idleTimer: 5,
      moveSpeed: 1.8,
      category: 'character',
      isVIP: true,
      dialogBark: 'Suncrest will stand firm against tyranny.',
    },
    {
      type: 'knight',
      name: 'Sir Gareth',
      position: { x: 12, y: 0, z: -10 },
      rotationY: -1.4,
      health: 120,
      maxHealth: 120,
      factionId: 'suncrest',
      aiState: 'wandering',
      idleTimer: 2,
      moveSpeed: 2.0,
      category: 'character',
      dialogBark: 'For the glory of Suncrest!',
    },
    {
      type: 'guard',
      name: 'Suncrest Vanguard',
      position: { x: 16, y: 0, z: -9 },
      rotationY: -1.0,
      health: 100,
      maxHealth: 100,
      factionId: 'suncrest',
      aiState: 'wandering',
      idleTimer: 3,
      moveSpeed: 1.8,
      category: 'character',
    },

    // ── Shadowfang Legion (West) ──
    {
      type: 'tower',
      name: 'Shadow Bastion',
      position: { x: -20, y: 0, z: -12 },
      rotationY: 0,
      health: 300,
      maxHealth: 300,
      factionId: 'shadowfang',
      category: 'structure',
    },
    {
      type: 'king',
      name: 'Warlord Vorn the Ironclast',
      position: { x: -16, y: 0, z: -10 },
      rotationY: 1.2,
      health: 220,
      maxHealth: 220,
      factionId: 'shadowfang',
      aiState: 'idle',
      idleTimer: 4,
      moveSpeed: 2.0,
      category: 'character',
      isVIP: true,
      dialogBark: 'The strong take what is theirs.',
    },
    {
      type: 'knight',
      name: 'Berserker Korg',
      position: { x: -14, y: 0, z: -8 },
      rotationY: 1.5,
      health: 130,
      maxHealth: 130,
      factionId: 'shadowfang',
      aiState: 'wandering',
      idleTimer: 2,
      moveSpeed: 2.2,
      category: 'character',
      dialogBark: 'My blade thirsts for battle.',
    },
    {
      type: 'guard',
      name: 'Shadow Legionnaire',
      position: { x: -18, y: 0, z: -6 },
      rotationY: 1.0,
      health: 100,
      maxHealth: 100,
      factionId: 'shadowfang',
      aiState: 'wandering',
      idleTimer: 3,
      moveSpeed: 1.8,
      category: 'character',
    },
  ];

  const map: Record<string, Entity> = {};
  for (const item of initialList) {
    const id = generateId();
    map[id] = { id, ...item };
    // Register solid structure collision footprints
    if (item.category === 'structure') {
      const radius = item.type === 'castle' ? 3.5 : item.type === 'windmill' ? 2.5 : 2.0;
      registerObstacle(id, item.position.x, item.position.z, radius);
    }
  }
  return map;
}

// ─── Store implementation ─────────────────────────────────────

export const useWorldStore = create<WorldStore>((set) => ({
  // ── Initial world state ────────────────────────────────────
  entities: createInitialEntities(),
  player: {
    position: { x: 0, y: 2.5, z: 8 },
    rotationY: Math.PI,
    velocity: { x: 0, y: 0, z: 0 },
    isGrounded: true,
  },
  factions: INITIAL_FACTIONS,
  relations: INITIAL_RELATIONS,
  story: INITIAL_STORY,
  terrain: { seed: 42, size: 250 },
  weather: { type: 'clear', intensity: 1 },
  time: { hours: 10, speed: 1.0, isPaused: true },
  chaosScore: 0,
  events: [],  // M3: world memory ledger
  timelineRestoreVersion: 0,
  bridgeDestroyed: false,
  isCampfireBurning: true,
  dynamicProps: createInitialProps(),

  voice: {
    status: 'idle',
    lastTranscript: '',
    lastError: '',
    lastCommand: '',
  },

  // ── Player avatar mutations ────────────────────────────────
  updatePlayer: (patch) =>
    set((s) => ({ player: { ...s.player, ...patch } })),

  // ── Faction & Story mutations ──────────────────────────────
  setFactionRelation: (factionA, factionB, relation) =>
    set((s) => {
      const nextRel = { ...s.relations };
      if (nextRel[factionA]) {
        nextRel[factionA] = { ...nextRel[factionA], [factionB]: relation };
      }
      if (nextRel[factionB]) {
        nextRel[factionB] = { ...nextRel[factionB], [factionA]: relation };
      }
      return { relations: nextRel };
    }),

  setStory: (patch) =>
    set((s) => ({ story: { ...s.story, ...patch } })),

  addStoryLog: (entry) =>
    set((s) => ({
      story: {
        ...s.story,
        log: [entry, ...s.story.log.slice(0, 15)],
      },
    })),

  // ── Entity mutations ───────────────────────────────────────
  addEntity: (data) => {
    const id = generateId();
    const entity: Entity = { id, ...data };
    if (data.category === 'structure') {
      const radius = data.type === 'castle' ? 3.5 : data.type === 'windmill' ? 2.5 : 2.0;
      registerObstacle(id, data.position.x, data.position.z, radius);
    }
    set((s) => ({ entities: { ...s.entities, [id]: entity } }));
    return id;
  },

  removeEntity: (entityId) => {
    set((s) => {
      const entity = s.entities[entityId];
      if (entity) {
        unregisterObstacle(entityId);
      }
      const isBridge = entity?.type === 'bridge' || entity?.name.toLowerCase().includes('bridge');
      if (isBridge && !s.bridgeDestroyed) {
        playDestructionSound();
      }
      const next = { ...s.entities };
      delete next[entityId];
      return {
        entities: next,
        bridgeDestroyed: isBridge ? true : s.bridgeDestroyed,
      };
    });
  },

  removeEntityByName: (name) => {
    set((s) => {
      const match = Object.values(s.entities).find(
        (e) => e.name.toLowerCase() === name.toLowerCase() || (name.toLowerCase() === 'bridge' && e.type === 'bridge')
      );
      if (!match) {
        if (name.toLowerCase() === 'bridge') {
          if (!s.bridgeDestroyed) playDestructionSound();
          return { bridgeDestroyed: true };
        }
        return s;
      }
      unregisterObstacle(match.id);
      const isBridge = match.type === 'bridge' || match.name.toLowerCase().includes('bridge');
      if (isBridge && !s.bridgeDestroyed) {
        playDestructionSound();
      }
      const next = { ...s.entities };
      delete next[match.id];
      return {
        entities: next,
        bridgeDestroyed: isBridge ? true : s.bridgeDestroyed,
      };
    });
  },

  removeAllEntities: () => set({ entities: {} }),

  updateEntity: (entityId, patch) => {
    set((s) => {
      const entity = s.entities[entityId];
      if (!entity) return s;
      return { entities: { ...s.entities, [entityId]: { ...entity, ...patch } } };
    });
  },

  // ── M5 World Physics & Destruction mutations ──────────────
  setBridgeDestroyed: (bridgeDestroyed) => set({ bridgeDestroyed }),
  setCampfireBurning: (isCampfireBurning) => set({ isCampfireBurning }),
  updateProp: (id, patch) =>
    set((s) => {
      const prop = s.dynamicProps[id];
      if (!prop) return s;
      return { dynamicProps: { ...s.dynamicProps, [id]: { ...prop, ...patch } } };
    }),
  setDynamicProps: (dynamicProps) => set({ dynamicProps }),

  // ── World mutations ────────────────────────────────────────
  setWeather: (patch) =>
    set((s) => ({ weather: { ...s.weather, ...patch } })),

  setTime: (patch) =>
    set((s) => ({ time: { ...s.time, ...patch } })),

  advanceTime: (deltaHours) =>
    set((s) => ({
      time: {
        ...s.time,
        hours: (s.time.hours + deltaHours + 24) % 24,
      },
    })),

  setChaosScore: (score) =>
    set({ chaosScore: Math.max(0, Math.min(100, score)) }),

  addChaos: (delta) =>
    set((s) => ({ chaosScore: Math.max(0, Math.min(100, s.chaosScore + delta)) })),

  // ── Memory mutations (M3) ───────────────────────────────────
  recordEvent: (event) => {
    const id = `ev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    set((s) => ({
      events: [...s.events, { id, ...event }].slice(-200), // cap at 200
    }));
  },

  clearEvents: () => set({ events: [] }),

  // ── Voice UI mutations ─────────────────────────────────────
  setVoiceStatus: (status) =>
    set((s) => ({ voice: { ...s.voice, status } })),

  setVoiceTranscript: (lastTranscript) =>
    set((s) => ({ voice: { ...s.voice, lastTranscript } })),

  setVoiceError: (lastError) =>
    set((s) => ({ voice: { ...s.voice, lastError } })),

  setVoiceCommand: (lastCommand) =>
    set((s) => ({ voice: { ...s.voice, lastCommand } })),

  // ── Timeline mutations (M4) ─────────────────────────────────
  restoreSnapshot: (snapshot) => {
    // 1. Rebuild obstacle colliders
    clearObstacles();
    for (const entity of Object.values(snapshot.entities)) {
      if (entity.category === 'structure') {
        const radius = entity.type === 'castle' ? 3.5 : entity.type === 'windmill' ? 2.5 : 2.0;
        registerObstacle(entity.id, entity.position.x, entity.position.z, radius);
      }
    }

    // 2. Deep clone state to ensure full snapshot isolation
    const cloned = JSON.parse(JSON.stringify(snapshot)) as WorldSnapshot;

    // 3. Set the world state & increment timeline restore version
    set((s) => ({
      entities: cloned.entities,
      player: cloned.player,
      factions: cloned.factions,
      relations: cloned.relations,
      story: cloned.story,
      terrain: cloned.terrain,
      weather: cloned.weather,
      time: cloned.time,
      chaosScore: cloned.chaosScore,
      events: cloned.events,
      bridgeDestroyed: cloned.bridgeDestroyed ?? false,
      isCampfireBurning: cloned.isCampfireBurning ?? true,
      dynamicProps: cloned.dynamicProps ?? createInitialProps(),
      timelineRestoreVersion: s.timelineRestoreVersion + 1,
    }));
  },
}));

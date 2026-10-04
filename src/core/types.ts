// ============================================================
// CORE TYPES — Single source of truth for all game data shapes
// All types must remain JSON-serializable (for future branching)
// M3: Added WorldEvent, EventType, InteractEntityCommand
// ============================================================

export type CharacterType = 'knight' | 'king' | 'villager' | 'mage' | 'guard' | 'merchant' | 'player';
export type CreatureType = 'wolf' | 'dragon' | 'deer' | 'sheep' | 'fox';
export type StructureType = 'tower' | 'house' | 'windmill' | 'castle' | 'village' | 'bridge';

export type EntityType = CharacterType | CreatureType | StructureType | 'generic';

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Entity {
  id: string;
  type: EntityType;
  name: string;
  position: Vec3;
  rotationY: number;      // Y-axis rotation in radians
  health: number;
  maxHealth: number;
  factionId: string | null;
  // M1/M2 AI behaviors & stats
  aiState?: 'idle' | 'wandering' | 'cheering' | 'alert' | 'marching' | 'fleeing' | 'advancing';
  targetPos?: Vec3;
  idleTimer?: number;
  moveSpeed?: number;
  category?: 'character' | 'creature' | 'structure';
  isVIP?: boolean;
  dialogBark?: string;
  // M5 Physics & Combat Feedback
  isStaggered?: boolean;
  isCollapsed?: boolean;
  knockback?: { vx: number; vz: number; timer: number };
}

export interface TerrainConfig {
  seed: number;
  size: number;           // world extends ±(size/2)
}

export type WeatherType = 'clear' | 'rain' | 'storm' | 'fog';

export interface WeatherState {
  type: WeatherType;
  intensity: number;      // 0–1
}

export interface WorldTime {
  hours: number;          // 0–24
  speed: number;          // time multiplier (e.g. 1.0 for normal, 0.5 for half, 2.0 for double)
  isPaused: boolean;
  timeScale?: number;     // optional user time-scale setting (0.5, 1.0, 2.0)
}

// ─── Faction System ──────────────────────────────────────────

export type FactionRelation = 'allied' | 'neutral' | 'hostile';

export interface Faction {
  id: string;
  name: string;
  color: string;
  bannerColor: string;
  leaderName: string;
  homeRegion: string;
}

// ─── Story / Narrative System ────────────────────────────────

export type StoryBranch = 'STANDOFF' | 'ALLIANCE' | 'WAR' | 'MALICE';

export interface StoryState {
  currentAct: string;
  branch: StoryBranch;
  tension: number;         // 0 to 100
  title: string;
  objective: string;
  log: string[];
}

// ─── Memory System (M3) ──────────────────────────────────────

export type EventType =
  | 'player_helped'      // player did something beneficial to an entity/faction
  | 'player_attacked'    // player attacked an entity/faction
  | 'faction_shift'      // relation between two factions changed
  | 'malice_summoned'    // a hostile creature (dragon/wolf pack) was spawned
  | 'vip_witnessed'      // a VIP was nearby when something significant happened
  | 'structure_built'    // player built something
  | 'story_beat';        // a narrative trigger fired

export interface WorldEvent {
  id: string;
  gameHour: number;         // world time when event occurred
  type: EventType;
  actorId: string;          // entity id or 'player'
  actorName: string;
  targetId?: string;        // entity/faction id affected
  targetName?: string;
  factionId?: string;       // faction context
  description: string;      // human-readable log line
  significance: 1 | 2 | 3; // 1=minor, 2=major, 3=legendary
}

// ─── Player Avatar State & Water Depth ───────────────────────

export type WaterDepthState = 'none' | 'shallow' | 'swimming' | 'underwater';

export interface PlayerState {
  position: Vec3;
  rotationY: number;
  velocity: Vec3;
  isGrounded: boolean;
  isAttacking?: boolean;
  waterState?: WaterDepthState;
  isStaggered?: boolean;
  knockbackTimer?: number;
}

// ─── Physical Interactive Props (M5) ─────────────────────────

export type PropType = 'crate' | 'barrel' | 'rock' | 'rubble';

export interface DynamicProp {
  id: string;
  name: string;
  propType: PropType;
  position: Vec3;
  rotation: Vec3;
  velocity: Vec3;
  radius: number;
  mass: number;
  health: number;
  isBroken: boolean;
}

// Top-level world data — everything here is serializable for branching
export interface WorldStateData {
  entities: Record<string, Entity>;
  player: PlayerState;
  factions: Record<string, Faction>;
  relations: Record<string, Record<string, FactionRelation>>;
  story: StoryState;
  terrain: TerrainConfig;
  weather: WeatherState;
  time: WorldTime;
  chaosScore: number;     // 0–100, tracks player destructiveness
  events: WorldEvent[];   // M3: persistent world memory ledger
  // M5 World Physics & State
  bridgeDestroyed: boolean;
  isCampfireBurning: boolean;
  dynamicProps: Record<string, DynamicProp>;
}

// ─── Timeline & Alternate Realities (M4) ─────────────────────

export interface WorldSnapshot {
  entities: Record<string, Entity>;
  player: PlayerState;
  factions: Record<string, Faction>;
  relations: Record<string, Record<string, FactionRelation>>;
  story: StoryState;
  terrain: TerrainConfig;
  weather: WeatherState;
  time: WorldTime;
  chaosScore: number;
  events: WorldEvent[];
  firedTriggers: string[];
  campaign?: any;
  bridgeDestroyed?: boolean;
  isCampfireBurning?: boolean;
  dynamicProps?: Record<string, DynamicProp>;
}

export type CheckpointSignificance = 'initial' | 'story' | 'command' | 'faction' | 'manual';

export interface TimelineCheckpoint {
  id: string;
  branchId: string;
  name: string;
  description: string;
  realTimestamp: number;
  gameHour: number;
  significance: CheckpointSignificance;
  snapshot: WorldSnapshot;
}

export interface TimelineBranch {
  id: string;
  name: string;
  parentBranchId?: string;
  forkCheckpointId?: string; // checkpoint ID where this branch diverged
  checkpointIds: string[];
  createdAt: number;
  color: string;
}

// ─── Commands ────────────────────────────────────────────────

export interface SpawnEntityCommand {
  type: 'SPAWN_ENTITY';
  entityType: EntityType;
  position: Vec3;
  name: string;
}

export interface DespawnEntityCommand {
  type: 'DESPAWN_ENTITY';
  entityId?: string;
  entityName?: string;
  all?: boolean;
}

export interface BuildStructureCommand {
  type: 'BUILD_STRUCTURE';
  structureType: StructureType;
  position: Vec3;
  name: string;
}

export interface WorldModifyCommand {
  type: 'WORLD_MODIFY';
  property: 'weather' | 'time';
  value: string;
}

export interface SetFactionRelationCommand {
  type: 'SET_FACTION_RELATION';
  factionA: string;
  factionB: string;
  relation: FactionRelation;
}

// M3: Direct interaction command — help, attack, talk, shield, warm, guide, freeze, retreat
export interface InteractEntityCommand {
  type: 'INTERACT_ENTITY';
  action: 'help' | 'attack' | 'retreat' | 'flee' | 'shield' | 'talk' | 'warm' | 'guide' | 'freeze' | 'repair' | 'fix';
  entityName: string;
}

// Player Action Commands
export interface JumpCommand {
  type: 'JUMP';
}

export interface AttackCommand {
  type: 'ATTACK';
  targetName?: string;
}

export interface TalkCommand {
  type: 'TALK';
  entityName?: string;
}

// M4: Timeline and Reality control commands
export interface RewindCommand {
  type: 'REWIND';
  target?: 'last' | 'initial' | string;
}

export interface SwitchBranchCommand {
  type: 'SWITCH_BRANCH';
  branchIdOrName: string;
}

export interface CreateCheckpointCommand {
  type: 'CREATE_CHECKPOINT';
  name?: string;
}

export type GameCommand =
  | SpawnEntityCommand
  | DespawnEntityCommand
  | BuildStructureCommand
  | WorldModifyCommand
  | SetFactionRelationCommand
  | InteractEntityCommand
  | RewindCommand
  | SwitchBranchCommand
  | CreateCheckpointCommand
  | JumpCommand
  | AttackCommand
  | TalkCommand;

// ─── Voice pipeline ──────────────────────────────────────────

export type VoiceStatus = 'idle' | 'listening' | 'processing' | 'success' | 'error';

export interface VoiceState {
  status: VoiceStatus;
  lastTranscript: string;
  lastError: string;
  lastCommand: string;
}

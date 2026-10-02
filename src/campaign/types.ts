// ============================================================
// CAMPAIGN TYPES — Story Acts, Missions, Dialogue & Story Flags
// ============================================================

export type CampaignAct =
  | 'prologue'   // The Voice (Mission 1)
  | 'act1'       // The Gathering Clouds (Mission 2 transition)
  | 'act2'       // The Woman Who Remembers (Mission 2)
  | 'act3'       // The Battle for the Mill (Mission 3)
  | 'act4'       // The Anchor of the Architect (Mission 4)
  | 'act5'       // The Other Worlds (Future)
  | 'act6';      // The Echo (Future)

export type MissionStatus = 'locked' | 'active' | 'completed' | 'failed';

export interface MissionObjective {
  id: string;
  text: string;
  completed: boolean;
  optional?: boolean;
  echoHint?: string; // Voice hint for how the Echo can interfere
}

export interface MissionConsequence {
  id: string;
  description: string;
  echoUsed?: boolean;
  consequenceTag?: string;
  resolutionMethod?: 'shield' | 'rain' | 'bridge' | 'retreat' | 'violence';
}

export interface DialogueChoice {
  id?: string;
  text: string;
  onSelectFlag?: string;
  bondDelta?: { character: string; amount: number };
  bondDelta2?: { character: string; amount: number };
  followUpLines?: DialogueLine[];
}

export type DialogueShotType = 'closeUp' | 'listenerCloseUp' | 'twoShot' | 'overTheShoulder';

export type DialogueEmotion =
  | 'neutral'
  | 'solemn'
  | 'discomfort'
  | 'wincing'
  | 'intense'
  | 'warning'
  | 'mournful';

export interface DialogueLine {
  speaker: string;
  speakerRole?: string;
  speakerColor?: string;
  text: string;
  avatarIcon?: string;
  portraitBg?: string;
  cameraFocusEntity?: string; // e.g. 'Rowan', 'Mira', 'Aldric', 'player'
  shotType?: DialogueShotType; // 'closeUp' | 'listenerCloseUp' | 'twoShot' | 'overTheShoulder'
  emotion?: DialogueEmotion; // for character expressions and distinctive behavioral reactions
  pauseDurationMs?: number; // initial pause before line starts typing
  choices?: DialogueChoice[];
}

export interface DialogueSequence {
  id: string;
  lines: DialogueLine[];
  cameraFocusEntity?: string;
  defaultShotType?: DialogueShotType;
  onCompleteFlag?: string;
  onCompleteCallback?: () => void;
}

export interface Mission {
  id: string;
  act: CampaignAct;
  title: string;
  briefing: string;
  status: MissionStatus;
  objectives: MissionObjective[];
  consequences: MissionConsequence[];
  dialogueOnStart?: DialogueSequence;
  dialogueOnComplete?: DialogueSequence;
}

export interface CampaignStoryFlags {
  // Mission 1: The First Resonance
  rowan_found?: boolean;
  rowan_first_impression?: 'grateful' | 'terrified' | 'curious';
  echo_demonstrated?: boolean;
  m1_completed?: boolean;
  m1_reaction_triggered?: boolean;

  // Mission 2: The Whispering Stones
  discovered_whispering_stones?: boolean;
  mira_found?: boolean;
  mira_revealed_ghost_memories?: boolean;
  mira_lore_learned?: boolean;
  architect_lore_layer1?: boolean;
  questioned_reality_cost?: boolean;
  m2_completed?: boolean;
  m2_start_dialogue_triggered?: boolean;
  m2_complete_dialogue_triggered?: boolean;

  // Mission 3: The Battle for the Mill
  raiders_spawned?: boolean;
  crisis_resolved?: boolean;
  rowan_fate?: 'saved' | 'wounded' | 'dead';
  resolution_method?: 'shield' | 'rain' | 'bridge' | 'retreat' | 'violence';
  m3_completed?: boolean;
  m3_start_dialogue_triggered?: boolean;
  m3_complete_dialogue_triggered?: boolean;

  // Mission 4: The Anchor of the Architect
  discovered_echo_tree?: boolean;
  echo_tree_communed?: boolean;
  architect_truth_revealed?: boolean;
  player_conviction?: 'accept_broken_world' | 'seek_perfection' | 'undecided';
  m4_completed?: boolean;
  vertical_slice_completed?: boolean;
  m4_start_dialogue_triggered?: boolean;
  m4_complete_dialogue_triggered?: boolean;
}

export interface CampaignSnapshot {
  currentAct: CampaignAct;
  activeMissionId: string;
  completedMissionIds: string[];
  storyFlags: Record<string, boolean | string | number>;
  characterBonds: Record<string, number>; // -100 to +100
  missions: Mission[];
}

export interface CampaignState extends CampaignSnapshot {
  activeDialogue: DialogueSequence | null;
  dialogueLineIndex: number;
}

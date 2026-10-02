// ============================================================
// HELP CONTENT — Centralized Manual & Tutorial Knowledge Base
// Single source of truth for all game mechanics, voice commands,
// movement bindings, and lore explanations.
// ============================================================

export interface CommandCategory {
  category: string;
  description: string;
  examples: string[];
}

export interface ControlBinding {
  input: string;
  action: string;
}

export interface HelpSection {
  id: string;
  title: string;
  subtitle: string;
  content: string[];
  bulletPoints?: string[];
  commandCategories?: CommandCategory[];
  controls?: ControlBinding[];
  callout?: {
    headline: string;
    text: string;
  };
}

export const HELP_SECTIONS: HelpSection[] = [
  {
    id: 'how_to_play',
    title: 'HOW TO PLAY',
    subtitle: 'The Essence of ECHO',
    content: [
      'ECHO is a story-driven fantasy game where the player can change the world through voice.',
      'Unlike conventional adventure games with static dialogue trees, the words you speak directly manipulate the world simulation, commanding units, modifying weather, creating fortifications, and authoring new history.',
    ],
    bulletPoints: [
      'Affect the environment and weather',
      'Interact and converse with living characters',
      'Command soldiers, guards, and creatures',
      'Influence faction alliances and war state',
      'Alter campaign missions and objective outcomes',
      'Create enduring consequences in the world ledger',
      'Rewind time and branch into alternate timelines',
    ],
  },
  {
    id: 'voice_commands',
    title: 'VOICE COMMANDS',
    subtitle: 'Speaking into the Simulation',
    content: [
      'Hold SPACE to speak. Release SPACE to send the command.',
      'The game interprets your spoken words in natural language and directly applies them to the game world. You do not need to memorize exact keywords or rigid phrases; the system is designed to understand natural intent.',
    ],
    commandCategories: [
      {
        category: 'WORLD',
        description: 'Shape weather, daylight, and physical architecture',
        examples: [
          '"Make it rain"',
          '"Make it night"',
          '"Build a tower here"',
          '"Destroy the bridge"',
        ],
      },
      {
        category: 'CHARACTERS',
        description: 'Direct, aid, or converse with inhabitants',
        examples: [
          '"Talk to Rowan"',
          '"Protect Rowan"',
          '"Heal Rowan"',
          '"Make the soldiers retreat"',
        ],
      },
      {
        category: 'FACTIONS',
        description: 'Sovereignty, diplomacy, and declarations of war',
        examples: [
          '"Make Suncrest and Shadowfang allies"',
          '"Declare war"',
        ],
      },
      {
        category: 'TIME',
        description: 'Chronal state manipulation and memory rewinds',
        examples: [
          '"Save checkpoint"',
          '"Rewind to before the battle"',
          '"Switch to another timeline"',
        ],
      },
    ],
  },
  {
    id: 'movement',
    title: 'MOVEMENT',
    subtitle: 'Navigating the Realm',
    content: [
      'ECHO supports smooth third-person character locomotion paired with an orbit camera system.',
    ],
    controls: [
      { input: 'W / A / S / D', action: 'Move character in world space' },
      { input: 'Arrow Keys', action: 'Alternative character locomotion' },
      { input: 'Mouse Orbit', action: 'Rotate camera view around the protagonist' },
      { input: 'Scroll Wheel', action: 'Zoom camera distance in / out' },
      { input: 'E Key', action: 'Interact or speak with nearby characters' },
      { input: 'Spacebar (Hold)', action: 'Push-to-Talk: speak Echo voice command' },
      { input: 'R Key', action: 'Quick rewind to previous chronal checkpoint' },
      { input: 'Escape', action: 'Pause simulation and open system menu' },
    ],
  },
  {
    id: 'the_echo',
    title: 'THE ECHO',
    subtitle: 'The Central Gameplay Mechanic',
    content: [
      'The Echo is an ancient resonance that bridges human voice with the physical fabric of reality.',
      'Voice commands are not cosmetic gimmicks or scripted triggers; they are the central mechanic of ECHO. When you speak, the words resonate through the simulation engine.',
      'Minor commands alter local conditions, while major reality-altering commands produce visible resonance waves, alter political power balances, and leave permanent marks across the landscape.',
    ],
  },
  {
    id: 'story_missions',
    title: 'STORY & MISSIONS',
    subtitle: 'An Unfolding Spoken Campaign',
    content: [
      'You are following a core narrative campaign beginning with the Awakening of the Echo in the Meadowlands, exploring the mystery of the Whispering Stones, and resolving the clash between Suncrest and Shadowfang.',
      'Missions in ECHO are dynamic: objectives adapt to how you solve problems. You can resolve hostilities through diplomacy, rally defenders with combat commands, or bypass conflict entirely using environmental displacement.',
    ],
  },
  {
    id: 'relationships',
    title: 'RELATIONSHIPS',
    subtitle: 'Memory, Trust, and Allegiances',
    content: [
      'Important characters—such as Rowan the Miller, Mira the Seer, King Aldric, and Warlord Vorn—as well as the sovereign factions, observe your behavior and remember what you do.',
      'Characters will not reset their opinions merely because a conversation ends. If you aid a village, defend a fortress, or betray a truce, their trust ratings and future dialogues will reflect your history.',
    ],
  },
  {
    id: 'timelines',
    title: 'TIMELINES',
    subtitle: 'Branching Realities and Chronal Recall',
    content: [
      'Every major decision, dialogue conclusion, and battle creates an anchor in time.',
      'If an outcome results in disaster or you wish to explore what might have happened, you can rewind time to a previous anchor.',
      'Changing a critical decision in the past creates a new branch in reality without erasing your historical discovery, letting you traverse parallel timelines.',
    ],
  },
  {
    id: 'world_memory',
    title: 'WORLD MEMORY',
    subtitle: 'The Living Historical Ledger',
    content: [
      'Every significant action, spoken command, casualty, and diplomatic decree is committed to the World Memory ledger.',
      'The simulation evaluates past events to generate character barks, reactive NPC decisions, and evolving mission requirements.',
      'Nothing that happens in ECHO is discarded: the past remains authoritative.',
    ],
  },
  {
    id: 'important',
    title: 'IMPORTANT',
    subtitle: 'The World Remembers',
    content: [
      'Actions and commands in ECHO are not merely dialogue responses or cosmetic text.',
      'They change actual game state, physics objects, character health, faction diplomacy, and story consequences.',
      'Speak with purpose. Every word changes the world.',
    ],
    callout: {
      headline: 'THE WORLD REMEMBERS',
      text: 'Every spoken command directly mutates the authoritative simulation state. What you build stands; what you destroy remains ruined; whom you betray will not forget.',
    },
  },
];

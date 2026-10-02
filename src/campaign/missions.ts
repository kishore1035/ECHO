// ============================================================
// CAMPAIGN MISSIONS CATALOG — Story Campaign for ECHO
// 4-Mission Focused Vertical Slice:
//
// "How much of the world are you willing to destroy to create the world you want?"
//
// PROLOGUE — THE VOICE
//   Mission 1: The First Resonance
// ACT I / ACT II — THE WOMAN WHO REMEMBERS
//   Mission 2: The Whispering Stones
// ACT III — THE WAR
//   Mission 3: The Battle for the Mill
// ACT IV — THE ANCHOR
//   Mission 4: The Anchor of the Architect
// ============================================================

import type { Mission } from './types';

export const CAMPAIGN_MISSIONS: Mission[] = [
  // ── PROLOGUE: THE VOICE ─────────────────────────────────────
  {
    id: 'm1_first_resonance',
    act: 'prologue',
    title: 'The First Resonance',
    briefing:
      'You awaken on the river grass with no memory of who you are — only an ethereal hum vibrating in your throat. Rowan the Miller approaches from the Old Mill, sensing something miraculous and terrifying in the air.',
    status: 'active',
    objectives: [
      {
        id: 'obj_approach_rowan',
        text: 'Approach Rowan the Miller near the Old Mill (Center Valley)',
        completed: false,
      },
      {
        id: 'obj_demonstrate_echo',
        text: 'Speak a command to demonstrate the Echo to Rowan',
        completed: false,
        echoHint: 'Say "Clear skies", "Aid Rowan", "Rain", or "Morning"',
      },
      {
        id: 'obj_listen_rowan',
        text: "Listen to Rowan's realization of your power",
        completed: false,
      },
    ],
    consequences: [],
    dialogueOnStart: {
      id: 'diag_m1_start',
      lines: [
        {
          speaker: 'The Voice within',
          speakerRole: 'Subconscious',
          speakerColor: '#38bdf8',
          text: 'Where are you...? The air feels malleable. If you speak, the world will listen.',
          avatarIcon: '✨',
        },
      ],
    },
    dialogueOnComplete: {
      id: 'diag_m1_complete',
      lines: [
        {
          speaker: 'Rowan the Miller',
          speakerRole: 'Meadowlands Miller',
          speakerColor: '#4ade80',
          text: 'Gods above... you spoke, and the very air bent to your command! Who... WHAT are you?',
          avatarIcon: '🌾',
        },
        {
          speaker: 'Rowan the Miller',
          speakerRole: 'Meadowlands Miller',
          speakerColor: '#4ade80',
          text: 'You must speak with Mira the Seer by the river stones. She has spent her life studying legends of the Echo.',
          avatarIcon: '🌾',
        },
      ],
    },
  },

  // ── ACT I / ACT II: THE WOMAN WHO REMEMBERS ─────────────────
  {
    id: 'm2_whispering_stones',
    act: 'prologue',
    title: 'The Whispering Stones',
    briefing:
      'Rowan directed you toward Mira the Seer, an enigmatic wanderer dwelling by the ancient river crossing. Unlike the others, Mira does not look at the Echo with wonder—she shivers, perceiving phantom memories of timelines that were erased.',
    status: 'locked',
    objectives: [
      {
        id: 'obj_find_mira',
        text: 'Locate Mira the Seer near the stone crossing (x=-4, z=9)',
        completed: false,
      },
      {
        id: 'obj_hear_mira_warning',
        text: 'Learn why Mira shivers at your voice and can remember erased timelines',
        completed: false,
      },
      {
        id: 'obj_witness_chronal_scar',
        text: 'Inquire about the Architect’s ancient fractures and accept her warning',
        completed: false,
        echoHint: 'Ask Mira about the voices she hears, or speak "Save checkpoint"',
      },
    ],
    consequences: [],
    dialogueOnStart: {
      id: 'diag_m2_start',
      lines: [
        {
          speaker: 'Mira the Seer',
          speakerRole: 'Chronal Scholar',
          speakerColor: '#a855f7',
          shotType: 'closeUp',
          emotion: 'solemn',
          text: 'I heard you crossing the shallows. The river currents went dead quiet the moment your boots touched the water.',
          avatarIcon: '🔮',
        },
      ],
    },
    dialogueOnComplete: {
      id: 'diag_m2_complete',
      lines: [
        {
          speaker: 'Mira the Seer',
          speakerRole: 'Chronal Scholar',
          speakerColor: '#a855f7',
          shotType: 'closeUp',
          emotion: 'solemn',
          text: 'The basalt monoliths hummed. You felt that tension in your chest, didn’t you? A chronal anchor has set into the earth.',
          avatarIcon: '🔮',
        },
        {
          speaker: 'Mira the Seer',
          speakerRole: 'Chronal Scholar',
          speakerColor: '#a855f7',
          shotType: 'closeUp',
          emotion: 'warning',
          text: 'Listen. Warhorns on the western ridge. Whatever words you choose to speak at the mill... remember: you cannot outrun what you change.',
          avatarIcon: '🔮',
        },
      ],
    },
  },

  // ── ACT III: THE BATTLE FOR THE MILL ────────────────────────
  {
    id: 'm3_shadows_meadowlands',
    act: 'act1',
    title: 'The Battle for the Mill',
    briefing:
      'Warlord Vorn’s Shadowfang vanguard has crossed the river ridge to seize Rowan’s mill and plunder winter supplies. Rowan is defenseless at the mill wheel. Use the Echo to intervene and determine the fate of the valley.',
    status: 'locked',
    objectives: [
      {
        id: 'obj_protect_rowan',
        text: 'Confront the Shadowfang raid (Rowan can be saved, wounded, or lost)',
        completed: false,
        optional: true,
        echoHint: 'Say "Protect Rowan" or "Shield Rowan" to grant him protection',
      },
      {
        id: 'obj_stop_raid',
        text: 'Repel the vanguard raid using the Echo',
        completed: false,
        echoHint: 'Say "Call the rain", "Destroy the bridge", or "Make the soldiers retreat"',
      },
      {
        id: 'obj_assess_aftermath',
        text: 'Assess the aftermath of the battle and discover Rowan’s fate',
        completed: false,
        optional: true,
      },
    ],
    consequences: [],
    dialogueOnStart: {
      id: 'diag_m3_start',
      lines: [
        {
          speaker: 'Rowan the Miller',
          speakerRole: 'Terrified Villager',
          speakerColor: '#4ade80',
          text: 'They are descending the ridge! Vorn’s vanguard will burn my mill to ash! Please, Voice... do something!',
          avatarIcon: '🌾',
        },
      ],
    },
    dialogueOnComplete: {
      id: 'diag_m3_complete',
      lines: [
        {
          speaker: 'Mira the Seer',
          speakerRole: 'Chronal Scholar',
          speakerColor: '#a855f7',
          text: 'The raid has broken... but feel the air. The consequences of your words have hardened into living history.',
          avatarIcon: '🔮',
        },
        {
          speaker: 'Rowan the Miller',
          speakerRole: 'Meadowlands Miller',
          speakerColor: '#4ade80',
          text: 'You saved me... or you broke them. I do not know which frightens me more. But I owe you my life, Voice.',
          avatarIcon: '🌾',
        },
      ],
    },
  },

  // ── ACT IV: THE ANCHOR OF THE ARCHITECT ─────────────────────
  {
    id: 'm4_anchor_architect',
    act: 'act4',
    title: 'The Anchor of the Architect',
    briefing:
      'In the quiet aftermath of the raid, Mira guides you across the Silverflow to a secluded glade west of the woods. There stands the ancient Echo Tree—the sole physical anchor holding fractured realities together. Here, the deeper tragedy of the Architect is laid bare.',
    status: 'locked',
    objectives: [
      {
        id: 'obj_follow_mira_glade',
        text: 'Cross the river bridge toward the secluded glade (x=-13.0, z=-1.5)',
        completed: false,
      },
      {
        id: 'obj_discover_echo_tree',
        text: 'Discover the ancient Echo Tree towering within the clearing',
        completed: false,
      },
      {
        id: 'obj_commune_with_anchor',
        text: 'Press [E] to touch the Echo Tree and initiate timeline communion',
        completed: false,
        echoHint: 'Approach the ancient roots and press [E] to commune with the timeline anchor',
      },
      {
        id: 'obj_confront_the_mirror',
        text: 'Confront the tragic truth of the Architect and choose your conviction',
        completed: false,
      },
    ],
    consequences: [],
    dialogueOnStart: {
      id: 'diag_m4_start',
      lines: [
        {
          speaker: 'Mira the Seer',
          speakerRole: 'Chronal Scholar',
          speakerColor: '#a855f7',
          text: 'Cross the river bridge, Voice. There is a place where reality does not heal—it only gathers. The Architect left his anchor there.',
          avatarIcon: '🔮',
        },
      ],
    },
    dialogueOnComplete: {
      id: 'diag_m4_complete',
      lines: [
        {
          speaker: 'Mira the Seer',
          speakerRole: 'Chronal Scholar',
          speakerColor: '#a855f7',
          text: 'Now you see it. The branches above are not just wood—they are the bleeding scars of every reality the Architect abandoned trying to save one life.',
          avatarIcon: '🔮',
        },
        {
          speaker: 'Mira the Seer',
          speakerRole: 'Chronal Scholar',
          speakerColor: '#a855f7',
          text: 'How much of this world are you willing to destroy to create the world you want, traveler? The choice will always be yours.',
          avatarIcon: '🔮',
        },
      ],
    },
  },
];

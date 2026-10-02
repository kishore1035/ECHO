// ============================================================
// CAMPAIGN DIALOGUES — Structured, State-Aware Narrative Scenes
// Generates character-driven dialogue sequences conditioned on
// real simulation state (health, VIP status, memories, timeline)
// ============================================================

import { useWorldStore } from '../core/WorldState';
import { useCampaignStore } from './CampaignSystem';
import { useTimelineStore } from '../systems/TimelineSystem';
import type { DialogueSequence, DialogueLine } from './types';

/**
 * Builds the state-aware Prologue / Mission 1 encounter with Rowan and Mira.
 * Reacts to:
 * - Rowan's alive / dead / injured status
 * - Whether player attacked Rowan or saved/aided Rowan in this timeline
 * - Whether player has discovered the Whispering Stones
 * - Whether player rewound into this timeline from an alternate branch
 */
export function buildRowanAndMiraDialogue(): DialogueSequence {
  const world = useWorldStore.getState();
  const campaign = useCampaignStore.getState();
  const timeline = useTimelineStore.getState();

  const rowan = Object.values(world.entities).find((e) => e.name.includes('Rowan'));
  const mira = Object.values(world.entities).find((e) => e.name.includes('Mira'));

  const isRowanDead = !rowan || rowan.health <= 0;
  const rowanEvents = rowan ? world.events.filter((e) => e.targetId === rowan.id) : [];
  const wasRowanAttacked = rowanEvents.some((ev) => ev.type === 'player_attacked') || (rowan && rowan.health < 80);
  const wasRowanSaved = Boolean(campaign.storyFlags['rowan_saved']) || rowanEvents.some((ev) => ev.type === 'player_helped');
  const hasVisitedStones = Boolean(campaign.storyFlags['discovered_whispering_stones']);
  const isRewoundTimeline = world.timelineRestoreVersion > 0 || timeline.activeBranchId !== 'branch_prime';

  const lines: DialogueLine[] = [];

  // ── Scenario A: Rowan is Dead in this Timeline ────────────────
  if (isRowanDead) {
    lines.push({
      speaker: 'Mira the Seer',
      speakerRole: 'Chronal Scholar',
      speakerColor: '#a855f7',
      avatarIcon: '🔮',
      text: 'Rowan lies lifeless by the river grass... The Echo brought ruin before wisdom could take root.',
    });
    lines.push({
      speaker: 'Mira the Seer',
      speakerRole: 'Chronal Scholar',
      speakerColor: '#a855f7',
      avatarIcon: '🔮',
      text: 'Do not despair yet, Voice. The Architect fractured this realm into braided timelines. You can rewind reality (Press R or speak "Rewind").',
      choices: [
        {
          text: '"Can time really be rewound?"',
          onSelectFlag: 'learned_rewind_lore',
          bondDelta: { character: 'mira', amount: 5 },
          followUpLines: [
            {
              speaker: 'Mira the Seer',
              speakerRole: 'Chronal Scholar',
              speakerColor: '#a855f7',
              avatarIcon: '🔮',
              text: 'Time is malleable to the Echo. Press R or command the timeline to restore Rowan before death took him.',
            },
          ],
        },
        {
          text: '"His death was necessary."',
          onSelectFlag: 'ruthless_voice',
          bondDelta: { character: 'mira', amount: -10 },
          followUpLines: [
            {
              speaker: 'Mira the Seer',
              speakerRole: 'Chronal Scholar',
              speakerColor: '#a855f7',
              avatarIcon: '🔮',
              text: 'A dangerous path. Every timeline that bleeds draws the Architect\'s shadow closer.',
            },
          ],
        },
      ],
    });

    return {
      id: 'diag_rowan_dead',
      lines,
      cameraFocusEntity: mira?.id,
    };
  }

  // ── Scenario B: Rowan was Attacked by the Player ───────────────
  if (wasRowanAttacked) {
    lines.push({
      speaker: 'Rowan the Miller',
      speakerRole: 'Meadowlands Miller',
      speakerColor: '#4ade80',
      avatarIcon: '🌾',
      text: 'Stay back! I saw the lightning crackle when you spoke earlier... you struck me without remorse!',
    });
    lines.push({
      speaker: 'Mira the Seer',
      speakerRole: 'Chronal Scholar',
      speakerColor: '#a855f7',
      avatarIcon: '🔮',
      text: 'Lower your pitch, Rowan. The Voice carries power beyond our reckoning, though they wield it recklessly.',
    });
    lines.push({
      speaker: 'Mira the Seer',
      speakerRole: 'Chronal Scholar',
      speakerColor: '#a855f7',
      avatarIcon: '🔮',
      text: 'Traveler, if you truly possess the Echo, mend what you broke. Speak words of healing or peace.',
      choices: [
        {
          text: '"I am sorry, Rowan. I did not understand my own power."',
          onSelectFlag: 'apologized_to_rowan',
          bondDelta: { character: 'rowan', amount: 10 },
          followUpLines: [
            {
              speaker: 'Rowan the Miller',
              speakerRole: 'Meadowlands Miller',
              speakerColor: '#4ade80',
              avatarIcon: '🌾',
              text: '...Then speak words that mend, not words that harm. Prove it to me.',
            },
          ],
        },
        {
          text: '"I command this valley. Do not stand in my way."',
          onSelectFlag: 'intimidated_rowan',
          bondDelta: { character: 'rowan', amount: -15 },
          bondDelta2: { character: 'mira', amount: -5 },
          followUpLines: [
            {
              speaker: 'Mira the Seer',
              speakerRole: 'Chronal Scholar',
              speakerColor: '#a855f7',
              avatarIcon: '🔮',
              text: 'Pride brought down the first Shaper. Mind that history does not repeat itself.',
            },
          ],
        },
      ],
    });

    return {
      id: 'diag_rowan_attacked',
      lines,
      cameraFocusEntity: rowan.id,
    };
  }

  // ── Scenario C: Rowan was Aided / Saved ───────────────────────
  if (wasRowanSaved) {
    lines.push({
      speaker: 'Rowan the Miller',
      speakerRole: 'Meadowlands Miller',
      speakerColor: '#4ade80',
      avatarIcon: '🌾',
      text: 'Traveler! You returned! When you spoke earlier, a soothing warmth chased the aches from my bones.',
    });
    lines.push({
      speaker: 'Mira the Seer',
      speakerRole: 'Chronal Scholar',
      speakerColor: '#a855f7',
      avatarIcon: '🔮',
      text: 'A benevolent resonance. The river currents slowed as if acknowledging their master.',
    });
  } else {
    // ── Scenario D: Standard First Meeting (Rowan alone at the Old Mill) ──
    const pPos = world.player.position;
    const isMiraNear = mira && Math.hypot(pPos.x - mira.position.x, pPos.z - mira.position.z) <= 7.0;

    lines.push({
      speaker: 'Rowan the Miller',
      speakerRole: 'Meadowlands Miller',
      speakerColor: '#4ade80',
      avatarIcon: '🌾',
      shotType: 'closeUp',
      text: 'Hold there, friend... easy now. You climbed out of the river like a ghost in the morning mist. Are you hurt?',
    });

    lines.push({
      speaker: 'Rowan the Miller',
      speakerRole: 'Meadowlands Miller',
      speakerColor: '#4ade80',
      avatarIcon: '🌾',
      shotType: 'closeUp',
      text: 'Your hands are empty, but the air around you... it hums. Like before a summer thunderstorm. Can you speak, traveler? Do you remember your name?',
      choices: [
        {
          text: '"I don\'t remember my name. But when I breathe, the air feels... malleable."',
          onSelectFlag: 'realized_voice_weight',
          bondDelta: { character: 'rowan', amount: 10 },
          followUpLines: [
            {
              speaker: 'Rowan the Miller',
              speakerRole: 'Meadowlands Miller',
              speakerColor: '#4ade80',
              avatarIcon: '🌾',
              shotType: 'closeUp',
              text: 'Malleable? A strange word for cold river water. Here, lean on the mill step. Rest your legs.',
            },
          ],
        },
        {
          text: '"I am the Echo. Watch what happens when I speak."',
          onSelectFlag: 'player_confident',
          bondDelta: { character: 'rowan', amount: 5 },
          followUpLines: [
            {
              speaker: 'Rowan the Miller',
              speakerRole: 'Meadowlands Miller',
              speakerColor: '#4ade80',
              avatarIcon: '🌾',
              shotType: 'closeUp',
              text: 'A bold tone for someone soaking wet. If you have words that carry weight, speak them softly. The valley is tense enough.',
            },
          ],
        },
        {
          text: '"Where am I? Who are the banners stationed across the ridges?"',
          onSelectFlag: 'learned_valley_tensions',
          bondDelta: { character: 'rowan', amount: 5 },
          followUpLines: [
            {
              speaker: 'Rowan the Miller',
              speakerRole: 'Meadowlands Miller',
              speakerColor: '#4ade80',
              avatarIcon: '🌾',
              shotType: 'closeUp',
              text: 'You stand in the Meadowlands. Suncrest holds the castle to the east; Shadowfang prowls the western ridges. We just grind flour and pray they leave us in peace.',
            },
          ],
        },
      ],
    });

    if (isMiraNear) {
      lines.push({
        speaker: 'Mira the Seer',
        speakerRole: 'Chronal Scholar',
        speakerColor: '#a855f7',
        avatarIcon: '🔮',
        shotType: 'closeUp',
        text: 'Listen to him, Rowan. The resonance around his throat is not a fever. Reality itself is waiting for his voice.',
      });
    }
  }

  // ── State-Aware Addition: Discovered Whispering Stones ────────
  if (hasVisitedStones) {
    lines.push({
      speaker: 'Rowan the Miller',
      speakerRole: 'Meadowlands Miller',
      speakerColor: '#4ade80',
      avatarIcon: '🌾',
      shotType: 'closeUp',
      text: 'You have basalt dust on your boots... you went near the Whispering Stones? People say those who linger there hear voices of things that haven\'t happened yet.',
    });
  }

  // ── State-Aware Addition: Rewound Reality / Alternate Branch ──
  if (isRewoundTimeline) {
    lines.push({
      speaker: 'Rowan the Miller',
      speakerRole: 'Meadowlands Miller',
      speakerColor: '#4ade80',
      avatarIcon: '🌾',
      shotType: 'closeUp',
      text: 'Have we... stood here before? For a moment, looking at you, I felt a strange shiver in my chest. Like remembering a dream I never had.',
    });
  }

  // Final line guiding to Echo demonstration
  lines.push({
    speaker: 'Rowan the Miller',
    speakerRole: 'Meadowlands Miller',
    speakerColor: '#4ade80',
    avatarIcon: '🌾',
    shotType: 'closeUp',
    text: 'If there is truth to what you claim, demonstrate it. Speak a word to the sky, the river, or this old miller. Let\'s see what happens.',
  });

  return {
    id: 'diag_m1_encounter',
    lines,
    cameraFocusEntity: rowan.id,
    onCompleteFlag: 'rowan_conversed',
  };
}

/**
 * Builds the Mission 1 Completion Dialogue once the Echo has been demonstrated.
 */
export function buildMission1CompleteDialogue(): DialogueSequence {
  const world = useWorldStore.getState();
  const rowan = Object.values(world.entities).find((e) => e.name.includes('Rowan'));

  return {
    id: 'diag_m1_complete',
    cameraFocusEntity: rowan?.id,
    lines: [
      {
        speaker: 'Rowan the Miller',
        speakerRole: 'Meadowlands Miller',
        speakerColor: '#4ade80',
        avatarIcon: '🌾',
        shotType: 'closeUp',
        text: 'Gods above... you spoke, and the very air bent around your words.',
      },
      {
        speaker: 'Rowan the Miller',
        speakerRole: 'Meadowlands Miller',
        speakerColor: '#4ade80',
        avatarIcon: '🌾',
        shotType: 'closeUp',
        text: 'The sky shifted. You didn\'t chant an incantation or draw a circle. You just... spoke. And the world obeyed.',
        choices: [
          {
            text: '"I didn\'t mean to frighten you, Rowan."',
            onSelectFlag: 'reassured_rowan',
            bondDelta: { character: 'rowan', amount: 15 },
            followUpLines: [
              {
                speaker: 'Rowan the Miller',
                speakerRole: 'Meadowlands Miller',
                speakerColor: '#4ade80',
                avatarIcon: '🌾',
                shotType: 'closeUp',
                text: 'Frightened? Aye, a little. But grateful, too. My grandfather told stories of the ancient Shapers... I thought they were tavern tales.',
              },
            ],
          },
          {
            text: '"It felt natural. Like remembering a song I had forgotten."',
            onSelectFlag: 'embraced_echo_nature',
            bondDelta: { character: 'rowan', amount: 10 },
            followUpLines: [
              {
                speaker: 'Rowan the Miller',
                speakerRole: 'Meadowlands Miller',
                speakerColor: '#4ade80',
                avatarIcon: '🌾',
                shotType: 'closeUp',
                text: 'Then tread with care, friend. A word that can alter the weather can just as easily break it.',
              },
            ],
          },
          {
            text: '"This is only the beginning of what I can do."',
            onSelectFlag: 'boasted_power',
            bondDelta: { character: 'rowan', amount: -5 },
            followUpLines: [
              {
                speaker: 'Rowan the Miller',
                speakerRole: 'Meadowlands Miller',
                speakerColor: '#4ade80',
                avatarIcon: '🌾',
                shotType: 'closeUp',
                text: 'Careful with that pride. Power without restraint draws cold steel in this valley.',
              },
            ],
          },
        ],
      },
      {
        speaker: 'Rowan the Miller',
        speakerRole: 'Meadowlands Miller',
        speakerColor: '#4ade80',
        avatarIcon: '🌾',
        shotType: 'closeUp',
        text: 'Listen to me: across the river shallows, near the ancient basalt monoliths, dwells a woman named Mira.',
      },
      {
        speaker: 'Rowan the Miller',
        speakerRole: 'Meadowlands Miller',
        speakerColor: '#4ade80',
        avatarIcon: '🌾',
        shotType: 'closeUp',
        text: 'She has spent her life studying legends of the Echo. If anyone in this valley can help you understand what you are... it is her.',
      },
      {
        speaker: 'Rowan the Miller',
        speakerRole: 'Meadowlands Miller',
        speakerColor: '#4ade80',
        avatarIcon: '🌾',
        shotType: 'closeUp',
        text: 'Find Mira at the Whispering Stones before the shadows stretch across the grass. And traveler... thank you.',
      },
    ],
  };
}

/**
 * Builds Mission 2 Start Dialogue at the Whispering Stones.
 * Reveals Layer 1 of the Architect mystery and establishes that Mira
 * remembers fragments of erased timelines.
 */
export function buildMission2StartDialogue(): DialogueSequence {
  const world = useWorldStore.getState();
  const campaign = useCampaignStore.getState();
  const timeline = useTimelineStore.getState();

  const mira = Object.values(world.entities).find((e) => e.name.includes('Mira'));
  const rowan = Object.values(world.entities).find((e) => e.name.includes('Rowan'));

  const hasRewound = world.timelineRestoreVersion > 0 || timeline.activeBranchId !== 'branch_prime';
  const isRowanDead = !rowan || rowan.health <= 0 || Boolean(campaign.storyFlags['rowan_dead']);
  const isRowanWounded = rowan && rowan.health > 0 && (rowan.health < 60 || Boolean(campaign.storyFlags['rowan_wounded']));
  const rowanBond = campaign.characterBonds.rowan || 0;
  const isRowanFriendly = rowanBond >= 15;
  const wasRowanAttacked = Boolean(campaign.storyFlags['rowan_attacked']) || rowanBond < 0;
  const hasVisitedStonesBefore = Boolean(campaign.storyFlags['discovered_whispering_stones']);
  const isAlternateBranch = timeline.activeBranchId !== 'branch_prime';

  const lines: DialogueLine[] = [];

  // ── Beat 1: Initial Encounter & Physical Temporal Reaction ──
  if (hasRewound) {
    lines.push({
      speaker: 'Mira the Seer',
      speakerRole: 'Chronal Scholar',
      speakerColor: '#a855f7',
      avatarIcon: '🔮',
      shotType: 'closeUp',
      emotion: 'discomfort',
      pauseDurationMs: 160,
      text: 'Stop. Please... just stand still for a moment. (Her breath catches, hand trembling against her brow.)',
    });
    lines.push({
      speaker: 'Mira the Seer',
      speakerRole: 'Chronal Scholar',
      speakerColor: '#a855f7',
      avatarIcon: '🔮',
      shotType: 'closeUp',
      emotion: 'discomfort',
      pauseDurationMs: 120,
      text: 'When you rewound... something sheared through my mind like broken glass. I can taste cold copper. I hear bells from an hour that never arrived.',
    });
    lines.push({
      speaker: 'Mira the Seer',
      speakerRole: 'Chronal Scholar',
      speakerColor: '#a855f7',
      avatarIcon: '🔮',
      shotType: 'closeUp',
      emotion: 'warning',
      text: 'You pulled the thread backward. And I am the one who felt it tear.',
    });
  } else {
    lines.push({
      speaker: 'Mira the Seer',
      speakerRole: 'Chronal Scholar',
      speakerColor: '#a855f7',
      avatarIcon: '🔮',
      shotType: 'closeUp',
      emotion: 'solemn',
      pauseDurationMs: 140,
      text: 'I heard you crossing the shallows. The river currents went dead quiet the moment your boots touched the water.',
    });
    lines.push({
      speaker: 'Mira the Seer',
      speakerRole: 'Chronal Scholar',
      speakerColor: '#a855f7',
      avatarIcon: '🔮',
      shotType: 'closeUp',
      emotion: 'solemn',
      text: 'Step into the circle, stranger. Keep your hands off the basalt pillars. The stone is already under too much strain.',
    });
  }

  // ── Beat 2: State-Aware Valley & Rowan Observations ──
  if (isRowanDead) {
    lines.push({
      speaker: 'Mira the Seer',
      speakerRole: 'Chronal Scholar',
      speakerColor: '#a855f7',
      avatarIcon: '🔮',
      shotType: 'closeUp',
      emotion: 'mournful',
      pauseDurationMs: 180,
      text: 'Rowan is gone. I can feel the silence spreading from the mill like frost. Cold ash on the hearth. ... Did his thread snap by your hand, or your silence?',
    });
  } else if (wasRowanAttacked) {
    lines.push({
      speaker: 'Mira the Seer',
      speakerRole: 'Chronal Scholar',
      speakerColor: '#a855f7',
      avatarIcon: '🔮',
      shotType: 'closeUp',
      emotion: 'warning',
      text: 'Rowan trembles when the wind shifts. He felt violence in your voice. Power wielded like a weapon leaves scarred earth.',
    });
  } else if (isRowanWounded) {
    lines.push({
      speaker: 'Mira the Seer',
      speakerRole: 'Chronal Scholar',
      speakerColor: '#a855f7',
      avatarIcon: '🔮',
      shotType: 'closeUp',
      emotion: 'solemn',
      text: 'I smelled blood on the river breeze. Rowan is injured. Pain was carved into his life today.',
    });
  } else if (isRowanFriendly) {
    lines.push({
      speaker: 'Mira the Seer',
      speakerRole: 'Chronal Scholar',
      speakerColor: '#a855f7',
      avatarIcon: '🔮',
      shotType: 'closeUp',
      emotion: 'solemn',
      text: 'Rowan speaks of you with awe. He thinks your voice is a blessing from the heavens. But Rowan only understands grain and summer rain.',
    });
  }

  if (hasVisitedStonesBefore) {
    lines.push({
      speaker: 'Mira the Seer',
      speakerRole: 'Chronal Scholar',
      speakerColor: '#a855f7',
      avatarIcon: '🔮',
      shotType: 'closeUp',
      emotion: 'solemn',
      text: 'You were here earlier, wandering between the basalt pillars. Did you feel the rock groaning? It was waiting for your return.',
    });
  }

  if (isAlternateBranch) {
    lines.push({
      speaker: 'Mira the Seer',
      speakerRole: 'Chronal Scholar',
      speakerColor: '#a855f7',
      avatarIcon: '🔮',
      shotType: 'closeUp',
      emotion: 'discomfort',
      text: 'We are standing in an offshoot. A severed branch. The light here is too thin... the shadows do not fall where they should.',
    });
  }

  // ── Beat 3: The Player's Echo ──
  lines.push({
    speaker: 'Mira the Seer',
    speakerRole: 'Chronal Scholar',
    speakerColor: '#a855f7',
    avatarIcon: '🔮',
    shotType: 'closeUp',
    emotion: 'intense',
    text: 'There is an unbearable pressure around your throat. It is not magic. It is not a prayer or incantation.',
  });

  lines.push({
    speaker: 'Mira the Seer',
    speakerRole: 'Chronal Scholar',
    speakerColor: '#a855f7',
    avatarIcon: '🔮',
    shotType: 'closeUp',
    emotion: 'intense',
    pauseDurationMs: 120,
    text: 'When you inhale... the world hesitates. As if reality itself is bracing for an order.',
  });

  // ── Beat 4: The Core Revelation — Remembering Unmade Realities ──
  lines.push({
    speaker: 'Mira the Seer',
    speakerRole: 'Chronal Scholar',
    speakerColor: '#a855f7',
    avatarIcon: '🔮',
    shotType: 'closeUp',
    emotion: 'solemn',
    text: 'The villagers call me a "seer." They think I peer through tomorrow\'s veil. They think I predict what is to come.',
  });

  lines.push({
    speaker: 'Mira the Seer',
    speakerRole: 'Chronal Scholar',
    speakerColor: '#a855f7',
    avatarIcon: '🔮',
    shotType: 'closeUp',
    emotion: 'discomfort',
    pauseDurationMs: 200,
    text: 'They are wrong. (She lowers her gaze, a sharp tremor running through her shoulders.) I do not see the future, Voice. I remember what was unmade.',
  });

  lines.push({
    speaker: 'Mira the Seer',
    speakerRole: 'Chronal Scholar',
    speakerColor: '#a855f7',
    avatarIcon: '🔮',
    shotType: 'closeUp',
    emotion: 'solemn',
    text: 'Two autumns ago, the southern fields burned to the roots. I choked on the smoke. I held a child\'s hand while she starved in the dust. I smelled the rotting cattle.',
  });

  lines.push({
    speaker: 'Mira the Seer',
    speakerRole: 'Chronal Scholar',
    speakerColor: '#a855f7',
    avatarIcon: '🔮',
    shotType: 'closeUp',
    emotion: 'discomfort',
    pauseDurationMs: 180,
    text: 'And then... a shudder in the sky. A hollow ringing. Suddenly the river was full, the crops tall and golden, and the mother was laughing by the water. She had no memory of her daughter\'s death. None of them did.',
  });

  lines.push({
    speaker: 'Mira the Seer',
    speakerRole: 'Chronal Scholar',
    speakerColor: '#a855f7',
    avatarIcon: '🔮',
    shotType: 'closeUp',
    emotion: 'intense',
    text: 'The tragedy was erased from the world. But the ash never left my mouth. The memory remains lodged in my skull like an iron nail.',
    choices: [
      {
        text: '"Are you saying... whenever reality changes, you\'re forced to remember the erased worlds?"',
        onSelectFlag: 'mira_revealed_ghost_memories',
        bondDelta: { character: 'mira', amount: 10 },
        followUpLines: [
          {
            speaker: 'Mira the Seer',
            speakerRole: 'Chronal Scholar',
            speakerColor: '#a855f7',
            avatarIcon: '🔮',
            shotType: 'closeUp',
            emotion: 'solemn',
            text: 'Yes. Every edit leaves a corpse of a world that should have been. The universe forgets. My head bears the cemetery.',
          },
        ],
      },
      {
        text: '"Someone rewrote the fire? Who had that kind of power?"',
        onSelectFlag: 'architect_lore_layer1',
        bondDelta: { character: 'mira', amount: 10 },
        followUpLines: [
          {
            speaker: 'Mira the Seer',
            speakerRole: 'Chronal Scholar',
            speakerColor: '#a855f7',
            avatarIcon: '🔮',
            shotType: 'closeUp',
            emotion: 'solemn',
            text: 'An ancient Voice. The records call him "The Architect." Long before our kings carved borders, he believed the world was flawed... and that his Echo could force it into perfection.',
          },
        ],
      },
      {
        text: '"If erasing the fire saved lives, it was a mercy. Why condemn it?"',
        onSelectFlag: 'questioned_reality_cost',
        bondDelta: { character: 'mira', amount: -5 },
        followUpLines: [
          {
            speaker: 'Mira the Seer',
            speakerRole: 'Chronal Scholar',
            speakerColor: '#a855f7',
            avatarIcon: '🔮',
            shotType: 'closeUp',
            emotion: 'warning',
            text: 'Mercy? You cannot cut a thread without fraying the weave. When you rewrite what is broken, you don\'t destroy the pain. You merely displace it.',
          },
        ],
      },
    ],
  });

  // ── Beat 5: Layer 1 Warning — The Cost of Reality Manipulation ──
  lines.push({
    speaker: 'Mira the Seer',
    speakerRole: 'Chronal Scholar',
    speakerColor: '#a855f7',
    avatarIcon: '🔮',
    shotType: 'closeUp',
    emotion: 'warning',
    text: 'The Architect rewrote reality over and over. He tried to craft a world without sorrow. And in doing so, he cracked the foundations of time into bleeding branches.',
  });

  lines.push({
    speaker: 'Mira the Seer',
    speakerRole: 'Chronal Scholar',
    speakerColor: '#a855f7',
    avatarIcon: '🔮',
    shotType: 'closeUp',
    emotion: 'solemn',
    text: 'The Whispering Stones were raised to anchor the fracture. But they can barely hold.',
  });

  lines.push({
    speaker: 'Mira the Seer',
    speakerRole: 'Chronal Scholar',
    speakerColor: '#a855f7',
    avatarIcon: '🔮',
    shotType: 'closeUp',
    emotion: 'warning',
    pauseDurationMs: 150,
    text: 'Now you stand here, carrying that same terrible resonance. If you use your voice to bend this world... understand the cost. Nothing is ever truly erased. The ledger always demands payment.',
  });

  lines.push({
    speaker: 'Mira the Seer',
    speakerRole: 'Chronal Scholar',
    speakerColor: '#a855f7',
    avatarIcon: '🔮',
    shotType: 'closeUp',
    emotion: 'solemn',
    text: 'Reach out your hand to the stones. Anchor yourself (or speak "Save checkpoint"). Feel how reality resists before you ever try to bend it.',
  });

  return {
    id: 'diag_m2_start',
    cameraFocusEntity: mira?.id,
    lines,
    onCompleteFlag: 'mira_lore_learned',
  };
}

/**
 * Builds Mission 2 Complete Dialogue when the player manipulates time/reality at the stones.
 */
export function buildMission2CompleteDialogue(): DialogueSequence {
  const world = useWorldStore.getState();
  const campaign = useCampaignStore.getState();
  const mira = Object.values(world.entities).find((e) => e.name.includes('Mira'));
  const rowan = Object.values(world.entities).find((e) => e.name.includes('Rowan'));

  const isRowanDead = !rowan || rowan.health <= 0 || Boolean(campaign.storyFlags['rowan_dead']);
  const isRowanWounded = rowan && rowan.health > 0 && (rowan.health < 60 || Boolean(campaign.storyFlags['rowan_wounded']));

  const lines: DialogueLine[] = [];

  lines.push({
    speaker: 'Mira the Seer',
    speakerRole: 'Chronal Scholar',
    speakerColor: '#a855f7',
    avatarIcon: '🔮',
    shotType: 'closeUp',
    emotion: 'solemn',
    text: 'The basalt monoliths hummed. You felt that tension in your chest, didn\'t you? A chronal anchor has set into the earth.',
  });

  // State-aware crisis arrival
  if (isRowanDead) {
    lines.push({
      speaker: 'Mira the Seer',
      speakerRole: 'Chronal Scholar',
      speakerColor: '#a855f7',
      avatarIcon: '🔮',
      shotType: 'closeUp',
      emotion: 'warning',
      pauseDurationMs: 180,
      text: 'Listen. (She turns her head sharply toward the western ridge.) Warhorns. Shadowfang raiders are descending from the hills.',
    });
    lines.push({
      speaker: 'Mira the Seer',
      speakerRole: 'Chronal Scholar',
      speakerColor: '#a855f7',
      avatarIcon: '🔮',
      shotType: 'closeUp',
      emotion: 'warning',
      text: 'With Rowan dead, the mill stands undefended. They are coming to burn what remains and seize the crossing.',
    });
  } else if (isRowanWounded) {
    lines.push({
      speaker: 'Rowan the Miller',
      speakerRole: 'Wounded Villager',
      speakerColor: '#4ade80',
      avatarIcon: '🌾',
      cameraFocusEntity: rowan?.id,
      shotType: 'closeUp',
      emotion: 'wincing',
      text: 'Mira! Voice! (Rowan stumbles forward, clutching his wounded side.) Shadowfang warhorns... raiders are crossing the shallows! They\'re marching on the mill!',
    });
  } else {
    lines.push({
      speaker: 'Rowan the Miller',
      speakerRole: 'Terrified Villager',
      speakerColor: '#4ade80',
      avatarIcon: '🌾',
      cameraFocusEntity: rowan?.id,
      shotType: 'closeUp',
      emotion: 'intense',
      text: 'Mira! Voice! Sound the alarm! Shadowfang warhorns are echoing along the ridge! Vanguard raiders are advancing toward the river bridge!',
    });
  }

  lines.push({
    speaker: 'Mira the Seer',
    speakerRole: 'Chronal Scholar',
    speakerColor: '#a855f7',
    avatarIcon: '🔮',
    shotType: 'closeUp',
    emotion: 'warning',
    text: 'The border standoff has broken. Warlord Vorn is marching on the crossing. Go, Voice—intervene before the valley burns.',
  });

  lines.push({
    speaker: 'Mira the Seer',
    speakerRole: 'Chronal Scholar',
    speakerColor: '#a855f7',
    avatarIcon: '🔮',
    shotType: 'closeUp',
    emotion: 'warning',
    pauseDurationMs: 160,
    text: 'Whatever words you choose to speak at the mill, remember: you cannot outrun what you change. The world forgets nothing.',
  });

  return {
    id: 'diag_m2_complete',
    cameraFocusEntity: mira?.id,
    lines,
    onCompleteFlag: 'm2_complete_dialogue_triggered',
  };
}

/**
 * Builds Mission 3 Start Dialogue as the raid commences.
 */
export function buildMission3StartDialogue(): DialogueSequence {
  const world = useWorldStore.getState();
  const rowan = Object.values(world.entities).find((e) => e.name.includes('Rowan'));

  return {
    id: 'diag_m3_start',
    cameraFocusEntity: rowan?.id,
    lines: [
      {
        speaker: 'Rowan the Miller',
        speakerRole: 'Terrified Villager',
        speakerColor: '#4ade80',
        avatarIcon: '🌾',
        text: 'They are descending the ridge! Vorn\'s vanguard raiders will slaughter us and burn my mill to ash! Please, Voice... do something!',
      },
      {
        speaker: 'Mira the Seer',
        speakerRole: 'Chronal Scholar',
        speakerColor: '#a855f7',
        avatarIcon: '🔮',
        text: 'Remember your Echo! Call down torrential rain to extinguish torches, destroy the river bridge, protect Rowan, or command the soldiers to flee!',
        choices: [
          {
            text: '"Stay behind me, Rowan. No one harms this mill while I breathe."',
            onSelectFlag: 'swore_rowan_protection',
            bondDelta: { character: 'rowan', amount: 15 },
            followUpLines: [
              {
                speaker: 'Rowan the Miller',
                speakerRole: 'Terrified Villager',
                speakerColor: '#4ade80',
                avatarIcon: '🌾',
                text: 'May the ancients guard you, Voice! I am trusting you with my life!',
              },
            ],
          },
          {
            text: '"I will make the soldiers retreat before blood is spilled."',
            onSelectFlag: 'swore_bloodless_victory',
            bondDelta: { character: 'mira', amount: 10 },
            followUpLines: [
              {
                speaker: 'Mira the Seer',
                speakerRole: 'Chronal Scholar',
                speakerColor: '#a855f7',
                avatarIcon: '🔮',
                text: 'A noble resolve. Speak the command and break their resolve!',
              },
            ],
          },
          {
            text: '"Let them come. They will witness the wrath of the Echo."',
            onSelectFlag: 'wrathful_approach',
            bondDelta: { character: 'mira', amount: 5 },
            bondDelta2: { character: 'rowan', amount: -10 },
            followUpLines: [
              {
                speaker: 'Rowan the Miller',
                speakerRole: 'Terrified Villager',
                speakerColor: '#4ade80',
                avatarIcon: '🌾',
                text: 'Just keep that wrath away from my flour sacks... please!',
              },
            ],
          },
        ],
      },
    ],
  };
}

/**
 * Builds Mission 3 Complete Dialogue after the raid is resolved.
 * Supports all 3 narrative fates of Rowan: saved, wounded, or dead.
 */
export function buildMission3CompleteDialogue(): DialogueSequence {
  const world = useWorldStore.getState();
  const campaign = useCampaignStore.getState();
  const rowan = Object.values(world.entities).find((e) => e.name.includes('Rowan'));
  const mira = Object.values(world.entities).find((e) => e.name.includes('Mira'));

  const isRowanDead = !rowan || rowan.health <= 0 || campaign.storyFlags['rowan_fate'] === 'dead';
  const isRowanWounded = rowan && rowan.health < 60;

  if (isRowanDead) {
    return {
      id: 'diag_m3_complete_dead',
      cameraFocusEntity: mira?.id,
      lines: [
        {
          speaker: 'Mira the Seer',
          speakerRole: 'Chronal Scholar',
          speakerColor: '#a855f7',
          avatarIcon: '🔮',
          text: 'The raiders broke... but Rowan lies lifeless upon the mill stones. His blood is already soaking into the soil.',
        },
        {
          speaker: 'Mira the Seer',
          speakerRole: 'Chronal Scholar',
          speakerColor: '#a855f7',
          avatarIcon: '🔮',
          text: 'Look at him, Voice. This is the reality you allowed. Or will you run across the river to the Echo Tree, and try to undo what cannot naturally be undone?',
          choices: [
            {
              text: '"I will find a way to bring him back."',
              onSelectFlag: 'vowed_to_rewind_rowan',
              bondDelta: { character: 'mira', amount: -10 },
              followUpLines: [
                {
                  speaker: 'Mira the Seer',
                  speakerRole: 'Chronal Scholar',
                  speakerColor: '#a855f7',
                  avatarIcon: '🔮',
                  text: 'And so you step onto the Architect\'s road. Come then. The Echo Tree awaits across the river bridge.',
                },
              ],
            },
            {
              text: '"His death is part of this world now. I must live with it."',
              onSelectFlag: 'accepted_rowan_death',
              bondDelta: { character: 'mira', amount: 15 },
              followUpLines: [
                {
                  speaker: 'Mira the Seer',
                  speakerRole: 'Chronal Scholar',
                  speakerColor: '#a855f7',
                  avatarIcon: '🔮',
                  text: 'A profound and bitter wisdom. You possess the restraint the Architect lacked.',
                },
              ],
            },
          ],
        },
      ],
      onCompleteFlag: 'slice_completed',
    };
  }

  if (isRowanWounded) {
    return {
      id: 'diag_m3_complete_wounded',
      cameraFocusEntity: rowan?.id,
      lines: [
        {
          speaker: 'Rowan the Miller',
          speakerRole: 'Wounded Miller',
          speakerColor: '#4ade80',
          avatarIcon: '🌾',
          text: 'The raiders broke... gods, my side burns where their blade caught me. But I am breathing, thanks to your voice.',
        },
        {
          speaker: 'Mira the Seer',
          speakerRole: 'Chronal Scholar',
          speakerColor: '#a855f7',
          avatarIcon: '🔮',
          text: 'The mill stands, and Rowan breathes. Every scar bears testimony to living history.',
        },
        {
          speaker: 'Rowan the Miller',
          speakerRole: 'Wounded Miller',
          speakerColor: '#4ade80',
          avatarIcon: '🌾',
          text: 'Whatever shadows gather across Suncrest and Shadowfang, Rowan the Miller is your sworn ally.',
        },
      ],
      onCompleteFlag: 'slice_completed',
    };
  }

  // Rowan saved unscathed
  return {
    id: 'diag_m3_complete_saved',
    cameraFocusEntity: rowan?.id,
    lines: [
      {
        speaker: 'Rowan the Miller',
        speakerRole: 'Meadowlands Miller',
        speakerColor: '#4ade80',
        avatarIcon: '🌾',
        text: 'The raiders broke and fled! The mill stands, and not a single hair on my head was touched! By the gods, your voice truly bent reality!',
      },
      {
        speaker: 'Mira the Seer',
        speakerRole: 'Chronal Scholar',
        speakerColor: '#a855f7',
        avatarIcon: '🔮',
        text: 'You wielded the Echo with purpose, Voice. The Architect fractured this valley trying to bend it to his will, but today, you preserved it.',
      },
      {
        speaker: 'Rowan the Miller',
        speakerRole: 'Meadowlands Miller',
        speakerColor: '#4ade80',
        avatarIcon: '🌾',
        text: 'Whatever shadows gather across Suncrest and Shadowfang in the days to come, Rowan the Miller is your sworn ally.',
      },
      {
        speaker: 'Mira the Seer',
        speakerRole: 'Chronal Scholar',
        speakerColor: '#a855f7',
        avatarIcon: '🔮',
        text: 'The Meadowlands have found their Voice. Now come with me across the river bridge—it is time you saw the ancient anchor.',
      },
    ],
    onCompleteFlag: 'slice_completed',
  };
}


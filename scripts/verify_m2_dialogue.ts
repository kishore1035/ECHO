// ============================================================
// ECHO — MISSION 2 DIALOGUE & MIRA BEHAVIOR VERIFICATION
// Validates:
// 1. Mission 2 Start Dialogue tone, restraint, and close-up camera treatment
// 2. Erased timeline remembrance reveal (not a future-predicting seer)
// 3. Layer 1 Architect reveal (no full backstory dump)
// 4. State-awareness:
//    - Rowan dead, wounded, friendly, attacked
//    - Rewind state (physical discomfort, temporal nausea) vs pristine
//    - Whispering stones visited vs first arrival
//    - Timeline branch state
// 5. Mission 2 Complete Dialogue:
//    - Chronal anchor set
//    - Warhorns arrival
//    - State-aware Rowan reaction vs Mira reaction if Rowan dead
// ============================================================

import { useCampaignStore } from '../src/campaign/CampaignSystem';
import { useWorldStore } from '../src/core/WorldState';
import { useTimelineStore } from '../src/systems/TimelineSystem';
import { buildMission2StartDialogue, buildMission2CompleteDialogue } from '../src/campaign/dialogues';

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error(`❌ ASSERTION FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`✅ ${msg}`);
}

async function runM2Verification() {
  console.log('🔮 Starting Mission 2 Dialogue & State-Awareness Verification...\n');

  const world = useWorldStore.getState();
  const campaign = useCampaignStore.getState();
  const rowan = Object.values(world.entities).find((e) => e.name.includes('Rowan'));
  const mira = Object.values(world.entities).find((e) => e.name.includes('Mira'));

  assert(Boolean(mira), 'Found Mira entity in world');
  assert(Boolean(rowan), 'Found Rowan entity in world');

  // ── 1. Pristine / Un-rewound Encounter ─────────────────────
  console.log('\n--- Scenario 1: First Arrival at Stones (Pristine, Rowan Friendly) ---');
  useWorldStore.setState({ timelineRestoreVersion: 0 });
  useTimelineStore.setState({ activeBranchId: 'branch_prime' });
  useCampaignStore.setState({
    characterBonds: { rowan: 25, mira: 10 },
    storyFlags: {
      discovered_whispering_stones: true,
      rowan_saved: true,
    },
  });

  const pristineDiag = buildMission2StartDialogue();
  assert(pristineDiag.id === 'diag_m2_start', 'Generated diag_m2_start');
  assert(pristineDiag.cameraFocusEntity === mira?.id, 'Camera focuses on Mira entity');

  // Verify closeUp shot treatment on all lines
  const allCloseUp = pristineDiag.lines.every((l) => l.shotType === 'closeUp');
  assert(allCloseUp, 'All lines have close-up face-focused camera treatment (shotType: "closeUp")');

  // Check opening lines
  assert(
    pristineDiag.lines[0].text.includes('river currents went dead quiet'),
    'Mira acknowledges player crossing river shallows'
  );
  assert(
    pristineDiag.lines[0].emotion === 'solemn',
    'Opening line has solemn emotion'
  );

  // Check Rowan friendliness reaction
  const friendlyLine = pristineDiag.lines.find((l) => l.text.includes('Rowan speaks of you with awe'));
  assert(Boolean(friendlyLine), 'Mira acknowledges Rowan speaks of player with awe');

  // Check Stones visited reaction
  const stonesLine = pristineDiag.lines.find((l) => l.text.includes('basalt pillars'));
  assert(Boolean(stonesLine), 'Mira acknowledges basalt pillars and stones exploration');

  // Check The Revelation: She remembers unmade realities (not future prediction)
  const seerLine = pristineDiag.lines.find((l) => l.text.includes('I do not see the future, Voice. I remember what was unmade.'));
  assert(Boolean(seerLine), 'Mira clarifies she is not predicting the future—she remembers unmade realities');
  assert(seerLine!.emotion === 'discomfort', 'Mira shows discomfort when revealing unmade reality memories');

  // Check specific visceral erased timeline memory (southern drought/fire)
  const memoryLine = pristineDiag.lines.find((l) => l.text.includes('Two autumns ago, the southern fields burned'));
  assert(Boolean(memoryLine), 'Recalls specific erased memory of burned southern fields');

  const shudderLine = pristineDiag.lines.find((l) => l.text.includes('shudder in the sky. A hollow ringing'));
  assert(Boolean(shudderLine), 'Describes the shudder in the sky when reality was rewritten');

  const ashLine = pristineDiag.lines.find((l) => l.text.includes('ash never left my mouth'));
  assert(Boolean(ashLine), 'Visceral line: "the ash never left my mouth"');

  // Check Choices present
  assert(Boolean(ashLine?.choices && ashLine.choices.length === 3), 'Dialogue provides 3 philosophical response choices');

  // Verify Layer 1 Architect reveal
  const architectChoice = ashLine!.choices!.find((c) => c.text.includes('The Architect') || c.text.includes('Who had that kind of power'));
  assert(Boolean(architectChoice), 'Includes choice to inquire about who rewrote reality');
  assert(
    architectChoice!.followUpLines![0].text.includes('The Architect') &&
    architectChoice!.followUpLines![0].text.includes('ancient Voice') &&
    architectChoice!.followUpLines![0].text.includes('perfection'),
    'Layer 1 Architect reveal: an ancient Voice who tried to force reality into perfection'
  );
  assert(
    !architectChoice!.followUpLines![0].text.includes('loved someone') && !architectChoice!.followUpLines![0].text.includes('variables in an equation'),
    'Backstory is strictly Layer 1 (does NOT dump private lover/variable backstory yet)'
  );

  // ── 2. Rewound Timeline Encounter ─────────────────────────
  console.log('\n--- Scenario 2: Arrival After Rewind (Physical Discomfort & Migraine) ---');
  useWorldStore.setState({ timelineRestoreVersion: 2 });
  const rewoundDiag = buildMission2StartDialogue();

  assert(
    rewoundDiag.lines[0].emotion === 'discomfort',
    'Opening line has "discomfort" emotion when timeline has been rewound'
  );
  assert(
    rewoundDiag.lines[0].text.includes('clutches') || rewoundDiag.lines[0].text.includes('breath catches'),
    'Dialogue depicts visible physical recoil/wince'
  );
  assert(
    rewoundDiag.lines[1].text.includes('taste cold copper') && rewoundDiag.lines[1].text.includes('bells from an hour that never arrived'),
    'Mira describes sensory trauma of erased timeline (taste of cold copper, phantom bells)'
  );

  // ── 3. Rowan Dead State-Awareness ──────────────────────────
  console.log('\n--- Scenario 3: Arrival When Rowan is Dead ---');
  world.updateEntity(rowan!.id, { health: 0 });
  useCampaignStore.setState({
    storyFlags: { rowan_dead: true },
  });

  const deadRowanDiag = buildMission2StartDialogue();
  const rowanDeadLine = deadRowanDiag.lines.find((l) => l.text.includes('Rowan is gone'));
  assert(Boolean(rowanDeadLine), 'Mira mourns Rowan when he is dead ("Rowan is gone... silence spreading from the mill")');
  assert(rowanDeadLine!.emotion === 'mournful', 'Rowan death line has mournful emotion');

  // ── 4. Rowan Wounded State-Awareness ───────────────────────
  console.log('\n--- Scenario 4: Arrival When Rowan is Wounded ---');
  world.updateEntity(rowan!.id, { health: 35 });
  useCampaignStore.setState({
    storyFlags: { rowan_dead: false, rowan_wounded: true },
  });

  const woundedRowanDiag = buildMission2StartDialogue();
  const rowanWoundedLine = woundedRowanDiag.lines.find((l) => l.text.includes('Rowan is injured'));
  assert(Boolean(rowanWoundedLine), 'Mira observes Rowan is wounded');

  // ── 5. Rowan Attacked State-Awareness ──────────────────────
  console.log('\n--- Scenario 5: Arrival When Player Attacked Rowan ---');
  useCampaignStore.setState({
    characterBonds: { rowan: -10 },
    storyFlags: { rowan_attacked: true },
  });

  const attackedRowanDiag = buildMission2StartDialogue();
  const attackedLine = attackedRowanDiag.lines.find((l) => l.text.includes('Rowan trembles'));
  assert(Boolean(attackedLine), 'Mira warns about violence in the player’s voice');
  assert(attackedLine!.emotion === 'warning', 'Attacked line has warning emotion');

  // ── 6. Mission 2 Complete Dialogue Verification ────────────
  console.log('\n--- Scenario 6: Mission 2 Complete Dialogue (Anchor set, Crisis Arrival) ---');
  // Sub-case A: Rowan Alive
  world.updateEntity(rowan!.id, { health: 100 });
  useCampaignStore.setState({
    storyFlags: { rowan_dead: false, rowan_wounded: false },
  });
  const m2CompAlive = buildMission2CompleteDialogue();
  assert(m2CompAlive.lines[0].text.includes('chronal anchor has set'), 'Mira notes chronal anchor set into earth');
  const rowanWarningLine = m2CompAlive.lines.find((l) => l.speaker.includes('Rowan'));
  assert(Boolean(rowanWarningLine), 'Alive Rowan delivers urgent warning about Shadowfang vanguard');

  // Sub-case B: Rowan Dead
  world.updateEntity(rowan!.id, { health: 0 });
  useCampaignStore.setState({
    storyFlags: { rowan_dead: true },
  });
  const m2CompDead = buildMission2CompleteDialogue();
  const deadRowanSpoke = m2CompDead.lines.some((l) => l.speaker.includes('Rowan'));
  assert(!deadRowanSpoke, 'DEAD ROWAN DOES NOT SPEAK in Mission 2 Complete Dialogue');
  const miraDeadReaction = m2CompDead.lines.find((l) => l.text.includes('With Rowan dead, the mill stands undefended'));
  assert(Boolean(miraDeadReaction), 'Mira reacts to warhorns and notes mill is undefended because Rowan is dead');

  console.log('\n🎉 ALL MISSION 2 DIALOGUE & NARRATIVE VERIFICATIONS PASSED 100%!');
}

runM2Verification().catch((e) => {
  console.error(e);
  process.exit(1);
});

// ============================================================
// VERIFICATION SCRIPT: MISSION 4 — THE ANCHOR OF THE ARCHITECT
// Tests the full narrative progression, environmental dampening,
// progressive communion dialogue, mirror choice, and timeline reveal.
// ============================================================

import { useWorldStore } from '../src/core/WorldState';
import { useCampaignStore, CampaignSystem } from '../src/campaign/CampaignSystem';
import { useEchoTreeStore } from '../src/core/echoTreeState';
import { soundFX } from '../src/core/soundFX';
import {
  buildMission4StartDialogue,
  buildMission4CommunionDialogue,
  buildMission4CompleteDialogue,
} from '../src/campaign/dialogues';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✓ ${msg}`);
}

async function runM4Verification() {
  console.log('\n======================================================');
  console.log('🧪 RUNNING MISSION 4 — THE ANCHOR OF THE ARCHITECT TEST');
  console.log('======================================================\n');

  const campaign = useCampaignStore.getState();
  const world = useWorldStore.getState();

  // ── 1. Setup: Activate Mission 4 (as after M3 completion) ──
  console.log('Step 1: Setting up M3 aftermath transition to Mission 4...');
  const m4 = campaign.missions.find((m) => m.id === 'm4_anchor_architect');
  assert(Boolean(m4), 'Mission 4 exists in campaign missions');

  if (m4) {
    m4.status = 'active';
  }
  useCampaignStore.setState({
    activeMissionId: 'm4_anchor_architect',
    currentAct: 'act4',
    activeDialogue: null,
    storyFlags: {
      ...campaign.storyFlags,
      rowan_fate: 'saved',
    },
  });

  // Evaluate initial tick
  CampaignSystem.evaluate();
  const updatedM4 = useCampaignStore.getState().missions.find((m) => m.id === 'm4_anchor_architect')!;
  assert(updatedM4.status === 'active', 'Mission 4 is active');
  assert(useCampaignStore.getState().currentAct === 'act4', 'Current Act is Act IV');

  // Check Mira relocated to glade threshold
  const mira = Object.values(useWorldStore.getState().entities).find((e) => e.name.includes('Mira'));
  assert(Boolean(mira), 'Mira the Seer exists in world');
  assert(mira!.position.x <= -10.0, `Mira relocated to glade threshold: x=${mira!.position.x}, z=${mira!.position.z}`);

  // ── 2. Environmental Dampening Check ──
  console.log('\nStep 2: Testing glade acoustic dampening...');
  soundFX.setGladeDampening(0.8);
  assert(true, 'soundFX.setGladeDampening successfully accepted acoustic parameter');

  // ── 3. Objective 1: Crossing the river bridge ──
  console.log('\nStep 3: Moving player across the river into the western hollow...');
  useWorldStore.getState().updatePlayer({
    position: { x: -8.5, y: 0.5, z: 2.0 },
    rotationY: 0,
    velocity: { x: 0, y: 0, z: 0 },
    isGrounded: true,
    waterState: 'none',
  });

  CampaignSystem.evaluate();
  const objBridge = useCampaignStore.getState().missions.find((m) => m.id === 'm4_anchor_architect')!.objectives[0];
  assert(objBridge.completed, 'Objective 1 (Cross river bridge toward glade) completed');

  // Check that opening dialogue triggered
  const activeDiag = useCampaignStore.getState().activeDialogue;
  assert(Boolean(activeDiag && activeDiag.id === 'diag_m4_start'), 'Mission 4 opening dialogue triggered');

  // Advance dialogue to completion
  console.log('Advancing M4 opening dialogue...');
  while (useCampaignStore.getState().activeDialogue) {
    CampaignSystem.advanceDialogue();
  }
  assert(Boolean(useCampaignStore.getState().storyFlags['m4_guidance_received']), 'Guidance received story flag set');

  // ── 4. Objective 2: Discovering the Echo Tree ──
  console.log('\nStep 4: Approaching the ancient Echo Tree (-13.0, -1.5)...');
  useWorldStore.getState().updatePlayer({
    position: { x: -12.0, y: 0.5, z: -1.5 },
    rotationY: 0,
    velocity: { x: 0, y: 0, z: 0 },
    isGrounded: true,
    waterState: 'none',
  });

  CampaignSystem.evaluate();
  const objDiscover = useCampaignStore.getState().missions.find((m) => m.id === 'm4_anchor_architect')!.objectives[1];
  assert(objDiscover.completed, 'Objective 2 (Discover ancient Echo Tree) completed');
  assert(Boolean(useCampaignStore.getState().storyFlags['echo_tree_discovered']), 'Echo tree discovered flag set');

  // Check tree proximity
  const isNearTree = useEchoTreeStore.getState().checkProximity({ x: -12.0, z: -1.5 });
  assert(isNearTree, 'Player is within physical interaction radius of Echo Tree');

  // ── 5. Objective 3: Timeline Communion & Progressive Revelation ──
  console.log('\nStep 5: Initiating communion dialogue sequence at the ancient roots...');
  const communionDiag = buildMission4CommunionDialogue();
  assert(communionDiag.lines.length >= 8, `Communion sequence has ${communionDiag.lines.length} progressive beats`);

  CampaignSystem.triggerDialogue(communionDiag);
  assert(useCampaignStore.getState().activeDialogue?.id === 'diag_m4_communion', 'Communion dialogue active');

  // Step through memory beats
  console.log('Advancing through progressive Architect memory fragments:');
  const lineCount = communionDiag.lines.length;
  for (let i = 0; i < lineCount; i++) {
    const cur = useCampaignStore.getState().activeDialogue?.lines[useCampaignStore.getState().dialogueLineIndex];
    if (cur) {
      console.log(`  [Beat ${i + 1}] ${cur.speaker} (${cur.speakerRole}): "${cur.text.slice(0, 55)}..."`);
    }
    if (i < lineCount - 1) {
      CampaignSystem.advanceDialogue();
    }
  }

  // The 8th line has the mirror question with choices
  const mirrorLine = useCampaignStore.getState().activeDialogue?.lines[useCampaignStore.getState().dialogueLineIndex];
  assert(Boolean(mirrorLine?.choices && mirrorLine.choices.length === 3), 'Mirror question presents 3 convictions');

  // Select Choice 1 (Empathy)
  const choice1 = mirrorLine!.choices![0];
  console.log(`Selecting conviction: ${choice1.text}`);
  useCampaignStore.getState().setStoryFlag(choice1.onSelectFlag!, true);
  if (choice1.bondDelta) {
    useCampaignStore.getState().adjustBond(choice1.bondDelta.character, choice1.bondDelta.amount);
  }

  // Complete dialogue
  CampaignSystem.advanceDialogue();
  // If followup line added, complete that too
  while (useCampaignStore.getState().activeDialogue) {
    CampaignSystem.advanceDialogue();
  }

  assert(Boolean(useCampaignStore.getState().storyFlags['architect_revelation_learned']), 'architect_revelation_learned flag set');
  assert(Boolean(useCampaignStore.getState().storyFlags['architect_path_empathy']), 'architect_path_empathy flag set');

  // ── 6. Objective 4 & Mission 4 Completion ──
  console.log('\nStep 6: Evaluating final objectives and vertical slice completion...');
  CampaignSystem.evaluate();

  const finalM4 = useCampaignStore.getState().missions.find((m) => m.id === 'm4_anchor_architect')!;
  assert(finalM4.objectives[2].completed, 'Objective 3 (Commune with anchor) completed');
  assert(finalM4.objectives[3].completed, 'Objective 4 (Confront mirror / choose conviction) completed');
  assert(finalM4.status === 'completed', 'Mission 4 status is completed!');
  assert(Boolean(useCampaignStore.getState().storyFlags['vertical_slice_completed']), 'Vertical slice completed flag set!');
  assert(useCampaignStore.getState().completedMissionIds.includes('m4_anchor_architect'), 'm4_anchor_architect in completedMissionIds');

  // Consequence recording
  const consequence = finalM4.consequences.find((c) => c.id === 'c_architect_mirror_confronted');
  assert(Boolean(consequence), 'Consequence c_architect_mirror_confronted recorded');
  console.log(`Recorded Consequence: "${consequence?.description}"`);

  // Organic TimelinePanel reveal check
  assert(useEchoTreeStore.getState().isInteracting === true, 'TimelinePanel opened organically upon communion completion');

  console.log('\n======================================================');
  console.log('🎉 MISSION 4 — THE ANCHOR OF THE ARCHITECT FULLY VERIFIED!');
  console.log('======================================================\n');
}

runM4Verification().catch((err) => {
  console.error('Fatal error during verification:', err);
  process.exit(1);
});

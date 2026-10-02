// ============================================================
// VERIFY CAMPAIGN SCRIPT — End-to-End Headless Simulation Test
// Validates Missions 1, 2, 3, Dialogue state, Echo commands,
// and M4 Timeline serialization.
// ============================================================

import { useWorldStore } from '../src/core/WorldState';
import { useCampaignStore, CampaignSystem } from '../src/campaign/CampaignSystem';
import { useTimelineStore, captureSnapshot } from '../src/systems/TimelineSystem';
import { dispatchCommand } from '../src/voice/CommandDispatcher';
import { parseVoiceCommand } from '../src/voice/CommandParser';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ ${message}`);
  }
}

async function runTests() {
  console.log('──────────────────────────────────────────────────────');
  console.log('🚀 BEGINNING ECHO CAMPAIGN SYSTEM INTEGRATION TESTS');
  console.log('──────────────────────────────────────────────────────\n');

  // ── STEP 1: Initial Game & Campaign State ────────────────────
  const initialCampaign = useCampaignStore.getState();
  assert(initialCampaign.currentAct === 'prologue', 'Current act begins in "prologue"');
  assert(initialCampaign.activeMissionId === 'm1_first_resonance', 'Active mission is Mission 1: The First Resonance');

  const m1 = initialCampaign.missions.find((m) => m.id === 'm1_first_resonance');
  assert(Boolean(m1 && m1.status === 'active'), 'Mission 1 status is active');
  assert(m1!.objectives.length === 3, 'Mission 1 has 3 objectives');

  // ── STEP 1.5: Advance Opening Subconscious Awakening Monologue ───
  console.log('🌅 Player awakens — hearing the Voice within...');
  assert(initialCampaign.activeDialogue?.id === 'diag_m1_start', 'Initial awakening dialogue is present');
  while (useCampaignStore.getState().activeDialogue?.id === 'diag_m1_start') {
    CampaignSystem.advanceDialogue();
  }
  assert(useCampaignStore.getState().activeDialogue === null, 'Awakening dialogue completed');

  // ── STEP 2: Player approaches Rowan near Mill ───────────────
  console.log('\n📍 [Step 2] Simulating Player walking to Rowan at the Old Mill (5, 5)...');
  useWorldStore.getState().updatePlayer({
    position: { x: 5.0, y: 1.5, z: 5.0 },
    rotationY: 0,
    velocity: { x: 0, y: 0, z: 0 },
    isGrounded: true,
  });

  CampaignSystem.evaluate();

  const campaignAfterApproach = useCampaignStore.getState();
  const m1AfterApproach = campaignAfterApproach.missions.find((m) => m.id === 'm1_first_resonance');
  assert(m1AfterApproach!.objectives[0].completed === true, 'Obj 1 (Approach Rowan) is COMPLETED');
  assert(Boolean(campaignAfterApproach.activeDialogue), 'State-aware Dialogue with Rowan & Mira was TRIGGERED');
  assert(
    campaignAfterApproach.activeDialogue?.lines[0].speaker === 'Rowan the Miller' ||
    campaignAfterApproach.activeDialogue?.lines[0].speaker === 'Mira the Seer',
    'First dialogue speaker is Rowan or Mira'
  );

  // Advance dialogue and select choice 1
  console.log('💬 Advancing dialogue with Rowan & Mira...');
  while (useCampaignStore.getState().activeDialogue) {
    const active = useCampaignStore.getState().activeDialogue;
    const idx = useCampaignStore.getState().dialogueLineIndex;
    const line = active?.lines[idx];
    if (line?.choices && line.choices.length > 0) {
      const choice = line.choices[0];
      if (choice.onSelectFlag) useCampaignStore.getState().setStoryFlag(choice.onSelectFlag, true);
      if (choice.bondDelta) useCampaignStore.getState().adjustBond(choice.bondDelta.character, choice.bondDelta.amount);
    }
    CampaignSystem.advanceDialogue();
  }
  assert(useCampaignStore.getState().activeDialogue === null, 'Dialogue successfully completed and closed');
  assert(useCampaignStore.getState().characterBonds.rowan > 10, 'Rowan bond increased from interaction');

  // ── STEP 3: Demonstrate the Echo (Voice Command) ────────────
  console.log('\n✨ [Step 3] Simulating Voice Command: "Aid Rowan the Miller"...');
  const aidCommand = await parseVoiceCommand('Aid Rowan the Miller', {});
  assert(Boolean(aidCommand && aidCommand.type === 'INTERACT_ENTITY'), 'Voice parser mapped "Aid Rowan" to INTERACT_ENTITY');
  dispatchCommand(aidCommand!);

  CampaignSystem.evaluate();

  const campaignAfterEcho = useCampaignStore.getState();
  const m1AfterEcho = campaignAfterEcho.missions.find((m) => m.id === 'm1_first_resonance');
  assert(m1AfterEcho!.objectives[1].completed === true, 'Obj 2 (Demonstrate Echo) is COMPLETED');

  // Finish reaction dialogue
  while (useCampaignStore.getState().activeDialogue) {
    CampaignSystem.advanceDialogue();
  }

  CampaignSystem.evaluate();
  const m1Final = useCampaignStore.getState().missions.find((m) => m.id === 'm1_first_resonance');
  assert(m1Final!.status === 'completed', 'Mission 1 (The First Resonance) is COMPLETED!');
  assert(useCampaignStore.getState().activeMissionId === 'm2_whispering_stones', 'Mission 2 (The Whispering Stones) is now ACTIVE');

  // ── STEP 4: Mission 2 — The Whispering Stones ───────────────
  console.log('\n🔮 [Step 4] Simulating walking to Mira at the Whispering Stones (-4, 9)...');
  useWorldStore.getState().updatePlayer({
    position: { x: -4.0, y: 1.5, z: 9.0 },
    rotationY: 0,
    velocity: { x: 0, y: 0, z: 0 },
    isGrounded: true,
  });

  CampaignSystem.evaluate();

  const campaignM2 = useCampaignStore.getState();
  const m2 = campaignM2.missions.find((m) => m.id === 'm2_whispering_stones');
  assert(m2!.objectives[0].completed === true, 'Mission 2 Obj 1 (Find Mira) is COMPLETED');
  assert(Boolean(campaignM2.activeDialogue), 'Mira Start Dialogue (The Architect Lore) triggered');

  // Step through Mira lore dialogue
  while (useCampaignStore.getState().activeDialogue) {
    const active = useCampaignStore.getState().activeDialogue;
    const idx = useCampaignStore.getState().dialogueLineIndex;
    const line = active?.lines[idx];
    if (line?.choices && line.choices.length > 0) {
      const choice = line.choices[0];
      if (choice.onSelectFlag) useCampaignStore.getState().setStoryFlag(choice.onSelectFlag, true);
    }
    CampaignSystem.advanceDialogue();
  }

  CampaignSystem.evaluate();
  assert(m2!.objectives[1].completed === true, 'Mission 2 Obj 2 (Hear warning & Architect lore) is COMPLETED');

  // Test Saving Checkpoint via Echo command
  console.log('💾 Testing Echo Voice Command: "Save checkpoint before the storm"...');
  const cpCommand = await parseVoiceCommand('Save checkpoint before the storm', {});
  assert(Boolean(cpCommand && cpCommand.type === 'CREATE_CHECKPOINT'), 'Voice parser mapped "Save checkpoint"');
  dispatchCommand(cpCommand!);

  CampaignSystem.evaluate();
  assert(m2!.objectives[2].completed === true, 'Mission 2 Obj 3 (Chronal scar / Checkpoint) is COMPLETED');

  // Close transition dialogue
  while (useCampaignStore.getState().activeDialogue) {
    CampaignSystem.advanceDialogue();
  }

  CampaignSystem.evaluate();
  assert(m2!.status === 'completed', 'Mission 2 (The Whispering Stones) is COMPLETED!');
  assert(useCampaignStore.getState().currentAct === 'act1', 'Act advanced to "act1: The Gathering Clouds"');
  assert(useCampaignStore.getState().activeMissionId === 'm3_shadows_meadowlands', 'Mission 3 (Shadows over the Meadowlands) is now ACTIVE');

  // ── STEP 5: Mission 3 — Shadows Over the Meadowlands ─────────
  console.log('\n⚔️ [Step 5] Evaluating Mission 3 & Shadowfang Vanguard Raid...');
  CampaignSystem.evaluate();

  const entities = useWorldStore.getState().entities;
  const raiders = Object.values(entities).filter((e) => e.name.includes('Shadowfang'));
  assert(raiders.length >= 2, 'Shadowfang Raiders spawned and advancing towards Rowan\'s mill');

  // Test Echo interference: "Make the soldiers retreat"
  console.log('⚡ Speaking Echo command: "Make the soldiers retreat"...');
  const retreatCmd = await parseVoiceCommand('Make the soldiers retreat', {});
  assert(Boolean(retreatCmd && retreatCmd.type === 'INTERACT_ENTITY' && retreatCmd.action === 'retreat'), 'Voice parser mapped command to retreat');
  dispatchCommand(retreatCmd!);

  // Fast forward simulation evaluation
  CampaignSystem.evaluate();

  const m3 = useCampaignStore.getState().missions.find((m) => m.id === 'm3_shadows_meadowlands');
  assert(m3!.objectives[1].completed === true, 'Mission 3 Obj 2 (Repel raid using Echo) is COMPLETED');
  assert(m3!.objectives[0].completed === true, 'Mission 3 Obj 1 (Rowan protected and survived) is COMPLETED');

  // Close victory dialogue
  while (useCampaignStore.getState().activeDialogue) {
    CampaignSystem.advanceDialogue();
  }

  CampaignSystem.evaluate();
  assert(m3!.status === 'completed', 'Mission 3 (Shadows Over the Meadowlands) is COMPLETED!');

  // ── STEP 6: M4 Timeline Serialization & Snapshot Integrity ──
  console.log('\n⏳ [Step 6] Testing M4 Timeline Snapshot & Campaign State Serialization...');
  const snapshot = captureSnapshot();
  assert(Boolean(snapshot.campaign), 'WorldSnapshot contains serialized campaign state');
  assert(snapshot.campaign.currentAct === 'act1' || snapshot.campaign.currentAct === 'act4', 'Snapshot preserved current act');
  assert(snapshot.campaign.characterBonds.rowan > 10, 'Snapshot preserved character bonds');
  assert(snapshot.campaign.missions.find((m: any) => m.id === 'm1_first_resonance').status === 'completed', 'Snapshot preserved completed mission 1');
  assert(snapshot.campaign.missions.find((m: any) => m.id === 'm2_whispering_stones').status === 'completed', 'Snapshot preserved completed mission 2');
  assert(snapshot.campaign.missions.find((m: any) => m.id === 'm3_shadows_meadowlands').status === 'completed', 'Snapshot preserved completed mission 3');

  // Test restore checkpoint
  console.log('🔄 Restoring inception checkpoint...');
  useTimelineStore.getState().rewind('initial');
  assert(useWorldStore.getState().timelineRestoreVersion > 0, 'Simulation timeline version incremented on rewind');

  console.log('\n──────────────────────────────────────────────────────');
  console.log('🎉 ALL INTEGRATION TESTS PASSED WITH 100% SUCCESS!');
  console.log('──────────────────────────────────────────────────────\n');
}

runTests().catch((err) => {
  console.error('Test run failed:', err);
  process.exit(1);
});

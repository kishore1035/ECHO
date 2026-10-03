// ============================================================
// VERIFICATION SCRIPT: MISSION 3 — THE BATTLE FOR THE MILL
// Tests all 5 major simulation paths & timeline rewind:
// Path 1: Shield Rowan ("Protect Rowan")
// Path 2: Call the rain ("Call the rain")
// Path 3: Destroy the bridge ("Destroy the bridge")
// Path 4: Make soldiers retreat ("Make the soldiers retreat")
// Path 5: Combat damage / inaction -> Rowan wounded & Rowan dead
// Path 6: M4 Timeline Rewind restores pre-raid state
// ============================================================

import { useWorldStore } from '../src/core/WorldState';
import { useCampaignStore } from '../src/campaign/CampaignSystem';
import { dispatchCommand } from '../src/voice/CommandDispatcher';
import { parseVoiceCommand } from '../src/voice/CommandParser';
import { TimelineSystem } from '../src/systems/TimelineSystem';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✓ ${msg}`);
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 VERIFYING MISSION 3 — THE BATTLE FOR THE MILL');
  console.log('====================================================\n');

  // ── TEST 1: Command Parser for all 4 Echo Paths ────────────────
  console.log('--- Step 1: Voice Command Parsing Verification ---');
  const dummyEntities = {
    'rowan': { id: 'ent_rowan', name: 'Rowan the Miller', type: 'character' },
    'bridge': { id: 'ent_bridge', name: 'River Bridge', type: 'structure' },
  };

  const cmdShield = await parseVoiceCommand('protect rowan', dummyEntities);
  assert(cmdShield !== null && cmdShield.type === 'INTERACT_ENTITY' && (cmdShield as any).action === 'shield', 'Parsed "protect rowan" -> INTERACT_ENTITY (shield)');

  const cmdRain = await parseVoiceCommand('call the rain', dummyEntities);
  assert(cmdRain !== null && cmdRain.type === 'WORLD_MODIFY' && (cmdRain as any).value === 'rain', 'Parsed "call the rain" -> WORLD_MODIFY (rain)');

  const cmdBridge = await parseVoiceCommand('destroy the bridge', dummyEntities);
  assert(cmdBridge !== null && cmdBridge.type === 'DESPAWN_ENTITY' && (cmdBridge as any).entityName === 'bridge', 'Parsed "destroy the bridge" -> DESPAWN_ENTITY (bridge)');

  const cmdRetreat = await parseVoiceCommand('make the soldiers retreat', dummyEntities);
  assert(cmdRetreat !== null && cmdRetreat.type === 'INTERACT_ENTITY' && (cmdRetreat as any).action === 'retreat', 'Parsed "make the soldiers retreat" -> INTERACT_ENTITY (retreat)');

  // ── TEST 2: Path 1 — Shield Rowan ──────────────────────────────
  console.log('\n--- Step 2: Path 1 — Shield Rowan ---');
  const missions = useCampaignStore.getState().missions;
  const m3 = missions.find((m) => m.id === 'm3_shadows_meadowlands');
  if (m3) m3.status = 'active';

  useCampaignStore.setState({
    activeMissionId: 'm3_shadows_meadowlands',
    currentAct: 'act1',
    storyFlags: {},
    missions: [...missions],
  });
  useWorldStore.setState({
    player: { ...useWorldStore.getState().player, position: { x: 5, y: 0, z: 5 } },
  });
  useCampaignStore.getState().evaluate();

  assert(Boolean(useCampaignStore.getState().storyFlags['raiders_spawned']), 'Raiders spawned as player approached Old Mill');
  assert(Boolean(useCampaignStore.getState().storyFlags['raid_begun']), 'Raid officially begun');

  // Dispatch shield command
  dispatchCommand({ type: 'INTERACT_ENTITY', action: 'shield', entityName: 'rowan' });
  assert(Boolean(useCampaignStore.getState().storyFlags['rowan_shielded']), 'Rowan is shielded by chronal barrier');
  assert(useCampaignStore.getState().storyFlags['resolution_method'] === 'shield', 'Resolution method recorded as shield');

  function resetM3() {
    const missions = useCampaignStore.getState().missions;
    const m3 = missions.find((m) => m.id === 'm3_shadows_meadowlands');
    if (m3) {
      m3.status = 'active';
      m3.objectives.forEach((o) => (o.completed = false));
    }
  }

  // ── TEST 3: Path 2 — Call the Rain ─────────────────────────────
  console.log('\n--- Step 3: Path 2 — Call the Rain ---');
  resetM3();
  useCampaignStore.setState({
    activeMissionId: 'm3_shadows_meadowlands',
    storyFlags: { raiders_spawned: true, raid_begun: true },
  });
  dispatchCommand({ type: 'WORLD_MODIFY', property: 'weather', value: 'rain' });
  useCampaignStore.getState().evaluate();

  assert(useWorldStore.getState().weather.type === 'rain', 'World weather modified to rain');
  assert(Boolean(useCampaignStore.getState().storyFlags['torches_extinguished']), 'Vanguard torches extinguished by rain');
  assert(useCampaignStore.getState().storyFlags['resolution_method'] === 'rain', 'Resolution method recorded as rain');

  // ── TEST 4: Path 3 — Destroy the Bridge ────────────────────────
  console.log('\n--- Step 4: Path 3 — Destroy the Bridge ---');
  resetM3();
  useCampaignStore.setState({
    activeMissionId: 'm3_shadows_meadowlands',
    storyFlags: { raiders_spawned: true, raid_begun: true },
  });
  useWorldStore.setState({ bridgeDestroyed: false });
  dispatchCommand({ type: 'DESPAWN_ENTITY', entityName: 'bridge' });
  useCampaignStore.getState().evaluate();

  assert(useWorldStore.getState().bridgeDestroyed === true, 'World bridge destroyed flag set to true');
  assert(Boolean(useCampaignStore.getState().storyFlags['bridge_cut']), 'Bridge cut flag recorded');
  assert(useCampaignStore.getState().storyFlags['resolution_method'] === 'bridge', 'Resolution method recorded as bridge');

  // ── TEST 5: Path 4 — Make Soldiers Retreat ─────────────────────
  console.log('\n--- Step 5: Path 4 — Make Soldiers Retreat ---');
  resetM3();
  useCampaignStore.setState({
    activeMissionId: 'm3_shadows_meadowlands',
    storyFlags: { raiders_spawned: true, raid_begun: true },
  });
  dispatchCommand({ type: 'INTERACT_ENTITY', action: 'retreat', entityName: 'soldiers' });
  useCampaignStore.getState().evaluate();

  assert(Boolean(useCampaignStore.getState().storyFlags['raiders_retreated']), 'Raiders retreated flag set');
  assert(useCampaignStore.getState().storyFlags['resolution_method'] === 'retreat', 'Resolution method recorded as retreat');

  // ── TEST 6: Path 5 — Rowan Simulation Fate (Saved, Wounded, Dead)
  console.log('\n--- Step 6: Path 5 — Rowan Simulation Fate ---');
  const worldEntities = useWorldStore.getState().entities;
  const rowanKey = Object.keys(worldEntities).find((k) => worldEntities[k].name.includes('Rowan'));
  assert(rowanKey !== undefined, 'Rowan exists in world entities');

  // Test 6a: Saved
  resetM3();
  useCampaignStore.setState({
    activeMissionId: 'm3_shadows_meadowlands',
    storyFlags: { raiders_spawned: true, raid_begun: true, raiders_retreated: true },
  });
  useWorldStore.getState().updateEntity(rowanKey!, { health: 100, isCollapsed: false });
  useCampaignStore.getState().evaluate();
  assert(useCampaignStore.getState().storyFlags['rowan_fate'] === 'saved', 'Rowan fate evaluated as saved when HP >= 60');

  // Test 6b: Wounded
  resetM3();
  useCampaignStore.setState({
    activeMissionId: 'm3_shadows_meadowlands',
    storyFlags: { raiders_spawned: true, raid_begun: true, raiders_retreated: true },
  });
  useWorldStore.getState().updateEntity(rowanKey!, { health: 35, isCollapsed: false });
  useCampaignStore.getState().evaluate();
  assert(useCampaignStore.getState().storyFlags['rowan_fate'] === 'wounded', 'Rowan fate evaluated as wounded when 0 < HP < 60');

  // Test 6c: Dead
  resetM3();
  useCampaignStore.setState({
    activeMissionId: 'm3_shadows_meadowlands',
    storyFlags: { raiders_spawned: true, raid_begun: true, raiders_retreated: true },
  });
  useWorldStore.getState().updateEntity(rowanKey!, { health: 0, isCollapsed: true });
  useCampaignStore.getState().evaluate();
  assert(useCampaignStore.getState().storyFlags['rowan_fate'] === 'dead', 'Rowan fate evaluated as dead when HP <= 0');

  // ── TEST 7: Timeline Rewind Restores Pre-Raid State ────────────
  console.log('\n--- Step 7: Timeline Rewind Restores Pre-Raid State ---');
  // Create checkpoint before raid
  useWorldStore.getState().updateEntity(rowanKey!, { health: 100, isCollapsed: false });
  useWorldStore.setState({ bridgeDestroyed: false, weather: { type: 'clear', intensity: 0, windSpeed: 0.2, fogDensity: 0 } });
  const preRaidCpId = TimelineSystem.createCheckpoint({
    name: 'Before the Mill Raid',
    description: 'Valley is calm before Shadowfang descent.',
    significance: 'story',
  });

  // Now simulate raid damage and bridge destruction
  useWorldStore.getState().updateEntity(rowanKey!, { health: 0, isCollapsed: true });
  useWorldStore.setState({ bridgeDestroyed: true });
  assert(useWorldStore.getState().entities[rowanKey!].health === 0, 'Rowan health set to 0 in alternate timeline');
  assert(useWorldStore.getState().bridgeDestroyed === true, 'Bridge destroyed in alternate timeline');

  // Rewind to pre-raid checkpoint
  TimelineSystem.restoreCheckpoint(preRaidCpId);
  assert(useWorldStore.getState().entities[rowanKey!].health === 100, 'Timeline rewind successfully restored Rowan HP to 100');
  assert(useWorldStore.getState().bridgeDestroyed === false, 'Timeline rewind successfully restored intact Bridge');

  console.log('\n====================================================');
  console.log('🎉 ALL MISSION 3 VERIFICATION TESTS PASSED!');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});

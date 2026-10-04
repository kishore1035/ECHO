import { send, wait, evaluate, screenshot, ws } from './cdp_helper.mjs';

try {
  const result = await evaluate(`(() => {
    const ws = window.useWorldStore;
    const ts = window.__ECHO_TIMELINE_STORE__ || window.useTimelineStore;
    if (!ws || !ts) return { error: 'Stores not found' };

    const state0 = ws.getState();
    const entities0 = state0.entities;
    
    // Find Rowan and another NPC
    const rowan = Object.values(entities0).find(e => e.name && e.name.toLowerCase().includes('rowan'));
    const secondNpc = Object.values(entities0).find(e => e.name && !e.name.toLowerCase().includes('rowan') && (e.category === 'npc' || e.type === 'npc' || e.health !== undefined));

    if (!rowan || !secondNpc) {
      return {
        error: 'NPCs not found',
        allEntities: Object.values(entities0).map(e => ({ id: e.id, name: e.name, type: e.type, cat: e.category }))
      };
    }

    const rowanId = rowan.id;
    const secondId = secondNpc.id;

    // Record pre-checkpoint state
    const beforeRowan = { health: rowan.health, position: { ...rowan.position } };
    const beforeSecond = { health: secondNpc.health, position: { ...secondNpc.position } };
    const beforePlayer = { position: { ...state0.player.position } };

    // 1. Create Checkpoint
    const cpId = ts.getState().createCheckpoint({
      name: 'QA Priority 6 Checkpoint',
      description: 'Restoration test of Rowan, second NPC, and Player',
      significance: 'command'
    });

    // 2. Change world/NPC state
    state0.updateEntity(rowanId, {
      health: 12,
      position: { x: 55, y: 14, z: -33 }
    });
    state0.updateEntity(secondId, {
      health: 9,
      position: { x: -80, y: 5, z: 40 }
    });
    state0.updatePlayer({
      position: { x: 99, y: 20, z: 99 }
    });

    const mutatedRowan = { ...ws.getState().entities[rowanId] };
    const mutatedSecond = { ...ws.getState().entities[secondId] };
    const mutatedPlayer = { ...ws.getState().player };

    // 3. Rewind / Restore
    const restoreSuccess = ts.getState().restoreCheckpoint(cpId);

    // 4. Inspect restored state
    const restoredEntities = ws.getState().entities;
    const restoredRowan = restoredEntities[rowanId];
    const restoredSecond = restoredEntities[secondId];
    const restoredPlayer = ws.getState().player;

    const rowanMatches = (
      restoredRowan.health === beforeRowan.health &&
      restoredRowan.position.x === beforeRowan.position.x &&
      restoredRowan.position.z === beforeRowan.position.z
    );

    const secondMatches = (
      restoredSecond.health === beforeSecond.health &&
      restoredSecond.position.x === beforeSecond.position.x &&
      restoredSecond.position.z === beforeSecond.position.z
    );

    const playerMatches = (
      restoredPlayer.position.x === beforePlayer.position.x &&
      restoredPlayer.position.z === beforePlayer.position.z
    );

    return {
      cpId,
      restoreSuccess,
      rowan: {
        id: rowanId,
        name: rowan.name,
        before: beforeRowan,
        mutated: { health: mutatedRowan.health, position: mutatedRowan.position },
        restored: { health: restoredRowan.health, position: restoredRowan.position },
        matches: rowanMatches
      },
      secondNpc: {
        id: secondId,
        name: secondNpc.name,
        before: beforeSecond,
        mutated: { health: mutatedSecond.health, position: mutatedSecond.position },
        restored: { health: restoredSecond.health, position: restoredSecond.position },
        matches: secondMatches
      },
      player: {
        before: beforePlayer.position,
        mutated: mutatedPlayer.position,
        restored: restoredPlayer.position,
        matches: playerMatches
      },
      transitionText: ts.getState().transitionText,
      isTransitioning: ts.getState().isTransitioning
    };
  })()`);

  console.log('Result:', JSON.stringify(result, null, 2));
  await wait(800);
  await screenshot('priority6_isolated_restoration_verified');
} finally {
  ws.close();
}

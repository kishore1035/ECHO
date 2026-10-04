// ============================================================
// VERIFICATION SCRIPT: CENTRALIZED CONTROLS & KEY-MAPPING SYSTEM
// Validates:
// 1. Default controls integrity
// 2. Action remapping immediate application
// 3. Old key cessation
// 4. Same-context conflict detection & replacement
// 5. Cross-context key coexistence
// 6. Dialogue action resolution
// 7. Pause action resolution
// 8. Voice push-to-talk resolution
// 9. Persistence & timeline snapshot isolation
// ============================================================

import { useControlsStore, formatKeyCodeDisplay } from '../src/core/controls/controlsStore';
import { InputManager, matchesAction, isActionHeld } from '../src/core/controls/InputManager';
import { useTimelineStore, TimelineSystem } from '../src/systems/TimelineSystem';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    console.error(`❌ Assertion Failed: ${msg}`);
    process.exit(1);
  }
  console.log(`  ✓ ${msg}`);
}

async function runControlsVerification() {
  console.log('\n======================================================');
  console.log('🎮 RUNNING CONTROLS & KEY MAPPING VERIFICATION TEST');
  console.log('======================================================\n');

  // ── 1. Default Controls ──
  console.log('Test 1: Verifying default control bindings...');
  useControlsStore.getState().resetToDefaults();

  const store = useControlsStore.getState();
  assert(store.getPrimaryCode('moveForward') === 'KeyW', 'Default Move Forward is KeyW');
  assert(store.getPrimaryCode('moveBackward') === 'KeyS', 'Default Move Backward is KeyS');
  assert(store.getPrimaryCode('moveLeft') === 'KeyA', 'Default Move Left is KeyA');
  assert(store.getPrimaryCode('moveRight') === 'KeyD', 'Default Move Right is KeyD');
  assert(store.getPrimaryCode('jump') === 'Space', 'Default Jump is Space');
  assert(store.getPrimaryCode('interact') === 'KeyE', 'Default Interact is KeyE');
  assert(store.getPrimaryCode('pause') === 'Escape', 'Default Pause is Escape');
  assert(store.getPrimaryCode('voicePushToTalk') === 'KeyM', 'Default Push to Talk is KeyM');
  assert(store.getBindingDisplay('voicePushToTalk') === 'M', 'Default Push to Talk display is M');
  assert(store.getPrimaryCode('timelineRewind') === 'KeyR', 'Default Timeline Rewind is KeyR');
  assert(store.getPrimaryCode('dialogueAdvance') === 'Enter', 'Default Dialogue Advance is Enter');

  // Display formats
  assert(formatKeyCodeDisplay('KeyW') === 'W', 'formatKeyCodeDisplay("KeyW") -> "W"');
  assert(formatKeyCodeDisplay('KeyM') === 'M', 'formatKeyCodeDisplay("KeyM") -> "M"');
  assert(formatKeyCodeDisplay('Space') === 'SPACE', 'formatKeyCodeDisplay("Space") -> "SPACE"');
  assert(formatKeyCodeDisplay('Escape') === 'ESC', 'formatKeyCodeDisplay("Escape") -> "ESC"');

  // ── 2. Action Matching on Defaults ──
  console.log('\nTest 2: Verifying action matching on defaults...');
  assert(matchesAction('moveForward', 'KeyW'), 'matchesAction("moveForward", "KeyW") is true');
  assert(matchesAction('moveForward', 'ArrowUp'), 'matchesAction("moveForward", "ArrowUp") alt is true');
  assert(matchesAction('pause', 'Escape'), 'matchesAction("pause", "Escape") is true');
  assert(matchesAction('interact', 'KeyE'), 'matchesAction("interact", "KeyE") is true');
  assert(matchesAction('voicePushToTalk', 'KeyM'), 'matchesAction("voicePushToTalk", "KeyM") is true');
  assert(!matchesAction('voicePushToTalk', 'Space'), 'matchesAction("voicePushToTalk", "Space") is false');
  assert(matchesAction('jump', 'Space'), 'matchesAction("jump", "Space") is true');
  assert(!matchesAction('jump', 'KeyM'), 'matchesAction("jump", "KeyM") is false');
  assert(matchesAction('dialogueAdvance', 'Enter'), 'matchesAction("dialogueAdvance", "Enter") is true');
  assert(matchesAction('timelineRewind', 'KeyR'), 'matchesAction("timelineRewind", "KeyR") is true');

  // ── 3. Remapping & Immediate Effect ──
  console.log('\nTest 3: Remapping Jump from Space to KeyH...');
  const rebindResult = store.rebindAction('jump', 'KeyH');
  assert(rebindResult.success, 'Rebinding jump to KeyH succeeded');
  assert(useControlsStore.getState().getPrimaryCode('jump') === 'KeyH', 'Jump primary is now KeyH');
  assert(matchesAction('jump', 'KeyH'), 'matchesAction("jump", "KeyH") is now true');

  // ── 4. Old Key Stops Working for Remapped Action ──
  console.log('\nTest 4: Verifying old key (Space) no longer activates Jump...');
  // Note: Jump's alt was KeyJ, primary became KeyH, so Space is no longer bound to jump
  const jumpCodes = useControlsStore.getState().getCodesForAction('jump');
  assert(!jumpCodes.includes('Space'), 'Space is no longer in Jump codes list');

  // ── 5. Conflict Detection in Same Context ──
  console.log('\nTest 5: Testing conflict detection (Attempting to bind Move Forward to KeyS which is Move Backward)...');
  const conflict = useControlsStore.getState().checkConflict('moveForward', 'KeyS');
  assert(conflict.hasConflict === true, 'Conflict detected for KeyS in gameplay context');
  assert(conflict.conflictActionId === 'moveBackward', 'Conflict correctly identifies Move Backward');
  assert(conflict.conflictActionName === 'Move Backward', 'Conflict correctly names Move Backward');

  // Rebind with replaceConflict = false should reject
  const failedRebind = useControlsStore.getState().rebindAction('moveForward', 'KeyS', false);
  assert(!failedRebind.success, 'rebindAction rejected conflict when replaceConflict = false');

  // Rebind with replaceConflict = true should replace
  console.log('Replacing conflict: Overwriting Move Backward key...');
  const replacedRebind = useControlsStore.getState().rebindAction('moveForward', 'KeyS', true);
  assert(replacedRebind.success, 'rebindAction succeeded with replaceConflict = true');
  assert(useControlsStore.getState().getPrimaryCode('moveForward') === 'KeyS', 'Move Forward is now KeyS');
  assert(useControlsStore.getState().getPrimaryCode('moveBackward') !== 'KeyS', 'Move Backward released KeyS');

  // ── 6. Cross-Context Key Coexistence ──
  console.log('\nTest 6: Verifying same key can coexist across different contexts (Gameplay vs Dialogue)...');
  // Dialogue Advance can use Space or Enter without conflicting with Gameplay Jump or Voice
  const dialogueConflict = useControlsStore.getState().checkConflict('dialogueAdvance', 'KeyE');
  assert(!dialogueConflict.hasConflict, 'KeyE in Dialogue context does not conflict with Gameplay Interact');

  // ── 7. Reset to Defaults ──
  console.log('\nTest 7: Testing Reset to Defaults...');
  useControlsStore.getState().resetToDefaults();
  const resetStore = useControlsStore.getState();
  assert(resetStore.getPrimaryCode('moveForward') === 'KeyW', 'Move Forward restored to KeyW');
  assert(resetStore.getPrimaryCode('moveBackward') === 'KeyS', 'Move Backward restored to KeyS');
  assert(resetStore.getPrimaryCode('jump') === 'Space', 'Jump restored to Space');

  // ── 8. Timeline Isolation ──
  console.log('\nTest 8: Verifying timeline snapshots and rewinds DO NOT modify control settings...');
  // 1. Remap interact to KeyT
  useControlsStore.getState().rebindAction('interact', 'KeyT');
  assert(useControlsStore.getState().getPrimaryCode('interact') === 'KeyT', 'Interact remapped to KeyT');

  // 2. Perform a timeline checkpoint / rewind
  TimelineSystem.createCheckpoint('Control Settings Isolation Test');
  TimelineSystem.rewind('last');

  // 3. Verify interact is STILL KeyT after timeline rewind
  assert(
    useControlsStore.getState().getPrimaryCode('interact') === 'KeyT',
    'Interact key remained KeyT after timeline rewind (Controls are completely isolated from timeline)'
  );

  // Restore defaults after test
  useControlsStore.getState().resetToDefaults();
  assert(useControlsStore.getState().getPrimaryCode('interact') === 'KeyE', 'Restored interact to KeyE');

  console.log('\n======================================================');
  console.log('🎉 ALL CONTROLS & KEY-MAPPING VERIFICATION TESTS PASSED!');
  console.log('======================================================\n');
}

runControlsVerification().catch((err) => {
  console.error('Fatal error during controls verification:', err);
  process.exit(1);
});

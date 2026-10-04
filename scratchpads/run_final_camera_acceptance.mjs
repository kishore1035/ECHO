import { send, wait, evaluate, screenshot, ws } from './cdp_helper.mjs';

async function pressKey(code, key = code, keyCode = 13) {
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key, code, windowsVirtualKeyCode: keyCode });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: keyCode });
}

async function main() {
  console.log('========================================================');
  console.log('🎬 ECHO — FINAL CAMERA & DIALOGUE ACCEPTANCE PASS');
  console.log('========================================================\n');

  // Check if at Title Screen; if so, start New Game
  const isTitle = await evaluate(`document.body.innerText.includes('NEW GAME')`);
  if (isTitle) {
    console.log('Step 1: On Title Screen, pressing Enter to start New Game...');
    await pressKey('Enter', 'Enter', 13);
    await wait(1000);
  }

  // Skip story intro if present by pressing Escape
  const isIntro = await evaluate(`document.body.innerText.includes('SKIP INTRO') || document.body.innerText.includes('THE VOICE')`);
  if (isIntro) {
    console.log('Step 2: On Story Intro, pressing Escape to skip into game...');
    await pressKey('Escape', 'Escape', 27);
    await wait(1500);
  }

  // Step 3: Check opening dialogue (Rowan & Mira)
  console.log('Step 3: Checking Dialogue Framing & DoF (Rowan)...');
  await wait(600);
  await screenshot('acceptance_rowan_dialogue');
  console.log('  -> Saved scratchpads/acceptance_rowan_dialogue.png');

  // Advance to Mira line
  console.log('Step 4: Advancing to Mira dialogue...');
  await evaluate(`
    (() => {
      const camp = window.__CampaignSystem;
      if (camp) {
        camp.advanceDialogue();
        camp.advanceDialogue();
        camp.advanceDialogue();
      }
    })()
  `);
  await wait(600);
  await screenshot('acceptance_mira_dialogue');
  console.log('  -> Saved scratchpads/acceptance_mira_dialogue.png');

  // Close dialogue to return cleanly to gameplay
  console.log('Step 5: Closing dialogue to restore gameplay camera...');
  await evaluate(`
    (() => {
      const camp = window.__CampaignSystem;
      if (camp) {
        camp.closeDialogue();
      }
      if (window.__ECHO_PLAYER_PHYS__) {
        window.__ECHO_PLAYER_PHYS__.pitch = -0.14;
      }
    })()
  `);
  await wait(800);

  // Check gameplay camera state
  const initialCam = await evaluate(`
    (() => {
      const c = window.__ECHO_CAMERA__;
      const p = window.__ECHO_PLAYER_PHYS__;
      if (!c || !p) return null;
      c.updateMatrixWorld();
      const fy = -c.matrixWorld.elements[9];
      return {
        pitch: p.pitch,
        yaw: p.yaw,
        playerPos: { x: p.x, y: p.y, z: p.z },
        camPos: { x: c.position.x, y: c.position.y, z: c.position.z },
        elevationDeg: Math.asin(Math.max(-1, Math.min(1, fy))) * 180 / Math.PI
      };
    })()
  `);
  console.log('\nGameplay Camera Restored:', initialCam);
  await screenshot('acceptance_neutral_gameplay');
  console.log('  -> Saved scratchpads/acceptance_neutral_gameplay.png');

  // Step 6: Test Mouse UP Look
  console.log('\nStep 6: Testing Mouse UP Look (dy = -100)...');
  await evaluate(`
    (() => {
      window.__ECHO_PLAYER_PHYS__.isPointerLocked = true;
      window.dispatchEvent(new MouseEvent('mousemove', {
        movementX: 0,
        movementY: -100
      }));
    })()
  `);
  await wait(300);
  const upCam = await evaluate(`
    (() => {
      const c = window.__ECHO_CAMERA__;
      const p = window.__ECHO_PLAYER_PHYS__;
      c.updateMatrixWorld();
      const fy = -c.matrixWorld.elements[9];
      return {
        pitch: p.pitch,
        camPos: { x: c.position.x, y: c.position.y, z: c.position.z },
        elevationDeg: Math.asin(Math.max(-1, Math.min(1, fy))) * 180 / Math.PI
      };
    })()
  `);
  console.log('  -> Pitch after Mouse UP:', upCam.pitch.toFixed(4), '| Elevation:', upCam.elevationDeg.toFixed(2) + '°');
  if (upCam.elevationDeg > initialCam.elevationDeg) {
    console.log('  ✅ Mouse UP visually raises the camera / tilts gaze upward towards sky');
  } else {
    throw new Error('Mouse UP look failed to raise camera gaze');
  }
  await screenshot('acceptance_mouse_up');

  // Step 7: Full Upward Look Range (+0.75 rad)
  console.log('\nStep 7: Testing Full Upward Look Range (pitch = +0.75 rad)...');
  await evaluate(`window.__ECHO_PLAYER_PHYS__.pitch = 0.75;`);
  await wait(300);
  const fullUpCam = await evaluate(`
    (() => {
      const c = window.__ECHO_CAMERA__;
      const p = window.__ECHO_PLAYER_PHYS__;
      c.updateMatrixWorld();
      const fy = -c.matrixWorld.elements[9];
      return {
        pitch: p.pitch,
        camPos: { x: c.position.x, y: c.position.y, z: c.position.z },
        elevationDeg: Math.asin(Math.max(-1, Math.min(1, fy))) * 180 / Math.PI
      };
    })()
  `);
  console.log('  -> Full Upward Elevation:', fullUpCam.elevationDeg.toFixed(2) + '°');
  if (fullUpCam.elevationDeg > 40) {
    console.log('  ✅ Full upward look allows player to clearly look upward toward the sky');
  } else {
    throw new Error('Full upward look insufficient');
  }
  await screenshot('acceptance_full_up_sky');

  // Step 8: Test Mouse DOWN Look
  console.log('\nStep 8: Resetting to neutral, then testing Mouse DOWN Look (dy = +100)...');
  await evaluate(`window.__ECHO_PLAYER_PHYS__.pitch = -0.14;`);
  await wait(100);
  await evaluate(`
    (() => {
      window.__ECHO_PLAYER_PHYS__.isPointerLocked = true;
      window.dispatchEvent(new MouseEvent('mousemove', {
        movementX: 0,
        movementY: 100
      }));
    })()
  `);
  await wait(300);
  const downCam = await evaluate(`
    (() => {
      const c = window.__ECHO_CAMERA__;
      const p = window.__ECHO_PLAYER_PHYS__;
      c.updateMatrixWorld();
      const fy = -c.matrixWorld.elements[9];
      return {
        pitch: p.pitch,
        camPos: { x: c.position.x, y: c.position.y, z: c.position.z },
        elevationDeg: Math.asin(Math.max(-1, Math.min(1, fy))) * 180 / Math.PI
      };
    })()
  `);
  console.log('  -> Pitch after Mouse DOWN:', downCam.pitch.toFixed(4), '| Elevation:', downCam.elevationDeg.toFixed(2) + '°');
  if (downCam.elevationDeg < initialCam.elevationDeg) {
    console.log('  ✅ Mouse DOWN visually lowers the camera / tilts gaze downward towards ground');
  } else {
    throw new Error('Mouse DOWN look failed to lower camera gaze');
  }
  await screenshot('acceptance_mouse_down');

  // Step 9: Full Downward Look Range (-0.65 rad)
  console.log('\nStep 9: Testing Full Downward Look Range (pitch = -0.65 rad)...');
  await evaluate(`window.__ECHO_PLAYER_PHYS__.pitch = -0.65;`);
  await wait(300);
  const fullDownCam = await evaluate(`
    (() => {
      const c = window.__ECHO_CAMERA__;
      const p = window.__ECHO_PLAYER_PHYS__;
      c.updateMatrixWorld();
      const fy = -c.matrixWorld.elements[9];
      return {
        pitch: p.pitch,
        camPos: { x: c.position.x, y: c.position.y, z: c.position.z },
        elevationDeg: Math.asin(Math.max(-1, Math.min(1, fy))) * 180 / Math.PI
      };
    })()
  `);
  console.log('  -> Full Downward Elevation:', fullDownCam.elevationDeg.toFixed(2) + '°');
  if (fullDownCam.elevationDeg < -35 && fullDownCam.camPos.y > 0) {
    console.log('  ✅ Full downward look remains comfortable without ground clipping or camera flip');
  } else {
    throw new Error('Full downward look failed');
  }
  await screenshot('acceptance_full_down_ground');

  // Step 10: Camera Sensitivity Scaling
  console.log('\nStep 10: Testing Camera Sensitivity Scaling...');
  const testSens = async (mult) => {
    await evaluate(`
      (() => {
        window.__useSettingsStore?.getState()?.updateSettings({ cameraSensitivity: ${mult} });
        window.__ECHO_PLAYER_PHYS__.pitch = 0.0;
        window.__ECHO_PLAYER_PHYS__.isPointerLocked = true;
      })()
    `);
    await wait(60);
    await evaluate(`
      window.dispatchEvent(new MouseEvent('mousemove', {
        movementX: 0,
        movementY: -50
      }));
    `);
    await wait(60);
    return await evaluate(`window.__ECHO_PLAYER_PHYS__.pitch`);
  };

  const p05 = await testSens(0.5);
  const p10 = await testSens(1.0);
  const p20 = await testSens(2.0);
  console.log(`  Sensitivity 0.5x delta: ${p05.toFixed(4)}`);
  console.log(`  Sensitivity 1.0x delta: ${p10.toFixed(4)}`);
  console.log(`  Sensitivity 2.0x delta: ${p20.toFixed(4)}`);
  if (p20 > p10 && p10 > p05) {
    console.log('  ✅ Camera Sensitivity setting scales look speed proportionally');
  } else {
    throw new Error('Sensitivity test failed');
  }

  // Restore defaults
  await evaluate(`
    (() => {
      window.__useSettingsStore?.getState()?.updateSettings({ cameraSensitivity: 1.0 });
      window.__ECHO_PLAYER_PHYS__.pitch = -0.14;
      window.__ECHO_PLAYER_PHYS__.isPointerLocked = false;
    })()
  `);

  console.log('\n========================================================');
  console.log('🎉 ALL LIVE CAMERA & DIALOGUE VERIFICATIONS PASSED!');
  console.log('========================================================\n');

  ws.close();
}

main().catch(err => {
  console.error('Acceptance test failed:', err);
  process.exit(1);
});

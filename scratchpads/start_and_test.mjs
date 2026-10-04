import { send, wait, evaluate, screenshot, ws } from './cdp_helper.mjs';

async function pressKey(code, key = code, keyCode = 13) {
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key, code, windowsVirtualKeyCode: keyCode });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: keyCode });
}

async function main() {
  console.log('1. Starting New Game from Title Screen...');
  await pressKey('Enter', 'Enter', 13);
  await wait(800);

  // Skip story intro if present
  console.log('2. Skipping Story Intro if present...');
  for (let i = 0; i < 4; i++) {
    await pressKey('Space', ' ', 32);
    await wait(300);
  }

  // Advance opening dialogues (Rowan & Mira)
  console.log('3. Advancing opening dialogues to reach gameplay...');
  for (let i = 0; i < 16; i++) {
    await pressKey('Space', ' ', 32);
    await wait(400);
  }

  // Wait 3s for mission banner to fade
  console.log('4. Waiting for mission banner...');
  await wait(3000);

  // Check state
  const state = await evaluate(`
    (() => {
      const c = window.__ECHO_CAMERA__;
      const p = window.__ECHO_PLAYER_PHYS__;
      if (!c || !p) return null;
      c.updateMatrixWorld();
      const e = c.matrixWorld.elements;
      const fy = -e[9];
      return {
        pitch: p.pitch,
        yaw: p.yaw,
        playerPos: { x: p.x, y: p.y, z: p.z },
        camPos: { x: c.position.x, y: c.position.y, z: c.position.z },
        forwardY: fy,
        elevationDeg: Math.asin(Math.max(-1, Math.min(1, fy))) * 180 / Math.PI
      };
    })()
  `);
  console.log('Gameplay Camera State:', state);

  // Take neutral screenshot
  await screenshot('verify_live_neutral');
  console.log('Saved scratchpads/verify_live_neutral.png');

  // Test Mouse UP via dispatching mousemove event with negative movementY
  console.log('\n--- Testing Mouse UP (dy = -120) ---');
  await evaluate(`
    (() => {
      window.__ECHO_PLAYER_PHYS__.isPointerLocked = true;
      window.dispatchEvent(new MouseEvent('mousemove', {
        movementX: 0,
        movementY: -120
      }));
    })()
  `);
  await wait(300);
  const upState = await evaluate(`
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
  console.log('After Mouse UP State:', upState);
  await screenshot('verify_live_mouse_up');

  // Test Full Upward Look (+0.75 rad)
  console.log('\n--- Testing Full Upward Look (+0.75 rad) ---');
  await evaluate(`window.__ECHO_PLAYER_PHYS__.pitch = 0.75;`);
  await wait(300);
  const fullUpState = await evaluate(`
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
  console.log('Full Upward State:', fullUpState);
  await screenshot('verify_live_full_up');

  // Test Mouse DOWN via dispatching mousemove event with positive movementY
  console.log('\n--- Resetting to neutral, then testing Mouse DOWN (dy = +120) ---');
  await evaluate(`window.__ECHO_PLAYER_PHYS__.pitch = -0.14;`);
  await wait(100);
  await evaluate(`
    (() => {
      window.__ECHO_PLAYER_PHYS__.isPointerLocked = true;
      window.dispatchEvent(new MouseEvent('mousemove', {
        movementX: 0,
        movementY: 120
      }));
    })()
  `);
  await wait(300);
  const downState = await evaluate(`
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
  console.log('After Mouse DOWN State:', downState);
  await screenshot('verify_live_mouse_down');

  // Test Full Downward Look (-0.65 rad)
  console.log('\n--- Testing Full Downward Look (-0.65 rad) ---');
  await evaluate(`window.__ECHO_PLAYER_PHYS__.pitch = -0.65;`);
  await wait(300);
  const fullDownState = await evaluate(`
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
  console.log('Full Downward State:', fullDownState);
  await screenshot('verify_live_full_down');

  // Reset to neutral
  await evaluate(`
    window.__ECHO_PLAYER_PHYS__.pitch = -0.14;
    window.__ECHO_PLAYER_PHYS__.isPointerLocked = false;
  `);

  ws.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

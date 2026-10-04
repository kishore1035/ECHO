import { send, wait, evaluate, screenshot, ws } from './cdp_helper.mjs';

async function main() {
  console.log('Testing camera look direction in running game...');

  const getCamState = () => evaluate(`
    (() => {
      const p = window.__ECHO_PLAYER_PHYS__;
      const c = window.__ECHO_CAMERA__;
      const f = { x: 0, y: 0, z: 0 };
      // Forward vector from rotation matrix
      // In Three.js: forward is -Z in local space
      c.updateMatrixWorld();
      const e = c.matrixWorld.elements;
      // -Z column is (-e[8], -e[9], -e[10])
      f.x = -e[8];
      f.y = -e[9];
      f.z = -e[10];
      return {
        pitch: p.pitch,
        yaw: p.yaw,
        playerPos: { x: p.x, y: p.y, z: p.z },
        camPos: { x: c.position.x, y: c.position.y, z: c.position.z },
        forward: f, // Y > 0 means pointing UP, Y < 0 means pointing DOWN
        elevationDeg: Math.asin(f.y) * 180 / Math.PI
      };
    })()
  `);

  console.log('Initial State:', await getCamState());

  // 1. Test setting pitch directly to inspect what angles correspond to what views
  console.log('\n--- Setting pitch to -0.35 (current minimum) ---');
  await evaluate(`window.__ECHO_PLAYER_PHYS__.pitch = -0.35;`);
  await wait(200);
  const minState = await getCamState();
  console.log('Pitch -0.35 State:', minState);
  await screenshot('view_pitch_neg_035');

  console.log('\n--- Setting pitch to +0.28 (default) ---');
  await evaluate(`window.__ECHO_PLAYER_PHYS__.pitch = 0.28;`);
  await wait(200);
  const defState = await getCamState();
  console.log('Pitch +0.28 State:', defState);
  await screenshot('view_pitch_pos_028');

  console.log('\n--- Setting pitch to +1.20 (current maximum) ---');
  await evaluate(`window.__ECHO_PLAYER_PHYS__.pitch = 1.20;`);
  await wait(200);
  const maxState = await getCamState();
  console.log('Pitch +1.20 State:', maxState);
  await screenshot('view_pitch_pos_120');

  // Now test mouse event dispatching
  console.log('\n--- Resetting pitch to 0.28 and simulating mouse UP event ---');
  await evaluate(`window.__ECHO_PLAYER_PHYS__.pitch = 0.28;`);
  await wait(100);

  // Dispatch mousemove with dy = -100 (Mouse UP)
  // In pointer lock:
  await evaluate(`
    (() => {
      window.__ECHO_PLAYER_PHYS__.isPointerLocked = true;
      window.dispatchEvent(new MouseEvent('mousemove', {
        movementX: 0,
        movementY: -100
      }));
    })()
  `);
  await wait(200);
  const mouseUpState = await getCamState();
  console.log('After Mouse UP (movementY = -100):', mouseUpState);

  // Dispatch mousemove with dy = +100 (Mouse DOWN)
  await evaluate(`
    (() => {
      window.__ECHO_PLAYER_PHYS__.pitch = 0.28;
      window.__ECHO_PLAYER_PHYS__.isPointerLocked = true;
      window.dispatchEvent(new MouseEvent('mousemove', {
        movementX: 0,
        movementY: +100
      }));
    })()
  `);
  await wait(200);
  const mouseDownState = await getCamState();
  console.log('After Mouse DOWN (movementY = +100):', mouseDownState);

  // Reset pointer locked
  await evaluate(`window.__ECHO_PLAYER_PHYS__.isPointerLocked = false;`);

  ws.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

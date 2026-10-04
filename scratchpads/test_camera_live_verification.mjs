import { send, wait, evaluate, screenshot, ws } from './cdp_helper.mjs';

async function main() {
  console.log('--- TESTING UPDATED CAMERA SYSTEM IN LIVE RUNNING GAME ---');

  const getCamState = () => evaluate(`
    (() => {
      const p = window.__ECHO_PLAYER_PHYS__;
      const c = window.__ECHO_CAMERA__;
      if (!p || !c) return { error: 'No camera or playerPhys' };
      c.updateMatrixWorld();
      const e = c.matrixWorld.elements;
      const fx = -e[8];
      const fy = -e[9];
      const fz = -e[10];
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

  // 1. Neutral view
  console.log('1. Setting neutral pitch (-0.14)...');
  await evaluate(`window.__ECHO_PLAYER_PHYS__.pitch = -0.14;`);
  await wait(300);
  const neutralState = await getCamState();
  console.log('Neutral State:', neutralState);
  await screenshot('cam_live_neutral');

  // 2. Simulate mouse UP: dy = -150
  console.log('\n2. Moving mouse UP (dy = -150, should pitch UP / elevate gaze)...');
  await evaluate(`
    (() => {
      window.__ECHO_PLAYER_PHYS__.isPointerLocked = true;
      window.dispatchEvent(new MouseEvent('mousemove', {
        movementX: 0,
        movementY: -150
      }));
    })()
  `);
  await wait(300);
  const mouseUpState = await getCamState();
  console.log('After Mouse UP State:', mouseUpState);
  await screenshot('cam_live_mouse_up');

  // 3. Move mouse to maximum UP (+0.75 rad)
  console.log('\n3. Full upward look (pitch = +0.75 rad, looking into sky)...');
  await evaluate(`window.__ECHO_PLAYER_PHYS__.pitch = 0.75;`);
  await wait(300);
  const fullUpState = await getCamState();
  console.log('Full Upward State:', fullUpState);
  await screenshot('cam_live_full_up');

  // 4. Simulate mouse DOWN from neutral: dy = +150
  console.log('\n4. Resetting to neutral, then moving mouse DOWN (dy = +150, should pitch DOWN)...');
  await evaluate(`window.__ECHO_PLAYER_PHYS__.pitch = -0.14;`);
  await wait(100);
  await evaluate(`
    (() => {
      window.__ECHO_PLAYER_PHYS__.isPointerLocked = true;
      window.dispatchEvent(new MouseEvent('mousemove', {
        movementX: 0,
        movementY: 150
      }));
    })()
  `);
  await wait(300);
  const mouseDownState = await getCamState();
  console.log('After Mouse DOWN State:', mouseDownState);
  await screenshot('cam_live_mouse_down');

  // 5. Full downward look (pitch = -0.65 rad)
  console.log('\n5. Full downward look (pitch = -0.65 rad, looking at ground)...');
  await evaluate(`window.__ECHO_PLAYER_PHYS__.pitch = -0.65;`);
  await wait(300);
  const fullDownState = await getCamState();
  console.log('Full Downward State:', fullDownState);
  await screenshot('cam_live_full_down');

  // 6. Reset pointer lock
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

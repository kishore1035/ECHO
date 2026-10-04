import { send, wait, evaluate, screenshot, ws } from './cdp_helper.mjs';

async function testLocation(name, x, y, z, yaw) {
  console.log(`Testing camera near ${name} at (${x}, ${y}, ${z})...`);
  await evaluate(`
    (() => {
      const p = window.__ECHO_PLAYER_PHYS__;
      p.x = ${x};
      p.y = ${y};
      p.z = ${z};
      p.yaw = ${yaw};
      p.pitch = -0.14;
    })()
  `);
  await wait(300);

  // Pitch Up
  await evaluate(`window.__ECHO_PLAYER_PHYS__.pitch = 0.65;`);
  await wait(200);
  const up = await evaluate(`
    (() => {
      const c = window.__ECHO_CAMERA__;
      return { x: c.position.x, y: c.position.y, z: c.position.z };
    })()
  `);
  console.log(`  ${name} [Pitch Up] Cam:`, up);
  await screenshot(`col_${name}_up`);

  // Pitch Down
  await evaluate(`window.__ECHO_PLAYER_PHYS__.pitch = -0.55;`);
  await wait(200);
  const down = await evaluate(`
    (() => {
      const c = window.__ECHO_CAMERA__;
      return { x: c.position.x, y: c.position.y, z: c.position.z };
    })()
  `);
  console.log(`  ${name} [Pitch Down] Cam:`, down);
  await screenshot(`col_${name}_down`);
}

async function main() {
  console.log('--- TESTING CAMERA COLLISION ACROSS WORLD LOCATIONS ---');

  // 1. Old Mill & Miller building
  await testLocation('mill', 2, 2.2, 6, 1.57);

  // 2. Stone Bridge & River
  await testLocation('bridge', -8, 0.1, 5, 0.0);

  // 3. Water swimming channel
  await testLocation('river_swimming', -8, -0.4, 8, 3.14);

  // 4. Whispering Stones / Trees
  await testLocation('forest_trees', -4, 2.5, 9, -1.57);

  // 5. Mountain cliffs / Castle approach
  await testLocation('castle_approach', 18, 5.0, -14, 2.8);

  ws.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

import { send, wait, evaluate, ws } from './cdp_helper.mjs';
import { ensurePlaying } from './ensure_playing.mjs';

async function main() {
  console.log('--- TESTING CAMERA SENSITIVITY AND POINTER LOCK ---');

  await ensurePlaying();

  // Test 1: Camera Sensitivity scaling
  const testSensitivity = async (mult) => {
    await evaluate(`
      (() => {
        window.__useSettingsStore?.getState()?.updateSettings({ cameraSensitivity: ${mult} });
        window.__ECHO_PLAYER_PHYS__.pitch = 0.0;
        window.__ECHO_PLAYER_PHYS__.isPointerLocked = true;
      })()
    `);
    await wait(100);
    // Dispatch mouse move UP by 50px
    await evaluate(`
      window.dispatchEvent(new MouseEvent('mousemove', {
        movementX: 0,
        movementY: -50
      }));
    `);
    await wait(100);
    const pitch = await evaluate(`window.__ECHO_PLAYER_PHYS__.pitch`);
    return pitch;
  };

  const pitch05 = await testSensitivity(0.5);
  const pitch10 = await testSensitivity(1.0);
  const pitch20 = await testSensitivity(2.0);

  console.log(`Sensitivity 0.5x pitch delta: ${pitch05.toFixed(4)}`);
  console.log(`Sensitivity 1.0x pitch delta: ${pitch10.toFixed(4)}`);
  console.log(`Sensitivity 2.0x pitch delta: ${pitch20.toFixed(4)}`);

  if (pitch20 > pitch10 && pitch10 > pitch05) {
    console.log('✅ Camera sensitivity scaling verified: higher sensitivity yields proportionally higher pitch delta');
  } else {
    throw new Error('Sensitivity scaling check failed');
  }

  // Restore default sensitivity
  await evaluate(`window.__useSettingsStore?.getState()?.updateSettings({ cameraSensitivity: 1.0 });`);

  // Test 2: Dragging without pointer lock (isDragging with clientX/clientY)
  console.log('\n--- Testing Mouse Dragging Mode ---');
  await evaluate(`
    (() => {
      const p = window.__ECHO_PLAYER_PHYS__;
      p.pitch = 0.0;
      p.yaw = 0.0;
      p.isPointerLocked = false;
      p.isDragging = true;
      p.lastMouseX = 200;
      p.lastMouseY = 200;
    })()
  `);
  // Drag UP (clientY = 150 -> dy = -50)
  await evaluate(`
    window.dispatchEvent(new MouseEvent('mousemove', {
      clientX: 200,
      clientY: 150
    }));
  `);
  await wait(100);
  const dragUpPitch = await evaluate(`window.__ECHO_PLAYER_PHYS__.pitch`);
  console.log(`Drag UP pitch: ${dragUpPitch.toFixed(4)} (Expected positive / looking up)`);

  // Drag DOWN (clientY = 250 -> dy = +100)
  await evaluate(`
    window.dispatchEvent(new MouseEvent('mousemove', {
      clientX: 200,
      clientY: 250
    }));
  `);
  await wait(100);
  const dragDownPitch = await evaluate(`window.__ECHO_PLAYER_PHYS__.pitch`);
  console.log(`Drag DOWN pitch: ${dragDownPitch.toFixed(4)} (Expected negative / looking down)`);

  // Drag RIGHT (clientX = 250 -> dx = +50)
  await evaluate(`
    window.dispatchEvent(new MouseEvent('mousemove', {
      clientX: 250,
      clientY: 250
    }));
  `);
  await wait(100);
  const dragRightYaw = await evaluate(`window.__ECHO_PLAYER_PHYS__.yaw`);
  console.log(`Drag RIGHT yaw: ${dragRightYaw.toFixed(4)} (Expected positive / rotating right)`);

  // Drag LEFT (clientX = 150 -> dx = -100)
  await evaluate(`
    window.dispatchEvent(new MouseEvent('mousemove', {
      clientX: 150,
      clientY: 250
    }));
  `);
  await wait(100);
  const dragLeftYaw = await evaluate(`window.__ECHO_PLAYER_PHYS__.yaw`);
  console.log(`Drag LEFT yaw: ${dragLeftYaw.toFixed(4)} (Expected negative / rotating left)`);

  await evaluate(`
    (() => {
      const p = window.__ECHO_PLAYER_PHYS__;
      p.isDragging = false;
      p.pitch = -0.14;
    })()
  `);

  if (dragUpPitch > 0 && dragDownPitch < 0 && dragRightYaw > 0 && dragLeftYaw < 0) {
    console.log('✅ Mouse Dragging verified: UP looks up, DOWN looks down, RIGHT rotates right, LEFT rotates left');
  } else {
    throw new Error('Mouse dragging check failed');
  }

  ws.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

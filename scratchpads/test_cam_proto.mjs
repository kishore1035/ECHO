import { send, wait, evaluate, screenshot, ws } from './cdp_helper.mjs';

async function testCameraMath() {
  console.log('Testing prototype camera pitch calculation live in running game...');

  // We can test by setting up the math in window and testing with simulated mouse moves
  const result = await evaluate(`
    (() => {
      const p = window.__ECHO_PLAYER_PHYS__;
      const c = window.__ECHO_CAMERA__;
      if (!p || !c) return { error: 'No playerPhys or camera' };

      // Test pitch math helper
      // Let pitch be elevation angle in radians:
      // pitch = 0: horizontal
      // pitch > 0: looking UP (towards sky)
      // pitch < 0: looking DOWN (towards ground)

      // Let's test pitch values:
      // Neutral: 0.0 (or -0.08 slight over shoulder)
      // Max Up: +0.72 rad (~41 deg up)
      // Max Down: -0.58 rad (~-33 deg down)
      return { ok: true, currentPitch: p.pitch, currentYaw: p.yaw };
    })()
  `);
  console.log('Result:', result);

  ws.close();
}

testCameraMath().catch(console.error);

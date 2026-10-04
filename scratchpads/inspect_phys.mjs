import { send, wait, evaluate, screenshot, ws } from './cdp_helper.mjs';

async function main() {
  const phys = await evaluate(`
    (() => {
      const p = window.__ECHO_PLAYER_PHYS__;
      const c = window.__ECHO_CAMERA__;
      return {
        hasPhys: !!p,
        pitch: p?.pitch,
        yaw: p?.yaw,
        pos: { x: p?.x, y: p?.y, z: p?.z },
        camPos: c?.position ? { x: c.position.x, y: c.position.y, z: c.position.z } : null
      };
    })()
  `);
  console.log('Player Phys & Camera:', phys);

  ws.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

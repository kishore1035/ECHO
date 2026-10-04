import { evaluate, ws } from './cdp_helper.mjs';

async function main() {
  const result = await evaluate(`
    (() => {
      const p = window.__ECHO_PLAYER_PHYS__;
      const initialPitch = p.pitch;
      p.isPointerLocked = true;
      window.dispatchEvent(new MouseEvent('mousemove', { movementX: 0, movementY: -50 }));
      const afterPitch = p.pitch;
      return {
        initialPitch,
        afterPitch,
        diff: afterPitch - initialPitch
      };
    })()
  `);
  console.log('Direct test:', result);
  ws.close();
}

main().catch(console.error);

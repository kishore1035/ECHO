import { send, wait, evaluate, screenshot, ws } from './cdp_helper.mjs';

async function main() {
  console.log('Testing current camera state...');

  // Check current view / game state
  const state = await evaluate(`
    (() => {
      const nav = window.__navState || {};
      const canvas = document.querySelector('canvas');
      return {
        hasCanvas: !!canvas,
        title: document.title,
        nav
      };
    })()
  `);
  console.log('State:', state);

  await screenshot('camera_initial');
  console.log('Saved scratchpads/camera_initial.png');

  ws.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

import { send, wait, evaluate, screenshot, ws } from './cdp_helper.mjs';

async function main() {
  console.log('Testing mouse move behavior in running game...');

  // Advance dialogue first: press Space
  console.log('Pressing Space to advance dialogue...');
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Space', code: 'Space', windowsVirtualKeyCode: 32 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Space', code: 'Space', windowsVirtualKeyCode: 32 });
  await wait(500);

  // Check if dialogue is still active
  let isDialogue = await evaluate(`!!window.__useCampaignStore?.getState?.()?.activeDialogue`);
  console.log('isDialogue after space:', isDialogue);

  // Let's get canvas bounding box
  const rect = await evaluate(`
    (() => {
      const c = document.querySelector('canvas');
      const r = c.getBoundingClientRect();
      return { x: r.x, y: r.y, width: r.width, height: r.height };
    })()
  `);
  console.log('Canvas rect:', rect);

  const cx = rect.x + rect.width / 2;
  const cy = rect.y + rect.height / 2;

  // Click on canvas to focus / drag or lock
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: cx, y: cy, button: 'left', clickCount: 1 });
  await wait(100);

  // Take screenshot after space
  await screenshot('after_space');

  // Let's check what window.__cameraSystem or navState has
  const camInfo1 = await evaluate(`
    (() => {
      return {
        nav: window.__navState || {},
      };
    })()
  `);
  console.log('Initial Cam info:', camInfo1);

  ws.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

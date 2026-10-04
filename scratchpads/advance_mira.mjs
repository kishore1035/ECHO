import { send, wait, evaluate, screenshot, ws } from './cdp_helper.mjs';

async function advanceDialogue() {
  for (let i = 0; i < 8; i++) {
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Space', code: 'Space', windowsVirtualKeyCode: 32 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Space', code: 'Space', windowsVirtualKeyCode: 32 });
    await wait(500);
  }
}

async function main() {
  console.log('Advancing through Mira dialogue...');
  await advanceDialogue();

  await screenshot('gameplay_live');
  console.log('Saved scratchpads/gameplay_live.png');

  ws.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

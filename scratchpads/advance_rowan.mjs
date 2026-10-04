import { send, wait, evaluate, screenshot, ws } from './cdp_helper.mjs';

async function advanceDialogue() {
  for (let i = 0; i < 6; i++) {
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Space', code: 'Space', windowsVirtualKeyCode: 32 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Space', code: 'Space', windowsVirtualKeyCode: 32 });
    await wait(600);
  }
}

async function main() {
  console.log('Advancing through Rowan dialogue...');
  await advanceDialogue();

  await screenshot('gameplay_after_rowan');
  console.log('Saved scratchpads/gameplay_after_rowan.png');

  ws.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

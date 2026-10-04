import { send, wait, evaluate, screenshot, ws } from './cdp_helper.mjs';

async function main() {
  console.log('Interacting with Mira ([E])...');
  // Dispatch KeyE
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'e', code: 'KeyE', windowsVirtualKeyCode: 69 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'e', code: 'KeyE', windowsVirtualKeyCode: 69 });
  await wait(800);

  const isDiag = await evaluate(`!!window.__useCampaignStore?.getState?.()?.activeDialogue`);
  console.log('Dialogue active:', isDiag);

  await screenshot('mira_dialogue_before_fix');
  console.log('Saved scratchpads/mira_dialogue_before_fix.png');

  ws.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

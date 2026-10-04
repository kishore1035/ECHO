import { send, wait, evaluate, screenshot, ws } from './cdp_helper.mjs';

async function main() {
  console.log('Interacting with NPC ([E])...');
  // Dispatch KeyE
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'e', code: 'KeyE', windowsVirtualKeyCode: 69 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'e', code: 'KeyE', windowsVirtualKeyCode: 69 });
  await wait(800);

  await screenshot('live_dialogue_mira_subtle_dof');
  console.log('Saved scratchpads/live_dialogue_mira_subtle_dof.png');

  // Advance dialogue to next line
  await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Space', code: 'Space', windowsVirtualKeyCode: 32 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Space', code: 'Space', windowsVirtualKeyCode: 32 });
  await wait(800);

  await screenshot('live_dialogue_next_speaker');
  console.log('Saved scratchpads/live_dialogue_next_speaker.png');

  // Close dialogue
  await evaluate(`window.__CampaignSystem?.closeDialogue?.();`);
  await wait(500);

  await screenshot('live_dialogue_restored_gameplay');
  console.log('Saved scratchpads/live_dialogue_restored_gameplay.png');

  ws.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

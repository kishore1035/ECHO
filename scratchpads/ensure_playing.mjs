import { send, wait, evaluate, ws } from './cdp_helper.mjs';

export async function ensurePlaying() {
  const isPlaying = await evaluate(`window.__ECHO_PLAYER_PHYS__ && !window.__useCampaignStore?.getState?.()?.activeDialogue`);
  const hasTitle = await evaluate(`!!document.querySelector('.title-screen-container')`);
  console.log('State check:', { isPlaying, hasTitle });

  if (hasTitle) {
    console.log('Pressing Enter to start New Game...');
    await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 });
    await wait(800);

    // Skip intro and advance dialogues
    for (let i = 0; i < 20; i++) {
      await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: 'Space', code: 'Space', windowsVirtualKeyCode: 32 });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Space', code: 'Space', windowsVirtualKeyCode: 32 });
      await wait(350);
    }
    await wait(1500);
  }
}

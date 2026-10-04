import { send, wait, evaluate, screenshot, ws } from './cdp_helper.mjs';

try {
  await evaluate('window.setGameState("playing")');
  await wait(600);

  // Open Pause menu
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await wait(80);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await wait(500);

  // Click CONTROLS
  await evaluate(`(() => {
    const el = Array.from(document.querySelectorAll('*')).find(e => e.children.length === 0 && e.innerText && e.innerText.trim() === 'CONTROLS');
    if (el) el.click();
  })()`);
  await wait(600);

  // Switch to VOICE category
  await evaluate(`(() => {
    const tabs = Array.from(document.querySelectorAll('*')).filter(e => e.children.length === 0 && e.innerText && e.innerText.trim() === 'VOICE');
    if (tabs.length > 0) tabs[tabs.length - 1].click();
  })()`);
  await wait(400);

  const controlsData = await evaluate(`(() => {
    const text = document.body.innerText;
    // Find all rows or text
    const rows = Array.from(document.querySelectorAll('div')).filter(d => d.innerText && d.innerText.includes('Push To Talk'));
    return {
      bodyTextSnippet: text.slice(0, 500),
      hasPushToTalk: text.includes('Push To Talk'),
      hasMKey: text.includes('M'),
      voiceBinding: window.useControlsStore ? window.useControlsStore.getState().getBindingDisplay('voicePushToTalk') : 'N/A'
    };
  })()`);

  console.log('Controls UI Verification:', JSON.stringify(controlsData, null, 2));

  await screenshot('controls_menu_ptt_m_verified');

  // Close back to gameplay
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await wait(80);
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await wait(400);

  await evaluate('window.setGameState("playing")');
  await wait(300);

} finally {
  ws.close();
}

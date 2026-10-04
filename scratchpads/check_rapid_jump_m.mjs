import { send, wait, evaluate, screenshot, ws } from './cdp_helper.mjs';

try {
  await evaluate('window.setGameState("playing")');
  await wait(600);

  const rapidResults = [];

  for (let cycle = 1; cycle <= 4; cycle++) {
    // 1. Press Space (Jump)
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
    await wait(100);
    const jumpCheck = await evaluate(`(() => {
      const p = window.useWorldStore?.getState().player;
      const v = window.useWorldStore?.getState().voice.status;
      return { y: p?.position.y, isListening: v === 'listening' };
    })()`);
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
    await wait(1000); // let jump arc complete landing

    // 2. Press KeyM (Voice)
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'm', code: 'KeyM', windowsVirtualKeyCode: 77 });
    await wait(120);
    const voiceCheck = await evaluate(`(() => {
      const p = window.useWorldStore?.getState().player;
      const v = window.useWorldStore?.getState().voice.status;
      return { y: p?.position.y, isListening: v === 'listening' };
    })()`);
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'm', code: 'KeyM', windowsVirtualKeyCode: 77 });
    await wait(450); // let speech buffer settle to idle

    rapidResults.push({
      cycle,
      spaceJumping: jumpCheck.y > 2.21,
      spaceListening: jumpCheck.isListening,
      mJumping: voiceCheck.y > 2.21,
      mListening: voiceCheck.isListening
    });
  }

  console.log('Rapid Alternating Results:', JSON.stringify(rapidResults, null, 2));

  const allPass = rapidResults.every(r => r.spaceJumping && !r.spaceListening && !r.mJumping && r.mListening);
  console.log('Rapid Alternating All Pass:', allPass);

  await screenshot('rapid_jump_m_verified');
} finally {
  ws.close();
}

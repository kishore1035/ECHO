import { send, wait, evaluate, screenshot, ws } from './cdp_helper.mjs';

try {
  await evaluate('window.setGameState("playing")');
  await wait(600);

  // Check initial grounded and y
  const initial = await evaluate(`(() => {
    const p = window.useWorldStore?.getState().player;
    return { y: p?.position.y, grounded: p?.isGrounded };
  })()`);
  console.log('Initial player position:', initial);

  // Press Space (Jump)
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
  await wait(120);
  const midJump = await evaluate(`(() => {
    const p = window.useWorldStore?.getState().player;
    const voice = window.useWorldStore?.getState().voice.status;
    return { y: p?.position.y, voiceStatus: voice };
  })()`);
  console.log('Mid-jump position and voice status:', midJump);

  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
  await wait(800);

  // Now press KeyM (Push to talk)
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'm', code: 'KeyM', windowsVirtualKeyCode: 77 });
  await wait(120);
  const duringM = await evaluate(`(() => {
    const p = window.useWorldStore?.getState().player;
    const voice = window.useWorldStore?.getState().voice.status;
    return { y: p?.position.y, voiceStatus: voice };
  })()`);
  console.log('During M position and voice status:', duringM);

  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'm', code: 'KeyM', windowsVirtualKeyCode: 77 });
  await wait(450);
  const afterM = await evaluate('window.useWorldStore?.getState().voice.status');
  console.log('After M settled voice status:', afterM);

} finally {
  ws.close();
}

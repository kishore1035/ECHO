import { send, wait, evaluate, screenshot, ws } from './cdp_helper.mjs';

try {
  await evaluate('window.setGameState("playing")');
  await wait(600);

  const before = await evaluate('window.useWorldStore.getState().voice.status');
  console.log('Status before:', before);

  // Press KeyM
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'm', code: 'KeyM', windowsVirtualKeyCode: 77 });
  await wait(150);
  const duringM = await evaluate('window.useWorldStore.getState().voice.status');
  console.log('Status during KeyM down:', duringM);

  // Release KeyM
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'm', code: 'KeyM', windowsVirtualKeyCode: 77 });
  await wait(450);
  const afterM = await evaluate('window.useWorldStore.getState().voice.status');
  console.log('Status after KeyM up (settled):', afterM);

  // Test Space (Jump)
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
  await wait(150);
  const duringSpace = await evaluate('window.useWorldStore.getState().voice.status');
  console.log('Status during Space down:', duringSpace);

  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
  await wait(150);
  const afterSpace = await evaluate('window.useWorldStore.getState().voice.status');
  console.log('Status after Space up:', afterSpace);

} finally {
  ws.close();
}

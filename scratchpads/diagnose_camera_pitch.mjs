import { send, wait, evaluate, screenshot, ws } from './cdp_helper.mjs';

try {
  await evaluate('window.setGameState("playing")');
  await wait(600);

  // Set pointer locked in physics ref for mouse testing
  await evaluate(`(() => {
    if (window.__ECHO_PLAYER_PHYS__) {
      window.__ECHO_PLAYER_PHYS__.isPointerLocked = true;
    }
  })()`);

  const initial = await evaluate(`(() => {
    const phys = window.__ECHO_PLAYER_PHYS__;
    return {
      pitch: phys?.pitch,
      yaw: phys?.yaw
    };
  })()`);
  console.log('Initial camera state:', initial);

  // Test 1: Move mouse UP (dy = -50 in screen space)
  await send('Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    x: 400,
    y: 300,
    movementX: 0,
    movementY: -50,
    button: 'none',
    pointerType: 'mouse'
  });
  await wait(200);

  const afterMouseUp = await evaluate(`(() => {
    const phys = window.__ECHO_PLAYER_PHYS__;
    const cam = window.__ECHO_CAMERA__;
    const fwd = new (window.THREE?.Vector3 || function(){})();
    return {
      dySent: -50,
      pitch: phys?.pitch,
      camY: cam?.position.y,
      pitchChange: phys?.pitch - ${initial.pitch}
    };
  })()`);
  console.log('After Mouse UP (dy = -50):', afterMouseUp);

  // Test 2: Move mouse DOWN (dy = +100 in screen space)
  await send('Input.dispatchMouseEvent', {
    type: 'mouseMoved',
    x: 400,
    y: 300,
    movementX: 0,
    movementY: 100,
    button: 'none',
    pointerType: 'mouse'
  });
  await wait(200);

  const afterMouseDown = await evaluate(`(() => {
    const phys = window.__ECHO_PLAYER_PHYS__;
    const cam = window.__ECHO_CAMERA__;
    return {
      dySent: 100,
      pitch: phys?.pitch,
      camY: cam?.position.y
    };
  })()`);
  console.log('After Mouse DOWN (dy = 100):', afterMouseDown);

} finally {
  ws.close();
}

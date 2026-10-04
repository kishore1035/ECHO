import { send, wait, evaluate, screenshot, ws } from './cdp_helper.mjs';

async function main() {
  console.log('Waiting for mission banner...');
  await wait(3500);

  // Take neutral screenshot
  await screenshot('camera_neutral');
  console.log('Saved neutral screenshot');

  // Find canvas
  const canvas = await evaluate(`
    (() => {
      const c = document.querySelector('canvas');
      const r = c.getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
    })()
  `);

  console.log('Simulating mouse UP drag: right button down, move up (negative delta Y)');
  // We can simulate right-click drag or dispatch mousemove events
  // Let's check how CameraSystem listens to mouse:
  // dom.addEventListener('mousedown', onMouseDown); -> e.button === 2 or 0?
  // Let's check onMouseDown in CameraSystem:
  // if (e.button === 0 && !e.altKey) { if (!playerPhys.current.isPointerLocked) dom.requestPointerLock?.(); performAttack(); }
  // if (e.button === 2) { playerPhys.current.isDragging = true; playerPhys.current.lastMouseX = e.clientX; playerPhys.current.lastMouseY = e.clientY; }
  // window.addEventListener('mousemove', onMouseMove);
  // In onMouseMove:
  // if (playerPhys.current.isPointerLocked) { dx = e.movementX; dy = e.movementY; }
  // else if (playerPhys.current.isDragging) { dx = e.clientX - lastMouseX; dy = e.clientY - lastMouseY; }

  // Let's test by dispatching mousemove events directly to window!
  // First, simulate right button down to enable isDragging
  await evaluate(`
    (() => {
      const c = document.querySelector('canvas');
      const r = c.getBoundingClientRect();
      const cx = r.x + r.width / 2;
      const cy = r.y + r.height / 2;
      c.dispatchEvent(new MouseEvent('mousedown', { button: 2, clientX: cx, clientY: cy, bubbles: true }));
    })()
  `);

  // Move mouse UP: clientY decreases, e.movementY is negative
  console.log('Dispatching mouse move UP (dy = -80)...');
  await evaluate(`
    (() => {
      const c = document.querySelector('canvas');
      const r = c.getBoundingClientRect();
      const cx = r.x + r.width / 2;
      const cy = r.y + r.height / 2;
      window.dispatchEvent(new MouseEvent('mousemove', {
        clientX: cx,
        clientY: cy - 80,
        movementX: 0,
        movementY: -80,
        bubbles: true
      }));
    })()
  `);
  await wait(500);
  await screenshot('camera_mouse_up');

  // Reset to neutral
  await evaluate(`
    (() => {
      const c = document.querySelector('canvas');
      const r = c.getBoundingClientRect();
      const cx = r.x + r.width / 2;
      const cy = r.y + r.height / 2;
      // mouse up to stop dragging
      window.dispatchEvent(new MouseEvent('mouseup', { button: 2, bubbles: true }));
      // start dragging again
      c.dispatchEvent(new MouseEvent('mousedown', { button: 2, clientX: cx, clientY: cy, bubbles: true }));
    })()
  `);

  // Move mouse DOWN: clientY increases, e.movementY is positive
  console.log('Dispatching mouse move DOWN (dy = +80)...');
  await evaluate(`
    (() => {
      const c = document.querySelector('canvas');
      const r = c.getBoundingClientRect();
      const cx = r.x + r.width / 2;
      const cy = r.y + r.height / 2;
      window.dispatchEvent(new MouseEvent('mousemove', {
        clientX: cx,
        clientY: cy + 80,
        movementX: 0,
        movementY: +80,
        bubbles: true
      }));
    })()
  `);
  await wait(500);
  await screenshot('camera_mouse_down');

  // Release mouse
  await evaluate(`
    window.dispatchEvent(new MouseEvent('mouseup', { button: 2, bubbles: true }));
  `);

  ws.close();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

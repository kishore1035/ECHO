import { send, wait, evaluate, screenshot, ws } from './cdp_helper.mjs';

try {
  // Ensure we are in playing state
  await evaluate('window.setGameState && window.setGameState("playing")');
  await wait(1000);

  const perfReport = await evaluate(`(async () => {
    const samples = [];
    let lastTime = performance.now();
    let frameCount = 0;
    let longFrames = 0;
    let maxDelta = 0;

    const measureFrames = (durationMs) => new Promise((resolve) => {
      const start = performance.now();
      const onFrame = (now) => {
        const delta = now - lastTime;
        lastTime = now;
        frameCount++;
        if (delta > maxDelta) maxDelta = delta;
        if (delta > 66) longFrames++; // > 66ms means < 15 fps glitch
        if (now - start < durationMs) {
          requestAnimationFrame(onFrame);
        } else {
          resolve();
        }
      };
      requestAnimationFrame(onFrame);
    });

    // 1. Village idle baseline
    lastTime = performance.now();
    frameCount = 0; longFrames = 0; maxDelta = 0;
    await measureFrames(1000);
    const baselineFps = Math.round((frameCount / 1000) * 1000);
    const baselineLong = longFrames;
    const baselineMax = maxDelta;

    // 2. Rapid camera rotation test
    lastTime = performance.now();
    frameCount = 0; longFrames = 0; maxDelta = 0;
    const rotStart = performance.now();
    let rotAngle = 0;
    const rotateInterval = setInterval(() => {
      rotAngle += 0.15;
      const cam = window.__ECHO_CAMERA__ || window.__threeCam;
      // Trigger canvas mouse events
      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.dispatchEvent(new MouseEvent('mousemove', { movementX: 30, movementY: 5 }));
      }
    }, 16);
    await measureFrames(1500);
    clearInterval(rotateInterval);
    const rotationFps = Math.round((frameCount / 1500) * 1000);
    const rotationLong = longFrames;
    const rotationMax = maxDelta;

    // 3. Traversal movement test (player moving)
    lastTime = performance.now();
    frameCount = 0; longFrames = 0; maxDelta = 0;
    const moveInterval = setInterval(() => {
      const p = window.useWorldStore?.getState().player;
      if (p) {
        window.useWorldStore.getState().updatePlayer({
          position: { x: p.position.x + 0.1, y: p.position.y, z: p.position.z + 0.1 }
        });
      }
    }, 16);
    await measureFrames(1500);
    clearInterval(moveInterval);
    const movementFps = Math.round((frameCount / 1500) * 1000);
    const movementLong = longFrames;
    const movementMax = maxDelta;

    // 4. Memory and WebGL resource metrics
    const heapUsedMb = performance.memory ? Math.round(performance.memory.usedJSHeapSize / (1024 * 1024)) : 'N/A';
    const heapTotalMb = performance.memory ? Math.round(performance.memory.totalJSHeapSize / (1024 * 1024)) : 'N/A';

    return {
      baseline: { fps: baselineFps, maxFrameMs: Math.round(baselineMax), longFrames: baselineLong },
      rapidRotation: { fps: rotationFps, maxFrameMs: Math.round(rotationMax), longFrames: rotationLong },
      traversal: { fps: movementFps, maxFrameMs: Math.round(movementMax), longFrames: movementLong },
      memory: { usedHeapMb: heapUsedMb, totalHeapMb: heapTotalMb }
    };
  })()`);

  console.log('Performance Sanity Report:', JSON.stringify(perfReport, null, 2));
  await screenshot('priority8_performance_verified');
} finally {
  ws.close();
}

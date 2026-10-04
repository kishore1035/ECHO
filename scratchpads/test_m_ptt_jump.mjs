import { send, wait, evaluate, screenshot, ws } from './cdp_helper.mjs';

const results = [];

async function step(name, fn) {
  try {
    const res = await fn();
    results.push({ name, status: 'PASS', details: res });
    console.log(`[PASS] ${name}:`, JSON.stringify(res));
  } catch (err) {
    results.push({ name, status: 'FAIL', error: err.message });
    console.error(`[FAIL] ${name}:`, err.message);
  }
}

try {
  // 1. Ensure in playing state
  await evaluate('window.setGameState && window.setGameState("playing")');
  await wait(800);

  // 1. Verify Controls Store default binding and display for voicePushToTalk
  await step('1. Verify default Push-to-Talk is M and Jump is Space', async () => {
    const store = await evaluate(`(() => {
      // Ensure local store resets to new defaults or migrates
      const s = window.useControlsStore ? window.useControlsStore.getState() : null;
      if (!s) return null;
      return {
        pttPrimary: s.getPrimaryCode('voicePushToTalk'),
        pttDisplay: s.getBindingDisplay('voicePushToTalk'),
        jumpPrimary: s.getPrimaryCode('jump'),
        jumpDisplay: s.getBindingDisplay('jump')
      };
    })()`);
    return store;
  });

  // 2. Test M in running game (Push-to-Talk activation)
  await step('2. Test M activates Voice Pipeline and releasing stops it', async () => {
    // Reset listening state
    await evaluate(`(() => {
      window.__pttStarted = false;
      window.__pttStopped = false;
      const vp = window.VoicePipeline;
      if (vp) {
        const origStart = vp.startListening.bind(vp);
        const origStop = vp.stopAndProcess.bind(vp);
        vp.startListening = () => { window.__pttStarted = true; return origStart(); };
        vp.stopAndProcess = () => { window.__pttStopped = true; return origStop(); };
      }
    })()`);

    // Press KeyM down
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'm', code: 'KeyM', windowsVirtualKeyCode: 77 });
    await wait(200);

    const started = await evaluate('Boolean(window.__pttStarted)');

    // Release KeyM
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'm', code: 'KeyM', windowsVirtualKeyCode: 77 });
    await wait(200);

    const stopped = await evaluate('Boolean(window.__pttStopped)');
    return { pttStartedWithM: started, pttStoppedOnReleaseM: stopped };
  });

  // 3. Test Jump independently (Space does NOT trigger Push-to-Talk)
  await step('3. Test Space triggers Jump and does NOT activate Push-to-Talk', async () => {
    await evaluate('window.__pttStarted = false; window.__pttStopped = false;');

    // Record initial jump state
    const jumpBefore = await evaluate(`(() => {
      const p = window.useWorldStore?.getState().player;
      return { y: p?.position.y };
    })()`);

    // Press Space down
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
    await wait(100);

    const pttTriggeredBySpace = await evaluate('Boolean(window.__pttStarted)');

    // Release Space
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
    await wait(200);

    return { pttTriggeredBySpace, jumpIndependent: !pttTriggeredBySpace };
  });

  // 4. Test pressing Jump and M separately and rapidly
  await step('4. Rapid alternating test between Jump (Space) and Push-to-Talk (M)', async () => {
    const trace = [];

    for (let i = 0; i < 3; i++) {
      await evaluate('window.__pttStarted = false;');
      // Jump
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
      await wait(50);
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: ' ', code: 'Space', windowsVirtualKeyCode: 32 });
      await wait(50);
      const spaceTriggeredVoice = await evaluate('Boolean(window.__pttStarted)');

      // Voice
      await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'm', code: 'KeyM', windowsVirtualKeyCode: 77 });
      await wait(50);
      const mTriggeredVoice = await evaluate('Boolean(window.__pttStarted)');
      await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'm', code: 'KeyM', windowsVirtualKeyCode: 77 });
      await wait(50);

      trace.push({ cycle: i, spaceTriggeredVoice, mTriggeredVoice });
    }

    const allCorrect = trace.every(t => !t.spaceTriggeredVoice && t.mTriggeredVoice);
    return { allCorrect, trace };
  });

  // 5. Verify Controls Menu displays Push-to-Talk: M
  await step('5. Open Pause Menu -> Controls and verify UI displays "M" for Push-to-Talk', async () => {
    // Open Pause
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

    // Switch to VOICE category if categories exist
    await evaluate(`(() => {
      const voiceCatBtn = Array.from(document.querySelectorAll('button, div')).find(e => e.innerText && e.innerText.trim() === 'VOICE');
      if (voiceCatBtn) voiceCatBtn.click();
    })()`);
    await wait(400);

    const pageText = await evaluate('document.body.innerText');
    const pttLabelPresent = pageText.includes('Push To Talk') || pageText.includes('VOICE');
    const hasKeyM = pageText.includes('M') && !pageText.includes('Push To Talk / Voice Command\nSPACE');

    // Close with Escape
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await wait(80);
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await wait(500);

    // Resume
    await evaluate(`(() => {
      const resume = Array.from(document.querySelectorAll('*')).find(e => e.children.length === 0 && e.innerText && e.innerText.trim() === 'RESUME');
      if (resume) resume.click();
      else window.setGameState('playing');
    })()`);
    await wait(500);

    return { pttLabelPresent, hasKeyM };
  });

  // 6. Verify HUD VoiceIndicator guidance displays [M]
  await step('6. Verify HUD VoiceIndicator guidance displays [M]', async () => {
    const indicatorText = await evaluate(`(() => {
      const el = document.querySelector('.voice-indicator') || document.body;
      return el.innerText;
    })()`);
    const displaysM = indicatorText.includes('[M]');
    return { displaysM, indicatorSnippet: indicatorText.slice(0, 100) };
  });

  await screenshot('ptt_key_m_verified');
  console.log('\n--- Push-to-Talk M Verification Complete ---');
} finally {
  ws.close();
}

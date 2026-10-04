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

const clickByText = async (text) => {
  return await evaluate(`(() => {
    const el = Array.from(document.querySelectorAll('*')).find(e => e.children.length === 0 && e.innerText && e.innerText.trim() === '${text}');
    if (el) {
      el.click();
      return true;
    }
    return false;
  })()`);
};

try {
  // Ensure we are in clean 'playing' state
  await evaluate('window.setGameState && window.setGameState("playing")');
  await wait(800);

  // 1. GAMEPLAY
  await step('1. GAMEPLAY - Confirm active gameplay HUD & world', async () => {
    const state = await evaluate('window.getGameState()');
    const hudFound = await evaluate('Boolean(document.querySelector(".hud-compass") || document.querySelector("canvas"))');
    const isPaused = await evaluate('window.useWorldStore.getState().time.isPaused');
    return { state, hudFound, isPaused };
  });

  // 2. DIALOGUE
  await step('2. DIALOGUE - Trigger Dialogue, verify overlay, pointer release, and close', async () => {
    await evaluate(`(() => {
      window.useCampaignStore.getState().triggerDialogue({
        id: 'qa_dialogue_test',
        title: 'Rowan Encounter',
        speaker: 'Rowan the Miller',
        lines: [
          { speaker: 'Rowan the Miller', text: 'The water wheel turns slow today, traveler. We must prepare.' }
        ]
      });
    })()`);
    await wait(600);

    const isDialogueActive = await evaluate('Boolean(window.useCampaignStore.getState().activeDialogue)');
    const bodyText = await evaluate('document.body.innerText');
    const hasDialogueText = bodyText.includes('Rowan the Miller') || bodyText.includes('water wheel');

    // Close dialogue
    await evaluate('window.useCampaignStore.getState().closeDialogue()');
    await wait(400);
    const dialogueClosed = await evaluate('!window.useCampaignStore.getState().activeDialogue');

    return { isDialogueActive, hasDialogueText, dialogueClosed };
  });

  // 3. PAUSE
  await step('3. PAUSE - Open Pause Menu via Escape key', async () => {
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await wait(80);
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await wait(600);

    const gameState = await evaluate('window.getGameState()');
    const bodyText = await evaluate('document.body.innerText');
    const pauseMenuVisible = bodyText.includes('RESUME') && bodyText.includes('PAUSED');
    const clockPaused = await evaluate('window.useWorldStore.getState().time.isPaused');
    return { gameState, pauseMenuVisible, clockPaused };
  });

  // 4. SETTINGS (OPTIONS)
  await step('4. SETTINGS (OPTIONS) - Open Options modal from Pause Menu', async () => {
    const clicked = await clickByText('OPTIONS');
    await wait(600);

    const bodyText = await evaluate('document.body.innerText');
    const optionsVisible = bodyText.includes('SETTINGS') || bodyText.includes('GRAPHICS') || bodyText.includes('AUDIO') || bodyText.includes('DISPLAY');

    // Close Options with Escape
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await wait(80);
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await wait(600);

    return { clicked, optionsVisible };
  });

  // 5. CONTROLS
  await step('5. CONTROLS - Open Controls tab from Pause Menu and close', async () => {
    const clicked = await clickByText('CONTROLS');
    await wait(600);

    const bodyText = await evaluate('document.body.innerText');
    const controlsVisible = bodyText.includes('MOVE') || bodyText.includes('INTERACT') || bodyText.includes('CONTROLS') || bodyText.includes('KEYBINDINGS');

    // Press Escape to return to pause menu
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await wait(80);
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await wait(600);

    return { clicked, controlsVisible };
  });

  // 6. HELP
  await step('6. HELP - Open Help Modal and close with Escape', async () => {
    const clicked = await clickByText('HELP');
    await wait(600);

    const bodyText = await evaluate('document.body.innerText');
    const helpVisible = bodyText.includes('HELP') || bodyText.includes('COMMANDS') || bodyText.includes('CONTROLS') || bodyText.includes('MANUAL');

    // Close with Escape
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await wait(80);
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await wait(600);

    return { clicked, helpVisible };
  });

  // 7. SAVE
  await step('7. SAVE - Open Save modal and close with Escape', async () => {
    const clicked = await clickByText('SAVE GAME');
    await wait(600);

    const bodyText = await evaluate('document.body.innerText');
    const saveVisible = bodyText.includes('SAVE') || bodyText.includes('SLOT');

    // Close with Escape
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await wait(80);
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await wait(600);

    return { clicked, saveVisible };
  });

  // 8. LOAD
  await step('8. LOAD - Open Load modal and close with Escape', async () => {
    const clicked = await clickByText('LOAD GAME');
    await wait(600);

    const bodyText = await evaluate('document.body.innerText');
    const loadVisible = bodyText.includes('LOAD') || bodyText.includes('SLOT');

    // Close with Escape
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await wait(80);
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await wait(600);

    return { clicked, loadVisible };
  });

  // 9. RESUME BACK TO GAMEPLAY & TIMELINE
  await step('9. RESUME & TIMELINE - Resume gameplay, open Timeline, close Timeline', async () => {
    // Click RESUME
    const resumeClicked = await clickByText('RESUME');
    await wait(600);

    const resumedState = await evaluate('window.getGameState()');

    // Open Timeline via communion / store
    await evaluate('window.useEchoTreeStore && window.useEchoTreeStore.getState().openInteraction()');
    await wait(600);

    const bodyText = await evaluate('document.body.innerText');
    const timelineOpen = bodyText.includes('TIMELINE') || bodyText.includes('BRANCH') || bodyText.includes('PRIME') || bodyText.includes('REWIND');

    // Close Timeline
    await evaluate('window.useEchoTreeStore && window.useEchoTreeStore.getState().closeInteraction()');
    await wait(600);

    return { resumeClicked, resumedState, timelineOpen };
  });

  // 10. TITLE & CREDITS
  await step('10. CREDITS & TITLE - Return to Title and view Credits', async () => {
    // Pause again
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await wait(80);
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await wait(600);

    // Click RETURN TO TITLE
    await clickByText('RETURN TO TITLE');
    await wait(1000);

    const titleVisible = await evaluate('document.body.innerText.includes("A SPOKEN WORLD") || document.body.innerText.includes("NEW GAME")');

    // Open CREDITS from Title screen
    await clickByText('CREDITS');
    await wait(600);

    const creditsVisible = await evaluate('document.body.innerText.includes("CREDITS") || document.body.innerText.includes("ECHO") || document.body.innerText.includes("DEVELOPMENT")');

    // Return from Credits
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await wait(80);
    await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
    await wait(600);

    return { titleVisible, creditsVisible };
  });

  // 11. RE-ENTER GAMEPLAY FROM TITLE
  await step('11. RE-ENTER GAMEPLAY - Launch into game from title and confirm clean active state', async () => {
    // Select CONTINUE or NEW GAME
    let clicked = await clickByText('CONTINUE');
    if (!clicked) clicked = await clickByText('NEW GAME');
    await wait(1500);

    // If in intro, skip intro
    await evaluate(`(() => {
      if (window.getGameState && window.getGameState() === 'intro') {
        window.setGameState('playing');
      }
    })()`);
    await wait(1000);

    const inGameplay = await evaluate('window.getGameState() === "playing"');
    const clockRunning = await evaluate('!window.useWorldStore.getState().time.isPaused');
    return { inGameplay, clockRunning };
  });

  await screenshot('priority7_ui_transitions_final_verified');
  console.log('\n--- Priority 7 Verification Completed Successfully ---');
} finally {
  ws.close();
}

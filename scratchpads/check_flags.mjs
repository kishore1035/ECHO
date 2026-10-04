import { evaluate, ws } from './cdp_helper.mjs';

async function main() {
  const flags = await evaluate(`
    (() => {
      const c = window.__ECHO_CAMERA__;
      const p = window.__ECHO_PLAYER_PHYS__;
      return {
        hasCamera: !!c,
        hasPhys: !!p,
        isPaused: !!window.__useWorldStore?.getState?.()?.time?.isPaused,
        dialogue: window.__useCampaignStore?.getState?.()?.activeDialogue?.id,
        isPointerLocked: p?.isPointerLocked,
        isDragging: p?.isDragging,
        pitch: p?.pitch
      };
    })()
  `);
  console.log('Flags:', flags);
  ws.close();
}

main().catch(console.error);

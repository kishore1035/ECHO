import { evaluate, ws } from './cdp_helper.mjs';

async function main() {
  const result = await evaluate(`
    (() => {
      return {
        campaignActiveDialogue: window.__useCampaignStore ? !!window.__useCampaignStore.getState().activeDialogue : 'no store',
        campaignMission: window.__useCampaignStore ? window.__useCampaignStore.getState().activeMissionId : 'no store',
        echoTree: window.__useEchoTreeStore ? window.__useEchoTreeStore.getState().isInteracting : 'no store',
        worldPaused: window.__useWorldStore ? window.__useWorldStore.getState().time.isPaused : 'no store',
      };
    })()
  `);
  console.log('Stores check:', result);
  ws.close();
}

main().catch(console.error);

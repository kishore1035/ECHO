import { send, evaluate, ws } from './cdp_helper.mjs';

async function main() {
  const result = await evaluate(`
    (() => {
      let captured = null;
      const handler = (e) => {
        captured = { mx: e.movementX, my: e.movementY };
      };
      window.addEventListener('mousemove', handler, { once: true });
      window.dispatchEvent(new MouseEvent('mousemove', { movementX: 10, movementY: 20 }));
      return captured;
    })()
  `);
  console.log('Dispatched MouseEvent with movementX/Y:', result);
  ws.close();
}

main().catch(console.error);

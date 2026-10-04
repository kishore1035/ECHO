import fs from 'node:fs/promises';

const targets = await (await fetch('http://127.0.0.1:9222/json')).json();
const page = targets.find(t => t.type === 'page' && t.url.startsWith('http://127.0.0.1:5173'));
if (!page) throw new Error('ECHO page target not found');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((resolve, reject) => { ws.addEventListener('open', resolve, { once: true }); ws.addEventListener('error', reject, { once: true }); });
let seq = 0;
const pending = new Map();
ws.addEventListener('message', e => {
  const data = JSON.parse(e.data);
  if (data.id && pending.has(data.id)) { pending.get(data.id)(data); pending.delete(data.id); }
});
const send = (method, params = {}) => new Promise(resolve => {
  const id = ++seq;
  pending.set(id, resolve);
  ws.send(JSON.stringify({ id, method, params }));
});
const wait = ms => new Promise(r => setTimeout(r, ms));
const evaluate = async expression => {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
  if (response.result?.result?.value !== undefined) return response.result.result.value;
  return response.result?.exceptionDetails?.exception?.description ?? response.result?.exceptionDetails?.text ?? response.error?.message ?? null;
};
const screenshot = async name => {
  const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false });
  await fs.writeFile(`scratchpads/${name}.png`, Buffer.from(result.result.data, 'base64'));
};
await send('Page.enable'); await send('Runtime.enable'); await send('Input.enable');

export { send, wait, evaluate, screenshot, ws };

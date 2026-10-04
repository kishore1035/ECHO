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
const action = process.argv[2] || 'state';
if (action === 'state') {
  await wait(1500);
  console.log(JSON.stringify({ title: await evaluate('document.title'), text: await evaluate('document.body.innerText'), canvas: await evaluate('Array.from(document.querySelectorAll("canvas")).map(c=>({w:c.width,h:c.height,rect:(()=>{let r=c.getBoundingClientRect();return {x:r.x,y:r.y,w:r.width,h:r.height}})()}))'), errors: await evaluate('window.__echoQaErrors || []') }, null, 2));
  await screenshot('echo_runtime_initial');
} else if (action === 'sequence') {
  const steps = process.argv[3]?.endsWith('.json') ? JSON.parse(await fs.readFile(process.argv[3], 'utf8')) : JSON.parse(process.argv[3]);
  for (let i=0;i<steps.length;i++) {
    const s = steps[i];
    if (s.type === 'viewport') {
      await send('Emulation.setDeviceMetricsOverride',{width:s.width,height:s.height,deviceScaleFactor:1,mobile:false});
    } else if (s.type === 'key') {
      await send('Input.dispatchKeyEvent',{type:'keyDown',key:s.key,code:s.code || s.key,windowsVirtualKeyCode:s.vk || 0});
      if (s.holdMs) await wait(s.holdMs);
      if (!s.hold) await send('Input.dispatchKeyEvent',{type:'keyUp',key:s.key,code:s.code || s.key,windowsVirtualKeyCode:s.vk || 0});
    } else if (s.type === 'keyup') {
      await send('Input.dispatchKeyEvent',{type:'keyUp',key:s.key,code:s.code || s.key,windowsVirtualKeyCode:s.vk || 0});
    } else if (s.type === 'mouse') {
      await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:s.x,y:s.y, ...(s.dx !== undefined ? {movementX:s.dx} : {}), ...(s.dy !== undefined ? {movementY:s.dy} : {}),button:'none',pointerType:'mouse'});
    } else if (s.type === 'click') {
      await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:s.x,y:s.y,button:'none',pointerType:'mouse'});
      await send('Input.dispatchMouseEvent',{type:'mousePressed',x:s.x,y:s.y,button:'left',clickCount:1,pointerType:'mouse'});
      await send('Input.dispatchMouseEvent',{type:'mouseReleased',x:s.x,y:s.y,button:'left',clickCount:1,pointerType:'mouse'});
    } else if (s.type === 'wheel') {
      await send('Input.dispatchMouseEvent',{type:'mouseWheel',x:s.x,y:s.y,deltaX:s.deltaX||0,deltaY:s.deltaY||0,pointerType:'mouse'});
    } else if (s.type === 'text') await send('Input.insertText',{text:s.text});
    if (s.wait) await wait(s.wait);
    if (s.shot) await screenshot(s.shot);
    if (s.eval) console.log(JSON.stringify({i, result:await evaluate(s.eval)}));
  }
} else if (action === 'eval') {
 console.log(JSON.stringify(await evaluate(process.argv[3]), null, 2));
} else if (action === 'viewport') {
 await send('Emulation.setDeviceMetricsOverride',{width:Number(process.argv[3]||1440),height:Number(process.argv[4]||900),deviceScaleFactor:1,mobile:false});
 await wait(1000); await screenshot('echo_runtime_resized');
 console.log(JSON.stringify({size:await evaluate('JSON.stringify({w:innerWidth,h:innerHeight,dpr:devicePixelRatio})')}));
} else if (action === 'shot') await screenshot(process.argv[3] || 'echo_runtime');
ws.close();

import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('../', import.meta.url))
const executable = process.env.CHROME_PATH || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find(existsSync)
if (!executable) throw new Error('Set CHROME_PATH to an installed Chrome/Chromium/Edge executable')
const profile = mkdtempSync(join(tmpdir(), 'easyamt-mascot-'))
const server = spawn(process.execPath, [join(root, 'node_modules/vite/bin/vite.js'), '--host', '127.0.0.1', '--port', '5179', '--strictPort'], { cwd: root, windowsHide: true, stdio: 'pipe' })
const chrome = spawn(executable, ['--headless=new', '--remote-debugging-port=9239', '--remote-allow-origins=http://localhost:9239', '--no-first-run', '--no-default-browser-check', '--disable-background-networking', `--user-data-dir=${profile}`, 'about:blank'], { windowsHide: true, stdio: 'pipe' })
let socket
const pending = new Map()
const diagnostics = []
async function poll(url) {
  const deadline = Date.now() + 20000
  while (Date.now() < deadline) {
    try { const response = await fetch(url); if (response.ok) return response } catch {}
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  throw new Error(`Timed out waiting for ${url}`)
}
try {
  await poll('http://127.0.0.1:5179')
  const targets = await (await poll('http://localhost:9239/json/list')).json()
  socket = new WebSocket(targets.find((target) => target.type === 'page').webSocketDebuggerUrl)
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject })
  let sequence = 0
  socket.onmessage = (event) => {
    const message = JSON.parse(event.data)
    if (message.id) {
      const callback = pending.get(message.id)
      pending.delete(message.id)
      if (message.error) callback.reject(new Error(JSON.stringify(message.error)))
      else callback.resolve(message.result)
    } else if (message.method === 'Runtime.exceptionThrown') diagnostics.push(message.params.exceptionDetails.text)
  }
  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++sequence
      pending.set(id, { resolve, reject })
      socket.send(JSON.stringify({ id, method, params }))
    })
  }
  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 900, deviceScaleFactor: 1, mobile: false })
  await send('Page.navigate', { url: 'http://127.0.0.1:5179/dev/mascot?check' })
  for (let index = 0; index < 100; index++) {
    const ready = await send('Runtime.evaluate', { expression: "document.readyState === 'complete'", returnByValue: true })
    if (ready.result.value) break
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  const check = await send('Runtime.evaluate', {
    expression: "import('/src/features/mascot/mascot.browser.tsx').then(module => module.runChecks())",
    awaitPromise: true, returnByValue: true,
  })
  if (check.exceptionDetails) throw new Error(JSON.stringify(check.exceptionDetails))
  console.log(JSON.stringify(check.result.value, null, 2))
  if (!check.result.value?.passed) throw new Error('Mascot browser checks failed')

  await send('Page.navigate', { url: 'http://127.0.0.1:5179/dev/mascot' })
  for (let index = 0; index < 100; index++) {
    const ready = await send('Runtime.evaluate', { expression: "document.querySelector('h1')?.textContent === 'CatPackFree mascot gallery'", returnByValue: true })
    if (ready.result.value) break
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
  for (const [width, height] of [[1280, 900], [390, 844], [320, 568], [900, 400]]) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false })
    await send('Runtime.evaluate', { expression: "new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))", awaitPromise: true })
    const layout = await send('Runtime.evaluate', { expression: `(() => {
      const panel = document.querySelector('.mascot-panel');
      const field = document.querySelector('.detail-panel input');
      const panelBox = panel.getBoundingClientRect();
      const fieldBox = field.getBoundingClientRect();
      const overlaps = panelBox.left < fieldBox.right && panelBox.right > fieldBox.left && panelBox.top < fieldBox.bottom && panelBox.bottom > fieldBox.top;
      return { width: innerWidth, height: innerHeight, overlaps, overflow: document.documentElement.scrollWidth > innerWidth, position: getComputedStyle(panel).position };
    })()`, returnByValue: true })
    console.log('Layout:', layout.result.value)
    if (layout.result.value.overlaps || layout.result.value.overflow) throw new Error('Mascot overlaps controls or overflows')
  }

  const naturalMotion = await send('Runtime.evaluate', { expression: `(async () => {
    const sprite = document.querySelector('[aria-label="Selected state"]');
    const positions = [];
    for (let index = 0; index < 6; index++) {
      positions.push(sprite.style.backgroundPosition);
      await new Promise(resolve => setTimeout(resolve, 120));
    }
    const assets = ['/mascot/catpack-idle.png', '/mascot/catpack-box.png', '/mascot/catpack-answer.png'];
    const dimensions = await Promise.all(assets.map(async src => {
      const image = new Image(); image.src = src; await image.decode();
      const canvas = document.createElement('canvas'); canvas.width = 32; canvas.height = 32;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0, 32, 32, 0, 0, 32, 32);
      const first = context.getImageData(0, 0, 32, 32).data;
      context.clearRect(0, 0, 32, 32);
      context.drawImage(image, 32, 0, 32, 32, 0, 0, 32, 32);
      const second = context.getImageData(0, 0, 32, 32).data;
      return { src, width: image.naturalWidth, height: image.naturalHeight, distinctFrames: first.some((value, index) => value !== second[index]) };
    }));
    return { reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches, positions, dimensions };
  })()`, awaitPromise: true, returnByValue: true })
  console.log('Native animation and loaded sprites:', naturalMotion.result.value)
  if (new Set(naturalMotion.result.value.positions).size < 2 || naturalMotion.result.value.dimensions.some(asset => !asset.distinctFrames)) throw new Error('Sprite animation is not visibly advancing')

  if (diagnostics.length) throw new Error(diagnostics.join('\n'))
} finally {
  socket?.close()
  chrome.kill()
  server.kill()
  await new Promise((resolve) => setTimeout(resolve, 500))
  // profile is a fresh mkdtemp child of the OS temp directory, never a user profile.
  if (profile.startsWith(join(tmpdir(), 'easyamt-mascot-'))) {
    try { rmSync(profile, { recursive: true, force: true, maxRetries: 3 }) } catch {}
  }
}

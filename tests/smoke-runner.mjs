import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join } from 'node:path';

const root = new URL('../', import.meta.url).pathname;
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
const server = createServer(async (req, res) => {
  try {
    const requestPath = decodeURIComponent((req.url || '/').split('?')[0]);
    const filePath = join(root, requestPath === '/' ? 'index.html' : requestPath.replace(/^\/+/, ''));
    const body = await readFile(filePath);
    res.writeHead(200, { 'content-type': mime[extname(filePath)] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404);
    res.end('not found');
  }
});

await new Promise(resolve => server.listen(4173, '127.0.0.1', resolve));
const browser = await chromium.launch({ headless: true });
try {
  const page = await browser.newPage();
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  await page.goto('http://127.0.0.1:4173/tests/smoke.html');
  await page.waitForFunction(() => document.title.startsWith('PASS') || document.title.startsWith('FAIL'), null, { timeout: 30000 });
  const title = await page.title();
  const failures = await page.locator('#results .fail').allTextContents();
  if (!title.startsWith('PASS') || failures.length) {
    throw new Error(failures.join('\n') || title);
  }
  console.log(title);
} finally {
  await browser.close();
  server.close();
}

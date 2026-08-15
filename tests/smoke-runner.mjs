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
  await page.goto('http://127.0.0.1:4173/tests/smoke.html');
  await page.waitForFunction(() => document.title.startsWith('PASS') || document.title.startsWith('FAIL'), null, { timeout: 30000 });
  const title = await page.title();
  const failures = await page.locator('#results .fail').allTextContents();
  if (!title.startsWith('PASS') || failures.length) {
    throw new Error(failures.join('\n') || title);
  }
  const performanceMetrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const paints = Object.fromEntries(
      performance.getEntriesByType('paint').map(entry => [entry.name, Math.round(entry.startTime)])
    );
    return {
      domContentLoaded: Math.round(navigation?.domContentLoadedEventEnd || 0),
      loadEvent: Math.round(navigation?.loadEventEnd || 0),
      firstPaint: paints['first-paint'] || 0,
      firstContentfulPaint: paints['first-contentful-paint'] || 0,
      resourceCount: performance.getEntriesByType('resource').length,
    };
  });
  console.log(`PERFORMANCE ${JSON.stringify(performanceMetrics)}`);
  console.log(title);

  // collection-format.test.html renders per-test cards and summary counters into the DOM
  await page.goto('http://127.0.0.1:4173/tests/collection-format.test.html');
  await page.waitForFunction(() => /^\d+$/.test(document.getElementById('total-tests')?.textContent ?? ''), null, { timeout: 30000 });
  const collection = await page.evaluate(() => ({
    total: Number(document.getElementById('total-tests').textContent),
    passed: Number(document.getElementById('passed-tests').textContent),
    failed: Number(document.getElementById('failed-tests').textContent),
    errors: [...document.querySelectorAll('.test-card.failed .test-error')].map(el => el.textContent.trim()),
  }));
  if (!collection.total || collection.failed) {
    throw new Error(`collection-format: ${collection.failed}/${collection.total} failed\n${collection.errors.join('\n')}`);
  }
  console.log(`PASS — collection-format tests (${collection.passed}/${collection.total})`);

  // spaced-repetition.test.html signals completion via window.testsCompleted / window.testResults
  await page.goto('http://127.0.0.1:4173/tests/spaced-repetition.test.html');
  await page.waitForFunction(() => window.testsCompleted === true, null, { timeout: 30000 });
  const spaced = await page.evaluate(() => ({
    ...window.testResults,
    errors: [...document.querySelectorAll('.test-case .test-error')].map(el => el.textContent.trim()),
  }));
  if (!spaced.total || spaced.failed) {
    throw new Error(`spaced-repetition: ${spaced.failed}/${spaced.total} failed\n${spaced.errors.join('\n')}`);
  }
  console.log(`PASS — spaced-repetition tests (${spaced.passed}/${spaced.total})`);
} finally {
  await browser.close();
  server.close();
}

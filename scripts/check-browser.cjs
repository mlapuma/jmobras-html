'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');
const { chromium } = require('playwright');

const pages = ['', 'about.html', 'services.html', 'contact.html', 'news.html',
 'pintura-predial.html', 'lavagem-predial.html', 'manutencao-predial.html',
 'manutencao-geral.html', 'reformas.html', 'conservacao-fachadas.html',
 'como-conservar-fachada.html', 'quando-fazer-pintura-predial.html',
 'beneficios-lavagem-predial.html', 'obrigado.html', '404.html'];
const widths = [390, 768, 1440];
const origin = 'http://127.0.0.1:8765/';
const screenshots = path.resolve('browser-check-results');
fs.mkdirSync(screenshots, { recursive: true });

async function waitForServer() {
 for (let attempt = 0; attempt < 30; attempt++) {
  try { if ((await fetch(origin)).ok) return; } catch {}
  await new Promise(resolve => setTimeout(resolve, 100));
 }
 throw new Error('Local test server did not start');
}

async function verifyMenu(page, width) {
 const toggle = page.locator('.menu-toggle');
 const links = page.locator('.nav-links a');
 if (width > 840) {
  assert.equal(await toggle.isVisible(), false);
  return;
 }
 await toggle.click();
 assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
 assert.equal(await links.first().evaluate(el => el === document.activeElement), true);
 const overlap = await page.evaluate(() =>
  document.querySelector('.nav-links').getBoundingClientRect().top <
  document.querySelector('.site-header').getBoundingClientRect().bottom);
 assert.equal(overlap, false, 'Open menu overlaps the header');
 await links.last().focus();
 await page.keyboard.press('Tab');
 assert.equal(await toggle.evaluate(el => el === document.activeElement), true);
 await page.keyboard.press('Shift+Tab');
 assert.equal(await links.last().evaluate(el => el === document.activeElement), true);
 await page.keyboard.press('Escape');
 assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
 assert.equal(await toggle.evaluate(el => el === document.activeElement), true);
 assert.equal(await page.evaluate(() => document.body.classList.contains('menu-open')), false);
 await toggle.click();
 await links.first().click();
 assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
 assert.equal(await page.evaluate(() => document.activeElement.id), 'topo',
  'Same-page menu link must focus its destination after closing');
}

(async () => {
 const server = spawn('python3', ['-m', 'http.server', '8765', '--bind', '127.0.0.1'],
  { stdio: 'ignore' });
 let browser;
 try {
  await waitForServer();
  browser = await chromium.launch();
  for (const width of widths) {
   const page = await browser.newPage({ viewport: { width, height: 900 } });
   for (const pathname of pages) {
    const label = pathname || 'index.html';
    try {
     const response = await page.goto(origin + pathname, { waitUntil: 'networkidle' });
     assert.equal(response.status(), 200, label);
     assert.equal(await page.locator('h1').count(), 1, label + ' must have one H1');
     assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth),
      false, label + ' has horizontal overflow at ' + width);
     assert.ok(await page.locator('.site-header').evaluate(el =>
      el.getBoundingClientRect().height <= 90), label + ' header is too tall');
     if (!pathname) {
      await page.screenshot({ path: path.join(screenshots, 'home-' + width + '.png') });
      await verifyMenu(page, width);
     }
     if (pathname === 'contact.html' || !pathname) {
      const requests = [];
      await page.route('https://formsubmit.co/**', async route => {
       requests.push({ method: route.request().method(), data: route.request().postData() });
       await route.fulfill({ status: 200, contentType: 'text/html',
        body: '<html><body><h1>Local simulated submission</h1></body></html>' });
      });
      const form = page.locator('.contact-form');
      const submit = form.getByRole('button', { name: 'Enviar solicitação' });
      await submit.click();
      assert.equal(requests.length, 0, 'Empty form attempted submission');
      assert.ok(await form.locator('input:invalid, textarea:invalid').count() > 0);
      await form.getByLabel('Nome', { exact: true }).fill('Teste automatizado');
      await form.getByLabel('Mensagem', { exact: true }).fill('Verificação local. Não enviar contato real.');
      await form.getByLabel('E-mail', { exact: true }).fill('email-invalido');
      await submit.click();
      assert.equal(requests.length, 0, 'Malformed email attempted submission');
      assert.equal(await form.getByLabel('E-mail', { exact: true }).evaluate(el =>
       el.validity.typeMismatch), true);
      await form.getByLabel('E-mail', { exact: true }).fill('teste@example.invalid');
      await Promise.all([
       page.waitForURL('https://formsubmit.co/**'),
       submit.click()
      ]);
      assert.equal(requests.length, 1, 'Valid form did not attempt exactly one submission');
      assert.equal(requests[0].method, 'POST');
      const payload = new URLSearchParams(requests[0].data);
      assert.equal(payload.get('nome'), 'Teste automatizado');
      assert.equal(payload.get('email'), 'teste@example.invalid');
      assert.equal(payload.get('mensagem'), 'Verificação local. Não enviar contato real.');
      assert.equal(payload.get('_honey'), '');
      assert.equal(payload.get('_captcha'), 'true');
      assert.equal(payload.get('_next'), 'https://www.jmobras.com.br/obrigado.html');
      assert.equal(payload.get('_subject'), 'Novo contato pelo site JM & Obras');
      assert.equal(await page.locator('h1').textContent(), 'Local simulated submission');
      await page.unroute('https://formsubmit.co/**');
      console.log('PASS simulated form payload at ' + width + 'px ' + label);
     }
     console.log('PASS ' + width + 'px ' + label);
    } catch (error) {
     await page.screenshot({ path: path.join(screenshots, 'failure-' + width + '-' + label + '.png'),
      fullPage: true }).catch(() => {});
     throw error;
    }
   }
   await page.goto(origin + 'services.html');
   await page.locator('.service-card a').first().click();
   await page.waitForURL('**/pintura-predial.html');
   assert.equal(await page.locator('h1').textContent(), 'Pintura predial em São Paulo');
   await page.goto(origin + 'news.html');
   await page.getByRole('link', { name: 'Como conservar a fachada do condomínio', exact: true }).click();
   await page.waitForURL('**/como-conservar-fachada.html');
   console.log('PASS navigation at ' + width + 'px');
   await page.close();
  }
 } finally {
  if (browser) await browser.close();
  server.kill('SIGTERM');
 }
})().catch(error => { console.error(error); process.exitCode = 1; });

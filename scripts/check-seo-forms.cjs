#!/usr/bin/env node
// Verificacao estatica: nao envia formularios nem altera DNS.
const fs = require('node:fs');
const assert = require('node:assert/strict');
const root = process.cwd();
const read = p => fs.readFileSync(p, 'utf8');
const sitemap = read('sitemap.xml');
const robots = read('robots.txt');
const urls = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);
assert(urls.length >= 10, 'Sitemap incompleto');
assert.equal(new Set(urls).size, urls.length, 'URLs duplicadas no sitemap');
assert.match(robots, /Sitemap:\s*https:\/\/www\.jmobras\.com\.br\/sitemap\.xml/);
for (const url of urls) {
  const parsed = new URL(url);
  assert.equal(parsed.origin, 'https://www.jmobras.com.br');
  const path = parsed.pathname === '/' ? 'index.html' : parsed.pathname.slice(1);
  assert(fs.existsSync(path), 'Pagina ausente: ' + path);
  const html = read(path);
  assert(html.includes('<h1'), 'H1 ausente: ' + path);
  assert(html.includes('rel="canonical"'), 'Canonical ausente: ' + path);
  assert(html.includes(url + '"'), 'Canonical divergente: ' + path);
}
for (const path of ['index.html', 'contact.html']) {
  const html = read(path);
  assert.match(html, /action="https:\/\/formsubmit\.co\/jmobras\.eng@gmail\.com"/);
  assert.match(html, /name="_captcha" value="true"/);
  assert.match(html, /name="_next" value="https:\/\/www\.jmobras\.com\.br\/obrigado\.html"/);
  assert.match(html, /name="_honey"/);
  assert.match(html, /type="email"[^>]*required|type="email"[^>]*>/);
}
console.log('SEO e configuracao estatica dos formularios: OK (' + urls.length + ' URLs).');

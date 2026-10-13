const fs = require('node:fs');
const assert = require('node:assert/strict');
const root = process.cwd();
const read = name => fs.readFileSync(name, 'utf8');
const sitemap = read('sitemap.xml');
const urls = [...sitemap.matchAll(/<loc>https:\/\/www\.jmobras\.com\.br\/([^<]*)<\/loc>/g)].map(m => m[1]);
assert(urls.length >= 10, 'Sitemap incompleto');
assert.equal(new Set(urls).size, urls.length, 'URLs duplicadas no sitemap');
for (const path of urls) {
  const file = path || 'index.html';
  assert(fs.existsSync(file), 'Página do sitemap ausente: ' + file);
  const html = read(file);
  assert(/<title>[^<]+<\/title>/i.test(html), 'Título ausente: ' + file);
  assert(/<meta name="description"/i.test(html), 'Descrição ausente: ' + file);
  const canonical = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  assert(canonical, 'Canonical ausente: ' + file);
  assert.equal(canonical[1], 'https://www.jmobras.com.br/' + path, 'Canonical divergente: ' + file);
  assert(!/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html), 'Página bloqueada para indexação: ' + file);
}
const home = read('index.html');
for (const asset of ['css/premium.css','js/site.js','images/logoJMObras.png','images/services/pintura-predial.jpg']) {
  assert(fs.existsSync(asset), 'Recurso da home ausente: ' + asset);
}
assert(/name="_next"/.test(home), 'Redirecionamento do formulário ausente');
assert(/name="_captcha"/.test(home), 'Verificação do formulário ausente');
assert(/Sitemap: https:\/\/www\.jmobras\.com\.br\/sitemap\.xml/.test(read('robots.txt')), 'Sitemap não declarado em robots.txt');
console.log('OK: ' + urls.length + ' páginas, SEO básico, recursos e formulário.');

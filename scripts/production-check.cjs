const https = require('node:https');
const assert = require('node:assert/strict');
const base = 'https://www.jmobras.com.br';
function request(path) {
 return new Promise((resolve,reject)=>{
  const req=https.get(base+path,{timeout:20000,headers:{'User-Agent':'JMObras-SiteCheck/1.1','Accept':'text/html,application/xml,text/plain'}},res=>{
   let body='';res.setEncoding('utf8');res.on('data',chunk=>{body+=chunk.slice(0,250000-body.length)});res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body}));
  });req.on('timeout',()=>req.destroy(new Error('Tempo limite: '+path)));req.on('error',reject);
 });
}
(async()=>{
 const paths=['/','/robots.txt','/sitemap.xml','/contact.html','/obrigado.html'];
 const results={};
 for(const path of paths){
  const result=await request(path);results[path]=result;
  assert.equal(result.status,200,path+' retornou HTTP '+result.status);
  console.log('OK HTTP',path,result.status);
 }
 assert(/<title>[^<]+<\/title>/i.test(results['/'].body),'Home sem título');
 assert(/Sitemap:\s*https:\/\/www\.jmobras\.com\.br\/sitemap\.xml/.test(results['/robots.txt'].body),'robots.txt sem sitemap correto');
 const xml=results['/sitemap.xml'].body;
 assert(xml.includes('<urlset'),'Sitemap inválido');
 const urls=[...xml.matchAll(/<loc>(https:\/\/www\.jmobras\.com\.br\/[^<]*)<\/loc>/g)].map(m=>m[1]);
 assert(urls.length>=10,'Sitemap incompleto');
 assert.equal(new Set(urls).size,urls.length,'URLs repetidas no sitemap');
 for(const url of urls){
  const path=new URL(url).pathname;
  const response=results[path] || await request(path);
  assert.equal(response.status,200,'URL do sitemap indisponível: '+url);
  const canonical=response.body.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
  assert(canonical,'Canonical ausente: '+url);
  assert.equal(canonical[1],url,'Canonical divergente: '+url);
 }
 const contact=results['/contact.html'].body;
 assert(/<form\b[^>]*action="https:\/\/formsubmit\.co\/jmobras\.eng@gmail\.com"[^>]*method="POST"/i.test(contact),'Formulário sem action/método esperado');
 for(const field of ['nome','email','mensagem','_captcha','_next','_honey'])assert(new RegExp('name="'+field+'"').test(contact),'Campo ausente: '+field);
 assert(contact.includes('https://www.jmobras.com.br/obrigado.html'),'Destino do formulário incorreto');
 console.log('OK: '+urls.length+' URLs indexáveis, canonical, formulário e página de agradecimento.');
 console.log('NOTA: envio real de formulário não é testado para evitar spam e mensagens não solicitadas.');
})().catch(err=>{console.error('FALHA:',err.message);process.exitCode=1});

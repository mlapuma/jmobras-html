const https = require('node:https');
const assert = require('node:assert/strict');
const base = 'https://www.jmobras.com.br';
function request(path) {
 return new Promise((resolve,reject)=>{
  const req=https.get(base+path,{timeout:12000,headers:{'User-Agent':'JMObras-SiteCheck/1.0'}},res=>{
   let body='';res.setEncoding('utf8');res.on('data',chunk=>{body+=chunk.slice(0,250000-body.length)});res.on('end',()=>resolve({status:res.statusCode,headers:res.headers,body}));
  });req.on('timeout',()=>req.destroy(new Error('Tempo limite: '+path)));req.on('error',reject);
 });
}
(async()=>{
 for(const path of ['/','/robots.txt','/sitemap.xml','/contact.html']){
  const result=await request(path);
  assert.equal(result.status,200,path+' retornou HTTP '+result.status);
  if(path==='/')assert(result.body.includes('<title>'),'Página inicial sem título');
  if(path==='/robots.txt')assert(result.body.includes('Sitemap:'),'robots.txt sem sitemap');
  if(path==='/sitemap.xml')assert(result.body.includes('<urlset'),'Sitemap inválido');
  console.log('OK',path,result.status);
 }
})().catch(err=>{console.error(err.message);process.exitCode=1});

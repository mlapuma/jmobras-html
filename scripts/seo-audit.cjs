const fs=require('node:fs');
const assert=require('node:assert/strict');
const sitemap=fs.readFileSync('sitemap.xml','utf8');
const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(m=>m[1]);
const rows=[];
for(const url of urls){
 const path=new URL(url).pathname;
 const file=path==='/'?'index.html':path.slice(1);
 const html=fs.readFileSync(file,'utf8');
 const title=html.match(/<title>([\s\S]*?)<\/title>/i)?.[1]?.trim()||'';
 const description=html.match(/<meta\s+name="description"\s+content="([^"]+)"/i)?.[1]||'';
 const canonical=html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i)?.[1]||'';
 const noindex=/<meta\s+name="robots"\s+content="[^"]*noindex/i.test(html);
 const issues=[];
 if(!title)issues.push('Título ausente');
 if(!description)issues.push('Descrição ausente');
 if(canonical!==url)issues.push('Canonical divergente');
 if(noindex)issues.push('Noindex');
 rows.push({url,title,issues});
}
const dupes=new Map();
for(const row of rows){const key=row.title.toLowerCase();if(!key)continue;dupes.set(key,(dupes.get(key)||0)+1)}
for(const row of rows)if(row.title&&dupes.get(row.title.toLowerCase())>1)row.issues.push('Título duplicado');
const lines=['# Auditoria técnica de SEO','','Páginas no sitemap: '+rows.length,'','| Página | Título | Diagnóstico |','|---|---|---|'];
for(const row of rows)lines.push('| '+row.url.replaceAll('|','%7C')+' | '+row.title.replaceAll('|','-')+' | '+(row.issues.join(', ')||'OK')+' |');
lines.push('','**Importante:** auditoria do código, não confirma indexação pelo Google.');
const report=lines.join('\n')+'\n';
fs.mkdirSync('reports',{recursive:true});
fs.writeFileSync('reports/seo-audit.md',report);
console.log(report);
assert(rows.every(r=>r.issues.length===0),'Foram encontrados problemas técnicos de SEO');

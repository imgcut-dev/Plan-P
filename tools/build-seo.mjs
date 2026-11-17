// 글마다 공유·검색용 정적 페이지(post/글ID/index.html)와 sitemap.xml을 만든다.
// 발행한 글만 Firestore에서 읽는다(공개 규칙 그대로, 비밀 값 없음). 실행: node tools/build-seo.mjs
// 만든 페이지는 index.html을 바탕으로 하므로 사람이 열면 같은 사이트 화면(댓글·스킨 포함)이 뜨고,
// 크롤러는 그 글의 제목·설명·썸네일(og 태그)과 본문 글자를 바로 읽는다.
import {readFileSync,writeFileSync,mkdirSync,rmSync} from "node:fs";
import path from "node:path";
import {fileURLToPath,pathToFileURL} from "node:url";

export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=f=>readFileSync(path.join(ROOT,f),"utf8");
export const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
export const siteUrl=()=>read("data.js").match(/const SITE_URL="([^"]+)"/)[1].replace(/\/$/,"");
export const siteDesc=()=>read("data.js").match(/const SITE_DESC="([^"]+)"/)[1];
const SAFE_ID=/^[A-Za-z0-9._-]+$/; // 폴더 이름으로 쓸 수 있는 글 id

// 마크다운을 검색엔진이 읽을 글자로 (서식 기호·이미지·태그 제거)
export const mdText=md=>String(md||"")
 .replace(/```[\s\S]*?```/g," ").replace(/!\[[^\]]*\]\([^)]*\)/g," ").replace(/\[([^\]]*)\]\([^)]*\)/g,"$1")
 .replace(/<[^>]+>/g," ").replace(/^[#>\-*+\s]+/gm,"").replace(/[*_`~]/g,"").replace(/[ \t]+/g," ").trim();
const clip=(s,n)=>{s=String(s||"").replace(/\s+/g," ").trim();return s.length>n?s.slice(0,n-1)+"…":s};
const abs=(u,base)=>/^https:\/\//.test(u||"")?u:(/^http:\/\//.test(u||"")?u:"");

// 글 하나의 정적 페이지. template = index.html 내용
export function renderPost(p,{site,url,desc,template}){
 const page=`${url}/post/${encodeURIComponent(p.id)}/`;
 const own=abs(p.img),img=own||`${url}/og-default.png`;
 const text=mdText(p.body);
 const d=clip(p.ex||text||desc,160),title=`${p.title} — ${site.name}`;
 const ld={"@context":"https://schema.org","@type":"BlogPosting",headline:p.title,description:d,image:[img],datePublished:p.date,
  author:{"@type":"Person",name:p.author||site.name},publisher:{"@type":"Organization",name:site.name},mainEntityOfPage:{"@type":"WebPage","@id":page}};
 let h=template;
 const swap=(re,tag)=>{if(!re.test(h))throw new Error("템플릿에 없는 태그: "+re);h=h.replace(re,()=>tag)};
 h=h.replace('<meta charset="utf-8">','<meta charset="utf-8">\n<base href="/">'); // 글 주소가 한 단계 깊어서 상대 경로를 사이트 루트 기준으로 고정
 swap(/<title>[^<]*<\/title>/,`<title>${esc(title)}</title>`);
 swap(/<meta name="description"[^>]*>/,`<meta name="description" content="${esc(d)}">`);
 swap(/<link rel="canonical"[^>]*>/,`<link rel="canonical" href="${esc(page)}">`);
 swap(/<meta property="og:type"[^>]*>/,`<meta property="og:type" content="article">`);
 swap(/<meta property="og:title"[^>]*>/,`<meta property="og:title" content="${esc(title)}">`);
 swap(/<meta property="og:description"[^>]*>/,`<meta property="og:description" content="${esc(d)}">`);
 swap(/<meta property="og:url"[^>]*>/,`<meta property="og:url" content="${esc(page)}">`);
 swap(/<meta property="og:image"[^>]*>/,`<meta property="og:image" content="${esc(img)}">`);
 if(own){h=h.replace(/<meta property="og:image:width"[^>]*>\n?/,"").replace(/<meta property="og:image:height"[^>]*>\n?/,"")} // 글 이미지의 크기는 모른다
 h=h.replace("</head>",`<meta property="article:published_time" content="${esc(p.date)}">\n<script type="application/ld+json">${JSON.stringify(ld).replace(/</g,"\\u003c")}</script>\n</head>`);
 const paras=text.split(/\n{2,}/).map(t=>t.trim()).filter(Boolean).slice(0,40).map(t=>`<p>${esc(t.replace(/\n/g," "))}</p>`).join("");
 const tags=(p.tags||[]).length?`<p>${p.tags.map(t=>"#"+esc(t)).join(" ")}</p>`:"";
 // 사이트 스크립트가 켜지면 이 내용은 실제 화면으로 바뀐다. 크롤러와 스크립트 없는 환경은 이 글자를 읽는다
 swap(/<main class="wrap" id="app"><\/main>/,`<main class="wrap" id="app"><article><h1>${esc(p.title)}</h1><p>${esc(p.ex||"")}</p>${paras}${tags}</article></main>`);
 return h;
}

export function renderSitemap(posts,url){
 const u=(loc,last)=>`<url><loc>${esc(loc)}</loc>${last?`<lastmod>${esc(last)}</lastmod>`:""}</url>`;
 const ps=[...posts].sort((a,b)=>String(b.date).localeCompare(String(a.date)));
 return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${u(url+"/",ps[0]?.date)}\n${ps.map(p=>u(`${url}/post/${encodeURIComponent(p.id)}/`,p.date)).join("\n")}\n</urlset>\n`;
}

// ---- Firestore 읽기 (REST, 공개된 글만) ----
const fromFs=v=>{
 if("stringValue" in v)return v.stringValue;if("integerValue" in v)return +v.integerValue;if("doubleValue" in v)return v.doubleValue;
 if("booleanValue" in v)return v.booleanValue;if("nullValue" in v)return null;if("timestampValue" in v)return v.timestampValue;
 if("arrayValue" in v)return (v.arrayValue.values||[]).map(fromFs);
 if("mapValue" in v)return Object.fromEntries(Object.entries(v.mapValue.fields||{}).map(([k,x])=>[k,fromFs(x)]));
 return null};
export async function fetchPublished(){
 const fb=read("fb.js"),project=fb.match(/projectId:"([^"]+)"/)[1],key=fb.match(/apiKey:"([^"]+)"/)[1];
 const base=`https://firestore.googleapis.com/v1/projects/${project}/databases/(default)/documents`;
 const q=await fetch(`${base}:runQuery?key=${key}`,{method:"POST",headers:{"content-type":"application/json"},
  body:JSON.stringify({structuredQuery:{from:[{collectionId:"posts"}],where:{fieldFilter:{field:{fieldPath:"status"},op:"EQUAL",value:{stringValue:"published"}}}}})});
 if(!q.ok)throw new Error("글 읽기 실패 "+q.status);
 const posts=(await q.json()).filter(r=>r.document).map(r=>fromFs({mapValue:{fields:r.document.fields}}));
 const c=await fetch(`${base}/site/config?key=${key}`);
 const cfg=c.ok?fromFs({mapValue:{fields:(await c.json()).fields}}):{};
 return {posts,site:{name:"Plan-P",...(cfg.site||{})}};
}

export async function build({posts,site,write=true}={}){
 if(!posts)({posts,site}=await fetchPublished());
 const url=siteUrl(),desc=siteDesc(),template=read("index.html");
 const ok=[],skip=[];
 for(const p of posts){(SAFE_ID.test(p.id||"")&&p.title?ok:skip).push(p)}
 const pages=ok.map(p=>({id:p.id,html:renderPost(p,{site,url,desc,template})}));
 const sitemap=renderSitemap(ok,url);
 if(write){
  if(!ok.length)throw new Error("발행된 글이 없어 중단합니다(기존 페이지를 지우지 않음)");
  const dir=path.join(ROOT,"post");
  rmSync(dir,{recursive:true,force:true}); // 이 스크립트가 만든 폴더(루트의 post/)만 지운다
  for(const pg of pages){mkdirSync(path.join(dir,pg.id),{recursive:true});writeFileSync(path.join(dir,pg.id,"index.html"),pg.html)}
  writeFileSync(path.join(ROOT,"sitemap.xml"),sitemap);
 }
 return {pages,sitemap,skipped:skip.map(p=>p.id)};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const r=await build();
 console.log(`글 페이지 ${r.pages.length}개와 sitemap.xml을 만들었습니다.`);
 if(r.skipped.length)console.warn("만들지 못한 글(id에 영문·숫자·-_. 외 문자가 있거나 제목이 없음):",r.skipped.join(", "));
}

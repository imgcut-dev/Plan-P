// 배포 점검(TC-D)과 SEO 점검(TC-S): 운영 주소에 읽기 요청(GET)만 보낸다
import assert from "node:assert/strict";
import {tc,loadSite} from "./lib.mjs";
const BASE=process.env.BASE||"https://plan-p-1b255.web.app"; // BASE=http://localhost:8123 로 로컬 검증도 가능
const get=async p=>{const r=await fetch(BASE+p,{redirect:"manual"});return {status:r.status,text:r.status===200?await r.text():""}};
const meta=(h,re)=>(h.match(re)||[])[1]||"";
const head=h=>h.split("</head>")[0];

export default async function(){
 await tc("TC-D-001",async()=>{const out=[];for(const p of ["/index.html","/admin.html","/comments.js","/analytics.js","/skins.css","/data.js","/fb.js"]){const r=await get(p);out.push(p+" "+r.status);assert.equal(r.status,200,p)}return out.join(", ")});
 await tc("TC-D-002",async()=>{const out=[];for(const p of ["/.git/config","/firestore.rules","/docs/decisions.md","/DESIGN.md","/CLAUDE.md","/firebase.json","/tests/package.json","/design-system/README.md"]){const r=await get(p);out.push(p+" "+r.status);assert.equal(r.status,404,p+" 이(가) 공개됨: "+r.status)}return out.join(", ")});
 await tc("TC-D-003",async()=>{const r=await get("/없는페이지");assert.equal(r.status,404)});
 await tc("TC-D-004",async()=>{const r=await get("/post/zzz-not-built/");assert.equal(r.status,200,"아직 만들지 않은 글 주소가 "+r.status+" (사이트 화면으로 열려야 함)");assert.ok(r.text.includes('id="app"')&&r.text.includes("document.write"),"index.html이 대신 내려오고 기준 주소 보정 스크립트가 있어야 함")});
 await tc("TC-D-005",async()=>{const out=[];for(const [f,t] of [["/favicon.ico","image"],["/favicon.svg","svg"],["/favicon-32.png","png"],["/apple-touch-icon.png","png"]]){const r=await fetch(BASE+f);const ct=r.headers.get("content-type")||"";out.push(f+" "+r.status+" "+ct);assert.equal(r.status,200,f+" "+r.status);assert.ok(ct.includes(t),f+" 형식이 "+ct)}const h=(await get("/index.html")).text;assert.ok(h.includes('rel="icon"'),"운영 index.html에 파비콘 링크 없음");return out.join(", ")});

 const home=(await get("/index.html")).text;
 // 운영 사이트맵에서 글 주소 두 개를 골라, 크롤러처럼 JS 없이 받은 HTML을 비교한다
 const sm=(await get("/sitemap.xml")).text;
 const urls=[...sm.matchAll(/<loc>([^<]+\/post\/[^<]+)<\/loc>/g)].map(m=>m[1]);
 const pages=[];for(const u of urls.slice(0,2))pages.push({u,h:(await get(new URL(u).pathname)).text});
 const og=(h,k)=>meta(head(h),new RegExp(`property=["']${k}["'][^>]*content=["']([^"']*)`,"i"));
 await tc("TC-S-001",()=>{const d=meta(head(home),/<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)/i);assert.ok(d,"<head>에 meta description이 없음");return d});
 await tc("TC-S-002",()=>{const miss=["og:title","og:description","og:image","og:url","og:type"].filter(k=>!new RegExp(`property=["']${k}["']`,"i").test(head(home)));assert.equal(miss.length,0,"없는 og 태그: "+miss.join(", "))});
 await tc("TC-S-003",()=>{assert.ok(pages.length===2,"사이트맵에 글 주소가 2개 이상 있어야 함 ("+pages.length+"개)");const [a,b]=pages;assert.ok(og(a.h,"og:image")&&og(b.h,"og:image"),"글 페이지에 og:image가 없음");assert.notEqual(og(a.h,"og:title"),og(b.h,"og:title"));assert.equal(og(a.h,"og:url"),a.u);assert.equal(og(b.h,"og:url"),b.u);return `${og(a.h,"og:title")} / ${og(b.h,"og:title")}`});
 await tc("TC-S-004",()=>{assert.ok(/name=["']twitter:card["']/i.test(head(home)),"홈에 twitter:card 없음");for(const p of pages)assert.ok(/name=["']twitter:card["']/i.test(head(p.h)),p.u+"에 twitter:card 없음")});
 await tc("TC-S-005",()=>{assert.ok(/rel=["']canonical["']/i.test(head(home)),"홈에 canonical 없음");assert.ok(pages.length,"글 페이지 없음");for(const p of pages)assert.ok(head(p.h).includes(`rel="canonical" href="${p.u}"`),p.u+"의 canonical이 자기 주소가 아님")});
 await tc("TC-S-006",async()=>{const r=await get("/robots.txt");assert.equal(r.status,200,"robots.txt "+r.status);assert.ok(r.text.includes("Sitemap:"));assert.ok(sm.includes("<urlset"),"sitemap.xml 없음");assert.ok(urls.length>0);assert.ok(!sm.includes("admin"))});
 await tc("TC-S-007",async()=>{assert.ok(pages.length>0,"글 전용 주소가 없음");for(const p of pages){assert.ok(!p.u.includes("#"));assert.ok(p.h.includes('<main class="wrap" id="app"><article>'),p.u+" 본문 글자가 서버 응답에 없음")}});
 await tc("TC-S-008",()=>{assert.ok(pages.length===2,"글 페이지 없음");const t=h=>meta(head(h),/<title>([^<]*)<\/title>/);assert.notEqual(t(pages[0].h),t(pages[1].h));assert.notEqual(t(pages[0].h),t(home));return t(pages[0].h)+" / "+t(pages[1].h)});
}

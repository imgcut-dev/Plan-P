// 테스트 공용: 사이트/관리자 HTML을 jsdom에 올리고(외부 주소는 비움), tc()로 결과를 모은다
import {JSDOM,ResourceLoader,VirtualConsole} from "jsdom";
import {readFileSync,existsSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";
export const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
export const results=[];
export async function tc(id,fn){
 try{const a=await fn();results.push({id,result:"Pass",actual:typeof a==="string"?a:"기대한 대로 동작"})}
 catch(e){results.push({id,result:"Fail",actual:String(e&&e.message||e).split("\n")[0].slice(0,280)})}
}
export const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export async function until(fn,ms=4000){const t=Date.now();while(Date.now()-t<ms){try{const v=fn();if(v)return v}catch{}await sleep(25)}throw new Error("시간 안에 조건이 충족되지 않음")}
class Loader extends ResourceLoader{
 fetch(url){
  const u=new URL(url);
  if(u.hostname!=="localhost")return Promise.resolve(Buffer.from("")); // CDN, 폰트, GA는 불러오지 않는다
  const f=path.join(ROOT,decodeURIComponent(u.pathname));
  return Promise.resolve(existsSync(f)?readFileSync(f):Buffer.from(""));
 }
}
// file: "index.html" | "admin.html", query: "?demo=1", hash: "#/"
export async function load(file,{query="",hash="",viewport=1280,gtag=false,beforeParse}={}){
 const html=readFileSync(path.join(ROOT,file),"utf8").replace('import("./fb.js").then(m=>{','Promise.resolve(null).then(m=>{if(!m)return;'); // jsdom은 동적 import를 못 한다: 관리자 로그인 부분만 건너뛴다
 const errors=[];
 const vc=new VirtualConsole();vc.on("jsdomError",e=>errors.push(String(e.message||e)));
 const dom=new JSDOM(html,{url:`http://localhost/${file}${query}${hash}`,runScripts:"dangerously",resources:new Loader(),pretendToBeVisual:true,virtualConsole:vc,
  beforeParse(w){
   w.structuredClone=structuredClone;w.scrollTo=()=>{};w.alert=()=>{};w.confirm=()=>true;
   w.__calls=[];if(gtag)w.gtag=(...a)=>w.__calls.push(a);
   Object.defineProperty(w,"innerWidth",{value:viewport,configurable:true});
   w.toastui={Editor:class{constructor(o){o.el.textContent=o.initialValue}}}; // 본문 뷰어 대역
   beforeParse&&beforeParse(w);
  }});
 const w=dom.window;
 w.$$=name=>w.eval(name); // 스크립트 안의 const/let/function 값을 읽는다
 w.errors=errors;
 return w;
}
export async function loadSite(opt={}){
 const w=await load("index.html",{query:"?demo=1",...opt});
 await until(()=>w.document.body.classList.contains("ready"),6000);
 return w;
}
export const text=el=>(el?.textContent||"").replace(/\s+/g," ").trim();
// analytics.js만 따로 실행 (주소로 집계 여부가 달라져서 주소를 고른다)
export function loadAnalytics(url,title="T"){
 const dom=new JSDOM(`<title>${title}</title>`,{url,runScripts:"outside-only"});
 const w=dom.window;w.__calls=[];w.eval(readFileSync(path.join(ROOT,"analytics.js"),"utf8")+";window.__ga={gaOn,gaView,gaEvent,gaDec};");
 return w;
}
export async function loadAdmin(opt={}){
 const w=await load("admin.html",opt);
 await until(()=>w.eval("typeof lFiltered")==="function",6000);
 return w;
}
export const plain=x=>JSON.parse(JSON.stringify(x));

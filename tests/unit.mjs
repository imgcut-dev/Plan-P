import assert from "node:assert/strict";
import {tc,loadSite,loadAdmin,loadAnalytics,sleep,text,until,plain} from "./lib.mjs";

export default async function(){
 const w=await loadSite({gtag:true});
 const S=n=>w.$$(n);
 const DEFAULT=S("DEFAULT"),SKINS=S("SKINS"),SECTIONS=S("SECTIONS"),homeSections=S("homeSections");

 // ---- 사이트: 문자열 도우미 ----
 await tc("TC-U-001",()=>{const r=S("esc")(`<a href="x" onclick='y'>&`);assert.equal(r,"&lt;a href=&quot;x&quot; onclick=&#39;y&#39;&gt;&amp;");return r});
 await tc("TC-U-002",()=>{const e=S("esc");assert.equal(e(null),"");assert.equal(e(undefined),"");assert.equal(e(0),"0")});
 await tc("TC-U-003",()=>{const s=S("safe");for(const u of ["#/","#/cat/A","https://a.b","http://a.b","/x","page.html"])assert.equal(s(u),u,u)});
 await tc("TC-U-004",()=>{const s=S("safe");for(const u of ["javascript:alert(1)","data:text/html,x","vbscript:x"])assert.equal(s(u),"#/",u)});
 await tc("TC-U-005",()=>{const r=S("fmt")("2026-11-17");assert.equal(r,"2026년 11월 17일");return r});
 await tc("TC-U-006",()=>{const r=S("fmt")("<b>x</b>");assert.ok(!r.includes("<b>"));return r});
 await tc("TC-U-007",()=>{const hs=S("hs");assert.equal(hs({tags:["a","b"],cats:["C"]}),"#a #b");assert.equal(hs({tags:[],cats:["C"]}),"#C");assert.equal(hs({cats:["C"]}),"#C")});
 await tc("TC-U-008",()=>{const t=S("thumb");assert.ok(t({img:"",cats:["A"]}).includes("placeholder.svg"));assert.ok(t({img:"https://x/y.png",cats:["A"]}).includes("https://x/y.png"));assert.ok(t({img:"",cats:[]}).includes('class="lb"'))});
 await tc("TC-U-009",()=>{const r=S("card")({id:"i",title:"<script>alert(1)</script>",ex:'"><img src=x onerror=1>',cats:["A"],tags:[],img:"",date:"2026-01-01"});assert.ok(!r.includes("<script>")&&!r.includes("<img src=x"));return"스크립트·이미지 태그가 글자로 바뀜"});
 await tc("TC-U-010",()=>{const h=S("href")({id:"한글 id/1"});assert.equal(h,"#/post/"+encodeURIComponent("한글 id/1"))});

 // ---- 데이터(data.js) ----
 await tc("TC-U-011",()=>{const r=homeSections({picks:["a"],feature:"f",count:9});assert.deepEqual(plain(r.map(x=>x.type)),["chips","picks","feature","latest"]);assert.deepEqual(plain(r[1].ids),["a","",""]);assert.equal(r[2].post,"f");assert.equal(r[3].count,9)});
 await tc("TC-U-012",()=>{const sec=[{type:"text"}];assert.equal(homeSections({sections:sec}),sec)});
 await tc("TC-U-013",()=>{const r=homeSections({});assert.equal(r.length,4);assert.equal(r[3].count,6);assert.deepEqual(plain(r[1].ids),["","",""])});
 await tc("TC-U-014",()=>{assert.deepEqual(plain(Object.keys(SKINS)).sort(),["dark","journal","plan-p","reader","studio"]);for(const [k,v] of Object.entries(SKINS)){assert.ok(v.name&&v.desc,k);assert.match(v.accent,/^#[0-9A-Fa-f]{6}$/,k);assert.match(v.accentText,/^#[0-9A-Fa-f]{6}$/,k);assert.equal(v.sw.length,4,k)}});
 await tc("TC-U-015",()=>{const keys=Object.keys(SECTIONS),SEC=S("SEC");assert.deepEqual(plain(keys).sort(),["category","chips","feature","latest","picks","text"]);for(const k of keys){assert.equal(typeof SEC[k],"function","렌더러 없음: "+k);assert.ok(SECTIONS[k].name&&SECTIONS[k].def)}});
 await tc("TC-U-016",()=>{const ids=DEFAULT.posts.map(p=>p.id);assert.equal(new Set(ids).size,ids.length);for(const p of DEFAULT.posts){assert.ok(Array.isArray(p.cats),p.id);assert.match(p.date,/^\d{4}-\d{2}-\d{2}$/,p.id);assert.equal(p.status,"published",p.id);assert.ok(p.title&&p.author,p.id)}return DEFAULT.posts.length+"개 글 검사"});
 await tc("TC-U-017",()=>{const ids=new Set(DEFAULT.posts.map(p=>p.id));assert.ok(ids.has(DEFAULT.home.feature));for(const i of DEFAULT.home.picks)assert.ok(ids.has(i),i)});
 await tc("TC-U-018",()=>{const cats=new Set(DEFAULT.posts.flatMap(p=>p.cats));for(const n of DEFAULT.nav){const m=n.url.match(/^#\/cat\/(.+)$/);if(m)assert.ok(cats.has(m[1]),"글 없는 카테고리 메뉴: "+m[1])}});
 await tc("TC-U-019",async()=>{const c=await S("loadCfg")();assert.equal(c.posts.length,DEFAULT.posts.length);assert.equal(c.site.name,"Plan-P");return "Firestore를 못 읽으면 샘플 데이터 "+c.posts.length+"개"});
 await tc("TC-U-020",()=>{const t=DEFAULT.posts.find(p=>p.id==="editor-test");assert.equal(t.tags.length,4);for(const p of DEFAULT.posts.filter(p=>p.id!=="editor-test"))assert.equal((p.tags||[]).length,4,p.id)});

 // ---- 방문 통계(analytics.js) ----
 const PROD="https://plan-p-1b255.web.app/";
 await tc("TC-U-021",()=>{const g=loadAnalytics(PROD).__ga;assert.equal(g.gaOn(),true)});
 await tc("TC-U-022",()=>{for(const u of ["http://localhost/","http://127.0.0.1:8123/"])assert.equal(!!loadAnalytics(u).__ga.gaOn(),false,u)});
 await tc("TC-U-023",()=>{for(const q of ["?demo=1","?skin=dark","?x=1&demo=1"])assert.equal(!!loadAnalytics(PROD+q).__ga.gaOn(),false,q)});
 await tc("TC-U-024",()=>{const g=loadAnalytics(PROD).__ga;assert.equal(g.gaDec("%ED%95%9C%EA%B8%80"),"한글");assert.equal(g.gaDec("%E0%A4%A"),"%E0%A4%A")});
 const view=(hash,title="T")=>{const w2=loadAnalytics(PROD,title);w2.gtag=(...a)=>w2.__calls.push(a);w2.location.hash=hash;w2.eval("gaView()");return w2};
 await tc("TC-U-025",()=>{const w2=view("#/post/abc");const [t,n,p]=w2.__calls[0];assert.equal(n,"page_view");assert.equal(p.page_path,"/post/abc");assert.equal(p.page_location,"https://plan-p-1b255.web.app/post/abc");assert.equal(p.page_title,"T");return JSON.stringify(p)});
 await tc("TC-U-026",()=>{const w2=view("");assert.equal(w2.__calls[0][2].page_path,"/")});
 await tc("TC-U-027",()=>{const w2=view("#/cat/"+encodeURIComponent("강아지"));assert.equal(w2.__calls[0][2].page_path,"/cat/강아지")});
 await tc("TC-U-028",async()=>{const w2=view("#/search/"+encodeURIComponent("테스트"));assert.equal(w2.__calls.length,0,"검색은 바로 보내지 않음");await sleep(1400);const names=w2.__calls.map(c=>c[1]);assert.deepEqual(plain(names),["page_view","search"]);assert.equal(w2.__calls[1][2].search_term,"테스트");return "1.2초 뒤 page_view + search(테스트) 각 1회"});
 await tc("TC-U-029",async()=>{const w2=loadAnalytics(PROD);w2.gtag=(...a)=>w2.__calls.push(a);w2.location.hash="#/search/a";w2.eval("gaView()");w2.location.hash="#/search/ab";w2.eval("gaView()");w2.location.hash="#/search/abc";w2.eval("gaView()");await sleep(1500);const s=w2.__calls.filter(c=>c[1]==="search");assert.equal(s.length,1);assert.equal(s[0][2].search_term,"abc");return "연속 입력 3번 → search 1회(abc)"});
 await tc("TC-U-030",()=>{const w2=loadAnalytics(PROD);delete w2.gtag;w2.__ga.gaEvent("x",{});w2.__ga.gaView()}); // gtag 없으면 조용히 무시

 // ---- 관리자(admin.html) 목록·필터 ----
 const a=await loadAdmin();
 const A=n=>a.$$(n);
 const mk=(id,o={})=>({id,title:id,cats:["A"],tags:[],ex:"",date:"2026-01-01",status:"published",...o});
 const setPosts=ps=>{a.C=null;a.eval("C={site:{},nav:[],home:{},posts:[]}");A("C").posts.push(...ps)};
 const P=[mk("a",{title:"사과",cats:["과일"],tags:["빨강"],date:"2026-03-01",ex:"맛있다"}),mk("b",{title:"바나나",cats:["과일","노랑"],tags:["노랑"],date:"2026-01-01",status:"draft"}),mk("c",{title:"Carrot",cats:["채소"],tags:[],date:"2026-02-01"})];
 const F=()=>a.eval("lFiltered()").map(([p])=>p.id);
 const reset=()=>a.eval("Object.assign(L,{q:'',st:'',cat:'',tag:'',sort:'new',per:10,pg:1});L.sel.clear()");
 setPosts(P);
 await tc("TC-U-031",()=>{reset();assert.deepEqual(plain(F()),["a","c","b"])});
 await tc("TC-U-032",()=>{reset();a.eval("L.sort='old'");assert.deepEqual(plain(F()),["b","c","a"]);a.eval("L.sort='title'");const t=F();assert.deepEqual(plain(t),["c","b","a"].sort((x,y)=>P.find(p=>p.id===x).title.localeCompare(P.find(p=>p.id===y).title,"ko")));return "제목순: "+t.join(",")});
 await tc("TC-U-033",()=>{reset();a.eval("L.st='draft'");assert.deepEqual(plain(F()),["b"]);a.eval("L.st='published'");assert.deepEqual(plain(F()),["a","c"])});
 await tc("TC-U-034",()=>{reset();a.eval("L.cat='과일'");assert.deepEqual(plain(F()),["a","b"])});
 await tc("TC-U-035",()=>{reset();a.eval("L.tag='노랑'");assert.deepEqual(plain(F()),["b"])});
 await tc("TC-U-036",()=>{reset();for(const [q,exp] of [["사과",["a"]],["맛있",["a"]],["채소",["c"]],["빨강",["a"]],["CARROT",["c"]],["  없는말  ",[]]]){a.eval(`L.q=${JSON.stringify(q)}`);assert.deepEqual(plain(F()),exp,q)}});
 await tc("TC-U-037",()=>{reset();a.eval("L.st='published';L.cat='과일';L.q='사과'");assert.deepEqual(plain(F()),["a"]);a.eval("L.cat='채소'");assert.deepEqual(plain(F()),[])});
 await tc("TC-U-038",()=>{setPosts(Array.from({length:23},(_,i)=>mk("p"+i,{date:"2026-01-"+String(i+1).padStart(2,"0")})));reset();a.eval("L.per=10");const n=[1,2,3].map(pg=>{a.eval(`L.pg=${pg}`);return a.eval("lPage(lFiltered())").length});assert.deepEqual(plain(n),[10,10,3]);return "23개 → 10/10/3"});
 await tc("TC-U-039",()=>{reset();a.eval("L.pg=2;L.sel.add('x')");a.eval("setL('q','p')");assert.equal(A("L").pg,1);assert.equal(A("L").sel.size,0);a.eval("L.pg=3");a.eval("setL('pg',2)");assert.equal(A("L").pg,2)});
 await tc("TC-U-040",()=>{reset();a.eval("lAllPage(true)");assert.equal(A("L").sel.size,10);a.eval("lAllResult()");assert.equal(A("L").sel.size,23);a.eval("lAllPage(false)");assert.equal(A("L").sel.size,13);a.eval("lToggle('p0',true)");assert.ok(A("L").sel.has("p0"));a.eval("lToggle('p0',false)");assert.ok(!A("L").sel.has("p0"));reset()});
 await tc("TC-U-041",()=>{a.eval("lReset=lReset");reset();a.eval("L.q='z';L.st='draft';L.pg=2");const sel=a.eval("L.sel.add('x');1");assert.equal(sel,1);assert.equal(A("catOf")({url:"#/cat/과일"}),"과일");assert.equal(A("catOf")({url:"#/"}),null)});
 await tc("TC-U-042",()=>{setPosts(P);a.eval("C.nav=[{label:'과일',url:'#/cat/과일'},{label:'홈',url:'#/'},{label:'기타',url:'#/cat/기타'}]");assert.equal(A("catCount")("과일"),2);assert.equal(A("catCount")("기타"),0);assert.deepEqual(plain(A("cats")()).sort(),["과일","기타","노랑","채소"]);assert.deepEqual(plain(A("allTags")()).sort(),["노랑","빨강"])});
 await tc("TC-U-043",()=>{a.eval("D={tags:[]}");a.eval("addTag('#a, b ,,c')");assert.deepEqual(plain(A("D").tags),["a","b","c"]);a.eval("addTag('a')");assert.equal(A("D").tags.length,3);a.eval("addTag('"+"가".repeat(30)+"')");assert.equal(A("D").tags[3].length,20)});
 await tc("TC-U-044",()=>{a.eval("D={tags:[]}");a.eval("addTag('1,2,3,4,5,6,7,8,9,10,11,12')");assert.equal(A("D").tags.length,10);a.eval("delTag('3')");assert.equal(A("D").tags.length,9);assert.ok(!A("D").tags.includes("3"))});
 await tc("TC-U-045",()=>{const f=A("autoTags");const p={id:"abc",cats:["일상","기록"]};const t=f(p);assert.equal(t.length,4);assert.equal(new Set(t).size,4);assert.deepEqual(plain(f(p)),plain(t),"같은 입력은 같은 결과");assert.deepEqual(plain(t.slice(0,2)),["일상","기록"]);return t.join(",")});
 await tc("TC-U-046",()=>{a.eval("newPost()");const d=A("D");assert.equal(d.status,"draft");assert.deepEqual(plain(d.tags),[]);assert.deepEqual(plain(d.cats),[]);assert.match(d.id,/^p[0-9a-z]+$/);assert.match(d.date,/^\d{4}-\d{2}-\d{2}$/)});
 await tc("TC-U-047",()=>{const f=A("cmCount");a.eval("CM=null");assert.equal(f("x"),"…");a.eval("CM=[{pid:'x'},{pid:'x'},{pid:'y'}]");assert.match(f("x"),/>2<\/a>/);assert.ok(f("x").includes("admin.html#cmts/x"));assert.ok(f("x").includes('target="_blank"'));assert.ok(f("z").includes("-"));assert.ok(!f("z").includes("<a"))});
 await tc("TC-U-048",()=>{setPosts([mk("a",{title:"<img src=x onerror=1>"})]);reset();a.eval("CM=[]");const h=A("listHtml")();assert.ok(!h.includes("<img src=x"));assert.ok(h.includes("editPost(0)"));assert.ok(h.includes("<th>댓글</th>"))});
 await tc("TC-U-049",()=>{const f=A("opts");const h=f([["a","<b>"],["b","B"]],"b");assert.ok(h.includes("&lt;b&gt;"));assert.ok(h.includes('value="b" selected'))});
 w.close();a.close();
}

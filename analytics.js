// 방문 통계(Google Analytics 4). 사이트(index.html)에서만 쓴다. 관리자(admin.html)는 불러오지 않는다.
// GA_ID가 비어 있으면 아무것도 하지 않는다. 로컬(localhost)과 미리보기(?demo, ?skin)는 집계하지 않는다.
const GA_ID="G-QLVXKMRS1Y"; // 측정 ID(공개 값). Analytics 관리 > 데이터 스트림 > plan-p
const gaOn=()=>GA_ID&&!["localhost","127.0.0.1"].includes(location.hostname)&&!/[?&](demo|skin)=/.test(location.search);
function gaInit(){
 if(!gaOn())return;
 window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};
 gtag("js",new Date());gtag("config",GA_ID,{send_page_view:false}); // 화면 이동은 아래 gaView가 직접 보낸다
 const s=document.createElement("script");s.async=true;s.src="https://www.googletagmanager.com/gtag/js?id="+GA_ID;document.head.append(s);
}
// 이 사이트는 주소의 #/ 뒤로 화면을 바꾼다. GA는 # 뒤를 구분하지 못하므로 "#/post/글ID"를 "/post/글ID" 주소로 바꿔 보낸다.
let gaTimer;
function gaView(){
 if(!window.gtag)return;
 const path=gaDec((location.hash||"#/").slice(1)||"/"); // 한글 주소는 읽기 좋게 풀어서 보낸다
 const send=()=>{gtag("event","page_view",{page_location:location.origin+path,page_path:path,page_title:document.title});
  if(path.startsWith("/search/"))gaEvent("search",{search_term:gaDec(path.split("/")[2]||"")})};
 clearTimeout(gaTimer);
 path.startsWith("/search/")?gaTimer=setTimeout(send,1200):send(); // 검색은 입력이 멈춘 뒤 한 번만
}

/* ---- 이벤트 (규칙표: docs/analytics-events.md) ---- */
const gaEvent=(name,params)=>{if(window.gtag)gtag("event",name,params)};
const gaDec=s=>{try{return decodeURIComponent(s)}catch{return s}};
// 클릭 이벤트: category_click, tag_click, select_content(메인 섹션의 글 클릭)
function gaBind(){
 document.addEventListener("click",e=>{
  const a=e.target.closest&&e.target.closest("a[href]");if(!a)return;
  const h=a.getAttribute("href")||"";
  if(h.startsWith("#/cat/")){
   const src=a.closest("nav")?"menu":a.closest(".chips")?"chips":a.closest(".catl")?"sidebar":a.closest(".art")?"post":"other";
   gaEvent("category_click",{category:gaDec(h.split("/")[2]),source:src});
  }else if(h.startsWith("#/tag/")){
   gaEvent("tag_click",{tag_name:gaDec(h.split("/")[2])});
  }
  if(h.startsWith("#/post/")){
   const sec=a.closest("[data-sec]");
   if(sec)gaEvent("select_content",{content_type:"home_section",content_id:sec.dataset.sec,post_id:gaDec(h.split("/")[2])});
  }
 });
}
// read_progress: 글 본문을 25/50/75/100%까지 읽었을 때 한 번씩. 짧은 글이 열자마자 100%가 되지 않도록 스크롤이 있거나 5초가 지난 뒤에만 센다
let gaReadOff=()=>{};
function gaReadStop(){gaReadOff();gaReadOff=()=>{}}
function gaRead(postId){
 gaReadStop();
 const done=new Set(),el=()=>document.querySelector(".art"),t0=Date.now();
 const check=()=>{
  const a=el();if(!a)return;
  const r=a.getBoundingClientRect(),total=r.height;if(total<=0)return;
  const p=Math.min(100,Math.max(0,(innerHeight-r.top)/total*100));
  for(const m of [25,50,75,100])if(p>=m&&!done.has(m)){done.add(m);gaEvent("read_progress",{post_id:postId,percent:m})}
 };
 const onScroll=()=>{if(Date.now()-t0<1500&&scrollY===0)return;check()}; // 계산이 가벼워서 스크롤마다 바로 확인한다
 const timer=setTimeout(check,5000);
 addEventListener("scroll",onScroll,{passive:true});
 gaReadOff=()=>{clearTimeout(timer);removeEventListener("scroll",onScroll)};
}

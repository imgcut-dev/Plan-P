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
 const path=(location.hash||"#/").slice(1)||"/";
 const send=()=>gtag("event","page_view",{page_location:location.origin+path,page_path:path,page_title:document.title});
 clearTimeout(gaTimer);
 path.startsWith("/search/")?gaTimer=setTimeout(send,1200):send(); // 검색은 입력이 멈춘 뒤 한 번만
}

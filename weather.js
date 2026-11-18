// 푸터 날씨: 내 위치(허용 시) + 전국 17개 시도 롤링. index.html이 설정을 읽은 뒤 wxStart(키)를 부른다.
// OpenWeatherMap(https://home.openweathermap.org/) 현재 날씨. 키는 관리자 > 디자인 관리에서 넣는다. 키가 없으면 위젯을 보이지 않는다
// ponytail: 한 번 불러오고 갱신하지 않는다(30분 세션 캐시만). 오래 열어 두는 사이트면 setInterval로 다시 부른다
(()=>{ // 전역 이름(card 등)이 index.html과 겹치지 않도록 감싼다
const R=[["서울",37.5665,126.978],["부산",35.1796,129.0756],["대구",35.8714,128.6014],["인천",37.4563,126.7052],["광주",35.1595,126.8526],["대전",36.3504,127.3845],["울산",35.5384,129.3114],["세종",36.48,127.289],["경기(수원)",37.2636,127.0286],["강원(춘천)",37.8813,127.7298],["충북(청주)",36.6424,127.489],["충남(홍성)",36.601,126.6608],["전북(전주)",35.8242,127.148],["전남(무안)",34.9906,126.4817],["경북(안동)",36.5684,128.7294],["경남(창원)",35.228,128.6811],["제주",33.4996,126.5312]];
const ok=r=>{if(!r.ok)throw r.status;return r.json()};
const owAll=(pts,key)=>Promise.all(pts.map(p=>fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${p[1]}&lon=${p[2]}&appid=${encodeURIComponent(key)}&units=metric&lang=kr`).then(ok)
 .then(d=>({t:d.main.temp,f:d.main.feels_like,h:d.main.humidity,w:d.wind.speed,s:d.weather[0].description}))));
const get=owAll;
const PIN=`<svg viewBox="0 0 24 24" width="12" height="12" aria-hidden="true"><path fill="currentColor" d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z"/></svg>`;
// 카드: 도시 · 큰 기온 / 날씨 · 체감 · 습도 · 바람
const card=(n,d,extra)=>`<div><b>${n}</b> <span class="wx-t">${Math.round(d.t)}°</span></div><span class="wx-d">${d.s} · 체감 ${Math.round(d.f)}° · 습도 ${d.h}% · 바람 ${d.w}m/s${extra||""}</span>`;
// 전국 17곳 조회가 많아서 30분은 브라우저(세션)에 둔다(무료 키는 분당 60회)
const cached=async(key)=>{
 try{const c=JSON.parse(sessionStorage.getItem("wx")||"null");if(c&&c.k===(key||"")&&Date.now()-c.at<18e5)return c.d}catch{}
 const d=await get(R,key);try{sessionStorage.setItem("wx",JSON.stringify({k:key||"",at:Date.now(),d}))}catch{}
 return d;
};

window.wxStart=function(key){
 const el=document.getElementById("wx");if(!el)return;
 key=(key||"").trim();if(!key){el.hidden=true;return}
 // 위: "핀 + 나의 위치" 버튼 / 아래: 날씨 카드(전국 롤링, 버튼을 누르면 내 위치 날씨로 바뀐다)
 el.innerHTML=`<button type="button" class="wx-pin" title="내 위치 날씨 보기">${PIN}나의 위치</button><div class="wx-roll" aria-label="날씨"></div>`;
 const pin=el.querySelector(".wx-pin"),roll=el.querySelector(".wx-roll");
 let cities=[],mine=null,i=0,hold=false,locating=false,timer=0;
 const draw=(n,d,extra,isMine)=>{pin.classList.toggle("on",!!isMine);roll.classList.remove("in");void roll.offsetWidth;roll.innerHTML=card(n,d,extra);roll.classList.add("in")};
 const showMine=()=>{draw(mine.n,mine.d,mine.extra,true);start()}; // 내 위치를 보여 준 뒤 3초 후 전국 롤링으로 이어진다
 const next=()=>{draw(R[i][0],cities[i]);i=(i+1)%R.length};
 const start=()=>{clearInterval(timer);timer=setInterval(()=>{if(!hold&&!document.hidden&&cities.length)next()},3000)};
 // 내 위치: 이미 허용한 방문자는 바로, 아니면 "나의 위치"를 눌렀을 때 한 번만 묻는다
 function locate(){
  if(locating||!navigator.geolocation)return;locating=true;
  navigator.geolocation.getCurrentPosition(
   async p=>{locating=false;try{
    const la=p.coords.latitude,lo=p.coords.longitude;
    // 지명은 OpenWeatherMap 역지오코딩(한국어 이름). 실패하면 "내 위치"
    const [[d],nm]=await Promise.all([get([["",la,lo]],key),fetch(`https://api.openweathermap.org/geo/1.0/reverse?lat=${la}&lon=${lo}&limit=1&appid=${encodeURIComponent(key)}`).then(ok).then(g=>g[0]&&((g[0].local_names||{}).ko||g[0].name)).catch(()=>"")]);
    const acc=p.coords.accuracy;
    mine={n:nm||"내 위치",d,extra:` · 위치 정확도 약 ${acc>=1000?(acc/1000).toFixed(1)+"km":Math.round(acc)+"m"}`};showMine();
   }catch{}},
   ()=>{locating=false;pin.title="브라우저의 위치 권한을 허용해 주세요"},
   {timeout:10000,maximumAge:60000,enableHighAccuracy:true});
 }
 if(!navigator.geolocation)pin.remove();
 pin.onclick=()=>mine?showMine():locate();
 roll.onmouseenter=()=>hold=true;roll.onmouseleave=()=>hold=false;
 cached(key).then(ds=>{cities=ds;if(mine)start();else{next();start()}}).catch(()=>{roll.textContent="전국 날씨를 불러오지 못했습니다"});
 if(navigator.permissions)navigator.permissions.query({name:"geolocation"}).then(s=>{if(s.state==="granted")locate()}).catch(()=>{});
};
})();

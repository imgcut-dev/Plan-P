// 사이트 데이터 로더. Firestore(site/config + posts)에서 읽고, 실패하거나 비어 있으면 DEFAULT
const P=[ // id,title,cats,date,author,excerpt,img seed
["when-you-tell-them-the-truth","When you tell them the truth",["Opinion"],"Isabella","Ei mei scripta intellegat. Verear voluptaria eam at, consul putent eu vel. Pro saepe maluisset ne, audire maiorum forensibus eos et. Diceret detraxit vis at. Eum et iidque tollit assentior, ullum soleat usu id.","street-man"],
["hero-half","Hero-Half Post Example",["Books"],"Lucas","Quo natum nemore putant in, his te case habemus. Nulla detraxit explicari in vim.","woman-work"],
["move-out","I decided to move out of the house",["Books","Politics"],"Lucas","Labore incorrupte vim an. Id augue populo alienum usu, has harum consectetuer ne, ne clita fuisset dignissim quo. Semper oportere assueverit eum eu. Ex facilisi dignissim vituperata mei, ad noluisse assueverit sea. Nam no dico quas delectus.","old-man-horse"],
["unwrapped","This is my 2024 unwrapped",["Opinion"],"Isabella","Lorem ipsum dolor sit amet, ei officiis assueverit pri.","couple"],
["rebel","Rebel Wilson weds Ramona Agruma in Sydney – and this time it’s for real",["Interview"],"Lucas","Quo natum nemore putant in, his te case habemus.","airplane"],
["truth2","When you tell them the truth",["Opinion"],"Isabella","Ei mei scripta intellegat verear voluptaria.","blonde"],
["welcome","Welcome To The Finest WordPress Theme For Writers",["Books"],"Lucas","Pro saepe maluisset ne, audire maiorum molestiae ad.","joy"],
["grad","I’m a high school graduate",["Business"],"Lucas","Quo natum nemore putant in, his te case habemus. Nulla detraxit explicari in vim. Id eam magna omnesque.","fabric"],
["exam","My entrance exam was on a book of matches",["Business"],"Isabella","Ei mei scripta intellegat. Verear voluptaria eam at, consul putent eu vel. Pro saepe maluisset ne, audire maiorum.","mosque"],
["rhoda","My name is Rhoda Morgenstern",["Business","Interview"],"Lucas","Lorem ipsum dolor sit amet, ei officiis assueverit pri, duo volumus commune molestiae ad, cum at clita latine.","oilrig"],
["tonight","Tonight what heights we’ll hit, on with the show this is it",["Business"],"Isabella","Labores incorrupte vim an. Id augue populo alienum usu, has harum consectetuer ne, ne clita fuisset dignissim quo.","underwater"],
["first-thing","The first thing I remember liking that liked me back was food",["Travel"],"Lucas","Ius ea rebum nostrum offendit. Per in recusabo facilisis, est ei choro veritus gloriatur. Has ut dicant fuisset.","workshop"],
["pakistan","Last Trip to Pakistan",["Travel"],"Isabella","Justo fabulas singulis at pri, saepe luptatum mei an. Duo idque solet scribentur eu, natum iudico labore te.","temple"],
["gallery","Post Gallery – Slider",["Travel"],"Lucas","Patrioque assentior ea vim. Volutpat salutandi ex his, cu sea soluta melius gubergren, has latine reprehendunt ea.","forest-soldier"],
["vote","We vote for our rights",["Travel"],"Isabella","Hey there. This is an excerpt.","vote"],
["ny","New York, this is your last chance",["Politics"],"Lucas","Quo natum nemore putant in, his te case habemus. Nulla detraxit explicari.","factory"],
["okavango","Helping to Protect the Okavango Basin",["Politics"],"Isabella","Labore nonumes te vel, vis id errem tantas tempor. Solet quidam salutatus.","speech"],
["old-man","An Old Man Telling Me about Wars",["Politics"],"Lucas","Ius ea rebum nostrum offendit. Per in recusabo facilisis, est ei choro.","desk-man"],
["vault","Enter at your peril, past the vault door",["Opinion","Politics"],"Isabella","Duo dolorum mandamus mnesarchum te. Sit ridens persius ex. Vel noluisse perpetua.","beach"],
];
const DEFAULT={
 site:{name:"Plan-P",skin:"plan-p",accent:"#4F46E5",accentText:"#4338CA",footer:"© 2026 Plan-P · A blog for writers"},
 nav:[["Home","#/"],["Posts","#/all"],["Business","#/cat/Business"],["Interview","#/cat/Interview"],["Politics","#/cat/Politics"],["Travel","#/cat/Travel"],["Opinion","#/cat/Opinion"],["Books","#/cat/Books"]].map(([label,url])=>({label,url})),
 posts:[
  {id:"editor-test",title:"에디터 테스트",cats:["Opinion"],author:"Admin",date:"2026-11-17",status:"published",img:"https://picsum.photos/seed/editor-test/900/700",ex:"관리자 에디터(TOAST UI)로 작성한 테스트 글입니다.",body:"## 소제목\n\n**굵게** 본문 *기울임*\n\n- 목록1\n- 목록2\n\n![sample](https://picsum.photos/seed/a/400/200)"},
  ...P.map(([id,title,cats,author,ex,seed])=>({id,title,cats,author,ex,body:"",status:"published",date:"2025-01-08",img:`https://picsum.photos/seed/${seed}/900/700`}))
 ],
 home:{feature:"when-you-tell-them-the-truth",picks:["move-out","pakistan","rhoda"],count:6}
};
const SERIF="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@400;700&display=swap";
// 스킨(디자인 팩): 색·글꼴·모서리를 통째로 바꾼다. 실제 CSS는 skins.css, 여기는 이름과 기본 포인트색
const SKINS={
 "plan-p":{name:"플랜-P 블루",desc:"흰 바탕, 파랑 포인트, 평평한 면. 기본 스킨",accent:"#4F46E5",accentText:"#4338CA",sw:["#FFFFFF","#E8F0FE","#4F46E5","#1F2328"]},
 journal:{name:"저널",desc:"종이 느낌 바탕, 골드 포인트, 세리프 제목",accent:"#B18443",accentText:"#8A6330",sw:["#FAF8F3","#EFE9DB","#B18443","#2A2622"],font:SERIF},
 dark:{name:"다크",desc:"어두운 바탕, 연한 보라 포인트",accent:"#4F46E5",accentText:"#A5B4FC",sw:["#14161A","#1C2027","#4F46E5","#E8EAED"]},
 reader:{name:"리더 (사이드바)",desc:"왼쪽 고정 사이드바, 세리프 본문, 가는 구분선. 읽기에 집중하는 미니멀 블로그",accent:"#1B1B1A",accentText:"#1B1B1A",sw:["#FCFBF8","#F3F0E8","#1B1B1A","#6A675F"],font:SERIF},
 studio:{name:"스튜디오 (포트폴리오)",desc:"큼직한 굵은 제목, 파스텔 그라데이션 바탕, 노란 형광펜 포인트, 둥근 버튼",accent:"#0D0D0D",accentText:"#0D0D0D",sw:["#FFFFFF","#FFFBD0","#FDF800","#0D0D0D"]}
};
// 메인 화면 섹션 종류. 메인은 이 섹션들의 순서 있는 목록(home.sections)이다
const SECTIONS={
 chips:{name:"카테고리 버튼",desc:"카테고리로 바로 이동하는 둥근 버튼 줄",def:{}},
 picks:{name:"추천 글",desc:"나란히 보이는 3칸. 직접 고른 글이 들어갑니다",def:{ids:["","",""]}},
 feature:{name:"대표 글",desc:"큰 이미지와 요약으로 보이는 글 1개. 소개 영역을 옆에 둘 수 있습니다",def:{post:"",about:true}},
 latest:{name:"최신 글",desc:"가장 최근에 발행한 글이 자동으로 쌓입니다",def:{title:"최신 글",count:6}},
 category:{name:"카테고리별 글",desc:"고른 카테고리의 최신 글이 자동으로 쌓입니다",def:{title:"",cat:"",count:3}},
 text:{name:"텍스트·배너",desc:"공지나 소개 문구와 버튼 하나",def:{title:"",body:"",label:"",url:""}}
};
// sections가 없는 예전 설정은 기존 메인 구성(추천 3 → 대표 → 최신)으로 간주한다
const homeSections=H=>H.sections||[{type:"chips"},{type:"picks",ids:[...(H.picks||[]),"","",""].slice(0,3)},{type:"feature",post:H.feature||"",about:true},{type:"latest",title:"최신 글",count:H.count||6}];
// all=true: 임시저장 글까지 (관리자 전용, 규칙이 막음)
async function loadCfg(all){
 try{
  const F=await import("./fb.js"),{db,doc,getDoc,getDocs,collection,query,where}=F;
  const [c,ps]=await Promise.all([getDoc(doc(db,"site","config")),getDocs(all?collection(db,"posts"):query(collection(db,"posts"),where("status","==","published")))]);
  const posts=ps.docs.map(d=>d.data());
  // 설정 문서가 아직 없어도 올린 글이 있으면 보여 준다 (설정·메뉴·메인은 기본값)
  if(c.exists()||posts.length)return {...structuredClone(DEFAULT),...(c.exists()?c.data():{}),posts};
 }catch(e){console.warn("Firestore 읽기 실패, 기본 데이터 사용",e)}
 return structuredClone(DEFAULT);
}

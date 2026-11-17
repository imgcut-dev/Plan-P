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
 site:{name:"Plan-P",accent:"#4F46E5",accentText:"#4338CA",footer:"© 2026 Plan-P · A blog for writers"},
 nav:[["Home","#/"],["Posts","#/all"],["Business","#/cat/Business"],["Interview","#/cat/Interview"],["Politics","#/cat/Politics"],["Travel","#/cat/Travel"],["Opinion","#/cat/Opinion"],["Books","#/cat/Books"]].map(([label,url])=>({label,url})),
 posts:[
  {id:"editor-test",title:"에디터 테스트",cats:["Opinion"],author:"Admin",date:"2026-11-17",status:"published",img:"https://picsum.photos/seed/editor-test/900/700",ex:"관리자 에디터(TOAST UI)로 작성한 테스트 글입니다.",body:"## 소제목\n\n**굵게** 본문 *기울임*\n\n- 목록1\n- 목록2\n\n![sample](https://picsum.photos/seed/a/400/200)"},
  ...P.map(([id,title,cats,author,ex,seed])=>({id,title,cats,author,ex,body:"",status:"published",date:"2025-01-08",img:`https://picsum.photos/seed/${seed}/900/700`}))
 ],
 home:{feature:"when-you-tell-them-the-truth",picks:["move-out","pakistan","rhoda"],count:6}
};
// all=true: 임시저장 글까지 (관리자 전용, 규칙이 막음)
async function loadCfg(all){
 try{
  const F=await import("./fb.js"),{db,doc,getDoc,getDocs,collection,query,where}=F;
  const [c,ps]=await Promise.all([getDoc(doc(db,"site","config")),getDocs(all?collection(db,"posts"):query(collection(db,"posts"),where("status","==","published")))]);
  if(c.exists())return {...c.data(),posts:ps.docs.map(d=>d.data())};
 }catch(e){console.warn("Firestore 읽기 실패, 기본 데이터 사용",e)}
 return structuredClone(DEFAULT);
}

// 사이트 데이터 로더. 우선순위: 이 브라우저의 관리자 저장본(localStorage) → data.json(게시본) → DEFAULT
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
 site:{name:"Plan-P",accent:"#0a6fd6",accentDark:"#4da3ff",footer:"© 2026 Plan-P · A blog for writers",subscribe:"Subscribe",theme:"light"},
 nav:[["Home","#/"],["Posts","#/all"],["Business","#/cat/Business"],["Interview","#/cat/Interview"],["Politics","#/cat/Politics"],["Travel","#/cat/Travel"],["Opinion","#/cat/Opinion"],["Books","#/cat/Books"]].map(([label,url])=>({label,url})),
 posts:P.map(([id,title,cats,author,ex,seed])=>({id,title,cats,author,ex,body:"",date:"2025-01-08",img:`https://picsum.photos/seed/${seed}/900/700`})),
 home:{feature:"when-you-tell-them-the-truth",left:["hero-half","old-man"],latest:["unwrapped","rebel","truth2","hero-half","welcome"],
  sections:[{cat:"Business",layout:"grid"},{cat:"Travel",layout:"grid"},{cat:"Politics",layout:"feature"}]}
};
async function loadCfg(){
 try{const s=localStorage.planp_cfg;if(s)return JSON.parse(s)}catch{}
 try{const r=await fetch("data.json",{cache:"no-store"});if(r.ok)return await r.json()}catch{}
 return structuredClone(DEFAULT);
}

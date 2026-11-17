// 글 아래 추천·댓글·대댓글(1단계)·댓글 추천. 글 화면에서만 지연 로드한다.
// 규칙은 firestore.rules(comments, likes). 작성자는 Google 로그인.
import {auth,db,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged,collection,query,where,getDocs,addDoc,setDoc,deleteDoc,doc,serverTimestamp} from "./fb.js";

const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const ev=(n,p)=>window.gaEvent&&gaEvent(n,p);
const MAX=500,GAP=10000; // 글자 수, 연속 작성 간격(ms). 간격은 화면에서만 막는다
const when=t=>{const d=t&&t.toDate?t.toDate():null;return d?d.toLocaleString("ko-KR",{year:"numeric",month:"numeric",day:"numeric",hour:"2-digit",minute:"2-digit"}):""};
const av=(c)=>c.photo?`<img class="cm-av" src="${esc(c.photo)}" alt="" referrerpolicy="no-referrer">`:`<span class="cm-av">${esc((c.name||"?")[0])}</span>`;
let U=null,last=0,seq=0,off=null;

export function mount(el,pid){
 const my=++seq;let cs=[],ls=[],open=null,busy=false;
 const alive=()=>my===seq&&el.isConnected;
 const L=cid=>ls.filter(l=>(l.cid||null)===cid);
 const mine=cid=>U&&ls.some(l=>l.id===(cid?cid+"_"+U.uid:U.uid));
 async function load(){
  try{
   const [a,b]=await Promise.all([getDocs(query(collection(db,"posts",pid,"comments"),where("status","==","visible"))),getDocs(collection(db,"posts",pid,"likes"))]);
   cs=a.docs.map(d=>({id:d.id,...d.data()}));ls=b.docs.map(d=>({id:d.id,...d.data()}));
  }catch(e){console.warn("댓글 읽기 실패",e);cs=[];ls=[];el.dataset.err="1"}
  if(alive())draw();
 }
 const form=(pa,ph)=>U?`<form class="cm-f" data-pa="${pa||""}"><textarea maxlength="${MAX}" rows="${pa?2:3}" placeholder="${ph}" aria-label="${ph}" required></textarea><div class="cm-r"><span class="cm-n">${esc(U.displayName||"")}</span><span><span class="cm-c">0/${MAX}</span><button class="cm-b" ${busy?"disabled":""}>등록</button></span></div></form>`
  :`<button class="cm-login" data-a="login">Google로 로그인하고 ${pa?"답글":"댓글"} 쓰기</button>`;
 const item=(c,reply)=>{
  const rs=reply?[]:cs.filter(x=>x.parentId===c.id).sort((a,b)=>(a.createdAt?.seconds||0)-(b.createdAt?.seconds||0));
  return `<li class="cm-i${reply?" cm-re":""}" id="c-${esc(c.id)}"><div class="cm-h">${av(c)}<b>${esc(c.name)}</b><span class="cm-d">${when(c.createdAt)}</span></div>
  <p class="cm-t">${esc(c.text)}</p>
  <div class="cm-a"><button class="cm-k${mine(c.id)?" on":""}" data-a="like" data-c="${esc(c.id)}" aria-pressed="${mine(c.id)}">♥ ${L(c.id).length}</button>${reply?"":`<button data-a="reply" data-c="${esc(c.id)}">답글${rs.length?" "+rs.length:""}</button>`}${U&&U.uid===c.uid?`<button data-a="del" data-c="${esc(c.id)}">삭제</button>`:""}</div>
  ${open===c.id?form(c.id,"답글을 입력하세요"):""}
  ${rs.length?`<ul class="cm-l">${rs.map(r=>item(r,true)).join("")}</ul>`:""}</li>`;
 };
 function draw(){
  const top=cs.filter(c=>!c.parentId).sort((a,b)=>(b.createdAt?.seconds||0)-(a.createdAt?.seconds||0));
  const keep=el.querySelector(".cm-f:not([data-pa]) textarea")?.value||"";
  el.innerHTML=`<section class="cm" aria-label="추천과 댓글">
   <div class="cm-top"><button class="cm-k cm-big${mine(null)?" on":""}" data-a="like" aria-pressed="${mine(null)}">♥ 추천 ${L(null).length}</button><h2 class="cm-h2">댓글 ${cs.length}</h2>${U?`<button class="cm-out" data-a="out">로그아웃</button>`:""}</div>
   ${el.dataset.err?`<p class="cm-m">댓글을 불러오지 못했습니다. 잠시 뒤 다시 시도해 주세요.</p>`:""}
   ${form("","댓글을 입력하세요 (최대 "+MAX+"자)")}
   <ul class="cm-l">${top.map(c=>item(c)).join("")||'<li class="cm-m">첫 댓글을 남겨 보세요.</li>'}</ul></section>`;
  const t=el.querySelector(".cm-f:not([data-pa]) textarea");if(t&&keep)t.value=keep;
 }
 async function like(cid){
  if(!U)return login();
  const id=cid?cid+"_"+U.uid:U.uid,r=doc(db,"posts",pid,"likes",id);
  try{if(mine(cid)){await deleteDoc(r);ls=ls.filter(l=>l.id!==id)}else{await setDoc(r,{uid:U.uid,cid:cid||null});ls.push({id,uid:U.uid,cid:cid||null});ev("like_click",{target:cid?"comment":"post",post_id:pid})}}
  catch(e){alert("처리하지 못했습니다. 잠시 뒤 다시 시도해 주세요.")}
  draw();
 }
 async function submit(f){
  const text=f.querySelector("textarea").value.trim(),pa=f.dataset.pa||null;
  if(!text||busy)return;
  if(Date.now()-last<GAP)return alert("잠시 뒤에 다시 등록해 주세요.");
  busy=true;f.querySelector(".cm-b").disabled=true;
  try{
   await addDoc(collection(db,"posts",pid,"comments"),{uid:U.uid,name:(U.displayName||"익명").slice(0,40),photo:U.photoURL||null,text:text.slice(0,MAX),createdAt:serverTimestamp(),parentId:pa,status:"visible"});
   last=Date.now();open=null;ev("comment_submit",{post_id:pid,is_reply:!!pa});el.dataset.err="";
  }catch(e){alert("등록하지 못했습니다. 로그인 상태를 확인해 주세요.")}
  busy=false;await load();
 }
 const login=()=>signInWithPopup(auth,new GoogleAuthProvider()).catch(()=>{});
 el.onclick=async e=>{
  const b=e.target.closest("[data-a]");if(!b)return;
  const a=b.dataset.a,c=b.dataset.c||null;
  if(a==="login")login();
  else if(a==="out")signOut(auth);
  else if(a==="like")like(c);
  else if(a==="reply"){if(!U)return login();open=open===c?null:c;draw();el.querySelector(`#c-${CSS.escape(c)} .cm-f textarea`)?.focus()}
  else if(a==="del"&&confirm("이 댓글을 삭제할까요?")){
   try{await deleteDoc(doc(db,"posts",pid,"comments",c));await load()}catch{alert("삭제하지 못했습니다.")}
  }
 };
 el.onsubmit=e=>{e.preventDefault();submit(e.target)};
 el.oninput=e=>{const n=e.target.closest(".cm-f")?.querySelector(".cm-c");if(n)n.textContent=e.target.value.length+"/"+MAX};
 // 로그인 상태가 바뀌면 다시 그린다 (처음 한 번은 load가 그린다)
 let first=true;
 if(off)off();
 off=onAuthStateChanged(auth,u=>{U=u;if(first){first=false;load()}else if(alive())draw()});
}

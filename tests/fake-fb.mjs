// fb.js 대역: 메모리 안의 가짜 Firestore/Auth. 규칙(권한)은 검사하지 않는다 — 규칙은 에뮬레이터 테스트(TC-R)가 맡는다
const store=new Map(); // "posts/p1/comments/c1" -> 데이터
const listeners=new Set();
let seq=0;
export const db={},auth={currentUser:null};
export const __ctl={store,popups:0,nextUser:null,failRead:false,failWrite:false,
 reset(){store.clear();__ctl.popups=0;__ctl.failRead=false;__ctl.failWrite=false;__ctl.nextUser=null;seq=0;__ctl.setUser(null)},
 setUser(u){auth.currentUser=u;listeners.forEach(cb=>cb(u))},
 put(path,data){store.set(path,data)}};
const ref=path=>{const s=path.split("/");return {path,id:s.at(-1),get parent(){return s.length>1?ref(s.slice(0,-1).join("/")):null}}};
const copy=d=>{const o={};for(const k in d){const v=d[k];o[k]=v&&typeof v==="object"&&v.seconds!==undefined?{seconds:v.seconds,toDate:()=>new Date(v.seconds*1000)}:Array.isArray(v)?[...v]:v}return o};
const snap=path=>({id:path.split("/").at(-1),ref:ref(path),data:()=>copy(store.get(path))});
export class GoogleAuthProvider{}
export const signInWithPopup=async()=>{__ctl.popups++;if(__ctl.nextUser)__ctl.setUser(__ctl.nextUser)};
export const signOut=async()=>__ctl.setUser(null);
export const onAuthStateChanged=(a,cb)=>{listeners.add(cb);Promise.resolve().then(()=>cb(auth.currentUser));return()=>listeners.delete(cb)};
export const collection=(d,...s)=>({kind:"col",path:s.join("/")});
export const collectionGroup=(d,name)=>({kind:"group",name});
export const doc=(d,...s)=>ref(s.join("/"));
export const where=(f,op,v)=>({f,op,v});
export const query=(col,...cons)=>({...col,cons});
export const serverTimestamp=()=>({__ts:true});
const stamp=()=>({seconds:Math.floor(Date.now()/1000)});
const resolve=data=>{const o={...data};for(const k in o)if(o[k]&&o[k].__ts)o[k]=stamp();return o};
export const getDocs=async q=>{
 if(__ctl.failRead)throw new Error("permission-denied");
 const out=[];
 for(const [p] of store){
  const s=p.split("/");
  if(q.kind==="group"?(s.length%2===0&&s.at(-2)===q.name):(p.startsWith(q.path+"/")&&s.length===q.path.split("/").length+1)){
   const d=store.get(p);
   if((q.cons||[]).every(c=>d[c.f]===c.v))out.push(snap(p))}}
 return {docs:out};
};
export const getDoc=async r=>({exists:()=>store.has(r.path),data:()=>copy(store.get(r.path))});
export const addDoc=async(col,data)=>{if(__ctl.failWrite)throw new Error("permission-denied");const id="c"+(++seq);store.set(col.path+"/"+id,resolve(data));return ref(col.path+"/"+id)};
export const setDoc=async(r,data)=>{if(__ctl.failWrite)throw new Error("permission-denied");store.set(r.path,resolve(data))};
export const updateDoc=async(r,data)=>{if(__ctl.failWrite)throw new Error("permission-denied");store.set(r.path,{...store.get(r.path),...data})};
export const deleteDoc=async r=>{if(__ctl.failWrite)throw new Error("permission-denied");store.delete(r.path)};
export const writeBatch=()=>{const ops=[];return {set:(r,d)=>ops.push(()=>store.set(r.path,resolve(d))),delete:r=>ops.push(()=>store.delete(r.path)),commit:async()=>{if(__ctl.failWrite)throw new Error("permission-denied");ops.forEach(f=>f())}}};

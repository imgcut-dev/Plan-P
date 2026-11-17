// Firebase 초기화 (웹 앱 설정값은 공개용입니다. 접근 제한은 Firestore 규칙이 합니다)
import {initializeApp} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
export {GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
export {doc,getDoc,setDoc,deleteDoc,getDocs,collection,query,where,writeBatch} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import {getAuth} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import {getFirestore} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
const app=initializeApp({apiKey:"AIzaSyAr9dKIE0vRmsof5Uv9fiG8K0fqLCCBYIc",authDomain:"plan-p-1b255.firebaseapp.com",projectId:"plan-p-1b255",storageBucket:"plan-p-1b255.firebasestorage.app",messagingSenderId:"960622142788",appId:"1:960622142788:web:4d79cb5b12fda40e022311"});
export const auth=getAuth(app),db=getFirestore(app);

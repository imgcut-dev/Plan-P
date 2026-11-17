import {loadSite,text} from "./lib.mjs";
const w=await loadSite();
console.log(w.errors.slice(0,3),w.document.querySelectorAll("[data-sec]").length,text(w.document.querySelector("#nav")).slice(0,60));
w.close();process.exit(0);

import {register} from "node:module";
import {writeFileSync} from "node:fs";
import {results,ROOT} from "./lib.mjs";
register("./hooks.mjs",import.meta.url);
const only=process.argv[2];
const suites=[["unit",()=>import("./unit.mjs")],["integration",()=>import("./integration.mjs")],["seo-gen",()=>import("./seo-gen.mjs")],["seo-deploy",()=>import("./seo-deploy.mjs")]];
for(const [n,load] of suites){
 if(only&&only!==n)continue;
 try{await (await load()).default()}catch(e){console.error("스위트 오류",n,e);results.push({id:"SUITE-"+n,result:"Fail",actual:String(e.message).slice(0,200)})}
}
const sum=results.reduce((o,r)=>(o[r.result]=(o[r.result]||0)+1,o),{});
console.log(sum);for(const r of results)if(r.result!=="Pass")console.log("FAIL",r.id,r.actual);
writeFileSync(ROOT+"/docs/test/results-auto.json",JSON.stringify({ranAt:new Date().toISOString(),results},null,1));
process.exit(0);

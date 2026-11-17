// comments.js가 불러오는 "./fb.js"를 가짜로 바꿔 끼운다
export async function resolve(spec,ctx,next){
 if(spec==="./fb.js"&&/\/comments\.js/.test(ctx.parentURL||""))return {url:new URL("./fake-fb.mjs",import.meta.url).href,shortCircuit:true};
 return next(spec,ctx);
}

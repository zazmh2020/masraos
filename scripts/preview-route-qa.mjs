import {readFile,writeFile} from 'node:fs/promises';
const base='http://127.0.0.1:3017';const inventory=JSON.parse(await readFile('../../outputs/route-inventory.json','utf8'));const results=[];
const login=async(email)=>{const r=await fetch(base+'/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:'MasraLocal2026!'})});if(!r.ok)throw new Error('Test login failed');return r.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ')};
const admin=await login('admin@masra.local');const owner=await login('owner@masra.local');
for(const entry of inventory.filter(r=>r.kind==='page')){
 let route=entry.route.replace('[slug]','masra-demo');if(route.includes('[id]')){if(route.includes('/students/'))route=route.replace('[id]','local-student-01');else if(route.includes('/halaqat/'))route=route.replace('[id]','local-halaqa-1');}
 if(route.includes('[')){results.push({route:entry.route,result:'needs_fixture'});continue;}
 try{const r=await fetch(base+route,{headers:{cookie:route.startsWith('/admin')?owner:route.startsWith('/org')?admin:''},redirect:'manual',signal:AbortSignal.timeout(60000)});const body=await r.text();const result=r.status>=500||body.includes('Application error: a server-side exception')?'server_error':r.status===404||body.includes('NEXT_HTTP_ERROR_FALLBACK;404')?'not_found':r.status>=300&&r.status<400||body.includes('NEXT_REDIRECT;')?'redirect':'served';results.push({route,status:r.status,result});}catch(e){results.push({route,result:'request_failed',error:e.message});}
}
await writeFile('../../outputs/route-smoke-qa.json',JSON.stringify(results,null,2));console.log(JSON.stringify({total:results.length,counts:results.reduce((a,r)=>(a[r.result]=(a[r.result]||0)+1,a),{}),failures:results.filter(r=>['server_error','request_failed'].includes(r.result))}));

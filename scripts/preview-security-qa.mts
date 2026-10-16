import dotenv from 'dotenv';
import { randomUUID } from 'node:crypto';
import { writeFile } from 'node:fs/promises';
import pg from 'pg';
import { serializeSession } from '../src/lib/session';
dotenv.config({path:'.env.local',quiet:true});
const db=new URL(process.env.DATABASE_URL!);
if(db.hostname!=='127.0.0.1'||db.pathname!=='/masra_preview_20261013')throw new Error('Tests require the isolated preview database.');
const base='http://127.0.0.1:3017';const checks: { name: string; status?: number; expected?: number; ok: boolean }[]=[];
const req=async(path:string,options:RequestInit={})=>fetch(base+path,{...options,redirect:'manual',signal:AbortSignal.timeout(60000)});
const login=async(email:string)=>{const r=await req('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password:'MasraLocal2026!'})});if(!r.ok)throw new Error('Test login failed');return r.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ')};
const check=async(name:string,path:string,expected:number,options:RequestInit={})=>{const r=await req(path,options);checks.push({name,status:r.status,expected,ok:r.status===expected});return r;};
const other=await login('other-admin@masra.local');
const isolatedPage=await req('/org/masra-check/education/students/local-student-01',{headers:{cookie:other}});const isolatedHtml=await isolatedPage.text();checks.push({name:'Cross-tenant student page rejected',ok:(isolatedPage.status===404||isolatedHtml.includes('NEXT_HTTP_ERROR_FALLBACK;404'))&&!isolatedHtml.includes('student-timeline-title')});
await check('Cross-tenant registration write','/api/org/education/students/local-student-01/registration',404,{method:'PUT',headers:{cookie:other,'Content-Type':'application/json'},body:'{}'});
await check('Unauthenticated statistics','/api/org/education/attendance/statistics?from=2026-09-21&to=2026-09-25',403);
const guardian=await login('guardian@masra.local');
const guardianPage=await req('/org/masra-demo/education/students/local-student-02',{headers:{cookie:guardian}});const guardianHtml=await guardianPage.text();checks.push({name:'Guardian staff profile redirected before student rendering',ok:(guardianPage.status===307||guardianHtml.includes('NEXT_REDIRECT;replace;/org/masra-demo;307'))&&!guardianHtml.includes('student-timeline-title')&&!guardianHtml.includes('طالب تجريبي 02')});
await check('Guardian cannot modify students','/api/org/education/students',403,{method:'POST',headers:{cookie:guardian,'Content-Type':'application/json'},body:'{}'});
const demo=serializeSession({userId:'local-admin',email:'admin@masra.local',name:'Local review',role:'ORG_ADMIN',organizationId:'local-org-demo',organizationSlug:'masra-demo',sessionVersion:0,demo:true});
for(const method of ['POST','PUT','PATCH','DELETE'])await check('Signed demo blocks '+method,'/api/org/education/students',403,{method,headers:{cookie:`midad_session=${demo}`,'Content-Type':'application/json'},body:'{}'});
const id=randomUUID().slice(0,8);const slug='qa-'+id;const email='qa-'+id+'@example.test';const client=new pg.Client({connectionString:db.href});await client.connect();
try{
 const start=await check('Signup start local OTP','/api/auth/signup/start',200,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:'Local QA',orgName:'Disposable QA center',slug,email,password:randomUUID()+'A1!',channel:'EMAIL'})});
 const data=await start.json();if(start.ok&&data.devCode){const verified=await check('Signup verify creates center','/api/auth/signup/verify',200,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId:data.requestId,code:data.devCode})});if(verified.ok){const cookie=verified.headers.getSetCookie().map(s=>s.split(';')[0]).join('; ');await check('New center onboarding loads','/org/'+slug,200,{headers:{cookie}});const org=(await client.query('SELECT id FROM organizations WHERE slug=$1',[slug])).rows[0];await client.query('UPDATE organizations SET "sitePublished"=true WHERE id=$1',[org.id]);for(const published of [true,false])await client.query('INSERT INTO announcements (id,title,body,"organizationId","isPublished") VALUES ($1,$2,$3,$4,$5)',[randomUUID(),(published?'public-':'private-')+id,'Temporary QA announcement',org.id,published]);const publicPage=await req('/site/'+slug);const publicHtml=await publicPage.text();checks.push({name:'Public website excludes unpublished announcements',ok:publicHtml.includes('public-'+id)&&!publicHtml.includes('private-'+id)});await check('OTP cannot be reused','/api/auth/signup/verify',400,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({requestId:data.requestId,code:data.devCode})});}}
}finally{
 await client.query('DELETE FROM organizations WHERE slug=$1 AND name=$2',[slug,'Disposable QA center']);await client.query('DELETE FROM signup_requests WHERE email=$1',[email]);await client.end();
}
await writeFile('../../outputs/security-and-signup-qa.json',JSON.stringify(checks,null,2));console.log(JSON.stringify(checks));if(checks.some(c=>!c.ok))process.exitCode=1;

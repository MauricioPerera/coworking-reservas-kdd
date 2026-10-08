import assert from 'node:assert/strict';
import { test } from 'node:test';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createServer } from 'node:net';
import { createHash, randomUUID } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { git } from '../../src/git.mjs';

export const root = fileURLToPath(new URL('../../', import.meta.url));
export const bookingKey = 'coworking-reservas:v1';
export const localeKey = 'coworking-reservas:locale:v1';
export const draft = (title='Meeting', extra={}) => ({title, roomId:'atlas', date:'2030-06-12', start:'10:00', end:'11:00', ...extra});
export const empty = () => ({version:1,nextId:1,bookings:[]});
const wait = ms => new Promise(resolve=>setTimeout(resolve,ms));
const files = ['tests/support/shared-fixture.mjs','tests/shared-api.test.mjs','tests/shared-ui.test.mjs',
  'knowledge/contracts/shared-booking-api.md','knowledge/contracts/shared-booking-ui.md',
  'example/server.mjs','example/shared-api.mjs','example/shared-store.mjs','example/shared-client.mjs',
  'example/client.mjs','example/index.html','example/booking-model.mjs','example/booking-storage.mjs',
  'src/git.mjs','package.json','package-lock.json'];
const digests=()=>Object.fromEntries(files.map(file=>[file,existsSync(path.join(root,file))?createHash('sha256').update(readFileSync(path.join(root,file))).digest('hex'):null]));

export function recorder(suite, expectedNames) {
  const directory=path.join(root,'.e2e/shared-runs',randomUUID()); mkdirSync(directory,{recursive:true});
  const startedAt=new Date().toISOString(), commit=git(root,['rev-parse','HEAD']), inputDigests=digests();
  assert.equal(git(root,['status','--porcelain','--untracked-files=no']),'','Commit changes before collecting shared evidence');
  const results=[], traces=[], fixtures=[];
  return {
    directory, traces, fixtures,
    check(name, run) {
      assert.ok(expectedNames.includes(name));
      test(name,{timeout:20000},async t=>{
        const start=performance.now();
        try {await run(t); results.push({name,status:'passed',durationMs:Math.round(performance.now()-start)});}
        catch(error) {results.push({name,status:'failed',durationMs:Math.round(performance.now()-start),error:error.message});throw error;}
      });
    },
    finish(runtime={}) {
      const inputsUnchanged=JSON.stringify(inputDigests)===JSON.stringify(digests());
      const cleanupVerified=fixtures.every(fixture=>fixture.children.every(child=>child.exitCode!==null||child.signalCode!==null));
      const complete=results.length===expectedNames.length&&new Set(results.map(result=>result.name)).size===expectedNames.length;
      const report={schemaVersion:'kdd-shared-bookings-1',suite,status:complete&&results.every(result=>result.status==='passed')&&inputsUnchanged&&cleanupVerified?'locally_verified':'failed',
        commit,startedAt,finishedAt:new Date().toISOString(),inputDigests,inputsUnchanged,cleanupVerified,
        runtime:{node:process.version,platform:process.platform,...runtime},
        ci:process.env.GITHUB_RUN_ID?{repository:process.env.GITHUB_REPOSITORY,runId:process.env.GITHUB_RUN_ID,headSha:process.env.GITHUB_SHA,runUrl:`https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`} :null,
        expectedCases:expectedNames,results,traces};
      writeFileSync(path.join(directory,'report.json'),JSON.stringify(report,null,2)+'\n');
      assert.equal(inputsUnchanged,true); assert.equal(cleanupVerified,true,'Server process cleanup failed');
      return report;
    },
  };
}

export async function fixture(t, record, {blocked=false}={}) {
  const directory=path.join(record.directory,randomUUID());mkdirSync(directory,{recursive:true});
  const probe=createServer();probe.listen(0,'127.0.0.1');await once(probe,'listening');
  const port=probe.address().port;await new Promise(resolve=>probe.close(resolve));
  const base=`http://127.0.0.1:${port}`;
  const dbPath=path.join(directory,'bookings.sqlite');
  if(blocked)writeFileSync(dbPath,'This is deliberately not a SQLite database');
  const current={base,dbPath,children:[],directory}; record.fixtures.push(current);
  let child, log='';
  current.start=async()=>{
    child=spawn(process.execPath,['example/server.mjs'],{cwd:root,env:{...process.env,PORT:String(port),SHARED_DB_PATH:dbPath},windowsHide:true,stdio:['ignore','pipe','pipe']});
    current.children.push(child);
    for(const stream of [child.stdout,child.stderr])stream.on('data',bytes=>{log+=bytes;});
    let ready=false;
    for(let attempt=0;attempt<60;attempt++){
      assert.equal(child.exitCode,null,log);
      try {const response=await fetch(base+'/reservas',{signal:AbortSignal.timeout(200)});ready=response.status===200;await response.text();}catch{}
      if(ready)break;await wait(50);
    }
    assert.equal(ready,true,'Server unavailable: '+log);return child.pid;
  };
  current.stop=async(signal='SIGTERM')=>{
    if(!child||child.exitCode!==null||child.signalCode!==null)return;
    await new Promise((resolve,reject)=>{
      const timeout=setTimeout(()=>{child.kill('SIGKILL');},2500);
      child.once('close',()=>{clearTimeout(timeout);resolve();});
      child.once('error',error=>{clearTimeout(timeout);reject(error);});child.kill(signal);
    });
  };
  current.request=async(method,route,data,options={})=>{
    const startedAt=new Date().toISOString();
    const response=await fetch(base+route,{method,headers:{...(data!==undefined?{'content-type':'application/json'}:{}),...options.headers},
      ...(data!==undefined?{body:typeof data==='string'?data:JSON.stringify(data)}:{}),signal:AbortSignal.timeout(5000)});
    const text=await response.text();let body;try{body=JSON.parse(text);}catch{body=text;}
    record.traces.push({method,route,startedAt,finishedAt:new Date().toISOString(),status:response.status,body});
    return {status:response.status,body,headers:response.headers};
  };
  current.read=()=>current.request('GET','/api/bookings');
  current.reserve=value=>current.request('POST','/api/bookings',value);
  current.cancel=id=>current.request('POST',`/api/bookings/${id}/cancel`,{});
  t.after(async()=>{await current.stop();writeFileSync(path.join(directory,'server.log'),log);});
  await current.start();return current;
}

export async function converge(pages, titles, record, label) {
  const start=performance.now(), wanted=[...titles].sort();let actual;
  while(performance.now()-start<5000){
    actual=await Promise.all(pages.map(page=>page.locator('.booking-title').allTextContents()));
    if(actual.every(values=>JSON.stringify(values.sort())===JSON.stringify(wanted))){
      record.traces.push({type:'convergence',label,limitMs:5000,durationMs:Math.round(performance.now()-start),titles:wanted});return;
    }
    await wait(25);
  }
  assert.fail(`Agendas did not converge within 5000 ms: ${JSON.stringify(actual)} expected ${JSON.stringify(wanted)}`);
}

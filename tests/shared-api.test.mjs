import {after} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {recorder,fixture,draft,empty} from './support/shared-fixture.mjs';

const names=['returns the canonical empty snapshot','two simultaneous identical reservations have exactly one winner',
  'simultaneous partially overlapping intervals have exactly one winner','twelve parallel nonconflicting writes are all preserved with unique IDs',
  'adjacent intervals are accepted concurrently','different rooms are accepted concurrently','different dates are accepted concurrently',
  'invalid drafts leave revision and data unchanged','concurrent cancellation preserves history and releases only its target',
  'protocol and unknown targets reject without mutation','a forced server restart preserves confirmed and cancelled state',
  'a real SQLite update failure rolls back without confirmation','a competing SQLite writer fails safely and later recovers',
  'a corrupt persisted snapshot is preserved and reported','an invalid database stays intact while local mode remains available'];
const record=recorder('api',names);after(()=>record.finish());
const check=(name,run)=>record.check(name,async t=>{const current=await fixture(t,record);await run(current);});
const snapshot=async current=>{const response=await current.read();assert.equal(response.status,200);assert.equal(response.headers.get('cache-control'),'no-store');return response.body;};

check(names[0],async current=>{assert.deepEqual(await snapshot(current),{revision:0,state:empty()});});
check(names[1],async current=>{
  const responses=await Promise.all([current.reserve(draft('User A')),current.reserve(draft('User B'))]);
  assert.deepEqual(responses.map(response=>response.status).sort(),[201,409]);
  assert.equal(responses.find(response=>response.status===409).body.error.code,'CONFLICT');
  const value=await snapshot(current);assert.equal(value.revision,1);assert.equal(value.state.nextId,2);assert.equal(value.state.bookings.length,1);
  assert.equal(value.state.bookings[0].status,'confirmed');assert.ok(['User A','User B'].includes(value.state.bookings[0].title));
});
check(names[2],async current=>{
  const responses=await Promise.all([current.reserve(draft('Early')),current.reserve(draft('Late',{start:'10:30',end:'11:30'}))]);
  assert.deepEqual(responses.map(response=>response.status).sort(),[201,409]);assert.equal((await snapshot(current)).state.bookings.length,1);
});
check(names[3],async current=>{
  const values=Array.from({length:12},(_,index)=>draft(`Parallel ${index}`,{date:`2030-06-${String(index+1).padStart(2,'0')}`}));
  const responses=await Promise.all(values.map(value=>current.reserve(value)));assert.ok(responses.every(response=>response.status===201));
  const value=await snapshot(current);assert.equal(value.revision,12);assert.equal(value.state.nextId,13);assert.equal(value.state.bookings.length,12);
  assert.equal(new Set(value.state.bookings.map(booking=>booking.id)).size,12);
  assert.deepEqual(value.state.bookings.map(booking=>booking.title).sort(),values.map(value=>value.title).sort());
});
for(const [index,extra] of [[4,{start:'11:00',end:'12:00'}],[5,{roomId:'luna'}],[6,{date:'2030-06-13'}]])check(names[index],async current=>{
  const responses=await Promise.all([current.reserve(draft('A')),current.reserve(draft('B',extra))]);
  assert.deepEqual(responses.map(response=>response.status),[201,201]);assert.equal((await snapshot(current)).state.bookings.length,2);
});
check(names[7],async current=>{
  const before=await snapshot(current);
  for(const [extra,code] of [[{title:''},'INVALID_TITLE'],[{roomId:'unknown'},'INVALID_ROOM'],[{date:'2030-02-30'},'INVALID_DATE'],[{start:'10:00',end:'10:00'},'INVALID_INTERVAL'],[{start:'11:00',end:'10:00'},'INVALID_INTERVAL'],[{end:'24:00'},'INVALID_INTERVAL']]){
    const response=await current.reserve(draft('Invalid',extra));assert.equal(response.status,400);assert.equal(response.body.error.code,code);
  }
  assert.deepEqual(await snapshot(current),before);
});
check(names[8],async current=>{
  assert.equal((await current.reserve(draft('Target'))).status,201);assert.equal((await current.reserve(draft('Keep',{roomId:'luna'}))).status,201);
  const responses=await Promise.all([current.cancel('r1'),current.cancel('r1')]);assert.deepEqual(responses.map(response=>response.status).sort(),[200,409]);
  assert.equal(responses.find(response=>response.status===409).body.error.code,'ALREADY_CANCELLED');
  const value=await snapshot(current);assert.equal(value.revision,3);assert.deepEqual(value.state.bookings.map(booking=>booking.status),['cancelled','confirmed']);
  assert.equal((await current.reserve(draft('Reuse'))).status,201);assert.equal((await snapshot(current)).state.bookings.length,3);
});
check(names[9],async current=>{
  const before=await snapshot(current);
  assert.equal((await current.cancel('r9')).status,404);
  assert.equal((await current.request('PUT','/api/bookings',{})).status,405);
  assert.equal((await current.request('GET','/api/bookings/missing')).status,404);
  assert.equal((await current.request('POST','/api/bookings','{broken')).status,400);
  assert.equal((await current.request('POST','/api/bookings',draft(),{headers:{'content-type':'text/plain'}})).status,415);
  assert.equal((await current.request('POST','/api/bookings',draft(),{headers:{origin:'https://untrusted.invalid'}})).status,403);
  assert.deepEqual(await snapshot(current),before);
});
check(names[10],async current=>{
  assert.equal((await current.reserve(draft('History'))).status,201);assert.equal((await current.cancel('r1')).status,200);
  assert.equal((await current.reserve(draft('Kept',{roomId:'luna'}))).status,201);const before=await snapshot(current), oldPid=current.children.at(-1).pid;
  await current.stop('SIGKILL');const newPid=await current.start();assert.notEqual(newPid,oldPid);assert.deepEqual(await snapshot(current),before);
  record.traces.push({type:'real-process-restart',oldPid,newPid});
});
check(names[11],async current=>{
  const before=await snapshot(current), db=new DatabaseSync(current.dbPath);
  try{
    db.exec("CREATE TRIGGER fail_write BEFORE UPDATE ON booking_state BEGIN SELECT RAISE(ABORT, 'deliberate disk-write surrogate'); END");
    const response=await current.reserve(draft('Cannot save'));assert.equal(response.status,503);assert.equal(response.body.error.code,'STORAGE_UNAVAILABLE');
    assert.deepEqual(await snapshot(current),before);db.exec('DROP TRIGGER fail_write');
    assert.equal((await current.reserve(draft('Recovered'))).status,201);assert.equal((await snapshot(current)).state.bookings.length,1);
  }finally{db.close();}
});
check(names[12],async current=>{
  const before=await snapshot(current), db=new DatabaseSync(current.dbPath);
  try{db.exec('BEGIN IMMEDIATE');const response=await current.reserve(draft('Locked'));assert.equal(response.status,503);assert.equal(response.body.error.code,'STORAGE_UNAVAILABLE');db.exec('ROLLBACK');
    assert.deepEqual(await snapshot(current),before);assert.equal((await current.reserve(draft('Unlocked'))).status,201);
  }finally{if(db.isTransaction)db.exec('ROLLBACK');db.close();}
});
check(names[13],async current=>{
  await snapshot(current);const db=new DatabaseSync(current.dbPath);db.prepare('UPDATE booking_state SET state_json=? WHERE singleton=1').run('{corrupt');db.close();
  const before=readFileSync(current.dbPath), response=await current.read();assert.equal(response.status,503);assert.equal(response.body.error.code,'CORRUPT_STORAGE');
  assert.deepEqual(readFileSync(current.dbPath),before);assert.equal((await current.request('GET','/reservas')).status,200);
});
record.check(names[14],async t=>{
  const current=await fixture(t,record,{blocked:true}), before=readFileSync(current.dbPath);
  const response=await current.read();assert.equal(response.status,503);assert.equal(response.body.error.code,'STORAGE_UNAVAILABLE');
  assert.deepEqual(readFileSync(current.dbPath),before);assert.equal((await current.request('GET','/reservas')).status,200);
});

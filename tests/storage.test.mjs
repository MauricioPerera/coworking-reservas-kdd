import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as model from '../example/booking-model.mjs';
import * as persistence from '../example/booking-storage.mjs';
import { checkStorage, memoryStorage } from './support/storage-oracle.mjs';
import { draft } from './support/booking-oracle.mjs';

test('storage roundtrip preserves bookings, identifiers and cancellation',()=>checkStorage(model,persistence));
test('corrupt JSON remains intact and is reported',()=>{
  const storage=memoryStorage(); storage.setItem(persistence.STORAGE_KEY,'{broken');
  assert.throws(()=>persistence.loadState(storage),error=>error.code==='CORRUPT_STORAGE');
  assert.equal(storage.getItem(persistence.STORAGE_KEY),'{broken');
});
test('invalid snapshots are rejected instead of silently reset',()=>{
  for (const value of [null,[],{}, {version:2,nextId:1,bookings:[]}, {version:1,nextId:0,bookings:[]}]) {
    const storage=memoryStorage(); const raw=JSON.stringify(value); storage.setItem(persistence.STORAGE_KEY,raw);
    assert.throws(()=>persistence.loadState(storage),error=>error.code==='CORRUPT_STORAGE');
    assert.equal(storage.getItem(persistence.STORAGE_KEY),raw);
  }
});
test('save rejects invalid data without replacing the previous value',()=>{
  const storage=memoryStorage(); storage.setItem(persistence.STORAGE_KEY,'original');
  assert.throws(()=>persistence.saveState(storage,{version:1,nextId:1,bookings:[{}]}),error=>error.code==='CORRUPT_STORAGE');
  assert.equal(storage.getItem(persistence.STORAGE_KEY),'original');
});
test('failed storage writes are surfaced and do not mutate the draft state',()=>{
  const state=model.reserveBooking(model.emptyState(),draft()), before=structuredClone(state);
  assert.throws(()=>persistence.saveState({setItem(){throw new Error('quota');}},state),error=>error.code==='STORAGE_UNAVAILABLE');
  assert.deepEqual(state,before);
});
test('failed reads are surfaced',()=>{
  assert.throws(()=>persistence.loadState({getItem(){throw new Error('blocked');}}),error=>error.code==='STORAGE_UNAVAILABLE');
});

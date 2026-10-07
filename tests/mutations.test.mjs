import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as originalModel from '../example/booking-model.mjs';
import * as originalStorage from '../example/booking-storage.mjs';
import { checkBookings } from './support/booking-oracle.mjs';
import { checkStorage } from './support/storage-oracle.mjs';

const sources=Object.fromEntries(['booking-model.mjs','booking-storage.mjs'].map(file=>[file,readFileSync(new URL(`../example/${file}`,import.meta.url),'utf8')]));
const defects=[
  ['overlaps accepted','booking-model.mjs','return left.start < right.end && right.start < left.end;','return false;','domain'],
  ['adjacent intervals incorrectly rejected','booking-model.mjs','return left.start < right.end && right.start < left.end;','return left.start <= right.end && right.start <= left.end;','domain'],
  ['wrong booking cancelled','booking-model.mjs',"booking.id === id ? { ...booking, status: 'cancelled' } : booking","booking.id === state.bookings[0].id ? { ...booking, status: 'cancelled' } : booking",'domain'],
  ['cancelled bookings still block availability','booking-model.mjs',"if (left.status !== 'confirmed' || right.status !== 'confirmed') return false;",'if (false) return false;','domain'],
  ['saved bookings lost','booking-storage.mjs','storage.setItem(STORAGE_KEY, JSON.stringify(state));','storage.setItem(STORAGE_KEY, JSON.stringify(emptyState()));','storage'],
];
for (const [name,target,before,after,kind] of defects) {
  test(`sealed oracle detects product mutation: ${name}`,async t=>{
    checkBookings(originalModel); checkStorage(originalModel,originalStorage);
    assert.equal(sources[target].split(before).length-1,1,'exact mutation anchor; mismatch is inconclusive');
    const directory=mkdtempSync(path.join(tmpdir(),'coworking-mutation-'));
    t.after(()=>{
      const resolved=path.resolve(directory);
      assert.ok(resolved.startsWith(path.resolve(tmpdir())+path.sep));
      assert.ok(path.basename(resolved).startsWith('coworking-mutation-'));
      rmSync(resolved,{recursive:true});
    });
    for (const [file,source] of Object.entries(sources)) writeFileSync(path.join(directory,file),file===target?source.replace(before,after):source);
    const model=await import(pathToFileURL(path.join(directory,'booking-model.mjs')).href);
    const persistence=await import(pathToFileURL(path.join(directory,'booking-storage.mjs')).href);
    assert.throws(()=>kind==='domain'?checkBookings(model):checkStorage(model,persistence),assert.AssertionError);
  });
}

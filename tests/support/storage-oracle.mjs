import assert from 'node:assert/strict';
import { draft } from './booking-oracle.mjs';
export function memoryStorage() {
  const values = new Map();
  return {getItem:key=>values.get(key)??null, setItem:(key,value)=>values.set(key,value)};
}
export function checkStorage(model, persistence) {
  const storage=memoryStorage();
  assert.deepEqual(persistence.loadState(storage),model.emptyState());
  const active=model.reserveBooking(model.emptyState(),draft());
  persistence.saveState(storage,active);
  assert.deepEqual(persistence.loadState(storage),active);
  const cancelled=model.cancelBooking(active,'r1');
  persistence.saveState(storage,cancelled);
  assert.deepEqual(persistence.loadState(storage),cancelled);
  assert.equal(persistence.loadState(storage).bookings[0].status,'cancelled');
}

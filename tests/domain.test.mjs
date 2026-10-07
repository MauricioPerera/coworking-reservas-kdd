import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as model from '../example/booking-model.mjs';
import { scenarios, draft } from './support/booking-oracle.mjs';
for (const [name, check] of scenarios) test(name, () => check(model));
test('snapshot validation rejects duplicate identifiers and active overlaps', () => {
  const state = model.reserveBooking(model.emptyState(), draft());
  assert.equal(model.isValidState(state),true);
  assert.equal(model.isValidState({...state,bookings:[state.bookings[0],state.bookings[0]]}),false);
  assert.equal(model.isValidState({...state,nextId:3,bookings:[state.bookings[0],{...state.bookings[0],id:'r2'}]}),false);
  assert.equal(model.isValidState({...state,nextId:1}),false);
});

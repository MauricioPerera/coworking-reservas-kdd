import assert from 'node:assert/strict';

export const draft = (changes = {}) => ({ title: 'Planificación', roomId: 'atlas', date: '2030-06-12', start: '10:00', end: '11:00', ...changes });
const one = model => model.reserveBooking(model.emptyState(), draft());
const rejects = (operation, code) => assert.throws(operation, error => error.code === code);
export const scenarios = [
  ['valid booking, normalized title and immutable input', model => {
    const input = model.emptyState(); Object.freeze(input.bookings); Object.freeze(input);
    const state = model.reserveBooking(input, draft({title:'  Planificación  '}));
    assert.equal(input.bookings.length, 0); assert.equal(input.nextId, 1);
    assert.equal(state.nextId, 2); assert.equal(state.bookings.length, 1);
    assert.deepEqual(state.bookings[0], {...draft(), id:'r1', status:'confirmed'});
  }],
  ['empty or oversized title rejected', model => {
    for (const title of ['', '  ', 'x'.repeat(81)]) rejects(()=>model.reserveBooking(model.emptyState(),draft({title})), 'INVALID_TITLE');
  }],
  ['unknown room rejected', model => rejects(()=>model.reserveBooking(model.emptyState(),draft({roomId:'missing'})), 'INVALID_ROOM')],
  ['invalid calendar dates rejected', model => {
    for (const date of ['2030-02-30','2030-13-01','2030-6-12','x']) rejects(()=>model.reserveBooking(model.emptyState(),draft({date})), 'INVALID_DATE');
  }],
  ['malformed, equal and reversed times rejected', model => {
    for (const [start,end] of [['12:00','11:00'],['10:00','10:00'],['24:00','25:00'],['9:00','10:00'],['10:00','11:99']]) rejects(()=>model.reserveBooking(model.emptyState(),draft({start,end})), 'INVALID_INTERVAL');
  }],
  ...[['10:00','11:00'],['10:15','10:45'],['09:30','11:30'],['09:30','10:30'],['10:30','11:30']].map(([start,end])=>[
    `overlap ${start}-${end} rejected without mutation`, model => {
      const state=one(model), before=structuredClone(state);
      rejects(()=>model.reserveBooking(state,draft({start,end,title:'Conflicto'})), 'CONFLICT');
      assert.deepEqual(state,before);
    },
  ]),
  ['adjacent intervals allowed on both boundaries', model => {
    const state=model.reserveBooking(model.reserveBooking(one(model),draft({start:'09:00',end:'10:00'})),draft({start:'11:00',end:'12:00'}));
    assert.equal(state.bookings.length,3);
  }],
  ['rooms have independent availability', model => assert.equal(model.reserveBooking(one(model),draft({roomId:'luna'})).bookings.length,2)],
  ['dates have independent availability', model => assert.equal(model.reserveBooking(one(model),draft({date:'2030-06-13'})).bookings.length,2)],
  ['cancellation releases the interval and preserves history', model => {
    const original=one(model), cancelled=model.cancelBooking(original,'r1');
    assert.equal(original.bookings[0].status,'confirmed');
    assert.equal(cancelled.bookings[0].status,'cancelled');
    const state=model.reserveBooking(cancelled,draft({title:'Reemplazo'}));
    assert.equal(state.bookings.length,2); assert.equal(state.bookings[1].status,'confirmed');
    assert.equal(state.bookings[1].id,'r2');
  }],
  ['cancellation affects only the requested booking', model => {
    const state=model.reserveBooking(one(model),draft({roomId:'luna'}));
    const cancelled=model.cancelBooking(state,'r2');
    assert.equal(cancelled.bookings[0].status,'confirmed'); assert.equal(cancelled.bookings[1].status,'cancelled');
    for (const id of ['', 'missing', -1]) rejects(()=>model.cancelBooking(state,id),'NOT_FOUND');
  }],
  ['repeated cancellation rejected without changing another booking', model => {
    const state=model.cancelBooking(one(model),'r1');
    rejects(()=>model.cancelBooking(state,'r1'),'ALREADY_CANCELLED');
  }],
  ['unique monotonic identifiers', model => {
    const state=model.reserveBooking(model.reserveBooking(one(model),draft({roomId:'luna'})),draft({start:'11:00',end:'12:00'}));
    assert.deepEqual(state.bookings.map(b=>b.id),['r1','r2','r3']); assert.equal(state.nextId,4);
  }],
  ['user content remains literal data', model => {
    const title='<img src=x onerror=alert(1)>';
    assert.equal(model.reserveBooking(model.emptyState(),draft({title})).bookings[0].title,title);
  }],
];
export function checkBookings(model) {
  for (const [name,check] of scenarios) assert.doesNotThrow(() => check(model), name);
}

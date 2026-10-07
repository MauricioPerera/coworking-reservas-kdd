export const ROOMS = [{ id: 'atlas', name: 'Sala Atlas' }, { id: 'luna', name: 'Sala Luna' }];
export function emptyState() { return { version: 1, nextId: 1, bookings: [] }; }
function invalid(code) { throw Object.assign(new Error(code), { code }); }
function normalizeDraft(draft) {
  const title = typeof draft?.title === 'string' ? draft.title.trim() : '';
  if (!title || title.length > 80) invalid('INVALID_TITLE');
  if (!ROOMS.some(room => room.id === draft.roomId)) invalid('INVALID_ROOM');
  const date = draft.date;
  if (typeof date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) invalid('INVALID_DATE');
  const { start, end } = draft;
  const time = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  if (typeof start !== 'string' || typeof end !== 'string' || !time.test(start) || !time.test(end) || end <= start) invalid('INVALID_INTERVAL');
  return { title, roomId: draft.roomId, date, start, end };
}
function overlaps(left, right) {
  if (left.status !== 'confirmed' || right.status !== 'confirmed') return false;
  if (left.roomId !== right.roomId || left.date !== right.date) return false;
  return left.start < right.end && right.start < left.end;
}
export function isValidState(state) {
  if (!state || state.version !== 1 || !Number.isSafeInteger(state.nextId) || state.nextId < 1 || !Array.isArray(state.bookings)) return false;
  const ids = new Set();
  for (const booking of state.bookings) {
    if (!booking || !/^r[1-9]\d*$/.test(booking.id) || !['confirmed', 'cancelled'].includes(booking.status)) return false;
    const number = Number(booking.id.slice(1));
    if (!Number.isSafeInteger(number) || number >= state.nextId || ids.has(booking.id)) return false;
    try { if (normalizeDraft(booking).title !== booking.title) return false; }
    catch { return false; }
    ids.add(booking.id);
  }
  return !state.bookings.some((booking, index) => state.bookings.slice(index + 1).some(other => overlaps(booking, other)));
}
export function reserveBooking(state, draft) {
  if (!isValidState(state)) invalid('INVALID_STATE');
  const booking = { ...normalizeDraft(draft), id: `r${state.nextId}`, status: 'confirmed' };
  if (state.bookings.some(other => overlaps(other, booking))) invalid('CONFLICT');
  if (state.nextId === Number.MAX_SAFE_INTEGER) invalid('IDENTIFIERS_EXHAUSTED');
  return { ...state, nextId: state.nextId + 1, bookings: [...state.bookings, booking] };
}
export function cancelBooking(state, id) {
  if (!isValidState(state)) invalid('INVALID_STATE');
  const found = state.bookings.find(booking => booking.id === id);
  if (!found) invalid('NOT_FOUND');
  if (found.status === 'cancelled') invalid('ALREADY_CANCELLED');
  return { ...state, bookings: state.bookings.map(booking => booking.id === id ? { ...booking, status: 'cancelled' } : booking) };
}

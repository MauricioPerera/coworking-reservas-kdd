export const ROOMS = [{ id: 'atlas', name: 'Sala Atlas' }, { id: 'luna', name: 'Sala Luna' }];
export function emptyState() { return { version: 1, nextId: 1, bookings: [] }; }
export function reserveBooking() { throw new Error('Not implemented'); }
export function cancelBooking() { throw new Error('Not implemented'); }
export function isValidState() { return false; }

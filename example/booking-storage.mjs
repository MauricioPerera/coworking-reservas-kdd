import { emptyState, isValidState } from './booking-model.mjs';
export const STORAGE_KEY = 'coworking-reservas:v1';
function failure(code, cause) { throw Object.assign(new Error(code, { cause }), { code }); }
export function loadState(storage) {
  let raw;
  try { raw = storage.getItem(STORAGE_KEY); }
  catch (error) { failure('STORAGE_UNAVAILABLE', error); }
  if (raw === null) return emptyState();
  let state;
  try { state = JSON.parse(raw); }
  catch (error) { failure('CORRUPT_STORAGE', error); }
  if (!isValidState(state)) failure('CORRUPT_STORAGE');
  return state;
}
export function saveState(storage, state) {
  if (!isValidState(state)) failure('CORRUPT_STORAGE');
  try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch (error) { failure('STORAGE_UNAVAILABLE', error); }
}

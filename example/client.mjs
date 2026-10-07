import { ROOMS, emptyState, reserveBooking, cancelBooking } from './booking-model.mjs';
import { loadState, saveState } from './booking-storage.mjs';

const form = document.getElementById('booking-form');
const output = document.getElementById('result');
const messages = {
  INVALID_TITLE: 'Escribe un nombre de hasta 80 caracteres.', INVALID_ROOM: 'Selecciona una sala válida.',
  INVALID_DATE: 'Selecciona una fecha válida.', INVALID_INTERVAL: 'La hora de fin debe ser posterior al inicio.',
  CONFLICT: 'La sala ya está reservada en ese horario.', NOT_FOUND: 'No se encontró esa reserva.',
  ALREADY_CANCELLED: 'Esta reserva ya estaba cancelada.',
  CORRUPT_STORAGE: 'No se pudieron leer las reservas. Los datos originales se conservaron.',
  STORAGE_UNAVAILABLE: 'No se pudo guardar o leer en este navegador. Inténtalo nuevamente.',
};
let state = emptyState(), filter = 'all';
function message(text, error = false) { output.textContent = text; output.classList.toggle('error', error); }
try { state = loadState(localStorage); }
catch (error) { message(messages[error.code] ?? 'No se pudieron leer las reservas.', true); document.getElementById('confirm').disabled = true; }
function commit(next, success) {
  saveState(localStorage, next);
  state = next; render(); message(success);
}
function render() {
  const active = state.bookings.filter(booking => booking.status === 'confirmed');
  const visible = active.filter(booking => filter === 'all' || booking.roomId === filter).sort((a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`));
  const list = document.getElementById('booking-list'); list.replaceChildren();
  document.getElementById('empty').hidden = visible.length > 0;
  document.getElementById('count').textContent = `${active.length} ${active.length === 1 ? 'reserva activa' : 'reservas activas'}`;
  for (const booking of visible) {
    const item = document.createElement('li'); item.className = 'booking'; item.dataset.testid = 'booking';
    const text = document.createElement('div');
    const title = document.createElement('p'); title.className = 'booking-title'; title.textContent = booking.title;
    const details = document.createElement('div'); details.className = 'details';
    const room = document.createElement('span'); room.className = 'room-tag'; room.textContent = ROOMS.find(value => value.id === booking.roomId).name;
    const date = document.createElement('span'); date.textContent = `${booking.date.split('-').reverse().join('/')} · ${booking.start} – ${booking.end}`;
    details.append(room, date); text.append(title, details);
    const cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'cancel'; cancel.textContent = 'Cancelar'; cancel.setAttribute('aria-label', `Cancelar ${booking.title}`);
    cancel.addEventListener('click', () => {
      try { commit(cancelBooking(state, booking.id), 'Reserva cancelada. El horario está disponible.'); }
      catch (error) { message(messages[error.code] ?? 'No se pudo cancelar la reserva.', true); }
    });
    item.append(text, cancel); list.append(item);
  }
}
form.addEventListener('submit', event => {
  event.preventDefault();
  try {
    const draft = Object.fromEntries(new FormData(form));
    commit(reserveBooking(state, draft), 'Reserva confirmada.');
    document.getElementById('title').value = '';
  } catch (error) { message(messages[error.code] ?? 'No se pudo confirmar la reserva.', true); }
});
for (const button of document.querySelectorAll('[data-filter]')) button.addEventListener('click', () => {
  filter = button.dataset.filter;
  for (const other of document.querySelectorAll('[data-filter]')) other.setAttribute('aria-pressed', String(other === button));
  render();
});
const today = new Date();
document.getElementById('date').value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
render();

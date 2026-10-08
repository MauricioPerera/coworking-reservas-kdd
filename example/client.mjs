import { emptyState, reserveBooking, cancelBooking } from './booking-model.mjs';
import { loadState, saveState } from './booking-storage.mjs';
import {createSharedSession,decorateShared} from './shared-client.mjs';

export const TRANSLATIONS = Object.freeze({
  es: Object.freeze({
  pageTitle: 'Espacio — Reservas de salas', language: 'Idioma', languageResult: 'Preferencia de idioma', location: 'Tu lugar para trabajar juntos',
  eyebrow: 'Organiza tu próxima reunión', heading: 'Reservas de salas', intro: 'Encuentra un espacio para tu equipo. Elige una sala y un horario; nosotros comprobamos que esté disponible.',
  newBooking: '01 / NUEVA RESERVA', formTitle: 'Prepara tu encuentro', titleLabel: 'Nombre de la reserva', titlePlaceholder: 'Ej. Planeación del equipo',
  roomLabel: 'Elige tu sala', room_atlas: 'Sala Atlas', room_luna: 'Sala Luna', dateLabel: 'Fecha de la reserva', startLabel: 'Hora de inicio', endLabel: 'Hora de fin',
  confirm: 'Confirmar reserva', result: 'Resultado', note: 'Puedes cancelar cuando lo necesites. Una cancelación libera el horario de inmediato.',
  agenda: 'Tu agenda', filterLabel: 'Filtrar por sala', allRooms: 'Todas las salas', emptyTitle: 'Un espacio para tus ideas', emptyText: 'Tus reservas aparecerán aquí. Empieza eligiendo una sala y el horario que mejor te venga.',
  hintTitle: 'Reuniones que encajan', hintText: 'Una reserva puede empezar justo cuando termina otra. Los horarios se comprueban por sala y fecha para evitar solapamientos.',
  footer: 'Guardado en este navegador · Horarios de tu agenda local', activeOne: '{count} reserva activa', activeMany: '{count} reservas activas', cancel: 'Cancelar', cancelLabel: 'Cancelar {title}',
  confirmed: 'Reserva confirmada.', cancelled: 'Reserva cancelada. El horario está disponible.', preferenceError: 'El idioma se aplicó a esta sesión, pero no se pudo guardar la preferencia.',
  readError: 'No se pudieron leer las reservas.', cancelError: 'No se pudo cancelar la reserva.', confirmError: 'No se pudo confirmar la reserva.',
  INVALID_TITLE: 'Escribe un nombre de hasta 80 caracteres.', INVALID_ROOM: 'Selecciona una sala válida.',
  INVALID_DATE: 'Selecciona una fecha válida.', INVALID_INTERVAL: 'La hora de fin debe ser posterior al inicio.',
  CONFLICT: 'La sala ya está reservada en ese horario.', NOT_FOUND: 'No se encontró esa reserva.',
  ALREADY_CANCELLED: 'Esta reserva ya estaba cancelada.',
  CORRUPT_STORAGE: 'No se pudieron leer las reservas. Los datos originales se conservaron.',
  STORAGE_UNAVAILABLE: 'No se pudo guardar o leer en este navegador. Inténtalo nuevamente.',
  INVALID_STATE: 'Las reservas guardadas no son válidas. Los datos originales se conservaron.', IDENTIFIERS_EXHAUSTED: 'No se pueden crear más reservas en este navegador.',
  }),
  en: Object.freeze({
  pageTitle: 'Espacio — Room bookings', language: 'Language', languageResult: 'Language preference', location: 'Your place to work together',
  eyebrow: 'Plan your next meeting', heading: 'Room bookings', intro: 'Find a space for your team. Choose a room and a time; we will check its availability.',
  newBooking: '01 / NEW BOOKING', formTitle: 'Plan your meeting', titleLabel: 'Booking name', titlePlaceholder: 'E.g. Team planning',
  roomLabel: 'Choose your room', room_atlas: 'Room Atlas', room_luna: 'Room Luna', dateLabel: 'Booking date', startLabel: 'Start time', endLabel: 'End time',
  confirm: 'Confirm booking', result: 'Result', note: 'Cancel whenever you need to. A cancellation makes the time available immediately.',
  agenda: 'Your schedule', filterLabel: 'Filter by room', allRooms: 'All rooms', emptyTitle: 'A space for your ideas', emptyText: 'Your bookings will appear here. Start by choosing a room and a time that works for you.',
  hintTitle: 'Meetings that fit', hintText: 'A booking can start exactly when another ends. Times are checked by room and date to prevent overlaps.',
  footer: 'Saved in this browser · Local schedule times (24-hour)', activeOne: '{count} active booking', activeMany: '{count} active bookings', cancel: 'Cancel', cancelLabel: 'Cancel {title}',
  confirmed: 'Booking confirmed.', cancelled: 'Booking cancelled. The time is available.', preferenceError: 'The language applies to this session, but the preference could not be saved.',
  readError: 'Bookings could not be read.', cancelError: 'The booking could not be cancelled.', confirmError: 'The booking could not be confirmed.',
  INVALID_TITLE: 'Enter a name with up to 80 characters.', INVALID_ROOM: 'Choose a valid room.',
  INVALID_DATE: 'Choose a valid date.', INVALID_INTERVAL: 'The end time must be after the start time.',
  CONFLICT: 'This room is already booked for that time.', NOT_FOUND: 'That booking could not be found.',
  ALREADY_CANCELLED: 'This booking was already cancelled.', CORRUPT_STORAGE: 'Bookings could not be read. The original data was preserved.',
  STORAGE_UNAVAILABLE: 'This browser could not read or save the data. Please try again.',
  INVALID_STATE: 'The saved bookings are invalid. The original data was preserved.', IDENTIFIERS_EXHAUSTED: 'No more bookings can be created in this browser.',
  }),
  pt: Object.freeze({
  pageTitle: 'Espacio — Reservas de salas', language: 'Idioma', languageResult: 'Preferência de idioma', location: 'Seu espaço para trabalhar juntos',
  eyebrow: 'Organize sua próxima reunião', heading: 'Reservas de salas', intro: 'Encontre um espaço para sua equipe. Escolha uma sala e um horário; nós verificamos a disponibilidade.',
  newBooking: '01 / NOVA RESERVA', formTitle: 'Prepare seu encontro', titleLabel: 'Nome da reserva', titlePlaceholder: 'Ex. Planejamento da equipe',
  roomLabel: 'Escolha sua sala', room_atlas: 'Sala Atlas', room_luna: 'Sala Luna', dateLabel: 'Data da reserva', startLabel: 'Hora de início', endLabel: 'Hora de término',
  confirm: 'Confirmar reserva', result: 'Resultado', note: 'Cancele quando precisar. O cancelamento libera o horário imediatamente.',
  agenda: 'Sua agenda', filterLabel: 'Filtrar por sala', allRooms: 'Todas as salas', emptyTitle: 'Um espaço para suas ideias', emptyText: 'Suas reservas aparecerão aqui. Comece escolhendo uma sala e o melhor horário para você.',
  hintTitle: 'Reuniões que se encaixam', hintText: 'Uma reserva pode começar exatamente quando outra termina. Os horários são verificados por sala e data para evitar sobreposições.',
  footer: 'Salvo neste navegador · Horários da sua agenda local', activeOne: '{count} reserva ativa', activeMany: '{count} reservas ativas', cancel: 'Cancelar', cancelLabel: 'Cancelar {title}',
  confirmed: 'Reserva confirmada.', cancelled: 'Reserva cancelada. O horário está disponível.', preferenceError: 'O idioma foi aplicado a esta sessão, mas não foi possível salvar a preferência.',
  readError: 'Não foi possível ler as reservas.', cancelError: 'Não foi possível cancelar a reserva.', confirmError: 'Não foi possível confirmar a reserva.',
  INVALID_TITLE: 'Digite um nome com até 80 caracteres.', INVALID_ROOM: 'Selecione uma sala válida.',
  INVALID_DATE: 'Selecione uma data válida.', INVALID_INTERVAL: 'A hora de término deve ser posterior à hora de início.',
  CONFLICT: 'Esta sala já está reservada nesse horário.', NOT_FOUND: 'Essa reserva não foi encontrada.',
  ALREADY_CANCELLED: 'Esta reserva já estava cancelada.', CORRUPT_STORAGE: 'Não foi possível ler as reservas. Os dados originais foram preservados.',
  STORAGE_UNAVAILABLE: 'Não foi possível ler ou salvar os dados neste navegador. Tente novamente.',
  INVALID_STATE: 'As reservas salvas são inválidas. Os dados originais foram preservados.', IDENTIFIERS_EXHAUSTED: 'Não é possível criar mais reservas neste navegador.',
  }),
});
const locales = Object.freeze({ es: 'es-MX', en: 'en-US', pt: 'pt-BR' });
const localeKey = 'coworking-reservas:locale:v1';
const form = document.getElementById('booking-form');
const output = document.getElementById('result');
const language = document.getElementById('language');
const languageOutput = document.getElementById('language-result');
let locale = 'es', state = emptyState(), filter = 'all', lastMessage = null, preferenceFailed = false;
const shared=location.pathname==='/compartidas';
let remote,connection={connected:!shared,busy:false,loading:shared};
try { const saved = localStorage.getItem(localeKey); if (Object.hasOwn(locales, saved)) locale = saved; } catch {}
function translate(key, values = {}) {
  return (TRANSLATIONS[locale][key] ?? TRANSLATIONS.es[key]).replace(/\{(\w+)\}/g, (_, name) => String(values[name]));
}
function renderMessages() {
  output.textContent = lastMessage ? translate(lastMessage.key) : '';
  output.classList.toggle('error', lastMessage?.error ?? false);
  languageOutput.textContent = preferenceFailed ? translate('preferenceError') : '';
}
function message(key, error = false) { lastMessage = { key, error }; renderMessages(); }
function errorKey(error, fallback) { return Object.hasOwn(TRANSLATIONS.es, error.code) ? error.code : fallback; }
function applyLanguage() {
  document.documentElement.lang = locales[locale]; document.title = translate('pageTitle'); language.value = locale;
  for (const element of document.querySelectorAll('[data-i18n]')) element.textContent = translate(element.dataset.i18n);
  for (const element of document.querySelectorAll('[data-i18n-placeholder]')) element.setAttribute('placeholder', translate(element.dataset.i18nPlaceholder));
  for (const element of document.querySelectorAll('[data-i18n-aria]')) element.setAttribute('aria-label', translate(element.dataset.i18nAria));
  render(); renderMessages();
  decorateShared(locale,shared,connection);
}
function formatDate(date) {
  return new Intl.DateTimeFormat(locales[locale], { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`));
}
if(!shared){
  try { state = loadState(localStorage); }
  catch (error) { message(errorKey(error, 'readError'), true); document.getElementById('confirm').disabled = true; }
}
function commit(next, success) {
  saveState(localStorage, next);
  state = next; render(); message(success);
}
function render() {
  const active = state.bookings.filter(booking => booking.status === 'confirmed');
  const visible = active.filter(booking => filter === 'all' || booking.roomId === filter).sort((a, b) => `${a.date} ${a.start}`.localeCompare(`${b.date} ${b.start}`));
  const list = document.getElementById('booking-list'); list.replaceChildren();
  document.getElementById('empty').hidden = visible.length > 0;
  document.getElementById('count').textContent = translate(active.length === 1 ? 'activeOne' : 'activeMany', { count: active.length });
  for (const booking of visible) {
    const item = document.createElement('li'); item.className = 'booking'; item.dataset.testid = 'booking';
    const text = document.createElement('div');
    const title = document.createElement('p'); title.className = 'booking-title'; title.textContent = booking.title;
    const details = document.createElement('div'); details.className = 'details';
    const room = document.createElement('span'); room.className = 'room-tag'; room.textContent = translate(`room_${booking.roomId}`);
    const date = document.createElement('span'); date.textContent = `${formatDate(booking.date)} · ${booking.start} – ${booking.end}`;
    details.append(room, date); text.append(title, details);
    const cancel = document.createElement('button'); cancel.type = 'button'; cancel.className = 'cancel'; cancel.textContent = translate('cancel'); cancel.setAttribute('aria-label', translate('cancelLabel', { title: booking.title }));
    cancel.disabled=shared&&(!connection.connected||connection.busy);
    cancel.addEventListener('click', async () => {
      try { if(shared){await remote.cancel(booking.id);message('cancelled');}else commit(cancelBooking(state, booking.id), 'cancelled'); }
      catch (error) { message(errorKey(error, 'cancelError'), true); }
    });
    item.append(text, cancel); list.append(item);
  }
}
form.addEventListener('submit', async event => {
  event.preventDefault();
  if(shared&&(!connection.connected||connection.busy))return;
  try {
    const draft = Object.fromEntries(new FormData(form));
    if(shared){await remote.reserve(draft);message('confirmed');}else commit(reserveBooking(state, draft), 'confirmed');
    document.getElementById('title').value = '';
  } catch (error) { message(errorKey(error, 'confirmError'), true); }
});
for (const button of document.querySelectorAll('[data-filter]')) button.addEventListener('click', () => {
  filter = button.dataset.filter;
  for (const other of document.querySelectorAll('[data-filter]')) other.setAttribute('aria-pressed', String(other === button));
  render();
});
const today = new Date();
document.getElementById('date').value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
language.addEventListener('change', () => {
  if (!Object.hasOwn(locales, language.value)) return;
  locale = language.value; preferenceFailed = false;
  try { localStorage.setItem(localeKey, locale); } catch { preferenceFailed = true; }
  applyLanguage();
});
applyLanguage();
if(shared){
  remote=createSharedSession({onSnapshot(next){state=next;render();},onConnection(next){
    connection=next;document.getElementById('confirm').disabled=!next.connected||next.busy;
    for(const button of document.querySelectorAll('.cancel'))button.disabled=!next.connected||next.busy;
    decorateShared(locale,true,next);
  }});
  remote.start();addEventListener('pagehide',()=>remote.close(),{once:true});
}

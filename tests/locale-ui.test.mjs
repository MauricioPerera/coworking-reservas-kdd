import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { chromium } from 'playwright-core';
import { createServer } from 'node:net';
import { spawn } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { git } from '../src/git.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const bookingKey = 'coworking-reservas:v1';
const languageKey = 'coworking-reservas:locale:v1';
const expected = {
  es: { lang: 'es-MX', heading: 'Reservas de salas', title: 'Nombre de la reserva', date: 'Fecha de la reserva', start: 'Hora de inicio', end: 'Hora de fin', confirm: 'Confirmar reserva', result: 'Resultado', success: 'Reserva confirmada.', interval: 'La hora de fin debe ser posterior al inicio.', conflict: 'La sala ya está reservada en ese horario.', atlas: 'Sala Atlas', luna: 'Sala Luna', cancel: 'Cancelar', day: '12/06/2030', tomorrow: '13/06/2030', one: '1 reserva activa', many: '2 reservas activas', preferenceError: 'El idioma se aplicó a esta sesión, pero no se pudo guardar la preferencia.', corrupt: 'No se pudieron leer las reservas. Los datos originales se conservaron.', storageError: 'No se pudo guardar o leer en este navegador. Inténtalo nuevamente.' },
  en: { lang: 'en-US', heading: 'Room bookings', title: 'Booking name', date: 'Booking date', start: 'Start time', end: 'End time', confirm: 'Confirm booking', result: 'Result', success: 'Booking confirmed.', interval: 'The end time must be after the start time.', conflict: 'This room is already booked for that time.', atlas: 'Room Atlas', luna: 'Room Luna', cancel: 'Cancel', day: '06/12/2030', tomorrow: '06/13/2030', one: '1 active booking', many: '2 active bookings', preferenceError: 'The language applies to this session, but the preference could not be saved.', corrupt: 'Bookings could not be read. The original data was preserved.', storageError: 'This browser could not read or save the data. Please try again.' },
  pt: { lang: 'pt-BR', heading: 'Reservas de salas', title: 'Nome da reserva', date: 'Data da reserva', start: 'Hora de início', end: 'Hora de término', confirm: 'Confirmar reserva', result: 'Resultado', success: 'Reserva confirmada.', interval: 'A hora de término deve ser posterior à hora de início.', conflict: 'Esta sala já está reservada nesse horário.', atlas: 'Sala Atlas', luna: 'Sala Luna', cancel: 'Cancelar', day: '12/06/2030', tomorrow: '13/06/2030', one: '1 reserva ativa', many: '2 reservas ativas', preferenceError: 'O idioma foi aplicado a esta sessão, mas não foi possível salvar a preferência.', corrupt: 'Não foi possível ler as reservas. Os dados originais foram preservados.', storageError: 'Não foi possível ler ou salvar os dados neste navegador. Tente novamente.' },
};
const inputFiles = ['tests/locale-ui.test.mjs', 'knowledge/contracts/booking-locales.md', 'example/client.mjs', 'example/index.html', 'example/booking-model.mjs', 'example/booking-storage.mjs', 'example/server.mjs', 'src/git.mjs', 'package.json', 'package-lock.json'];
const digests = () => Object.fromEntries(inputFiles.map(file => [file, createHash('sha256').update(readFileSync(path.join(root, file))).digest('hex')]));
const results = [];
let browser, child, base, serverLog = '', startedAt, commit, inputs;
const directory = path.join(root, '.e2e/locale-runs', randomUUID());

before(async () => {
  startedAt = new Date().toISOString();
  commit = git(root, ['rev-parse', 'HEAD']);
  assert.equal(git(root, ['status', '--porcelain', '--untracked-files=no']), '', 'Commit changes before collecting locale evidence');
  inputs = digests();
  mkdirSync(directory, { recursive: true });
  const listener = createServer();
  await new Promise((resolve, reject) => { listener.once('error', reject); listener.listen(0, '127.0.0.1', resolve); });
  const port = listener.address().port;
  await new Promise((resolve, reject) => listener.close(error => error ? reject(error) : resolve()));
  base = `http://127.0.0.1:${port}`;
  child = spawn(process.execPath, ['example/server.mjs'], { cwd: root, env: { ...process.env, PORT: String(port) }, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
  child.stdout.on('data', bytes => { serverLog += bytes; });
  child.stderr.on('data', bytes => { serverLog += bytes; });
  let ready = false;
  for (let attempt = 0; attempt < 40; attempt++) {
    assert.equal(child.exitCode, null, serverLog);
    try { ready = (await fetch(base + '/reservas', { signal: AbortSignal.timeout(300) })).ok; } catch {}
    if (ready) break;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  assert.equal(ready, true, 'Booking server did not become ready');
  browser = await chromium.launch({ headless: true });
}, { timeout: 15000 });

after(async () => {
  const unchanged = inputs ? JSON.stringify(inputs) === JSON.stringify(digests()) : false;
  if (browser) await browser.close();
  if (child && child.exitCode === null) {
    child.kill('SIGTERM');
    await Promise.race([new Promise(resolve => child.once('exit', resolve)), new Promise(resolve => setTimeout(resolve, 2000))]);
    if (child.exitCode === null) child.kill('SIGKILL');
  }
  const report = { schemaVersion: 'kdd-booking-locales-1', status: results.length === 34 && results.every(result => result.status === 'passed') && unchanged ? 'locally_verified' : 'failed', commit, startedAt, finishedAt: new Date().toISOString(), inputDigests: inputs, inputsUnchanged: unchanged, runtime: { node: process.version, platform: process.platform, chromium: browser?.version() }, ci: process.env.GITHUB_RUN_ID ? { repository: process.env.GITHUB_REPOSITORY, runId: process.env.GITHUB_RUN_ID, headSha: process.env.GITHUB_SHA, runUrl: `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}` } : null, matrixCases: 21, results };
  mkdirSync(directory, { recursive: true });
  writeFileSync(path.join(directory, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  writeFileSync(path.join(directory, 'server.log'), serverLog);
  assert.equal(unchanged, true, 'Locale inputs changed during execution');
});

async function session(t, { persistent = false, width = 1280, timezoneId = 'America/Mexico_City', seed = {}, blockedKey } = {}) {
  const profile = persistent ? mkdtempSync(path.join(tmpdir(), 'kdd-locale-')) : undefined;
  const options = { headless: true, viewport: { width, height: 900 }, locale: 'en-US', timezoneId };
  const current = { context: persistent ? await chromium.launchPersistentContext(profile, options) : await browser.newContext(options), profile, options };
  t.after(async () => {
    await current.context.close();
    if (profile) {
      const relative = path.relative(path.resolve(tmpdir()), path.resolve(profile));
      assert.ok(relative && !relative.startsWith('..') && !path.isAbsolute(relative) && path.basename(profile).startsWith('kdd-locale-'));
      rmSync(profile, { recursive: true, force: true });
    }
  });
  if (Object.keys(seed).length || blockedKey) await current.context.addInitScript(({ seed, blockedKey }) => {
    for (const [key, value] of Object.entries(seed)) localStorage.setItem(key, value);
    if (blockedKey) {
      const original = Storage.prototype.setItem;
      Storage.prototype.setItem = function(key, value) { if (key === blockedKey) throw new DOMException('Storage blocked', 'QuotaExceededError'); return original.call(this, key, value); };
    }
  }, { seed, blockedKey });
  current.page = await current.context.newPage();
  const errors = [];
  current.page.on('pageerror', error => errors.push(error.message));
  t.after(() => assert.deepEqual(errors, []));
  await current.page.goto(base + '/reservas');
  assert.equal(await current.page.locator('#language').count(), 1, 'Missing the reviewed language selector');
  return current;
}
async function choose(page, locale) {
  await page.selectOption('#language', locale);
  assert.equal(await page.locator('html').getAttribute('lang'), expected[locale].lang);
  assert.equal(await page.getByRole('heading', { level: 1 }).textContent(), expected[locale].heading);
  assert.equal(await page.title(), `Espacio — ${expected[locale].heading}`);
}
async function enter(page, locale, title, start = '10:00', end = '11:00', date = '2030-06-12') {
  const text = expected[locale];
  await page.getByLabel(text.title, { exact: true }).fill(title);
  await page.getByLabel(text.date, { exact: true }).fill(date);
  await page.getByLabel(text.start, { exact: true }).fill(start);
  await page.getByLabel(text.end, { exact: true }).fill(end);
  await page.getByRole('button', { name: text.confirm, exact: true }).click();
}
async function status(page, locale, value) { assert.equal(await page.getByRole('status', { name: expected[locale].result, exact: true }).textContent(), value); }
const raw = page => page.evaluate(key => localStorage.getItem(key), bookingKey);
function check(name, run, locale = null) {
  test(name, { timeout: 20000 }, async t => {
    const start = performance.now();
    try { await run(t); results.push({ name, locale, status: 'passed', durationMs: Math.round(performance.now() - start) }); }
    catch (error) { results.push({ name, locale, status: 'failed', durationMs: Math.round(performance.now() - start), error: error.message }); throw error; }
  });
}

for (const locale of Object.keys(expected)) {
  const text = expected[locale];
  check(`${locale}: creates a valid booking`, async t => {
    const { page } = await session(t); await choose(page, locale); await enter(page, locale, 'Equipo <b>Ágil</b>');
    assert.equal(await page.getByTestId('booking').count(), 1);
    const item = page.getByTestId('booking').first();
    for (const value of ['Equipo <b>Ágil</b>', text.atlas, text.day, '10:00 – 11:00']) assert.ok((await item.textContent()).includes(value), value);
    assert.equal(await item.locator('b').count(), 0);
    assert.equal(await page.locator('#count').textContent(), text.one);
    await status(page, locale, text.success);
    await page.screenshot({ path: path.join(directory, `${locale}-desktop.png`), fullPage: true });
  }, locale);
  check(`${locale}: rejects equal and reversed intervals`, async t => {
    const { page } = await session(t); await choose(page, locale);
    for (const end of ['11:00', '12:00']) { await enter(page, locale, 'Invalid', '12:00', end); assert.equal(await page.getByTestId('booking').count(), 0); await status(page, locale, text.interval); }
  }, locale);
  check(`${locale}: rejects overlapping bookings`, async t => {
    const { page } = await session(t); await choose(page, locale); await enter(page, locale, 'Original'); const before = await raw(page);
    await enter(page, locale, 'Conflict', '10:30', '11:30');
    assert.equal(await page.getByTestId('booking').count(), 1); assert.equal(await raw(page), before); await status(page, locale, text.conflict);
  }, locale);
  check(`${locale}: allows adjacent intervals`, async t => {
    const { page } = await session(t); await choose(page, locale); await enter(page, locale, 'First'); await enter(page, locale, 'Next', '11:00', '12:00');
    assert.equal(await page.getByTestId('booking').count(), 2); assert.equal(await page.locator('#count').textContent(), text.many); await status(page, locale, text.success);
  }, locale);
  check(`${locale}: rooms and dates have independent availability`, async t => {
    const { page } = await session(t); await choose(page, locale); await enter(page, locale, 'Atlas');
    await page.getByLabel(text.luna, { exact: true }).check(); await enter(page, locale, 'Luna');
    await page.getByLabel(text.atlas, { exact: true }).check(); await enter(page, locale, 'Tomorrow', '10:00', '11:00', '2030-06-13');
    assert.equal(await page.getByTestId('booking').count(), 3); assert.ok((await page.getByTestId('booking').last().textContent()).includes(text.tomorrow));
  }, locale);
  check(`${locale}: cancellation releases the requested interval`, async t => {
    const { page } = await session(t); await choose(page, locale); await enter(page, locale, 'Target'); await enter(page, locale, 'Keep', '11:00', '12:00');
    await page.getByRole('button', { name: `${text.cancel} Target`, exact: true }).click(); await enter(page, locale, 'Replacement');
    assert.equal(await page.getByTestId('booking').count(), 2);
    const saved = JSON.parse(await raw(page)); assert.equal(saved.bookings[0].status, 'cancelled'); assert.equal(saved.bookings[1].title, 'Keep'); assert.equal(saved.bookings[1].status, 'confirmed');
  }, locale);
  check(`${locale}: bookings and language survive reload and browser restart`, async t => {
    const current = await session(t, { persistent: true }); await choose(current.page, locale); await enter(current.page, locale, 'Persistent'); const saved = await raw(current.page);
    await current.page.reload(); assert.equal(await current.page.locator('html').getAttribute('lang'), text.lang); assert.equal(await raw(current.page), saved);
    await current.context.close(); current.context = await chromium.launchPersistentContext(current.profile, current.options); current.page = await current.context.newPage(); await current.page.goto(base + '/reservas');
    assert.equal(await current.page.locator('html').getAttribute('lang'), text.lang); assert.equal(await current.page.locator('#language').inputValue(), locale); assert.equal(await current.page.getByTestId('booking').count(), 1); assert.equal(await raw(current.page), saved);
  }, locale);
}

check('catalogs cover every visible translation and every booking error', async t => {
  const { page } = await session(t);
  const catalog = await page.evaluate(async () => (await import('/client.mjs')).TRANSLATIONS);
  const keys = Object.keys(catalog.es).sort();
  for (const locale of Object.keys(expected)) { assert.deepEqual(Object.keys(catalog[locale]).sort(), keys); assert.ok(Object.values(catalog[locale]).every(value => typeof value === 'string' && value.trim())); }
  for (const code of ['INVALID_TITLE', 'INVALID_ROOM', 'INVALID_DATE', 'INVALID_INTERVAL', 'CONFLICT', 'NOT_FOUND', 'ALREADY_CANCELLED', 'CORRUPT_STORAGE', 'STORAGE_UNAVAILABLE', 'INVALID_STATE', 'IDENTIFIERS_EXHAUSTED']) assert.ok(keys.includes(code), code);
  const referenced = await page.locator('[data-i18n], [data-i18n-placeholder], [data-i18n-aria]').evaluateAll(elements => elements.flatMap(element => ['data-i18n', 'data-i18n-placeholder', 'data-i18n-aria'].map(attr => element.getAttribute(attr)).filter(Boolean)));
  for (const key of referenced) assert.ok(keys.includes(key), key);
});
check('switching languages preserves data, draft, room choice and room filter', async t => {
  const { page } = await session(t); await enter(page, 'es', 'Sin traducir / Not translated / Não traduzido');
  await page.getByLabel('Sala Luna', { exact: true }).check(); await enter(page, 'es', 'Luna');
  await page.locator('[data-filter="atlas"]').click(); await page.fill('#title', 'Borrador'); await page.fill('#date', '2031-01-02'); await page.fill('#start', '14:00'); await page.fill('#end', '15:00');
  const before = await raw(page);
  for (const locale of ['en', 'pt', 'es']) { await choose(page, locale); assert.equal(await raw(page), before); assert.equal(await page.inputValue('#title'), 'Borrador'); assert.equal(await page.inputValue('#date'), '2031-01-02'); assert.equal(await page.inputValue('#start'), '14:00'); assert.equal(await page.inputValue('#end'), '15:00'); assert.equal(await page.locator('input[value="luna"]').isChecked(), true); assert.equal(await page.getByTestId('booking').count(), 1); assert.equal(await page.locator('[data-filter="atlas"]').getAttribute('aria-pressed'), 'true'); }
});
check('existing success and error statuses follow the selected language', async t => {
  const { page } = await session(t); await enter(page, 'es', 'One'); await choose(page, 'en'); await status(page, 'en', expected.en.success);
  await enter(page, 'en', 'Invalid', '12:00', '11:00'); await choose(page, 'pt'); await status(page, 'pt', expected.pt.interval); await choose(page, 'es'); await status(page, 'es', expected.es.interval);
});
check('an unsupported stored language falls back to Spanish without changing saved data', async t => {
  const { page } = await session(t, { seed: { [languageKey]: 'xx-unknown' } }); assert.equal(await page.locator('html').getAttribute('lang'), 'es-MX'); assert.equal(await page.inputValue('#language'), 'es'); assert.equal(await raw(page), null);
});
check('a blocked preference write applies the language for the session and reports the failure', async t => {
  const { page } = await session(t, { blockedKey: languageKey }); await enter(page, 'es', 'Saved'); const before = await raw(page); await choose(page, 'en');
  assert.equal(await page.locator('#language-result').textContent(), expected.en.preferenceError); assert.equal(await raw(page), before); assert.equal(await page.evaluate(key => localStorage.getItem(key), languageKey), null);
});
check('corrupt booking bytes are preserved and their error follows the language', async t => {
  const { page } = await session(t, { seed: { [bookingKey]: '{broken' } }); await choose(page, 'pt'); await status(page, 'pt', expected.pt.corrupt); assert.equal(await raw(page), '{broken'); assert.equal(await page.locator('#confirm').isDisabled(), true);
});
for (const locale of Object.keys(expected)) {
  check(`${locale}: a failed booking write never announces success`, async t => {
    const { page } = await session(t, { blockedKey: bookingKey }); await choose(page, locale); await enter(page, locale, 'Not saved'); assert.equal(await page.getByTestId('booking').count(), 0); assert.equal(await raw(page), null); await status(page, locale, expected[locale].storageError);
  }, locale);
  check(`${locale}: mobile layout fits the viewport and translated cancel labels`, async t => {
    const { page } = await session(t, { width: 390 }); await choose(page, locale); await enter(page, locale, 'Reunião internacional');
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false); assert.equal(await page.getByRole('button', { name: `${expected[locale].cancel} Reunião internacional`, exact: true }).count(), 1);
    await page.screenshot({ path: path.join(directory, `${locale}-mobile.png`), fullPage: true });
  }, locale);
}
check('calendar dates are unchanged across time zones and translated display formats', async t => {
  for (const timezoneId of ['America/Los_Angeles', 'UTC', 'Pacific/Auckland']) {
    const { page } = await session(t, { timezoneId });
    await enter(page, 'es', 'Calendar'); const before = await raw(page);
    for (const locale of Object.keys(expected)) { await choose(page, locale); assert.ok((await page.getByTestId('booking').first().textContent()).includes(expected[locale].day)); assert.equal(await raw(page), before); }
  }
});

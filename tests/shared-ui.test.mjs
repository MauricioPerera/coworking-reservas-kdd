import {before,after} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {chromium} from 'playwright-core';
import path from 'node:path';
import {recorder,fixture,draft,bookingKey,localeKey,converge} from './support/shared-fixture.mjs';

const expected={
  es:{lang:'es-MX',heading:'Reservas compartidas',online:'Agenda sincronizada.',offline:'No se pudo sincronizar. Se intentará de nuevo.',success:'Reserva confirmada.',conflict:'La sala ya está reservada en ese horario.',cancelled:'Reserva cancelada. El horario está disponible.',storage:'No se pudo guardar o leer en este navegador. Inténtalo nuevamente.',day:'12/06/2030'},
  en:{lang:'en-US',heading:'Shared bookings',online:'Schedule synchronized.',offline:'Could not synchronize. Will try again.',success:'Booking confirmed.',conflict:'This room is already booked for that time.',cancelled:'Booking cancelled. The time is available.',storage:'This browser could not read or save the data. Please try again.',day:'06/12/2030'},
  pt:{lang:'pt-BR',heading:'Reservas compartilhadas',online:'Agenda sincronizada.',offline:'Não foi possível sincronizar. Uma nova tentativa será feita.',success:'Reserva confirmada.',conflict:'Esta sala já está reservada nesse horário.',cancelled:'Reserva cancelada. O horário está disponível.',storage:'Não foi possível ler ou salvar os dados neste navegador. Tente novamente.',day:'12/06/2030'},
};
const names=[];for(const locale of ['es','en','pt'])for(const flow of ['parallel conflict has one winner in two isolated browsers','adjacent and different-room writes synchronize then cancellation releases availability','database write failure never announces success'])names.push(`${locale}: ${flow}`);
names.push('language and polling preserve draft room filter and raw local data','shared mode ignores corrupt browser booking data and never migrates it',
  'server restart reconnects both clients and preserves data','late old snapshots cannot roll the agenda backward','mobile shared layout fits all three languages','unavailable service disables confirmation and recovers automatically');
const record=recorder('ui',names);let browser;
before(async()=>{browser=await chromium.launch({headless:true});});
after(async()=>{if(browser)await browser.close();record.finish({chromium:browser?.version()});});
async function page(t,current,locale,{width=1280,seed={},blocked=false}={}){
  const context=await browser.newContext({locale:'en-US',viewport:{width,height:900}});t.after(()=>context.close());
  await context.addInitScript(({locale,seed,localeKey,bookingKey,blocked})=>{
    for(const [key,value] of Object.entries(seed))localStorage.setItem(key,value);localStorage.setItem(localeKey,locale);
    if(blocked){const get=Storage.prototype.getItem,set=Storage.prototype.setItem;
      Storage.prototype.getItem=function(key){if(key===bookingKey)throw new DOMException('Do not read local bookings');return get.call(this,key);};
      Storage.prototype.setItem=function(key,value){if(key===bookingKey)throw new DOMException('Do not save shared bookings locally');return set.call(this,key,value);};}
  },{locale,seed,localeKey,bookingKey,blocked});
  const value=await context.newPage(),errors=[];value.on('pageerror',error=>errors.push(error.message));t.after(()=>assert.deepEqual(errors,[]));
  await value.goto(current.base+'/compartidas');assert.equal(await value.locator('#sync-state').count(),1,'Shared status missing');
  await value.waitForFunction(text=>document.querySelector('#sync-state').textContent===text,expected[locale].online,{timeout:5000});
  assert.equal(await value.locator('html').getAttribute('lang'),expected[locale].lang);assert.equal(await value.locator('h1').textContent(),expected[locale].heading);
  return value;
}
async function fill(value,booking){await value.locator('#title').fill(booking.title);await value.locator(`input[value="${booking.roomId}"]`).check();for(const key of ['date','start','end'])await value.locator('#'+key).fill(booking[key]);}
const submit=value=>value.locator('#confirm').click();
async function result(value,text){await value.waitForFunction(text=>document.querySelector('#result').textContent===text,text,{timeout:5000});}
const check=(name,run)=>record.check(name,async t=>{const current=await fixture(t,record);await run(t,current);});

for(const locale of ['es','en','pt']){
  const text=expected[locale],prefix=locale+': ';
  check(prefix+'parallel conflict has one winner in two isolated browsers',async(t,current)=>{
    const a=await page(t,current,locale),b=await page(t,current,locale);
    let release;const barrier=new Promise(resolve=>{release=resolve;}),arrivals=[];
    for(const value of [a,b])await value.route('**/api/bookings',async route=>{
      if(route.request().method()!=='POST'){await route.continue();return;}
      arrivals.push({title:route.request().postDataJSON().title,at:new Date().toISOString()});if(arrivals.length===2)release();
      await barrier;await route.continue();
    });
    const responses=[];for(const value of [a,b])value.on('response',response=>{if(response.request().method()==='POST'&&response.url().endsWith('/api/bookings'))responses.push(response.status());});
    await fill(a,draft('User A'));await fill(b,draft('User B'));await Promise.all([submit(a),submit(b)]);
    await Promise.all([a,b].map(value=>value.waitForFunction(messages=>messages.includes(document.querySelector('#result').textContent),[text.success,text.conflict],{timeout:5000})));
    assert.equal(arrivals.length,2);assert.deepEqual(responses.sort(),[201,409]);
    assert.deepEqual((await Promise.all([a,b].map(value=>value.locator('#result').textContent()))).sort(),[text.success,text.conflict].sort());
    const response=await current.read();assert.equal(response.status,200);assert.equal(response.body.state.bookings.length,1);
    const winner=response.body.state.bookings[0].title;await converge([a,b],[winner],record,prefix+'conflict');
    assert.ok((await a.getByTestId('booking').textContent()).includes(text.day));
    assert.equal(await a.evaluate(key=>localStorage.getItem(key),bookingKey),null);assert.equal(await b.evaluate(key=>localStorage.getItem(key),bookingKey),null);
    record.traces.push({type:'two-browser-request-barrier',locale,arrivals,statuses:responses});
    await a.screenshot({path:path.join(record.directory,`${locale}-shared.png`),fullPage:true});
  });
  check(prefix+'adjacent and different-room writes synchronize then cancellation releases availability',async(t,current)=>{
    const a=await page(t,current,locale),b=await page(t,current,locale);
    await fill(a,draft('First'));await fill(b,draft('Adjacent',{start:'11:00',end:'12:00'}));await Promise.all([submit(a),submit(b)]);
    await result(a,text.success);await result(b,text.success);await converge([a,b],['First','Adjacent'],record,prefix+'adjacent');
    assert.equal((await current.reserve(draft('Other room',{roomId:'luna'}))).status,201);await converge([a,b],['First','Adjacent','Other room'],record,prefix+'rooms');
    await a.locator('[data-testid="booking"]').filter({hasText:'First'}).getByRole('button').click();await result(a,text.cancelled);
    await converge([a,b],['Adjacent','Other room'],record,prefix+'cancel');
    await fill(b,draft('Reuse'));await submit(b);await result(b,text.success);await converge([a,b],['Reuse','Adjacent','Other room'],record,prefix+'reuse');
    const state=(await current.read()).body.state;assert.equal(state.bookings.find(booking=>booking.title==='First').status,'cancelled');
  });
  check(prefix+'database write failure never announces success',async(t,current)=>{
    const value=await page(t,current,locale),db=new DatabaseSync(current.dbPath);
    try{db.exec("CREATE TRIGGER fail_write BEFORE UPDATE ON booking_state BEGIN SELECT RAISE(ABORT, 'fail'); END");
      await fill(value,draft('Unsaved'));await submit(value);await result(value,text.storage);assert.equal(await value.getByTestId('booking').count(),0);
      assert.equal((await current.read()).body.state.bookings.length,0);assert.equal(await value.locator('#title').inputValue(),'Unsaved');
    }finally{db.exec('DROP TRIGGER fail_write');db.close();}
  });
}
check(names[9],async(t,current)=>{
  const raw='{"legacy":"private untouched bytes"}',a=await page(t,current,'es',{seed:{[bookingKey]:raw}}),b=await page(t,current,'en');
  await fill(a,draft('Borrador',{roomId:'luna',date:'2031-01-02',start:'14:00',end:'15:00'}));await a.locator('[data-filter="luna"]').click();
  assert.equal((await current.reserve(draft('Remote',{roomId:'luna'}))).status,201);await converge([a,b],['Remote'],record,'remote draft');
  for(const locale of ['en','pt','es']){
    await a.locator('#language').selectOption(locale);assert.equal(await a.locator('h1').textContent(),expected[locale].heading);
    assert.equal(await a.locator('#title').inputValue(),'Borrador');assert.equal(await a.locator('#date').inputValue(),'2031-01-02');
    assert.equal(await a.locator('#start').inputValue(),'14:00');assert.equal(await a.locator('#end').inputValue(),'15:00');
    assert.equal(await a.locator('input[value="luna"]').isChecked(),true);assert.equal(await a.locator('[data-filter="luna"]').getAttribute('aria-pressed'),'true');
    assert.equal(await a.evaluate(key=>localStorage.getItem(key),bookingKey),raw);
  }
  assert.equal(await b.evaluate(key=>localStorage.getItem(key),localeKey),'en');
});
check(names[10],async(t,current)=>{
  const value=await page(t,current,'es',{blocked:true});await fill(value,draft('Central'));await submit(value);await result(value,expected.es.success);
  assert.equal((await current.read()).body.state.bookings.length,1);await value.goto(current.base+'/reservas');
  assert.equal(await value.locator('#confirm').isEnabled(),false);
});
check(names[11],async(t,current)=>{
  const a=await page(t,current,'es'),b=await page(t,current,'pt');await fill(a,draft('Durable'));await submit(a);await result(a,expected.es.success);
  await converge([a,b],['Durable'],record,'before restart');const snapshot=(await current.read()).body;await current.stop('SIGKILL');
  await a.waitForFunction(text=>document.querySelector('#sync-state').textContent===text,expected.es.offline,{timeout:5000});
  assert.equal(await a.locator('#confirm').isEnabled(),false);await current.start();
  await Promise.all([a,b].map((value,index)=>value.waitForFunction(text=>document.querySelector('#sync-state').textContent===text,index===0?expected.es.online:expected.pt.online,{timeout:5000})));
  assert.deepEqual((await current.read()).body,snapshot);await converge([a,b],['Durable'],record,'after restart');
});
check(names[12],async(t,current)=>{
  const value=await page(t,current,'es'),old=(await current.read()).body;let captured=false,release,captureResolve,deliveredResolve;
  const barrier=new Promise(resolve=>{release=resolve;});
  const capture=new Promise(resolve=>{captureResolve=resolve;}), delivered=new Promise(resolve=>{deliveredResolve=resolve;});
  await value.route('**/api/bookings',async route=>{
    if(route.request().method()==='GET'&&!captured){captured=true;captureResolve();await barrier;await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(old)});deliveredResolve();}
    else await route.continue();
  });
  await capture;assert.equal(captured,true);
  try{await fill(value,draft('Newest'));await submit(value);await result(value,expected.es.success);}finally{release();}
  await delivered;await value.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  assert.equal(await value.getByTestId('booking').count(),1);assert.equal(await value.locator('.booking-title').textContent(),'Newest');
});
check(names[13],async(t,current)=>{
  assert.equal((await current.reserve(draft('Mobile'))).status,201);
  for(const locale of ['es','en','pt']){
    const value=await page(t,current,locale,{width:390});await converge([value],['Mobile'],record,'mobile '+locale);
    assert.equal(await value.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
    await value.screenshot({path:path.join(record.directory,`${locale}-shared-mobile.png`),fullPage:true});
  }
});
check(names[14],async(t,current)=>{
  const value=await page(t,current,'en');let blocked=true;
  await value.route('**/api/bookings',route=>blocked?route.abort('failed'):route.continue());
  await value.waitForFunction(text=>document.querySelector('#sync-state').textContent===text,expected.en.offline,{timeout:5000});
  assert.equal(await value.locator('#confirm').isEnabled(),false);assert.notEqual(await value.locator('#result').textContent(),expected.en.success);
  blocked=false;await value.waitForFunction(text=>document.querySelector('#sync-state').textContent===text,expected.en.online,{timeout:5000});
  assert.equal(await value.locator('#confirm').isEnabled(),true);assert.equal((await current.read()).body.state.bookings.length,0);
});

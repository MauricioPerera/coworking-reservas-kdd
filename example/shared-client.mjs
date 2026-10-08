import {isValidState} from './booking-model.mjs';

const messages={
  es:{local:'En este navegador',shared:'Reservas compartidas',mode:'Modo de reservas',heading:'Reservas compartidas',sync:'Sincronización',connecting:'Conectando con la agenda compartida…',online:'Agenda sincronizada.',offline:'No se pudo sincronizar. Se intentará de nuevo.',footer:'Compartidas con otros navegadores · Horarios de tu agenda local'},
  en:{local:'In this browser',shared:'Shared bookings',mode:'Booking mode',heading:'Shared bookings',sync:'Synchronization',connecting:'Connecting to the shared schedule…',online:'Schedule synchronized.',offline:'Could not synchronize. Will try again.',footer:'Shared with other browsers · Local schedule times (24-hour)'},
  pt:{local:'Neste navegador',shared:'Reservas compartilhadas',mode:'Modo de reservas',heading:'Reservas compartilhadas',sync:'Sincronização',connecting:'Conectando à agenda compartilhada…',online:'Agenda sincronizada.',offline:'Não foi possível sincronizar. Uma nova tentativa será feita.',footer:'Compartilhadas com outros navegadores · Horários da sua agenda local'},
};
export function decorateShared(locale,active,{connected=false,loading=false}={}){
  const text=messages[locale]??messages.es;
  document.getElementById('local-view').textContent=text.local;document.getElementById('shared-view').textContent=text.shared;
  document.querySelector('.mode-nav').setAttribute('aria-label',text.mode);
  for(const [id,current] of [['local-view',!active],['shared-view',active]]){
    const link=document.getElementById(id);if(current)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');
  }
  const status=document.getElementById('sync-state');status.hidden=!active;status.setAttribute('aria-label',text.sync);
  if(!active)return;
  document.querySelector('h1').textContent=text.heading;document.title=`Espacio — ${text.heading}`;
  document.querySelector('footer').textContent=text.footer;
  status.textContent=loading?text.connecting:connected?text.online:text.offline;status.classList.toggle('error',!loading&&!connected);
}
const unavailable=cause=>Object.assign(new Error('STORAGE_UNAVAILABLE',{cause}),{code:'STORAGE_UNAVAILABLE'});
export function createSharedSession({onSnapshot,onConnection}){
  let revision=-1,connected=false,busy=false,loading=true,closed=false,timer;
  const lifetime=new AbortController();
  const status=()=>onConnection({connected,busy,loading});
  async function request(method,route,value){
    let response,body;
    try{
      response=await fetch(route,{method,cache:'no-store',signal:AbortSignal.any([lifetime.signal,AbortSignal.timeout(3000)]),
        ...(value!==undefined?{headers:{'content-type':'application/json'},body:JSON.stringify(value)}:{})});
      body=await response.json();
    }catch(error){throw unavailable(error);}
    if(!response.ok)throw Object.assign(new Error(body?.error?.code??'STORAGE_UNAVAILABLE'),{code:body?.error?.code??'STORAGE_UNAVAILABLE',status:response.status});
    if(!Number.isSafeInteger(body?.revision)||body.revision<0||!isValidState(body.state))throw unavailable();
    if(body.revision>revision){revision=body.revision;onSnapshot(body.state);}
    return body;
  }
  async function poll(){
    if(closed)return;
    try{await request('GET','/api/bookings');connected=true;}catch{connected=false;}
    loading=false;if(!closed){status();timer=setTimeout(poll,750);}
  }
  async function command(route,value){
    if(!connected||busy)throw unavailable();
    busy=true;status();
    try{return await request('POST',route,value);}
    catch(error){if(!error.status||error.status>=500)connected=false;throw error;}
    finally{busy=false;status();}
  }
  return {start(){status();void poll();},reserve:value=>command('/api/bookings',value),cancel:id=>command(`/api/bookings/${encodeURIComponent(id)}/cancel`,{}),
    close(){closed=true;clearTimeout(timer);lifetime.abort();}};
}

import {DatabaseSync} from 'node:sqlite';
import {mkdirSync} from 'node:fs';
import path from 'node:path';
import {emptyState,isValidState,reserveBooking,cancelBooking} from './booking-model.mjs';

function failure(code,cause){return Object.assign(new Error(code,{cause}),{code});}
export function openSharedStore(file){
  let database;
  try{
    mkdirSync(path.dirname(path.resolve(file)),{recursive:true});
    database=new DatabaseSync(file,{timeout:250});
    database.exec('PRAGMA synchronous=FULL; CREATE TABLE IF NOT EXISTS booking_state (singleton INTEGER PRIMARY KEY CHECK(singleton=1), revision INTEGER NOT NULL CHECK(revision>=0), state_json TEXT NOT NULL) STRICT');
    database.prepare('INSERT OR IGNORE INTO booking_state(singleton,revision,state_json) VALUES(1,0,?)').run(JSON.stringify(emptyState()));
  }catch(error){if(database?.isOpen)database.close();throw failure('STORAGE_UNAVAILABLE',error);}
  function read(){
    const row=database.prepare('SELECT revision,state_json FROM booking_state WHERE singleton=1').get();
    let state;try{state=JSON.parse(row?.state_json);}catch(error){throw failure('CORRUPT_STORAGE',error);}
    if(!Number.isSafeInteger(row.revision)||row.revision<0||!isValidState(state))throw failure('CORRUPT_STORAGE');
    return {revision:row.revision,state};
  }
  function changeSnapshot(change){
    try{
      database.exec('BEGIN IMMEDIATE');
      const current=read();
      const next=change(current.state);
      if(current.revision===Number.MAX_SAFE_INTEGER)throw failure('IDENTIFIERS_EXHAUSTED');
      const revision=current.revision+1;
      database.prepare('UPDATE booking_state SET revision=?,state_json=? WHERE singleton=1').run(revision,JSON.stringify(next));
      database.exec('COMMIT');
      return {revision,state:next};
    }catch(error){
      if(database.isTransaction){try{database.exec('ROLLBACK');}catch(rollback){throw failure('STORAGE_UNAVAILABLE',rollback);}}
      if(error.code?.startsWith('ERR_SQLITE'))throw failure('STORAGE_UNAVAILABLE',error);
      throw error;
    }
  }
  return {read,reserve:draft=>changeSnapshot(state=>reserveBooking(state,draft)),cancel:id=>changeSnapshot(state=>cancelBooking(state,id)),close:()=>database.close()};
}

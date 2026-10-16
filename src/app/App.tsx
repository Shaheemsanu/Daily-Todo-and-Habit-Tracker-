import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { BarChart3, CalendarDays, Check, ChevronLeft, ChevronRight, Cloud, Download, LayoutDashboard, LogOut, Menu, RotateCcw, Sparkles, Upload, X } from 'lucide-react';
import { addDays, format, parseISO } from 'date-fns';
import { AuthGate } from '../features/auth/AuthGate';
import { Dashboard } from '../features/dashboard/Dashboard';
import type { DailyLog, Task, TaskEntry, Tracker, TrackerEntry } from '../features/dashboard/types';
import { Reports } from '../features/reports/Reports';
import { History } from '../features/history/History';
import { downloadText } from '../lib/export';
import { dateKey, todayKey } from '../lib/dates';
import { supabase } from '../lib/supabase';

type Page='dashboard'|'reports'|'history';
const emptyLog=(date:string,userId?:string):DailyLog=>({entry_date:date,user_id:userId,water_ml:0,sleep_hours:0,notes:''});

export default function App() {
  const [session,setSession]=useState<Session|null>(null);
  const [page,setPage]=useState<Page>('dashboard');
  const [date,setDate]=useState(todayKey());
  const [period,setPeriod]=useState<'week'|'month'>('week');
  const [tasks,setTasks]=useState<Task[]>([]);
  const [entries,setEntries]=useState<TaskEntry[]>([]);
  const [trackers,setTrackers]=useState<Tracker[]>([]);
  const [trackerEntries,setTrackerEntries]=useState<TrackerEntry[]>([]);
  const [logs,setLogs]=useState<DailyLog[]>([]);
  const [log,setLog]=useState<DailyLog>(emptyLog(todayKey()));
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState('');
  const [mobileNav,setMobileNav]=useState(false);

  const userId=session?.user.id;
  const handleSession=useCallback((next:Session|null)=>setSession(next),[]);

  const refresh=useCallback(async()=>{
    if(!supabase||!userId)return;
    setBusy(true);
    try{
      const [t,e,tr,te,l]=await Promise.all([
        supabase.from('tasks').select('*').order('created_at',{ascending:true}),
        supabase.from('task_entries').select('*').order('entry_date',{ascending:false}),
        supabase.from('custom_trackers').select('*').order('created_at',{ascending:true}),
        supabase.from('tracker_entries').select('*').order('entry_date',{ascending:false}),
        supabase.from('daily_logs').select('*').order('entry_date',{ascending:false})
      ]);
      const error=[t,e,tr,te,l].find(r=>r.error)?.error;
      if(error){setNotice(error.message);return;}
      setTasks((t.data??[]) as Task[]);setEntries((e.data??[]) as TaskEntry[]);setTrackers((tr.data??[]) as Tracker[]);setTrackerEntries((te.data??[]) as TrackerEntry[]);setLogs((l.data??[]) as DailyLog[]);
      const todays=(l.data??[]).find((r:DailyLog)=>r.entry_date===date);
      setLog(todays?{...emptyLog(date,userId),...todays}:emptyLog(date,userId));
    }catch(error){
      setNotice(error instanceof Error?error.message:'Could not load your daily progress.');
    }finally{
      setBusy(false);
    }
  },[userId,date]);

  useEffect(()=>{ if(userId) void refresh(); else {setTasks([]);setEntries([]);setTrackers([]);setTrackerEntries([]);setLogs([]);setLog(emptyLog(date));} },[userId,refresh,date]);
  useEffect(()=>{ if(!notice)return;const timer=window.setTimeout(()=>setNotice(''),4500);return()=>window.clearTimeout(timer); },[notice]);

  const run=useCallback(async<T,>(action:()=>PromiseLike<{error:{message:string}|null;data?:T}>,success?:string)=>{
    if(!supabase)return;
    const result=await action();
    if(result.error){setNotice(result.error.message);return false;}
    if(success)setNotice(success);
    await refresh();
    return true;
  },[refresh]);

  const addTask=async(title:string,schedule_days:number[])=>{
    if(!supabase||!userId)return;
    await run(()=>supabase!.from('tasks').insert({user_id:userId,title,schedule_days,active:true}).select().single(),'Recurring task added');
  };
  const deleteTask=async(id:string)=>{if(!supabase)return;await run(()=>supabase!.from('tasks').delete().eq('id',id),'Task removed');};
  const setStatus=async(task:Task,status:TaskEntry['status'])=>{
    if(!supabase||!userId)return;
    await run(()=>supabase!.from('task_entries').upsert({user_id:userId,task_id:task.id,entry_date:date,status,completed_at:status==='done'?new Date().toISOString():null},{onConflict:'user_id,task_id,entry_date'}).select().single());
  };
  const updateLog=async(patch:Partial<DailyLog>)=>{
    const currentLog=log.entry_date===date?log:emptyLog(date,userId);
    const next={...currentLog,...patch,entry_date:date,user_id:userId};
    setLog(next);
    if(!supabase||!userId)return;
    await run(()=>supabase!.from('daily_logs').upsert(next,{onConflict:'user_id,entry_date'}).select().single());
  };
  const addTracker=async(name:string,kind:'number'|'boolean',unit:string,target:number|null)=>{
    if(!supabase||!userId)return;
    await run(()=>supabase!.from('custom_trackers').insert({user_id:userId,name,kind,unit,target,active:true}).select().single(),'Tracker created');
  };
  const deleteTracker=async(id:string)=>{if(!supabase)return;await run(()=>supabase!.from('custom_trackers').delete().eq('id',id),'Tracker removed');};
  const setTrackerValue=async(tracker:Tracker,value:number|boolean)=>{
    if(!supabase||!userId)return;
    const payload={user_id:userId,tracker_id:tracker.id,entry_date:date,numeric_value:tracker.kind==='number'?Number(value):null,boolean_value:tracker.kind==='boolean'?Boolean(value):null};
    await run(()=>supabase!.from('tracker_entries').upsert(payload,{onConflict:'user_id,tracker_id,entry_date'}).select().single());
  };
  const updateNote=async(value:string)=>updateLog({notes:value});

  async function signOut(){if(supabase)await supabase.auth.signOut();setSession(null);}
  async function exportBackup(){
    const backup={schemaVersion:1,exportedAt:new Date().toISOString(),tasks,entries,trackers,trackerEntries,logs};
    downloadText(`daymark-backup-${todayKey()}.json`,JSON.stringify(backup,null,2),'application/json');
  }
  async function importBackup(file:File){
    if(!supabase||!userId)return;
    try{
      const parsed=JSON.parse(await file.text());
      if(!Array.isArray(parsed.tasks)||!Array.isArray(parsed.trackers)||!Array.isArray(parsed.logs))throw new Error('This does not look like a Daymark backup.');
      // Import records in dependency order, forcing the active user's ID for safety.
      const taskMap=new Map<string,string>();
      for(const t of parsed.tasks){const {data,error}=await supabase.from('tasks').insert({user_id:userId,title:t.title,description:t.description??'',schedule_days:t.schedule_days??[0,1,2,3,4,5,6],active:t.active??true}).select('id').single();if(error)throw error;taskMap.set(t.id,data.id);}
      const trackerMap=new Map<string,string>();
      for(const t of parsed.trackers){const {data,error}=await supabase.from('custom_trackers').insert({user_id:userId,name:t.name,kind:t.kind,unit:t.unit??'',target:t.target??null,active:t.active??true}).select('id').single();if(error)throw error;trackerMap.set(t.id,data.id);}
      for(const e of parsed.entries??[]){const taskId=taskMap.get(e.task_id);if(taskId){const {error}=await supabase.from('task_entries').upsert({user_id:userId,task_id:taskId,entry_date:e.entry_date,status:e.status},{onConflict:'user_id,task_id,entry_date'});if(error)throw error;}}
      for(const e of parsed.trackerEntries??[]){const trackerId=trackerMap.get(e.tracker_id);if(trackerId){const {error}=await supabase.from('tracker_entries').upsert({user_id:userId,tracker_id:trackerId,entry_date:e.entry_date,numeric_value:e.numeric_value,boolean_value:e.boolean_value,note:e.note??''},{onConflict:'user_id,tracker_id,entry_date'});if(error)throw error;}}
      for(const l of parsed.logs){const {error}=await supabase.from('daily_logs').upsert({...l,id:undefined,user_id:userId},{onConflict:'user_id,entry_date'});if(error)throw error;}
      setNotice('Backup restored. Existing daily entries were merged where possible.');await refresh();
    }catch(error){setNotice(error instanceof Error?error.message:'Could not restore this backup.');}
  }

  const visibleEntries=useMemo(()=>entries,[entries]);
  const nav=[{id:'dashboard' as Page,label:'Daily tracker',icon:LayoutDashboard},{id:'reports' as Page,label:'Analytics',icon:BarChart3},{id:'history' as Page,label:'History',icon:CalendarDays}];
  const doneToday=tasks.filter(t=>t.active&&t.schedule_days.includes(parseISO(`${date}T12:00:00`).getDay())&&entries.some(e=>e.task_id===t.id&&e.entry_date===date&&e.status==='done')).length;
  const displayedLog=log.entry_date===date?log:emptyLog(date,userId);

  return <><AuthGate onSession={handleSession}/>{session&&<div className="app-shell">
    <aside className={`sidebar ${mobileNav?'nav-open':''}`}><div className="brand-row"><div className="brand-mark">d</div><span>daymark</span><button className="mobile-close" onClick={()=>setMobileNav(false)}><X size={18}/></button></div><div className="workspace-label">PERSONAL WORKSPACE</div><div className="user-chip"><div className="avatar">{session.user.email?.[0]?.toUpperCase()??'U'}</div><div><strong>{session.user.email?.split('@')[0]??'Your space'}</strong><span>Personal dashboard</span></div><span className="online-dot"/></div><nav>{nav.map(item=><button key={item.id} className={`nav-item ${page===item.id?'selected':''}`} onClick={()=>{setPage(item.id);setMobileNav(false);}}><item.icon size={18}/><span>{item.label}</span>{page===item.id&&<span className="nav-indicator"/>}</button>)}</nav><div className="sidebar-bottom"><div className="sidebar-tip"><div className="tip-icon"><Sparkles size={17}/></div><strong>Progress, not perfection</strong><p>Build a rhythm that works for you.</p></div><div className="sync-status"><Cloud size={15}/><span>Cloud synced with Supabase</span><span className="online-dot"/></div><button className="nav-item logout-button" onClick={signOut}><LogOut size={18}/><span>Sign out</span></button></div></aside>
    {mobileNav&&<button className="nav-scrim" onClick={()=>setMobileNav(false)} aria-label="Close navigation"/>}
    <main className="main-area"><header className="topbar"><button className="mobile-menu" onClick={()=>setMobileNav(true)} aria-label="Open navigation"><Menu size={20}/></button><div className="breadcrumbs"><span>Workspace</span><ChevronRight size={14}/><strong>{nav.find(n=>n.id===page)?.label}</strong></div><div className="topbar-actions"><div className="sync-pill"><span className="online-dot"/> All changes synced</div><button className="icon-button" title="Export JSON backup" onClick={exportBackup}><Download size={17}/></button><label className="icon-button upload-button" title="Restore JSON backup"><Upload size={17}/><input type="file" accept="application/json,.json" onChange={e=>{const file=e.target.files?.[0];if(file)void importBackup(file);e.currentTarget.value='';}}/></label><button className="avatar top-avatar" title="Sign out" onClick={signOut}>{session.user.email?.[0]?.toUpperCase()??'U'}</button></div></header>
      <div className="content-wrap">{page==='dashboard'?<><div className="date-navigation"><button className="date-nav-btn" onClick={()=>setDate(d=>dateKey(addDays(parseISO(`${d}T12:00:00`),-1)))}><ChevronLeft size={16}/></button><button className="date-current" onClick={()=>setDate(todayKey())}>{date===todayKey()?'Today':format(parseISO(`${date}T12:00:00`),'MMM d, yyyy')}<RotateCcw size={13}/></button><button className="date-nav-btn" onClick={()=>setDate(d=>dateKey(addDays(parseISO(`${d}T12:00:00`),1)))}><ChevronRight size={16}/></button><span className="date-nav-divider"/><span className="muted small" role="status" aria-live="polite">{busy?'Loading daily progress…':`${doneToday} completed`}</span></div><Dashboard date={date} tasks={tasks} entries={visibleEntries} log={displayedLog} trackers={trackers} trackerEntries={trackerEntries} onAddTask={addTask} onDeleteTask={deleteTask} onStatus={setStatus} onLog={updateLog} onAddTracker={addTracker} onDeleteTracker={deleteTracker} onTrackerValue={setTrackerValue} note={displayedLog.notes} onNote={updateNote} busy={busy}/></>:page==='reports'?<Reports tasks={tasks} entries={entries} logs={logs} period={period} onPeriod={setPeriod}/>:<History tasks={tasks} entries={entries} logs={logs}/>}
      <footer className="app-footer"><span>© {new Date().getFullYear()} Daymark</span><span><span className="online-dot"/> Your progress is private</span></footer></div>
    </main>
    {notice&&<div className={`toast ${notice.toLowerCase().includes('error')?'toast-error':''}`} role="status"><Check size={16}/><span>{notice}</span><button onClick={()=>setNotice('')}><X size={14}/></button></div>}
  </div>}</>;
}

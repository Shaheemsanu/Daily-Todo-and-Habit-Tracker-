import { useMemo, useState } from 'react';
import { Download, Search } from 'lucide-react';
import { downloadText, toCsv } from '../../lib/export';
import type { DailyLog, Task, TaskEntry } from '../dashboard/types';

export function History({ tasks, entries, logs }: { tasks:Task[]; entries:TaskEntry[]; logs:DailyLog[] }) {
  const [query,setQuery]=useState('');
  const [from,setFrom]=useState('');
  const [to,setTo]=useState('');
  const rows=useMemo(()=>{
    const allDates=[...new Set([...entries.map(e=>e.entry_date),...logs.map(l=>l.entry_date)])].sort((a,b)=>b.localeCompare(a));
    return allDates.filter(date=>(!from||date>=from)&&(!to||date<=to)).map(date=>{
      const dayEntries=entries.filter(e=>e.entry_date===date);
      const names=dayEntries.map(e=>`${tasks.find(t=>t.id===e.task_id)?.title??'Task'}: ${e.status}`).join(' · ');
      const log=logs.find(l=>l.entry_date===date);
      return {date,done:dayEntries.filter(e=>e.status==='done').length,pending:dayEntries.filter(e=>e.status==='pending').length,skipped:dayEntries.filter(e=>e.status==='skipped').length,water:log?.water_ml??0,sleep:log?.sleep_hours??0,notes:log?.notes??'',tasks:names};
    }).filter(row=>`${row.date} ${row.tasks} ${row.notes}`.toLowerCase().includes(query.toLowerCase()));
  },[entries,logs,tasks,from,to,query]);
  return <div className="page-stack"><div className="welcome-row"><div><p className="eyebrow">YOUR JOURNEY</p><h1>History & records<span className="period">.</span></h1><p className="muted">Your days, saved in one place.</p></div><button className="secondary-button" onClick={()=>downloadText('daymark-history.csv',toCsv(rows),'text/csv;charset=utf-8')}><Download size={16}/> Export CSV</button></div>
    <section className="panel history-panel"><div className="history-filters"><div className="search-box"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search notes or task names"/></div><label>From<input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label>To<input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label></div>
    <div className="table-scroll"><table><thead><tr><th>Date</th><th>Done</th><th>Pending</th><th>Skipped</th><th>Water</th><th>Sleep</th><th>Notes</th></tr></thead><tbody>{rows.map(r=><tr key={r.date}><td className="date-cell">{r.date}</td><td><span className="table-pill done-pill">{r.done}</span></td><td><span className="table-pill pending-pill">{r.pending}</span></td><td><span className="table-pill skipped-pill">{r.skipped}</span></td><td>{(r.water/1000).toFixed(2)} L</td><td>{Number(r.sleep).toFixed(1)} h</td><td className="note-cell" title={r.notes}>{r.notes||'—'}</td></tr>)}</tbody></table></div>
    {!rows.length&&<div className="empty-state"><strong>No matching history</strong><p>Try a different search or date range.</p></div>}<div className="table-footer">{rows.length} day{rows.length===1?'':'s'} found</div></section></div>;
}

import { useMemo } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format, parseISO } from 'date-fns';
import type { Task, TaskEntry, DailyLog } from '../dashboard/types';
import { lastNDays } from '../../lib/dates';

export function Reports({ tasks, entries, logs, period, onPeriod }: {
  tasks: Task[]; entries: TaskEntry[]; logs: DailyLog[]; period: 'week'|'month'; onPeriod: (p:'week'|'month')=>void;
}) {
  const days = useMemo(()=>lastNDays(period==='week'?7:30),[period]);
  const trend = days.map(day=>{
    const scheduled = tasks.filter(t=>t.active && t.schedule_days.includes(parseISO(`${day}T12:00:00`).getDay()));
    const done = scheduled.filter(t=>entries.some(e=>e.entry_date===day&&e.task_id===t.id&&e.status==='done')).length;
    return { day: format(parseISO(`${day}T12:00:00`), period==='week'?'EEE':'d MMM'), completion: scheduled.length?Math.round(done/scheduled.length*100):0, water: (logs.find(l=>l.entry_date===day)?.water_ml??0)/1000, sleep: Number(logs.find(l=>l.entry_date===day)?.sleep_hours??0) };
  });
  const counts = [
    {name:'Completed',value:entries.filter(e=>days.includes(e.entry_date)&&e.status==='done').length,color:'#5b54f5'},
    {name:'Pending',value:entries.filter(e=>days.includes(e.entry_date)&&e.status==='pending').length,color:'#dce0ec'},
    {name:'Skipped',value:entries.filter(e=>days.includes(e.entry_date)&&e.status==='skipped').length,color:'#f6bd60'}
  ].filter(x=>x.value>0);
  const average = Math.round(trend.reduce((s,d)=>s+d.completion,0)/(trend.length||1));
  const avgWater = (trend.reduce((s,d)=>s+d.water,0)/(trend.length||1)).toFixed(1);
  const avgSleep = (trend.reduce((s,d)=>s+d.sleep,0)/(trend.length||1)).toFixed(1);
  return <div className="page-stack">
    <div className="welcome-row"><div><p className="eyebrow">YOUR PROGRESS</p><h1>Insights that add up<span className="period">.</span></h1><p className="muted">Look back, learn, and keep moving forward.</p></div><div className="segmented"><button className={period==='week'?'active':''} onClick={()=>onPeriod('week')}>7 days</button><button className={period==='month'?'active':''} onClick={()=>onPeriod('month')}>30 days</button></div></div>
    <div className="summary-grid report-stats"><div className="summary-card"><span className="muted">Average completion</span><div className="summary-value">{average}<small>%</small></div><p className="summary-foot">Across the selected period</p></div><div className="summary-card"><span className="muted">Average water</span><div className="summary-value">{avgWater}<small> L/day</small></div><p className="summary-foot">Recorded daily intake</p></div><div className="summary-card"><span className="muted">Average sleep</span><div className="summary-value">{avgSleep}<small> hrs</small></div><p className="summary-foot">Recorded nightly rest</p></div><div className="summary-card"><span className="muted">Task entries</span><div className="summary-value">{entries.filter(e=>days.includes(e.entry_date)).length}</div><p className="summary-foot">Statuses recorded in this period</p></div></div>
    <div className="report-grid">
      <section className="panel chart-panel wide-chart"><div className="panel-heading"><div><p className="eyebrow">COMPLETION TREND</p><h2>Daily follow-through</h2></div><span className="chart-key"><i/> Completion</span></div><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={trend} margin={{top:8,right:8,left:-22,bottom:0}}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f6"/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize:11,fill:'#8790a2'}} interval={period==='month'?4:0}/><YAxis domain={[0,100]} axisLine={false} tickLine={false} tick={{fontSize:11,fill:'#8790a2'}} tickFormatter={v=>`${v}%`}/><Tooltip formatter={(v)=>[`${v}%`,'Completion']}/><Bar dataKey="completion" fill="#635bff" radius={[5,5,0,0]} maxBarSize={period==='week'?38:20}/></BarChart></ResponsiveContainer></div></section>
      <section className="panel chart-panel"><div className="panel-heading"><div><p className="eyebrow">TASK STATUS</p><h2>How it landed</h2></div></div>{counts.length?<div className="donut-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={counts} dataKey="value" nameKey="name" innerRadius={62} outerRadius={84} paddingAngle={3} stroke="none">{counts.map((entry,i)=><Cell key={entry.name} fill={entry.color}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer><div className="donut-legend">{counts.map(c=><div key={c.name}><span style={{background:c.color}}/><span>{c.name}</span><strong>{c.value}</strong></div>)}</div></div>:<div className="empty-state compact-empty">No task status data for this period yet.</div>}</section>
      <section className="panel chart-panel"><div className="panel-heading"><div><p className="eyebrow">WELLBEING</p><h2>Water intake</h2></div></div><div className="chart-wrap small-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={trend} margin={{top:8,right:4,left:-22,bottom:0}}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f6"/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize:10,fill:'#8790a2'}} interval={period==='month'?4:0}/><YAxis axisLine={false} tickLine={false} tick={{fontSize:10,fill:'#8790a2'}}/><Tooltip formatter={(v)=>[`${v} L`,'Water']}/><Bar dataKey="water" fill="#51b8df" radius={[4,4,0,0]} maxBarSize={24}/></BarChart></ResponsiveContainer></div></section>
      <section className="panel chart-panel"><div className="panel-heading"><div><p className="eyebrow">REST & RECOVERY</p><h2>Sleep duration</h2></div></div><div className="chart-wrap small-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={trend} margin={{top:8,right:4,left:-22,bottom:0}}><CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf0f6"/><XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fontSize:10,fill:'#8790a2'}} interval={period==='month'?4:0}/><YAxis axisLine={false} tickLine={false} tick={{fontSize:10,fill:'#8790a2'}}/><Tooltip formatter={(v)=>[`${v} hrs`,'Sleep']}/><Bar dataKey="sleep" fill="#9d8cf5" radius={[4,4,0,0]} maxBarSize={24}/></BarChart></ResponsiveContainer></div></section>
    </div>
  </div>;
}

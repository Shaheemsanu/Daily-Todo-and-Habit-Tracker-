import { useMemo, useState } from 'react';
import { Check, Circle, Clock3, Droplets, Moon, Plus, SkipForward, Trash2, X } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { DailyLog, Task, TaskEntry, Tracker, TrackerEntry } from './types';
import { prettyDate } from '../../lib/dates';

type Props = {
  date: string; tasks: Task[]; entries: TaskEntry[]; log: DailyLog;
  trackers: Tracker[]; trackerEntries: TrackerEntry[];
  onAddTask: (title: string, days: number[]) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onStatus: (task: Task, status: TaskEntry['status']) => Promise<void>;
  onLog: (patch: Partial<DailyLog>) => Promise<void>;
  onAddTracker: (name: string, kind: 'number'|'boolean', unit: string, target: number|null) => Promise<void>;
  onDeleteTracker: (id: string) => Promise<void>;
  onTrackerValue: (tracker: Tracker, value: number|boolean) => Promise<void>;
  note: string; onNote: (value: string) => Promise<void>;
  busy: boolean;
};

const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

export function Dashboard(props: Props) {
  const { date, tasks, entries, log, trackers, trackerEntries } = props;
  const [newTask, setNewTask] = useState('');
  const [newTracker, setNewTracker] = useState('');
  const [trackerKind, setTrackerKind] = useState<'number'|'boolean'>('boolean');
  const [trackerUnit, setTrackerUnit] = useState('');
  const [trackerTarget, setTrackerTarget] = useState('');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showTrackerForm, setShowTrackerForm] = useState(false);
  const [taskDays, setTaskDays] = useState<number[]>([0,1,2,3,4,5,6]);

  const todaysTasks = useMemo(() => tasks.filter(t => t.active && t.schedule_days.includes(parseISO(date).getDay())), [tasks,date]);
  const statusByTask = (id: string) => entries.find(e => e.task_id === id)?.status ?? 'pending';
  const doneCount = todaysTasks.filter(t => statusByTask(t.id) === 'done').length;
  const percent = todaysTasks.length ? Math.round(doneCount / todaysTasks.length * 100) : 0;
  const trackerValue = (id: string) => trackerEntries.find(e => e.tracker_id === id);

  async function addTask() {
    const title = newTask.trim(); if (!title) return;
    await props.onAddTask(title, taskDays);
    setNewTask(''); setShowTaskForm(false);
  }
  async function addTracker() {
    if (!newTracker.trim()) return;
    await props.onAddTracker(newTracker.trim(), trackerKind, trackerUnit, trackerTarget ? Number(trackerTarget) : null);
    setNewTracker(''); setTrackerUnit(''); setTrackerTarget(''); setShowTrackerForm(false);
  }

  return <div className="page-stack">
    <div className="welcome-row">
      <div><p className="eyebrow">{format(parseISO(date), 'EEEE, MMMM d, yyyy').toUpperCase()}</p><h1>Make today count<span className="period">.</span></h1><p className="muted">Small steps, repeated with care.</p></div>
      <div className="date-chip"><span className="date-chip-day">{format(parseISO(date), 'dd')}</span><span>{format(parseISO(date), 'MMM yyyy')}</span></div>
    </div>

    <section className="summary-grid">
      <div className="summary-card completion-card"><div className="summary-top"><span>Daily completion</span><span className="icon-bubble purple"><Check size={18}/></span></div><div className="summary-value">{percent}<small>%</small></div><div className="progress-track"><div className="progress-fill" style={{width:`${percent}%`}}/></div><p className="summary-foot">{doneCount} of {todaysTasks.length} scheduled tasks completed</p></div>
      <div className="summary-card"><div className="summary-top"><span>Water intake</span><span className="icon-bubble blue"><Droplets size={18}/></span></div><div className="summary-value">{(log.water_ml/1000).toFixed(1)}<small> L</small></div><div className="mini-actions"><button onClick={()=>props.onLog({water_ml:Math.max(0,log.water_ml-250)})}>− 250 ml</button><button onClick={()=>props.onLog({water_ml:log.water_ml+250})}>+ 250 ml</button></div><p className="summary-foot">Daily target: 2.0 L</p></div>
      <div className="summary-card"><div className="summary-top"><span>Sleep duration</span><span className="icon-bubble amber"><Moon size={18}/></span></div><div className="summary-value">{Number(log.sleep_hours).toFixed(1)}<small> hrs</small></div><input aria-label="Sleep hours" className="range-input" type="range" min="0" max="14" step=".5" value={log.sleep_hours} onChange={e=>props.onLog({sleep_hours:Number(e.target.value)})}/><p className="summary-foot">Aim for 7–9 hours</p></div>
      <div className="summary-card"><div className="summary-top"><span>Still to do</span><span className="icon-bubble rose"><Clock3 size={18}/></span></div><div className="summary-value">{todaysTasks.length-doneCount}<small> tasks</small></div><p className="summary-foot">{todaysTasks.length-doneCount === 0 ? 'You have cleared your list.' : 'One task at a time.'}</p><div className="tiny-illustration"><span/><span/><span/><span/><span/></div></div>
    </section>

    <div className="dashboard-columns">
      <section className="panel task-panel">
        <div className="panel-heading"><div><p className="eyebrow">YOUR ROUTINE</p><h2>Daily tasks <span className="count-pill">{todaysTasks.length}</span></h2></div><button className="icon-button" aria-label="Add task" onClick={()=>setShowTaskForm(!showTaskForm)}><Plus size={19}/></button></div>
        {showTaskForm && <div className="inline-form"><input value={newTask} onChange={e=>setNewTask(e.target.value)} placeholder="e.g. Read for 20 minutes" onKeyDown={e=>e.key==='Enter'&&addTask()} autoFocus/><div className="weekday-picks">{days.map((d,i)=><button key={d} className={taskDays.includes(i)?'weekday active':'weekday'} onClick={()=>setTaskDays(prev=>prev.includes(i)?prev.filter(n=>n!==i):[...prev,i])}>{d}</button>)}</div><div className="form-actions"><button className="text-button" onClick={()=>setShowTaskForm(false)}>Cancel</button><button className="primary-button compact" onClick={addTask}>Add recurring task</button></div><p className="microcopy">Choose the days this task should appear. Its status is stored separately for each date.</p></div>}
        <div className="task-list">{todaysTasks.length ? todaysTasks.map(task=>{const status=statusByTask(task.id);return <div className={`task-row ${status==='done'?'is-done':''}`} key={task.id}>
          <button className={`task-check ${status==='done'?'checked':status==='skipped'?'skipped':''}`} aria-label={`Mark ${task.title} ${status==='done'?'pending':'done'}`} onClick={()=>props.onStatus(task,status==='done'?'pending':'done')}>{status==='done'?<Check size={15}/>:status==='skipped'?<SkipForward size={14}/>:<Circle size={16}/>}</button>
          <div className="task-copy"><span className="task-title">{task.title}</span><span className="task-subtitle">{status==='done'?'Completed':status==='skipped'?'Skipped':'Recurring task'}</span></div>
          <button className="status-action" title="Skip for this day" onClick={()=>props.onStatus(task,status==='skipped'?'pending':'skipped')}><SkipForward size={15}/></button>
          <button className="status-action delete-action" title="Delete recurring task" onClick={()=>props.onDeleteTask(task.id)}><Trash2 size={15}/></button>
        </div>}) : <div className="empty-state"><div className="empty-icon"><Check size={22}/></div><strong>No tasks scheduled</strong><p>Add a recurring task to build a routine.</p><button className="text-button" onClick={()=>setShowTaskForm(true)}>+ Add your first task</button></div>}</div>
        <div className="panel-footer"><span><span className="legend-dot green"/> Done</span><span><span className="legend-dot gray"/> Pending</span><span><span className="legend-dot amber-dot"/> Skipped</span></div>
      </section>

      <section className="panel tracker-panel">
        <div className="panel-heading"><div><p className="eyebrow">BUILD CONSISTENCY</p><h2>Habit trackers</h2></div><button className="icon-button" aria-label="Add tracker" onClick={()=>setShowTrackerForm(!showTrackerForm)}><Plus size={19}/></button></div>
        {showTrackerForm && <div className="inline-form"><input value={newTracker} onChange={e=>setNewTracker(e.target.value)} placeholder="Tracker name" autoFocus/><div className="two-fields"><select value={trackerKind} onChange={e=>setTrackerKind(e.target.value as 'number'|'boolean')}><option value="boolean">Yes / No</option><option value="number">Number</option></select><input value={trackerUnit} onChange={e=>setTrackerUnit(e.target.value)} placeholder="Unit (e.g. pages)"/></div>{trackerKind==='number'&&<input type="number" min="0" value={trackerTarget} onChange={e=>setTrackerTarget(e.target.value)} placeholder="Daily target (optional)"/>}<div className="form-actions"><button className="text-button" onClick={()=>setShowTrackerForm(false)}>Cancel</button><button className="primary-button compact" onClick={addTracker}>Create tracker</button></div></div>}
        <div className="tracker-list">
          {trackers.filter(t=>t.active).map(tracker=>{const entry=trackerValue(tracker.id);const value=tracker.kind==='boolean'?Boolean(entry?.boolean_value):Number(entry?.numeric_value??0);return <div className="tracker-row" key={tracker.id}><div className={`tracker-symbol ${tracker.kind==='boolean'?'tracker-check':'tracker-number'}`}>{tracker.kind==='boolean'?<Check size={17}/>:<span>123</span>}</div><div className="tracker-copy"><strong>{tracker.name}</strong><span>{tracker.kind==='boolean'?'Daily check-in':`Target: ${tracker.target??'—'} ${tracker.unit}`}</span></div>{tracker.kind==='boolean'?<button className={`toggle-check ${value?'selected':''}`} aria-label={`Toggle ${tracker.name}`} onClick={()=>props.onTrackerValue(tracker,!value)}>{value?<Check size={15}/>:<X size={14}/>}</button>:<div className="number-stepper"><button onClick={()=>props.onTrackerValue(tracker,Math.max(0,Number(value)-1))}>−</button><strong>{value}</strong><button onClick={()=>props.onTrackerValue(tracker,Number(value)+1)}>+</button></div>}<button className="status-action delete-action" title={`Delete ${tracker.name}`} onClick={()=>props.onDeleteTracker(tracker.id)}><Trash2 size={14}/></button></div>})}
          {!trackers.filter(t=>t.active).length&&!showTrackerForm&&<div className="tracker-empty">Create a custom tracker for any habit.</div>}
        </div>
        <div className="panel-note"><span className="note-star">✦</span><span>Consistency beats intensity. A little progress still counts.</span></div>
      </section>
    </div>

    <section className="panel notes-panel"><div className="panel-heading"><div><p className="eyebrow">REFLECTION</p><h2>Daily notes</h2></div><span className="muted small">Saved to {date}</span></div><textarea value={props.note} onChange={e=>props.onNote(e.target.value)} placeholder="What went well today? What would you like to remember?..." rows={3}/><div className="notes-footer"><span className="muted small">A few words can help you notice your progress.</span><span className="muted small">{props.note.length} characters</span></div></section>
  </div>;
}

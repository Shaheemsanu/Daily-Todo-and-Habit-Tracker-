export type Task = { id: string; user_id: string; title: string; description: string; schedule_days: number[]; active: boolean };
export type TaskEntry = { id: string; user_id: string; task_id: string; entry_date: string; status: 'pending'|'done'|'skipped'; completed_at?: string|null };
export type Tracker = { id: string; user_id: string; name: string; kind: 'number'|'boolean'; unit: string; target: number|null; active: boolean };
export type TrackerEntry = { id: string; user_id: string; tracker_id: string; entry_date: string; numeric_value: number|null; boolean_value: boolean|null; note: string };
export type DailyLog = { id?: string; user_id?: string; entry_date: string; water_ml: number; sleep_hours: number; notes: string };

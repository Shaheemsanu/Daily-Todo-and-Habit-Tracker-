import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Dashboard } from './Dashboard';
import type { DailyLog, Task, TaskEntry, Tracker, TrackerEntry } from './types';

describe('Dashboard daily values', () => {
  it('does not carry task or habit values over from a previous date', () => {
    const date = '2026-10-16';
    const tasks: Task[] = [{
      id: 'task-1',
      user_id: 'user-1',
      title: 'Read',
      description: '',
      schedule_days: [5],
      active: true,
    }];
    const entries: TaskEntry[] = [{
      id: 'task-entry-1',
      user_id: 'user-1',
      task_id: 'task-1',
      entry_date: '2026-10-15',
      status: 'done',
    }];
    const trackers: Tracker[] = [{
      id: 'tracker-1',
      user_id: 'user-1',
      name: 'Pages read',
      kind: 'number',
      unit: 'pages',
      target: 10,
      active: true,
    }];
    const trackerEntries: TrackerEntry[] = [{
      id: 'tracker-entry-1',
      user_id: 'user-1',
      tracker_id: 'tracker-1',
      entry_date: '2026-10-15',
      numeric_value: 8,
      boolean_value: null,
      note: '',
    }];
    const log: DailyLog = {
      entry_date: date,
      water_ml: 0,
      sleep_hours: 0,
      notes: '',
    };

    render(<Dashboard
      date={date}
      tasks={tasks}
      entries={entries}
      log={log}
      trackers={trackers}
      trackerEntries={trackerEntries}
      onAddTask={vi.fn()}
      onDeleteTask={vi.fn()}
      onStatus={vi.fn()}
      onLog={vi.fn()}
      onAddTracker={vi.fn()}
      onDeleteTracker={vi.fn()}
      onTrackerValue={vi.fn()}
      note=""
      onNote={vi.fn()}
      busy={false}
    />);

    expect(screen.getByText('Recurring task')).toBeInTheDocument();
    expect(document.querySelector('.number-stepper strong')).toHaveTextContent('0');
  });
});

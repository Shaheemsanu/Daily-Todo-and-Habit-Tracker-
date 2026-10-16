import { fireEvent, render, screen } from '@testing-library/react';
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
    const trackers: Tracker[] = [
      {
        id: 'tracker-1',
        user_id: 'user-1',
        name: 'Pages read',
        kind: 'number',
        unit: 'pages',
        target: 10,
        active: true,
      },
      {
        id: 'tracker-2',
        user_id: 'user-1',
        name: 'Meditate',
        kind: 'boolean',
        unit: '',
        target: null,
        active: true,
      },
    ];
    const trackerEntries: TrackerEntry[] = [
      {
        id: 'tracker-entry-1',
        user_id: 'user-1',
        tracker_id: 'tracker-1',
        entry_date: '2026-10-15',
        numeric_value: 8,
        boolean_value: null,
        note: '',
      },
      {
        id: 'tracker-entry-2',
        user_id: 'user-1',
        tracker_id: 'tracker-2',
        entry_date: '2026-10-15',
        numeric_value: null,
        boolean_value: true,
        note: '',
      },
    ];
    const log: DailyLog = {
      entry_date: date,
      water_ml: 0,
      sleep_hours: 0,
      notes: '',
    };
    const onStatus = vi.fn();
    const onNote = vi.fn().mockResolvedValue(true);

    render(<Dashboard
      date={date}
      tasks={tasks}
      entries={entries}
      log={log}
      trackers={trackers}
      trackerEntries={trackerEntries}
      onAddTask={vi.fn()}
      onDeleteTask={vi.fn()}
      onStatus={onStatus}
      onLog={vi.fn()}
      onAddTracker={vi.fn()}
      onDeleteTracker={vi.fn()}
      onTrackerValue={vi.fn()}
      note=""
      onNote={onNote}
      busy={false}
    />);

    expect(screen.getByText('Recurring task')).toBeInTheDocument();
    expect(document.querySelector('.number-stepper strong')).toHaveTextContent('0');
    expect(screen.getByRole('button', { name: 'Toggle Meditate' })).not.toHaveClass('selected');
    fireEvent.click(screen.getByRole('button', { name: 'Mark Read done' }));
    expect(onStatus).toHaveBeenCalledWith(tasks[0], 'done');

    fireEvent.change(screen.getByPlaceholderText('What went well today? What would you like to remember?...'), {
      target: { value: 'A good day' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save notes' }));
    expect(onNote).toHaveBeenCalledWith('A good day');
  });
});

import React, { useMemo, useState } from 'react';
import { CalendarClock, PlusCircle } from 'lucide-react';
import { useTimer } from './TimerProvider';

const getTodayDateString = (): string => {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, '0');
  const day = `${now.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function RetrospectiveTimePanel() {
  const { tasks, activeTimer, loading, logManualTime } = useTimer();

  const initialTaskId = useMemo(() => (tasks.length > 0 ? tasks[0].id : ''), [tasks]);

  const [taskId, setTaskId] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [hours, setHours] = useState<string>('0');
  const [minutes, setMinutes] = useState<string>('30');
  const [note, setNote] = useState<string>('');

  React.useEffect(() => {
    if (!taskId && initialTaskId) {
      setTaskId(initialTaskId);
    }
  }, [initialTaskId, taskId]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    const parsedHours = Number(hours || '0');
    const parsedMinutes = Number(minutes || '0');
    const durationMinutes = (parsedHours * 60) + parsedMinutes;

    const result = await logManualTime({
      taskId,
      date,
      durationMinutes,
      note: note.trim() || undefined
    });

    if (result.success) {
      setHours('0');
      setMinutes('30');
      setNote('');
    }
  };

  const hasTasks = tasks.length > 0;
  const isManualTimeDisabled = !hasTasks || !!activeTimer || loading;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 mb-6">
      <div className="flex items-start gap-3 mb-4">
        <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
          <CalendarClock size={20} />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Log time retrospectively</h2>
          <p className="text-sm text-gray-500 mt-1">
            Add a completed time entry for a selected task and date.
          </p>
        </div>
      </div>

      {activeTimer && (
        <div className="mb-4 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-sm text-amber-800">
          Stop the active timer before logging retrospective time.
        </div>
      )}

      {!hasTasks && (
        <div className="rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-sm text-gray-600">
          Create at least one task before logging retrospective time.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="manual-task" className="block text-sm font-medium text-gray-700 mb-1">
              Task
            </label>
            <select
              id="manual-task"
              value={taskId}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTaskId(e.target.value)}
              disabled={isManualTimeDisabled}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {tasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="manual-date" className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              id="manual-date"
              type="date"
              value={date}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
              disabled={isManualTimeDisabled}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="manual-hours" className="block text-sm font-medium text-gray-700 mb-1">
              Hours
            </label>
            <input
              id="manual-hours"
              type="number"
              min="0"
              step="1"
              value={hours}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setHours(e.target.value)}
              disabled={isManualTimeDisabled}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="manual-minutes" className="block text-sm font-medium text-gray-700 mb-1">
              Minutes
            </label>
            <input
              id="manual-minutes"
              type="number"
              min="0"
              max="59"
              step="1"
              value={minutes}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setMinutes(e.target.value)}
              disabled={isManualTimeDisabled}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label htmlFor="manual-note" className="block text-sm font-medium text-gray-700 mb-1">
            Note (optional)
          </label>
          <textarea
            id="manual-note"
            rows={3}
            value={note}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNote(e.target.value)}
            disabled={isManualTimeDisabled}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optional note about this time entry"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isManualTimeDisabled || !taskId || !date}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded-lg transition-colors"
          >
            <PlusCircle size={18} />
            Log time
          </button>
        </div>
      </form>
    </div>
  );
}

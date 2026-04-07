import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { timerAPI, BackendTask } from '../../services/api';
import { Task, TimerContextType, ManualTimeEntryInput } from './types';

const TimerContext = createContext<TimerContextType | undefined>(undefined);

interface TimerProviderProps {
  children: ReactNode;
}

const transformTask = (backendTask: BackendTask): Task => ({
  id: backendTask.taskId,
  name: backendTask.title,
  color: '#3B82F6',
  totalTime: backendTask.totalTimeSpent,
  description: backendTask.description,
  category: backendTask.category,
  priority: backendTask.priority,
  status: backendTask.status
});

export function TimerProvider({ children }: TimerProviderProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeTimer, setActiveTimer] = useState<Task | null>(null);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const refreshTasks = useCallback(async (): Promise<void> => {
    const backendTasks = await timerAPI.getTasks();
    const transformedTasks = backendTasks.map(transformTask);
    setTasks(transformedTasks);
  }, []);

  useEffect(() => {
    const loadTasks = async (): Promise<void> => {
      try {
        setLoading(true);
        await refreshTasks();
      } catch (err) {
        setError('Failed to load tasks');
        console.error('Load tasks error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, [refreshTasks]);

  useEffect(() => {
    const checkActiveTimer = async (): Promise<void> => {
      try {
        console.log('🔍 Checking for active timer...');
        const activeTimerData = await timerAPI.getActiveTimer();
        console.log('📊 Active timer API response:', activeTimerData);

        if (activeTimerData && Object.keys(activeTimerData).length > 0) {
          const timer = activeTimerData.timer || activeTimerData;

          console.log('✅ Found existing active timer:', timer);

          const start = new Date(timer.startTime).getTime();
          if (Number.isNaN(start)) {
            console.error('❌ Failed to parse startTime:', timer.startTime);
            return;
          }

          const tempTask: Task = {
            id: timer.taskId,
            name: timer.taskTitle || timer.taskName || 'Loading task...',
            color: '#3B82F6',
            totalTime: 0
          };

          setActiveTimer(tempTask);
          setStartTime(start);
          setElapsedTime(Math.floor((Date.now() - start) / 1000));
        } else {
          console.log('ℹ️ No active timer found');
        }
      } catch (err) {
        console.error('❌ Error checking active timer:', err);
      }
    };

    checkActiveTimer();
  }, []);

  useEffect(() => {
    if (tasks.length > 0 && activeTimer && (activeTimer.name === 'Loading task...' || activeTimer.name === 'Loading...')) {
      const fullTask = tasks.find((task) => task.id === activeTimer.id);
      if (fullTask) {
        setActiveTimer(fullTask);
      }
    }
  }, [tasks, activeTimer]);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (activeTimer && startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        setElapsedTime(Math.floor((now - startTime) / 1000));
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeTimer, startTime]);

  const startTimer = useCallback(async (task: Task): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      const existingTimer = await timerAPI.getActiveTimer();
      const timer = existingTimer?.timer || existingTimer;

      if (timer) {
        if (timer.taskId === task.id) {
          await timerAPI.stopTimer();
          setActiveTimer(null);
          setStartTime(null);
          setElapsedTime(0);
          return;
        }

        await timerAPI.switchTimer(task.id);
      } else {
        await timerAPI.startTimer(task.id);
      }

      setActiveTimer(task);
      setStartTime(Date.now());
      setElapsedTime(0);
    } catch (err) {
      setError('Failed to start timer');
      console.error('Start timer error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const stopTimer = useCallback(async (): Promise<void> => {
    if (!activeTimer) {
      return;
    }

    try {
      setLoading(true);
      await timerAPI.stopTimer();
      setActiveTimer(null);
      setStartTime(null);
      setElapsedTime(0);
      await refreshTasks();
    } catch (err) {
      setError('Failed to stop timer');
      console.error('Stop timer error:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTimer, refreshTasks]);

  const logManualTime = useCallback(async (entry: ManualTimeEntryInput) => {
    try {
      setLoading(true);
      setError(null);

      if (activeTimer) {
        setError('Stop the active timer before logging retrospective time');
        return { success: false };
      }

      if (!entry.taskId) {
        setError('Please select a task');
        return { success: false };
      }

      if (!entry.date) {
        setError('Please select a date');
        return { success: false };
      }

      if (!Number.isInteger(entry.durationMinutes) || entry.durationMinutes <= 0) {
        setError('Duration must be a positive number of minutes');
        return { success: false };
      }

      await timerAPI.createManualSession(entry);
      await refreshTasks();

      return { success: true };
    } catch (err) {
      setError('Failed to log retrospective time');
      console.error('Log manual time error:', err);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [activeTimer, refreshTasks]);

  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'totalTime'>) => {
    try {
      setLoading(true);

      const backendTaskData = {
        title: taskData.name,
        description: taskData.description,
        category: taskData.category,
        priority: taskData.priority || ('medium' as const)
      };

      const response = await timerAPI.createTask(backendTaskData);
      const newTask = transformTask(response.task);

      setTasks((prev) => [...prev, newTask]);
      return { success: true };
    } catch (err) {
      setError('Failed to add task');
      console.error('Add task error:', err);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTask = useCallback(async (taskId: string, updates: Partial<Task>) => {
    try {
      setLoading(true);

      const backendUpdates: Partial<BackendTask> = {};
      if (updates.name) backendUpdates.title = updates.name;
      if (updates.description) backendUpdates.description = updates.description;
      if (updates.category) backendUpdates.category = updates.category;
      if (updates.priority) backendUpdates.priority = updates.priority;

      await timerAPI.updateTask(taskId, backendUpdates);

      setTasks((prev) => prev.map((task) => (
        task.id === taskId ? { ...task, ...updates } : task
      )));

      if (activeTimer && activeTimer.id === taskId) {
        setActiveTimer((prev) => (prev ? { ...prev, ...updates } : null));
      }

      return { success: true };
    } catch (err) {
      setError('Failed to update task');
      console.error('Update task error:', err);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [activeTimer]);

  const deleteTask = useCallback(async (taskId: string) => {
    try {
      setLoading(true);

      if (activeTimer && activeTimer.id === taskId) {
        await timerAPI.stopTimer();
        setActiveTimer(null);
        setStartTime(null);
        setElapsedTime(0);
      }

      await timerAPI.deleteTask(taskId);
      setTasks((prev) => prev.filter((task) => task.id !== taskId));

      return { success: true };
    } catch (err) {
      setError('Failed to delete task');
      console.error('Delete task error:', err);
      return { success: false };
    } finally {
      setLoading(false);
    }
  }, [activeTimer]);

  const value: TimerContextType = {
    tasks,
    activeTimer,
    elapsedTime,
    loading,
    error,
    startTimer,
    stopTimer,
    logManualTime,
    addTask,
    updateTask,
    deleteTask,
    setError
  };

  return (
    <TimerContext.Provider value={value}>
      {children}
    </TimerContext.Provider>
  );
}

export function useTimer(): TimerContextType {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within TimerProvider');
  }
  return context;
}

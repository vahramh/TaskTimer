import React, { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { timerAPI, BackendTask } from '../../services/api';
import { Task, TimerContextType } from './types';

const TimerContext = createContext<TimerContextType | undefined>(undefined);

interface TimerProviderProps {
  children: ReactNode;
}

// Transform backend task to frontend task
const transformTask = (backendTask: BackendTask): Task => ({
  id: backendTask.taskId,
  name: backendTask.title,
  color: '#3B82F6', // Default color - you might want to add this field to backend
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

  // Load tasks on mount
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true);
        const backendTasks = await timerAPI.getTasks();
        const transformedTasks = backendTasks.map(transformTask);
        setTasks(transformedTasks);
      } catch (err) {
        setError('Failed to load tasks');
        console.error('Load tasks error:', err);
      } finally {
        setLoading(false);
      }
    };
    loadTasks();
  }, []);

// Check for active timer on mount - with debug logging
  useEffect(() => {
    const checkActiveTimer = async () => {
      try {
        console.log('🔍 Checking for active timer...');
        const activeTimerData = await timerAPI.getActiveTimer();
        console.log('📊 Active timer API response:', activeTimerData);
        
        if (activeTimerData && Object.keys(activeTimerData).length > 0) {
          console.log('✅ Found existing active timer:', activeTimerData);
          console.log('✅ activeTimerData.timer:', activeTimerData.timer);
          
          // Log the structure of the response
          console.log('📋 Timer data structure:', {
            taskId: activeTimerData.timer.taskId,
            taskName: activeTimerData.timer.taskName,
            startTime: activeTimerData.timer.startTime,
            startTimeType: typeof activeTimerData.timer.startTime
          });
          
          // Simple time parsing - try the original approach first
          const start = new Date(activeTimerData.timer.startTime).getTime();
          console.log('⏰ Parsed start time:', start, 'Current time:', Date.now());
          
          // Validate timestamp
          if (isNaN(start)) {
            console.error('❌ Failed to parse startTime:', activeTimerData.timer.startTime);
            return;
          }
          
          // Create task object
          const tempTask = {
            id: activeTimerData.timer.taskId,
            name: activeTimerData.timer.taskName || 'Loading task...',
            color: '#3B82F6',
            totalTime: 0
          };
          
          console.log('📝 Setting temp task:', tempTask);
          setActiveTimer(tempTask);
          setStartTime(start);
          
          const elapsed = Math.floor((Date.now() - start) / 1000);
          console.log('⏱️ Calculated elapsed time:', elapsed, 'seconds');
          setElapsedTime(elapsed);
          
          console.log('✅ Active timer setup complete');
        } else {
          console.log('ℹ️ No active timer found');
        }
      } catch (err) {
        console.error('❌ Error checking active timer:', err);
      }
    };

    checkActiveTimer();
  }, []);

  // Update active timer with full task data when tasks load
  useEffect(() => {
    console.log('🔄 Tasks loaded, checking if need to update active timer');
    console.log('Tasks count:', tasks.length, 'Active timer:', activeTimer?.name);
    
    if (tasks.length > 0 && activeTimer && (activeTimer.name === 'Loading task...' || activeTimer.name === 'Loading...')) {
      console.log('🔍 Looking for full task data for ID:', activeTimer.id);
      const fullTask = tasks.find(t => t.id === activeTimer.id);
      if (fullTask) {
        console.log('✅ Found full task, updating:', fullTask.name);
        setActiveTimer(fullTask);
      } else {
        console.warn('⚠️ Could not find task with ID:', activeTimer.id);
        console.log('Available task IDs:', tasks.map(t => t.id));
      }
    }
  }, [tasks, activeTimer]);
  
  // Real-time timer updates
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeTimer && startTime) {
      interval = setInterval(() => {
        const now = Date.now();
        setElapsedTime(Math.floor((now - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeTimer, startTime]);

const startTimer = useCallback(async (task: Task) => {
  try {
    setLoading(true);
    setError(null);
    
    // Check if there's already an active timer
    const existingTimer = await timerAPI.getActiveTimer();
    
    if (existingTimer) {
      if (existingTimer.taskId === task.id) {
        // Same task - stop the timer
        console.log('Stopping current timer for same task');
        await timerAPI.stopTimer();
        setActiveTimer(null);
        setStartTime(null);
        setElapsedTime(0);
        return;
      } else {
        // Different task - switch timer
        console.log('Switching from task', existingTimer.taskId, 'to task', task.id);
        await timerAPI.switchTimer(task.id);
      }
    } else {
      // No existing timer - start new one
      console.log('Starting new timer for task', task.id);
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

const stopTimer = useCallback(async () => {
  if (!activeTimer) return;
  
  try {
    setLoading(true);
    
    console.log('Stopping timer for task:', activeTimer.id);
    const stopResponse = await timerAPI.stopTimer();
    console.log('Stop timer response:', stopResponse);
    
    setActiveTimer(null);
    setStartTime(null);
    setElapsedTime(0);
    
    // Reload tasks to get updated totalTime with better error handling
    try {
      console.log('Reloading tasks after stop...');
      const backendTasks = await timerAPI.getTasks();
      console.log('Reloaded tasks:', backendTasks);
      
      if (Array.isArray(backendTasks)) {
        const transformedTasks = backendTasks.map(transformTask);
        setTasks(transformedTasks);
      } else {
        console.warn('getTasks did not return an array:', backendTasks);
        // Don't update tasks if we get invalid data
      }
    } catch (reloadError) {
      console.error('Failed to reload tasks after stopping timer:', reloadError);
      // Continue anyway - the timer was stopped successfully
    }
    
  } catch (err) {
    setError('Failed to stop timer');
    console.error('Stop timer error:', err);
  } finally {
    setLoading(false);
  }
}, [activeTimer]);

  const addTask = useCallback(async (taskData: Omit<Task, 'id' | 'totalTime'>) => {
    try {
      setLoading(true);
      const backendTaskData = {
        title: taskData.name,
        description: taskData.description,
        category: taskData.category,
        priority: taskData.priority || 'medium' as const
      };
      
      const response = await timerAPI.createTask(backendTaskData);
      const newTask = transformTask(response.task);
      
      setTasks(prev => [...prev, newTask]);
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
      
      const backendUpdates: any = {};
      if (updates.name) backendUpdates.title = updates.name;
      if (updates.description) backendUpdates.description = updates.description;
      if (updates.category) backendUpdates.category = updates.category;
      if (updates.priority) backendUpdates.priority = updates.priority;
      
      await timerAPI.updateTask(taskId, backendUpdates);
      
      setTasks(prev => prev.map(t => 
        t.id === taskId ? { ...t, ...updates } : t
      ));
      
      if (activeTimer && activeTimer.id === taskId) {
        setActiveTimer(prev => prev ? { ...prev, ...updates } : null);
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
      
      // Stop timer if deleting active task
      if (activeTimer && activeTimer.id === taskId) {
        await timerAPI.stopTimer();
        setActiveTimer(null);
        setStartTime(null);
        setElapsedTime(0);
      }
      
      await timerAPI.deleteTask(taskId);
      setTasks(prev => prev.filter(t => t.id !== taskId));
      
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
import React from 'react';
import { Zap } from 'lucide-react';
import { useTimer } from './TimerProvider';
import { formatTime } from './utils';
import { Task } from './types';

interface TaskCardProps {
  task: Task;
}

export function TaskCard({ task }: TaskCardProps) {
  const { activeTimer, startTimer, stopTimer, loading } = useTimer();
  const isActive = activeTimer?.id === task.id;
  const isLoading = loading && activeTimer?.id === task.id;

const handleClick = async (): Promise<void> => {
  // If this task is already active, do nothing
  if (isActive) {
    return;
  }
  
  // If another task is active, stop it first
  if (activeTimer) {
    await stopTimer();
  }
  
  // Start this task
  await startTimer(task);
};

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className={`
        w-full min-h-[120px] p-4 rounded-2xl transition-all duration-300 transform
        hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 relative
        ${isActive 
          ? 'bg-white shadow-lg ring-2 ring-offset-2' 
          : 'bg-white hover:shadow-md shadow-sm'
        }
      `}
      style={{ 
        borderLeft: `4px solid ${task.color}`,
        ...(isActive && { '--tw-ring-color': task.color } as any)
      }}
    >
      <div className="flex flex-col items-start text-left h-full">
        <div className="flex items-center gap-2 mb-3">
          <div 
            className={`w-3 h-3 rounded-full ${isActive ? 'animate-pulse' : ''}`}
            style={{ backgroundColor: task.color }}
          ></div>
          {isActive && <Zap size={16} className="text-yellow-500" />}
        </div>
        
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 flex-1">
          {task.name}
        </h3>
        
        <div className="w-full">
          <div className="text-sm text-gray-500 mb-1">Total Time</div>
          <div className="font-mono text-sm font-medium text-gray-700">
            {formatTime(task.totalTime)}
          </div>
        </div>
        
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-2xl">
            <div className="w-6 h-6 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
          </div>
        )}
      </div>
    </button>
  );
}
import React, { useState } from 'react';
import { Clock, Settings, Plus, CheckCircle } from 'lucide-react';
import { useTimer } from './TimerProvider';
import { ActiveTimerDisplay } from './ActiveTimerDisplay';
import { TaskCard } from './TaskCard';
import { TaskManager } from './TaskManager';
import { ErrorToast } from './ErrorToast';
import { Task } from './types';

export function TimerInterface() {
  const { tasks, loading: tasksLoading } = useTimer();
  const [showTaskManager, setShowTaskManager] = useState<boolean>(false);

  if (tasksLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-600">Loading your tasks...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto p-4 pb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pt-4">
          <div className="flex items-center gap-3">
            <Clock className="text-blue-600" size={28} />
            <h1 className="text-2xl font-bold text-gray-900">Task Timer</h1>
          </div>
          
          <button
            onClick={() => setShowTaskManager(true)}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 
                       border border-gray-200 rounded-lg transition-colors shadow-sm"
          >
            <Settings size={20} />
            <span className="hidden sm:inline">Manage Tasks</span>
          </button>
        </div>

        {/* Active Timer Display */}
        <ActiveTimerDisplay />

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task: Task) => (
            <TaskCard key={task.id} task={task} />
          ))}
        </div>

        {/* Empty State */}
        {tasks.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks yet</h3>
            <p className="text-gray-500 mb-4">Add some tasks to start tracking your time</p>
            <button
              onClick={() => setShowTaskManager(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 hover:bg-blue-600 
                         text-white rounded-lg transition-colors"
            >
              <Plus size={20} />
              Add Your First Task
            </button>
          </div>
        )}
      </div>

      {/* Task Manager Modal */}
      <TaskManager 
        isOpen={showTaskManager}
        onClose={() => setShowTaskManager(false)}
      />

      {/* Error Toast */}
      <ErrorToast />
    </div>
  );
}
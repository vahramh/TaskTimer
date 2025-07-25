import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useTimer } from './TimerProvider';
import { TaskForm } from './TaskForm';
import { TaskListItem } from './TaskListItem';
import { Task } from './types';

interface TaskManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TaskManager({ isOpen, onClose }: TaskManagerProps) {
  const { tasks, addTask, updateTask, deleteTask, loading } = useTimer();
  const [editingTask, setEditingTask] = useState<string | null>(null); // Changed to string
  const [showAddForm, setShowAddForm] = useState<boolean>(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Manage Tasks</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-96 overflow-y-auto">
          {/* Add Task Button */}
          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-2 p-4 border-2 border-dashed 
                         border-gray-300 hover:border-blue-500 rounded-lg transition-colors mb-4"
            >
              <Plus size={20} />
              <span>Add New Task</span>
            </button>
          )}

          {/* Add Task Form */}
          {showAddForm && (
            <TaskForm 
              onSubmit={async (data) => {
                const result = await addTask(data);
                if (result.success) {
                  setShowAddForm(false);
                }
              }}
              onCancel={() => setShowAddForm(false)}
            />
          )}

          {/* Task List */}
          <div className="space-y-3">
            {tasks.map((task: Task) => (
              <div key={task.id}>
                {editingTask === task.id ? (
                  <TaskForm
                    initialData={task}
                    onSubmit={async (data) => {
                      const result = await updateTask(task.id, data);
                      if (result.success) {
                        setEditingTask(null);
                      }
                    }}
                    onCancel={() => setEditingTask(null)}
                  />
                ) : (
                  <TaskListItem 
                    task={task}
                    onEdit={() => setEditingTask(task.id)}
                    onDelete={() => deleteTask(task.id)}
                    loading={loading}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
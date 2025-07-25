import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { formatTime } from './utils';
import { Task } from './types';

interface TaskListItemProps {
  task: Task;
  onEdit: () => void;
  onDelete: () => void;
  loading: boolean;
}

export function TaskListItem({ task, onEdit, onDelete, loading }: TaskListItemProps) {
  return (
    <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
      <div 
        className="w-4 h-4 rounded-full"
        style={{ backgroundColor: task.color }}
      ></div>
      
      <div className="flex-1">
        <div className="font-medium text-gray-900">{task.name}</div>
        <div className="text-sm text-gray-500">
          Total: {formatTime(task.totalTime)}
        </div>
      </div>

      <div className="flex gap-1">
        <button
          onClick={onEdit}
          disabled={loading}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <Edit2 size={16} />
        </button>
        <button
          onClick={onDelete}
          disabled={loading}
          className="p-2 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors disabled:opacity-50"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}
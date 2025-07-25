import React from 'react';
import { Square } from 'lucide-react';
import { useTimer } from './TimerProvider';
import { formatTime } from './utils';

export function ActiveTimerDisplay() {
  const { activeTimer, elapsedTime, stopTimer, loading } = useTimer();

  if (!activeTimer) return null;

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 mb-6 border-l-4" 
         style={{ borderLeftColor: activeTimer.color }}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 rounded-full animate-pulse" 
                 style={{ backgroundColor: activeTimer.color }}></div>
            <h2 className="text-lg font-semibold text-gray-900">{activeTimer.name}</h2>
          </div>
          <div className="text-3xl font-mono font-bold text-gray-900 mb-1">
            {formatTime(elapsedTime)}
          </div>
          <div className="text-sm text-gray-500">Active Session</div>
        </div>
        
        <button
          onClick={stopTimer}
          disabled={loading}
          className="flex items-center justify-center w-12 h-12 bg-red-500 hover:bg-red-600 
                     disabled:opacity-50 text-white rounded-xl transition-all duration-200 
                     transform hover:scale-105 active:scale-95"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <Square size={20} />
          )}
        </button>
      </div>
    </div>
  );
}
import React, { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { useTimer } from './TimerProvider';

export function ErrorToast() {
  const { error, setError } = useTimer();

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  if (!error) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 flex items-center gap-3 bg-red-50 border border-red-200 
                    text-red-800 px-4 py-3 rounded-lg shadow-lg">
      <AlertCircle size={20} />
      <span className="flex-1">{error}</span>
      <button 
        onClick={() => setError(null)}
        className="text-red-600 hover:text-red-800"
      >
        ×
      </button>
    </div>
  );
}
import React, { useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useAdmin } from './AdminProvider';

export function ErrorToast() {
  const { error, setError } = useAdmin();

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  if (!error) return null;

  return (
    <div className="fixed top-4 right-4 z-50 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
      <AlertTriangle size={20} />
      <span>{error}</span>
      <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">×</button>
    </div>
  );
}
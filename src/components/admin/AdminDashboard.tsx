import React, { useState } from 'react';
import { Settings, Download } from 'lucide-react';
import { useAdmin } from './AdminProvider';
import { GlobalAnalytics } from './GlobalAnalytics';
import { UserTable } from './UserTable';
import { UserAnalytics } from './UserAnalytics';
import { AdminNavigation } from './AdminNavigation';
import { ErrorToast } from './ErrorToast';

export function AdminDashboard() {
  const [activeView, setActiveView] = useState('dashboard');
  const { selectedUser, loading } = useAdmin();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-gray-600">Loading admin dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="text-blue-600" size={32} />
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="p-2 hover:bg-gray-100 rounded-lg">
                <Download size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <AdminNavigation activeView={activeView} setActiveView={setActiveView} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6">
        {activeView === 'dashboard' && <GlobalAnalytics />}
        {activeView === 'users' && <UserTable />}
        {activeView === 'analytics' && <UserAnalytics user={selectedUser} />}
      </main>

      {/* Error Toast */}
      <ErrorToast />
    </div>
  );
}
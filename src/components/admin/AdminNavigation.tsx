import React from 'react';
import { BarChart3, Users, PieChart } from 'lucide-react';

interface AdminNavigationProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

export function AdminNavigation({ activeView, setActiveView }: AdminNavigationProps) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'analytics', label: 'User Analytics', icon: PieChart }
  ];

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-4">
      <div className="flex space-x-8">
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg font-medium transition-colors ${
                activeView === item.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Icon size={20} />
              {item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
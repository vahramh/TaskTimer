import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Clock, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export function MainNavigation() {
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  // Compute display name from AuthUser
  const displayName = user ? `${user.firstName} ${user.lastName}`.trim() || user.email : '';

  return (
    <nav className="bg-white shadow-sm border-b px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Logo/Brand */}
          <div className="flex items-center gap-2">
            <Clock className="text-blue-600" size={24} />
            <span className="font-bold text-gray-900">TaskTimer</span>
          </div>
          
          {/* Navigation Links */}
          <div className="flex items-center gap-1">
            <Link
              to="/"
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              Timer
            </Link>
            
            {isAdmin() && (
              <Link
                to="/admin"
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/admin') 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Settings size={16} />
                Admin
              </Link>
            )}
          </div>
        </div>
        
        {/* User Info */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{displayName}</span>
            <span className="ml-2 px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
              {user?.role}
            </span>
          </div>
          
          <button 
            onClick={logout}
            className="flex items-center gap-2 text-sm text-red-600 hover:text-red-800 px-3 py-2 rounded-lg hover:bg-red-50 transition-colors"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
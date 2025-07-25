import React, { useEffect, useState } from 'react';
import { Clock, Activity, Zap, Target, Eye } from 'lucide-react';
import { 
  LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import { useAdmin } from './AdminProvider';
import { StatsCard } from './StatsCard';
import { formatTime } from './utils';
import { User } from './types';

interface UserAnalyticsProps {
  user?: User | null;
}

export function UserAnalytics({ user }: UserAnalyticsProps) {
  const { userAnalytics, loadUserAnalytics, loading, users, setSelectedUser } = useAdmin();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(user?.id || null); // Changed to string

  useEffect(() => {
    if (user && user.id !== selectedUserId) {
      setSelectedUserId(user.id);
      loadUserAnalytics(user.id);
    }
  }, [user, loadUserAnalytics, selectedUserId]);

  const handleUserSelect = (userId: string) => { // Changed to string
    setSelectedUserId(userId);
    loadUserAnalytics(userId);
    // Also update the selected user in the admin context
    const selectedUserObj = users.find(u => u.id === userId);
    if (selectedUserObj) {
      setSelectedUser(selectedUserObj);
    }
  };

  const selectedUser = users.find(u => u.id === selectedUserId) || user;

  if (!selectedUser) {
    return (
      <div className="space-y-6">
        {/* User Selector */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Select User for Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map(user => (
              <button
                key={user.id}
                onClick={() => handleUserSelect(user.id)}
                className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-left"
              >
                <div className="font-medium text-gray-900">{user.name}</div>
                <div className="text-sm text-gray-500">{user.email}</div>
                <div className="text-sm text-gray-500 mt-1">
                  {formatTime(user.totalTime)} • {user.role}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Instruction */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
          <Eye className="mx-auto text-blue-500 mb-3" size={48} />
          <h3 className="text-lg font-medium text-blue-900 mb-2">Choose a User</h3>
          <p className="text-blue-700">
            Select a user above to view their detailed analytics and productivity insights.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-gray-600">Loading analytics for {selectedUser.name}...</div>
        </div>
      </div>
    );
  }

  if (!userAnalytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-600">No analytics data available for {selectedUser.name}</div>
          <button 
            onClick={() => loadUserAnalytics(selectedUser.id)}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Load Analytics
          </button>
        </div>
      </div>
    );
  }

  const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444'];

  return (
    <div className="space-y-6">
      {/* User Selector Dropdown */}
      <div className="bg-white rounded-xl shadow-sm border p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Viewing analytics for:</label>
          <select
            value={selectedUserId || ''}
            onChange={(e) => handleUserSelect(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {users.map(user => (
              <option key={user.id} value={user.id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* User Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{selectedUser.name}</h2>
            <p className="text-gray-600">{selectedUser.email} • {selectedUser.role}</p>
          </div>
          <div className="text-right">
            <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
              selectedUser.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
            }`}>
              {selectedUser.status}
            </div>
          </div>
        </div>
      </div>

      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={Clock}
          title="Total Hours"
          value={formatTime(userAnalytics.productivity.totalHours * 3600)}
          color="blue"
        />
        <StatsCard
          icon={Activity}
          title="Daily Average"
          value={`${userAnalytics.productivity.avgDaily.toFixed(1)}h`}
          color="green"
        />
        <StatsCard
          icon={Zap}
          title="Longest Session"
          value={`${userAnalytics.productivity.longestSession}h`}
          color="purple"
        />
        <StatsCard
          icon={Target}
          title="Total Sessions"
          value={userAnalytics.productivity.totalSessions}
          color="orange"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Activity */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Activity (Last 30 Days)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={userAnalytics.dailyActivity}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(date) => new Date(date).getDate().toString()} />
              <YAxis />
              <Tooltip labelFormatter={(date) => new Date(date).toLocaleDateString()} />
              <Line type="monotone" dataKey="hours" stroke="#3B82F6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Task Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Time Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={userAnalytics.taskBreakdown}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={120}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {userAnalytics.taskBreakdown.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
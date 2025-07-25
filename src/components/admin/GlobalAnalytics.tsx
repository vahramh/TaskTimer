import React from 'react';
import { Users, Activity, Clock, Target } from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';
import { useAdmin } from './AdminProvider';
import { StatsCard } from './StatsCard';
import { formatTime } from './utils';

export function GlobalAnalytics() {
  const { globalAnalytics } = useAdmin();

  if (!globalAnalytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          icon={Users}
          title="Total Users"
          value={globalAnalytics.overview.totalUsers}
          trend={12}
          color="blue"
        />
        <StatsCard
          icon={Activity}
          title="Active Users"
          value={globalAnalytics.overview.activeUsers}
          subtitle="This month"
          color="green"
        />
        <StatsCard
          icon={Clock}
          title="Total Hours"
          value={formatTime(globalAnalytics.overview.totalHours * 3600)}
          subtitle="All time"
          color="purple"
        />
        <StatsCard
          icon={Target}
          title="Avg per User"
          value={formatTime(globalAnalytics.overview.avgUserHours * 3600)}
          color="orange"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Growth</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={globalAnalytics.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="users" stroke="#3B82F6" fill="#3B82F680" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Top Tasks Chart */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Most Popular Tasks</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={globalAnalytics.topTasks}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalHours" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
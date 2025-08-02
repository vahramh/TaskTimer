import React, { useEffect, useState } from 'react';
import { Clock, Calendar, User, BarChart3, RefreshCw } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';

interface ApiUser {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

interface AdminUser {
  id?: string;
  userId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
}

interface Session {
  sessionId: string;
  userId: string;
  taskId: string;
  taskTitle: string;
  startTime: string;
  endTime: string;
  duration: number;
  status: string;
  createdAt: string;
}

interface DailyTaskData {
  date: string;
  [taskTitle: string]: number | string;
}

interface UserAnalyticsProps {
  user?: AdminUser | null;
}

export function UserAnalytics({ user }: UserAnalyticsProps) {
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [chartData, setChartData] = useState<DailyTaskData[]>([]);
  const [uniqueTasks, setUniqueTasks] = useState<string[]>([]);

  const API_BASE = 'https://ymaesypvdc.execute-api.ap-southeast-2.amazonaws.com/dev/analytics';

  // Set default date range (last 30 days)
  useEffect(() => {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
  }, []);

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Set selected user when user prop changes or when users are loaded
  useEffect(() => {
    if (user) {
      // Handle different user ID properties
      const userId = user.userId || user.id;
      if (userId) {
        setSelectedUserId(userId);
      }
    } else if (!user && users.length > 0 && !selectedUserId) {
      // Auto-select first user only if no user prop is provided
      setSelectedUserId(users[0].userId);
    }
  }, [user, users, selectedUserId]);

  // Fetch sessions when user or date range changes
  useEffect(() => {
    if (selectedUserId && startDate && endDate) {
      fetchSessions();
    }
  }, [selectedUserId, startDate, endDate]);

  // Process chart data when sessions change
  useEffect(() => {
    if (sessions.length > 0 && selectedUserId) {
      processChartData();
    } else {
      setChartData([]);
      setUniqueTasks([]);
    }
  }, [sessions, selectedUserId, startDate, endDate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/users`);
      const data = await response.json();
      
      // Handle Lambda response format with body property
      let actualData = data;
      if (data.body && typeof data.body === 'string') {
        actualData = JSON.parse(data.body);
      }
      
      setUsers(actualData.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/sessions`);
      const data = await response.json();
      
      // Handle Lambda response format with body property
      let actualData = data;
      if (data.body && typeof data.body === 'string') {
        actualData = JSON.parse(data.body);
      }
      
      setSessions(actualData.sessions || []);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const processChartData = () => {
    // Filter sessions for selected user and date range
    const filteredSessions = sessions.filter(session => {
      if (session.userId !== selectedUserId) return false;
      
      const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
      return sessionDate >= startDate && sessionDate <= endDate;
    });

    // Get unique task titles
    const taskTitles = Array.from(new Set(filteredSessions.map(s => s.taskTitle))).filter(Boolean);
    setUniqueTasks(taskTitles);

    // Group sessions by date and task
    const dailyData: { [date: string]: { [taskTitle: string]: number } } = {};
    
    // Initialize all dates in range
    const start = new Date(startDate);
    const end = new Date(endDate);
    const current = new Date(start);
    
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      dailyData[dateStr] = {};
      taskTitles.forEach(task => {
        dailyData[dateStr][task] = 0;
      });
      current.setDate(current.getDate() + 1);
    }

    // Aggregate session durations
    filteredSessions.forEach(session => {
      const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
      const taskTitle = session.taskTitle || 'Untitled';
      const durationHours = session.duration / 3600; // Convert seconds to hours
      
      if (dailyData[sessionDate]) {
        dailyData[sessionDate][taskTitle] = (dailyData[sessionDate][taskTitle] || 0) + durationHours;
      }
    });

    // Convert to chart format
    const chartData = Object.entries(dailyData).map(([date, tasks]) => ({
      date,
      ...tasks
    }));

    setChartData(chartData);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTooltip = (value: any, name: string) => {
    if (typeof value === 'number') {
      return [`${value.toFixed(2)}h`, name];
    }
    return [value, name];
  };

  // Calculate task summary data
  const getTaskSummary = () => {
    if (!selectedUserId || sessions.length === 0) return [];

    // Filter sessions for selected user and date range
    const filteredSessions = sessions.filter(session => {
      if (session.userId !== selectedUserId) return false;
      
      const sessionDate = new Date(session.startTime).toISOString().split('T')[0];
      return sessionDate >= startDate && sessionDate <= endDate;
    });

    // Group by task and calculate totals
    const taskTotals: { [taskTitle: string]: number } = {};
    
    filteredSessions.forEach(session => {
      const taskTitle = session.taskTitle || 'Untitled';
      const durationHours = session.duration / 3600; // Convert seconds to hours
      taskTotals[taskTitle] = (taskTotals[taskTitle] || 0) + durationHours;
    });

    // Calculate total hours across all tasks
    const totalHours = Object.values(taskTotals).reduce((sum, hours) => sum + hours, 0);

    // Convert to array with percentages
    return Object.entries(taskTotals)
      .map(([taskTitle, hours]) => ({
        taskTitle,
        hours: hours,
        percentage: totalHours > 0 ? (hours / totalHours) * 100 : 0
      }))
      .sort((a, b) => b.hours - a.hours); // Sort by hours descending
  };

  const taskSummary = getTaskSummary();

  const selectedUser = users.find(u => u.userId === selectedUserId);
  const displayUser = selectedUser || user;
  
  // Helper function to get user display name
  const getUserDisplayName = (user: ApiUser | AdminUser | undefined) => {
    if (!user) return '';
    if ('firstName' in user && 'lastName' in user) {
      return `${user.firstName || ''} ${user.lastName || ''}`.trim();
    }
    if ('name' in user) {
      return user.name || '';
    }
    return user.email || '';
  };
  const totalHours = chartData.reduce((sum, day) => {
    return sum + uniqueTasks.reduce((daySum, task) => {
      return daySum + (typeof day[task] === 'number' ? day[task] as number : 0);
    }, 0);
  }, 0);

  // Generate colors for different tasks
  const colors = [
    '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="text-blue-500" size={24} />
          <h2 className="text-xl font-bold text-gray-900">User Task Analytics</h2>
        </div>
        <p className="text-gray-600">
          Analyze daily time spent on tasks by user over a selected time period
        </p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          {/* User Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User size={16} className="inline mr-1" />
              Select User
            </label>
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={loading}
            >
              <option value="">Choose a user...</option>
              {users.map(user => {
                const displayName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown User';
                return (
                  <option key={user.userId || user.email} value={user.userId}>
                    {displayName} ({user.email})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar size={16} className="inline mr-1" />
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Refresh Button */}
          <div>
            <button
              onClick={() => {
                fetchUsers();
                if (selectedUserId) fetchSessions();
              }}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Summary */}
      {displayUser && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{getUserDisplayName(displayUser)}</div>
              <div className="text-sm text-gray-500">{displayUser.email}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{totalHours.toFixed(1)}h</div>
              <div className="text-sm text-gray-500">Total Hours</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{uniqueTasks.length}</div>
              <div className="text-sm text-gray-500">Different Tasks</div>
            </div>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Daily Task Time Breakdown
          {displayUser && (
            <span className="text-sm font-normal text-gray-500 ml-2">
              for {getUserDisplayName(displayUser)}
            </span>
          )}
        </h3>
        
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="animate-spin text-blue-500 mx-auto mb-2" size={24} />
              <div className="text-gray-600">Loading data...</div>
            </div>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Clock className="text-gray-400 mx-auto mb-2" size={48} />
              <div className="text-gray-600">No data available for the selected period</div>
              <div className="text-sm text-gray-500 mt-1">
                Try selecting a different user or date range
              </div>
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis 
                label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip 
                labelFormatter={(date) => `Date: ${formatDate(date as string)}`}
                formatter={formatTooltip}
              />
              <Legend />
              {uniqueTasks.map((task, index) => (
                <Bar
                  key={task}
                  dataKey={task}
                  stackId="a"
                  fill={colors[index % colors.length]}
                  name={task}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Task Legend */}
      {uniqueTasks.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tasks</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uniqueTasks.map((task, index) => (
              <div key={task} className="flex items-center gap-3">
                <div 
                  className="w-4 h-4 rounded"
                  style={{ backgroundColor: colors[index % colors.length] }}
                ></div>
                <span className="text-sm text-gray-700">{task}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task Summary Table */}
      {taskSummary.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Time Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-900">Task Name</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">Total Hours</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-900">% of Total</th>
                </tr>
              </thead>
              <tbody>
                {taskSummary.map((task, index) => (
                  <tr key={task.taskTitle} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded"
                          style={{ backgroundColor: colors[index % colors.length] }}
                        ></div>
                        <span className="text-gray-900">{task.taskTitle}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-900 font-medium">
                      {task.hours.toFixed(2)}h
                    </td>
                    <td className="py-3 px-4 text-right text-gray-600">
                      {task.percentage.toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 font-semibold">
                  <td className="py-3 px-4 text-gray-900">Total</td>
                  <td className="py-3 px-4 text-right text-gray-900">
                    {taskSummary.reduce((sum, task) => sum + task.hours, 0).toFixed(2)}h
                  </td>
                  <td className="py-3 px-4 text-right text-gray-900">100.0%</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
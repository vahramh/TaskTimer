import { AuthService } from './auth'; // Use the new AuthService

// Types matching your backend schema
export interface BackendUser {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BackendTask {
  taskId: string;
  userId: string;
  title: string;
  description?: string;
  estimatedDuration?: number;
  category?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'active' | 'completed';
  totalTimeSpent: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserBackendSession {
  sessionId: string;
  taskId: string;
  taskTitle: string;        // ✅ This matches your data
  startTime: string;
  endTime?: string;
  duration?: number;
  status: 'completed' | 'running';
  createdAt: string;
  updatedAt: string;
}

export interface BackendSession {
  users: UserBackendSession[];
}

export interface BackendActiveTimer {
  taskId: string;
  taskTitle: string;
  startTime: string;
  status: 'running';
  createdAt: string;
  updatedAt: string;
}

const API_BASE = 'https://ymaesypvdc.execute-api.ap-southeast-2.amazonaws.com/dev';

// Helper function to get auth token using the new AuthService
const getAuthToken = async (): Promise<string> => {
  try {
    const token = await AuthService.getIdToken();
    return token || '';
  } catch (error) {
    console.error('Failed to get auth token:', error);
    return '';
  }
};

// Helper function for API calls
const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE}${endpoint}`;
  const token = await getAuthToken();
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  let response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  });

  // If we get a 401, the session is invalid
  if (response.status === 401) {
    console.error('API call unauthorized - clearing auth state');
    
    // Clear the auth state and redirect to login
    try {
      await AuthService.signOut();
    } catch (error) {
      console.error('Error during signOut:', error);
    }
    
    // Use window.location to ensure a clean redirect
    window.location.href = '/login';
    throw new Error('Authentication expired. Please log in again.');
  }

  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
};

// Real Timer API
export const timerAPI = {
  async getTasks() {
    try {
      const response = await apiCall('/tasks');
      console.log('getTasks response:', response); // Debug log
      
      // Handle different possible response structures
      if (Array.isArray(response)) {
        return response;
      } else if (response && Array.isArray(response.data)) {
        return response.data;
      } else if (response && Array.isArray(response.tasks)) {
        return response.tasks;
      } else if (response && Array.isArray(response.data.tasks)) {
        return response.data.tasks;
      } else {
        console.warn('Unexpected getTasks response structure:', response);
        return [];
      }
    } catch (error) {
      console.error('getTasks error:', error);
      return [];
    }
  },

  async createTask(taskData: {
    title: string;
    description?: string;
    estimatedDuration?: number;
    category?: string;
    priority?: 'low' | 'medium' | 'high';
  }) {
    try {
      const response = await apiCall('/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData)
      });
      console.log('createTask response:', response); // Debug log
      
      // Handle different response structures
      if (response.data && response.data.task) {
        return response.data;
      } else if (response.task) {
        return { task: response.task };
      } else {
        return response;
      }
    } catch (error) {
      console.error('createTask error:', error);
      throw error;
    }
  },

  async updateTask(taskId: string, updates: Partial<BackendTask>) {
    try {
      const response = await apiCall(`/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      return response.data || response;
    } catch (error) {
      console.error('updateTask error:', error);
      throw error;
    }
  },

  async deleteTask(taskId: string) {
    try {
      const response = await apiCall(`/tasks/${taskId}`, {
        method: 'DELETE'
      });
      return response;
    } catch (error) {
      console.error('deleteTask error:', error);
      throw error;
    }
  },

  async startTimer(taskId: string) {
    try {
      const response = await apiCall('/timer/start', {
        method: 'POST',
        body: JSON.stringify({ taskId })
      });
      return response.data || response;
    } catch (error) {
      console.error('startTimer error:', error);
      throw error;
    }
  },

  async stopTimer() {
    try {
      const response = await apiCall('/timer/stop', {
        method: 'POST'
      });
      return response.data || response;
    } catch (error) {
      console.error('stopTimer error:', error);
      throw error;
    }
  },

  async switchTimer(taskId: string) {
    try {
      const response = await apiCall('/timer/switch', {
        method: 'POST',
        body: JSON.stringify({ taskId })
      });
      return response.data || response;
    } catch (error) {
      console.error('switchTimer error:', error);
      throw error;
    }
  },

  async getActiveTimer() {
    try {
      const response = await apiCall('/timer/active');
      return response.data || response;
    } catch (error) {
      // No active timer is expected sometimes
      console.log('No active timer found');
      return null;
    }
  },

  async getSessions(period?: string) {
    try {
      const query = period ? `?period=${period}` : '';
      const response = await apiCall(`/sessions${query}`);
      return response.data || [];
    } catch (error) {
      console.error('getSessions error:', error);
      return [];
    }
  },

  async getSessionStats(period?: string) {
    try {
      const query = period ? `?period=${period}` : '';
      const response = await apiCall(`/sessions/stats${query}`);
      return response.data || {};
    } catch (error) {
      console.error('getSessionStats error:', error);
      return {};
    }
  }
};

// Real Admin API
export const adminAPI = {
  async getUsers() {
    const response = await apiCall('/users');
    console.log('getUsers raw response:', response); // Debug log
    
    // Handle different response structures
    if (Array.isArray(response)) {
        return response;
    } else if (response && Array.isArray(response.users)) {
        return response.users;
    } else if (response && Array.isArray(response.data)) {
        return response.data;
    } else if (response && Array.isArray(response.data.users)) {
        return response.data.users;
    } else {
        console.warn('Unexpected getUsers response:', response);
        return [];
    }
  },

  async createUser(userData: {
    email: string;
    firstName: string;
    lastName: string;
    role: 'admin' | 'user';
  }) {
    const response = await apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
    return response.data;
  },

  async updateUser(userId: string, updates: Partial<BackendUser>) {
    const response = await apiCall(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
    return response.data;
  },

  async getUserAnalytics(userId: string, period = '30d') {
    try {
      console.log('🔍 Getting user analytics for:', userId, 'period:', period);
      
      // Get user's sessions for analytics
      const sessions = await apiCall(`/sessions?period=${period}`);
      const stats = await apiCall(`/sessions/stats?period=${period}`);
      
      // The sessions are at data.sessions (not data.users)
      const sessionsData = sessions.data?.sessions || [];
      const statsData = stats.data?.stats || {};
      
      console.log('📈 Extracted data:', { 
        sessionsCount: sessionsData.length, 
        isArray: Array.isArray(sessionsData),
        statsKeys: Object.keys(statsData)
      });
      
      // Transform to analytics format
      return transformToAnalytics(sessionsData, statsData);
    } catch (error) {
      console.error('❌ getUserAnalytics error:', error);
      throw error;
    }
  },

  async getGlobalAnalytics() {
    try {
      console.log('🔍 Starting getGlobalAnalytics...');
      
      const users = await this.getUsers();
      console.log('👥 Users loaded:', users.length);
      
      const allStats = await apiCall('/sessions/stats?period=month');
      console.log('📊 Raw stats response:', allStats);
      
      // The stats are nested at data.stats, not data.users
      const statsData = allStats.data?.stats || {};
      console.log('📈 Extracted stats data:', statsData);
      
      const result = transformToGlobalAnalytics(users, statsData);
      console.log('✅ Transformed analytics:', result);
      
      return result;
    } catch (error) {
      console.error('❌ getGlobalAnalytics error:', error);
      throw error;
    }
  }
};

// Helper functions to transform backend data to frontend format
function transformToAnalytics(sessions: UserBackendSession[], stats: any) {
  // Generate daily activity from sessions
  const dailyActivity = generateDailyActivity(sessions);
  
  // Transform task breakdown
  const taskBreakdown = stats.taskBreakdown?.map((task: any) => ({
    name: task.taskTitle,
    value: Math.round((task.totalDuration / stats.totalDuration) * 100),
    hours: Math.round(task.totalDuration / 3600)
  })) || [];

  return {
    dailyActivity,
    taskBreakdown,
    productivity: {
      totalHours: Math.round(stats.totalDuration / 3600),
      avgDaily: Math.round((stats.totalDuration / 3600) / 30 * 10) / 10,
      longestSession: Math.round(Math.max(...sessions.map(s => s.duration || 0)) / 3600 * 10) / 10,
      totalSessions: stats.totalSessions
    }
  };
}

function generateDailyActivity(sessions: UserBackendSession[]) {
  const daily: { [date: string]: { hours: number; sessions: number } } = {};
  
  sessions.forEach(session => {
    const date = session.startTime.split('T')[0];
    if (!daily[date]) {
      daily[date] = { hours: 0, sessions: 0 };
    }
    daily[date].hours += (session.duration || 0) / 3600;
    daily[date].sessions += 1;
  });

  // Fill in missing days for last 30 days
  const result = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    result.push({
      date,
      hours: daily[date]?.hours || 0,
      sessions: daily[date]?.sessions || 0
    });
  }
  
  return result;
}

function transformToGlobalAnalytics(users: BackendUser[], stats: any) {
  const activeUsers = users.filter(u => u.isActive).length;
  
  return {
    overview: {
      totalUsers: users.length,
      activeUsers,
      totalHours: Math.round(stats.totalDuration / 3600),
      avgUserHours: Math.round((stats.totalDuration / 3600) / users.length * 10) / 10
    },
    userGrowth: generateUserGrowth(users),
    topTasks: stats.taskBreakdown?.slice(0, 5).map((task: any) => ({
      name: task.taskTitle,
      users: task.userCount || 1,
      totalHours: Math.round(task.totalDuration / 3600)
    })) || []
  };
}

function generateUserGrowth(users: BackendUser[]) {
  // Group users by month they joined
  const growth: { [month: string]: number } = {};
  
  users.forEach(user => {
    const month = new Date(user.createdAt).toLocaleDateString('en', { month: 'short' });
    growth[month] = (growth[month] || 0) + 1;
  });

  return Object.entries(growth).map(([month, users]) => ({ month, users }));
}
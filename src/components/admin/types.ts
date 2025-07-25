export interface User {
  id: string; // Already string
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  joinDate: string;
  lastActive: string;
  totalTime: number;
  tasksCount: number;
  avgSessionTime: number;
  firstName?: string;
  lastName?: string;
}

export interface UserAnalytics {
  dailyActivity: DailyActivity[];
  taskBreakdown: TaskBreakdown[];
  productivity: ProductivityStats;
}

export interface DailyActivity {
  date: string;
  hours: number;
  sessions: number;
}

export interface TaskBreakdown {
  name: string;
  value: number;
  hours: number;
}

export interface ProductivityStats {
  totalHours: number;
  avgDaily: number;
  longestSession: number;
  totalSessions: number;
}

export interface GlobalAnalytics {
  overview: {
    totalUsers: number;
    activeUsers: number;
    totalHours: number;
    avgUserHours: number;
  };
  userGrowth: Array<{
    month: string;
    users: number;
  }>;
  topTasks: Array<{
    name: string;
    users: number;
    totalHours: number;
  }>;
}

export interface AdminContextType {
  users: User[];
  setUsers: (users: User[]) => void;
  globalAnalytics: GlobalAnalytics | null;
  selectedUser: User | null;
  setSelectedUser: (user: User | null) => void;
  userAnalytics: UserAnalytics | null;
  loading: boolean;
  error: string | null;
  setError: (error: string | null) => void;
  loadUsers: () => Promise<void>;
  loadUserAnalytics: (userId: string) => Promise<void>; // Changed to string
  addUser: (userData: Omit<User, 'id' | 'joinDate' | 'lastActive' | 'totalTime' | 'tasksCount' | 'avgSessionTime'>) => Promise<{ success: boolean }>;
  updateUser: (userId: string, updates: Partial<User>) => Promise<{ success: boolean }>; // Changed to string
  deleteUser: (userId: string) => Promise<{ success: boolean }>; // Changed to string
}
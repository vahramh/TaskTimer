export interface Task {
  id: string; // Changed from number to string to match backend UUID
  name: string; // Maps to backend 'title'
  color: string; // Frontend only (you might want to add this to backend)
  totalTime: number; // Maps to backend 'totalTimeSpent'
  description?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'active' | 'completed';
}

export interface TimerContextType {
  tasks: Task[];
  activeTimer: Task | null;
  elapsedTime: number;
  loading: boolean;
  error: string | null;
  startTimer: (task: Task) => Promise<void>;
  stopTimer: () => Promise<void>;
  addTask: (taskData: Omit<Task, 'id' | 'totalTime'>) => Promise<{ success: boolean }>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<{ success: boolean }>;
  deleteTask: (taskId: string) => Promise<{ success: boolean }>;
  setError: (error: string | null) => void;
}

export interface APIResponse {
  success: boolean;
  data?: any;
  message?: string;
}
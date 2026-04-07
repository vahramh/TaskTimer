export interface Task {
  id: string;
  name: string;
  color: string;
  totalTime: number;
  description?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'active' | 'completed';
}

export interface ManualTimeEntryInput {
  taskId: string;
  date: string;
  durationMinutes: number;
  note?: string;
}

export interface TimerContextType {
  tasks: Task[];
  activeTimer: Task | null;
  elapsedTime: number;
  loading: boolean;
  error: string | null;
  startTimer: (task: Task) => Promise<void>;
  stopTimer: () => Promise<void>;
  logManualTime: (entry: ManualTimeEntryInput) => Promise<{ success: boolean }>;
  addTask: (taskData: Omit<Task, 'id' | 'totalTime'>) => Promise<{ success: boolean }>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<{ success: boolean }>;
  deleteTask: (taskId: string) => Promise<{ success: boolean }>;
  setError: (error: string | null) => void;
}

export interface APIResponse {
  success: boolean;
  data?: unknown;
  message?: string;
}

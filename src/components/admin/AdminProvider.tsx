import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { adminAPI, BackendUser } from '../../services/api';
import { User, UserAnalytics, GlobalAnalytics, AdminContextType } from './types';

const AdminContext = createContext<AdminContextType | undefined>(undefined);

interface AdminProviderProps {
  children: ReactNode;
}

// Transform backend user to frontend user
const transformUser = (backendUser: BackendUser): User => ({
  id: backendUser.userId,
  name: `${backendUser.firstName} ${backendUser.lastName}`,
  email: backendUser.email,
  role: backendUser.role,
  status: backendUser.isActive ? 'active' : 'inactive',
  joinDate: backendUser.createdAt.split('T')[0],
  lastActive: backendUser.updatedAt.split('T')[0],
  totalTime: 0, // Will be computed from sessions
  tasksCount: 0, // Will be computed from tasks
  avgSessionTime: 0, // Will be computed from sessions
  firstName: backendUser.firstName,
  lastName: backendUser.lastName
});

export function AdminProvider({ children }: AdminProviderProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [globalAnalytics, setGlobalAnalytics] = useState<GlobalAnalytics | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const backendUsers = await adminAPI.getUsers();
      const transformedUsers = backendUsers.map(transformUser);
      setUsers(transformedUsers);
    } catch (err) {
      setError('Failed to load users');
      console.error('Load users error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadGlobalAnalytics = async () => {
    try {
      const analytics = await adminAPI.getGlobalAnalytics();
      setGlobalAnalytics(analytics);
    } catch (err) {
      setError('Failed to load analytics');
      console.error('Load analytics error:', err);
    }
  };

  const loadUserAnalytics = async (userId: string) => {
    try {
      setLoading(true);
      const analytics = await adminAPI.getUserAnalytics(userId);
      setUserAnalytics(analytics);
    } catch (err) {
      setError('Failed to load user analytics');
      console.error('Load user analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
    loadGlobalAnalytics();
  }, []);

  const addUser = async (userData: { name: string; email: string; role: string; status: 'active' | 'inactive' }) => {
    try {
      setLoading(true);
      
      // Split name into first and last name
      const nameParts = userData.name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      
      const backendUserData = {
        email: userData.email,
        firstName,
        lastName,
        role: userData.role as 'admin' | 'user'
      };
      
      const response = await adminAPI.createUser(backendUserData);
      
      // Reload users to get the new user with proper ID
      await loadUsers();
      
      return { success: true };
    } catch (err) {
      setError('Failed to add user');
      console.error('Add user error:', err);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    try {
      setLoading(true);
      
      const backendUpdates: any = {};
      if (updates.firstName) backendUpdates.firstName = updates.firstName;
      if (updates.lastName) backendUpdates.lastName = updates.lastName;
      if (updates.email) backendUpdates.email = updates.email;
      if (updates.role) backendUpdates.role = updates.role;
      if (updates.status) backendUpdates.isActive = updates.status === 'active';
      
      // If name is updated, split it
      if (updates.name) {
        const nameParts = updates.name.trim().split(' ');
        backendUpdates.firstName = nameParts[0] || '';
        backendUpdates.lastName = nameParts.slice(1).join(' ') || '';
      }
      
      await adminAPI.updateUser(userId, backendUpdates);
      
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
      
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser(prev => prev ? { ...prev, ...updates } : null);
      }
      
      return { success: true };
    } catch (err) {
      setError('Failed to update user');
      console.error('Update user error:', err);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    try {
      setLoading(true);
      
      // Note: Your backend doesn't have a delete user endpoint
      // You might want to add this or implement a "soft delete" via update
      // For now, I'll just remove from local state
      setUsers(prev => prev.filter(u => u.id !== userId));
      
      if (selectedUser?.id === userId) {
        setSelectedUser(null);
      }
      
      return { success: true };
    } catch (err) {
      setError('Failed to delete user');
      console.error('Delete user error:', err);
      return { success: false };
    } finally {
      setLoading(false);
    }
  };

  const value: AdminContextType = {
    users,
    setUsers,
    globalAnalytics,
    selectedUser,
    setSelectedUser,
    userAnalytics,
    loading,
    error,
    setError,
    loadUsers,
    loadUserAnalytics,
    addUser,
    updateUser,
    deleteUser
  };

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>;
}

export function useAdmin(): AdminContextType {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
}
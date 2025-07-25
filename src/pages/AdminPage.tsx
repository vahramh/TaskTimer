import React from 'react';
import { AdminProvider } from '../components/admin/AdminProvider';
import { AdminDashboard } from '../components/admin/AdminDashboard';

export function AdminPage() {
  return (
    <AdminProvider>
      <AdminDashboard />
    </AdminProvider>
  );
}
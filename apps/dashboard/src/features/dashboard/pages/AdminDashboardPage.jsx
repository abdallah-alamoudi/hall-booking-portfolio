import React from 'react';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShieldAlert, BarChart3 } from 'lucide-react';

export function AdminDashboardPage() {
  return (
    <DashboardLayout title="Admin Command Center">
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="hover:bg-accent/50 transition-colors cursor-pointer border-primary/10">
          <CardHeader>
            <Users className="h-8 w-8 text-primary mb-2" />
            <CardTitle>User Management</CardTitle>
            <CardDescription>Manage owners and customers</CardDescription>
          </CardHeader>
        </Card>
        
        <Card className="hover:bg-accent/50 transition-colors cursor-pointer border-primary/10">
          <CardHeader>
            <ShieldAlert className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Moderation</CardTitle>
            <CardDescription>Review and approve new listings</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:bg-accent/50 transition-colors cursor-pointer border-primary/10">
          <CardHeader>
            <BarChart3 className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Analytics</CardTitle>
            <CardDescription>Platform performance and growth</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </DashboardLayout>
  );
}

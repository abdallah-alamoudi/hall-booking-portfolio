import React from 'react';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building, Calendar, ClipboardList } from 'lucide-react';

export function OwnerDashboardPage() {
  return (
    <DashboardLayout title="Venue Dashboard">
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="hover:bg-accent/50 transition-colors cursor-pointer border-primary/10">
          <CardHeader>
            <Building className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Manage Venue</CardTitle>
            <CardDescription>Edit your active venue profile and setup</CardDescription>
          </CardHeader>
        </Card>
        
        <Card className="hover:bg-accent/50 transition-colors cursor-pointer border-primary/10">
          <CardHeader>
            <Calendar className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Availability</CardTitle>
            <CardDescription>Block dates and manage calendar</CardDescription>
          </CardHeader>
        </Card>

        <Card className="hover:bg-accent/50 transition-colors cursor-pointer border-primary/10">
          <CardHeader>
            <ClipboardList className="h-8 w-8 text-primary mb-2" />
            <CardTitle>Bookings</CardTitle>
            <CardDescription>Review and accept booking requests</CardDescription>
          </CardHeader>
        </Card>
      </div>
    </DashboardLayout>
  );
}

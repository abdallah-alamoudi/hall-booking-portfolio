import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { apiFetch } from '../../../shared/api/client';
import { useOwnerHalls } from '../../halls/hooks/useOwnerHalls';
import { useOwnerBookings } from '../../bookings/hooks/useOwnerBookings';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, Calendar, Loader2, Plus, ShieldCheck, UserCheck } from 'lucide-react';

export function HomePage() {
  const { user } = useAuth();
  const isOwner = user?.role === 'OWNER';
  const [apiStatus, setApiStatus] = useState('checking');
  const { data: halls = [], isLoading: hallsLoading } = useOwnerHalls({ enabled: isOwner });
  const { data: bookings = [], isLoading: bookingsLoading } = useOwnerBookings({ enabled: isOwner });

  useEffect(() => {
    let active = true;
    apiFetch('/health')
      .then(() => {
        if (active) setApiStatus('online');
      })
      .catch(() => {
        if (active) setApiStatus('offline');
      });

    return () => {
      active = false;
    };
  }, []);

  if (isOwner && (hallsLoading || bookingsLoading)) {
    return (
      <DashboardLayout title="Overview">
        <div className="h-[360px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (isOwner) {
    const venue = halls[0] || null;
    const pendingCount = bookings.filter((booking) => booking.status === 'PENDING_REVIEW').length;
    const acceptedCount = bookings.filter((booking) => booking.status === 'ACCEPTED').length;

    return (
      <DashboardLayout title="Overview">
        <div className="space-y-5">
          <Card className="overflow-hidden border-white/80 bg-white/90 shadow-xl shadow-slate-200/60">
            <CardHeader className="bg-[linear-gradient(120deg,_hsl(186_56%_91%),_hsl(31_92%_94%))]">
              <CardTitle className="text-3xl tracking-tight">Welcome, {user?.fullName || 'Owner'}</CardTitle>
              <CardDescription className="text-slate-600">
                Run your venue from one focused workspace: profile, bank accounts, availability, and bookings.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              {venue ? (
                <div className="flex flex-wrap items-center gap-3">
                  <Button asChild className="rounded-xl shadow-lg shadow-primary/20">
                    <Link to="/owner/halls">Open My Venue</Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-xl">
                    <Link to="/owner/bookings">Review Bookings</Link>
                  </Button>
                  <Button asChild variant="outline" className="gap-2 rounded-xl">
                    <Link to={`/owner/halls/${venue.id}/edit?tab=availability`}>
                      <Calendar className="h-4 w-4" />
                      Availability
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="rounded-xl">
                    <Link to={`/owner/halls/${venue.id}/bank-accounts`}>Bank Accounts</Link>
                  </Button>
                </div>
              ) : (
                <Button asChild className="gap-2 rounded-xl shadow-lg shadow-primary/20">
                  <Link to="/owner/halls/create">
                    <Plus className="h-4 w-4" />
                    Create Venue
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-white/80 bg-white/85 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>Venue Status</CardDescription>
                <CardTitle className="text-2xl">{venue ? 'Configured' : 'Not Set'}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-white/80 bg-white/85 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>Total Bookings</CardDescription>
                <CardTitle className="text-2xl">{bookings.length}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-white/80 bg-white/85 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>Pending Review</CardDescription>
                <CardTitle className="text-2xl">{pendingCount}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-white/80 bg-white/85 shadow-sm">
              <CardHeader className="pb-2">
                <CardDescription>Accepted</CardDescription>
                <CardTitle className="text-2xl">{acceptedCount}</CardTitle>
              </CardHeader>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Dashboard Overview">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-full border-white/80 bg-white/90 shadow-xl shadow-slate-200/60">
          <CardHeader>
            <CardTitle className="text-2xl font-bold tracking-tight">Welcome back, {user?.fullName || 'Admin'}!</CardTitle>
            <CardDescription>Monitor operations, quality, and platform health from a single control surface.</CardDescription>
          </CardHeader>
        </Card>

        <Card className="border-white/80 bg-white/85 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Activity className={`h-4 w-4 ${apiStatus === 'online' ? 'text-emerald-600' : 'text-destructive'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{apiStatus}</div>
            <p className="text-xs text-muted-foreground">API health check status</p>
          </CardContent>
        </Card>

        <Card className="border-white/80 bg-white/85 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Account Role</CardTitle>
            <UserCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold capitalize">{user?.role}</div>
            <p className="text-xs text-muted-foreground">Current user access level</p>
          </CardContent>
        </Card>

        <Card className="border-white/80 bg-white/85 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security</CardTitle>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-xs text-muted-foreground">Session is secure and encrypted</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

import React from 'react';
import { Link } from 'react-router-dom';
import { useOwnerHalls } from './hooks/useOwnerHalls';
import { useOwnerBookings } from '../bookings/hooks/useOwnerBookings';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  Calendar,
  CalendarRange,
  Clock3,
  Edit2,
  ImageOff,
  Landmark,
  Loader2,
  MapPin,
  Plus,
  ShieldAlert,
  Trash2,
  Users
} from 'lucide-react';
import { useDeleteHall } from './hooks/useDeleteHall';
import { API_BASE_URL } from '@/shared/api/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export function OwnerHallsPage() {
  const { data: halls = [], isLoading, error } = useOwnerHalls();
  const { data: bookings = [] } = useOwnerBookings();
  const deleteHall = useDeleteHall();
  const venue = halls[0] || null;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const venueBookings = venue ? bookings.filter((booking) => booking?.hall?.id === venue.id) : [];
  const pendingCount = venueBookings.filter((booking) => booking.status === 'PENDING_REVIEW').length;
  const acceptedCount = venueBookings.filter((booking) => booking.status === 'ACCEPTED').length;
  const upcomingCount = venueBookings.filter((booking) => {
    if (!['PENDING_REVIEW', 'ACCEPTED'].includes(booking.status)) return false;
    const bookingDate = new Date(booking.date);
    bookingDate.setHours(0, 0, 0, 0);
    return bookingDate >= today;
  }).length;

  if (isLoading) {
    return (
      <DashboardLayout title="My Venue">
        <div className="h-[420px] flex items-center justify-center">
          <Loader2 className="h-9 w-9 text-primary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Venue">
      <div className="space-y-6">
        {error && (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm font-medium text-destructive">
            {error?.message || 'Failed to load your venue'}
          </div>
        )}

        {!venue ? (
          <Card className="overflow-hidden border-white/80 bg-white/85 shadow-xl shadow-slate-200/60">
            <CardHeader className="space-y-3 bg-[linear-gradient(135deg,_hsl(187_48%_92%),_hsl(36_88%_95%))]">
              <Badge className="w-fit bg-slate-900 text-slate-100">Start Here</Badge>
              <CardTitle className="text-3xl tracking-tight">Create Your First Venue</CardTitle>
              <CardDescription className="max-w-xl text-slate-600">
                Your owner account now manages one active venue at a time. Add your venue details to start receiving bookings.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" className="gap-2 rounded-xl shadow-lg shadow-primary/20">
                  <Link to="/owner/halls/create">
                    <Plus className="h-4 w-4" />
                    Create Venue
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <section className="relative overflow-hidden rounded-3xl border border-white/80 bg-white/85 shadow-xl shadow-slate-200/70">
              {venue.coverPhoto ? (
                <img
                  src={
                    venue.coverPhoto.startsWith('http')
                      ? venue.coverPhoto
                      : `${API_BASE_URL}${venue.coverPhoto.startsWith('/') ? '' : '/'}${venue.coverPhoto}`
                  }
                  alt={venue.name}
                  className="absolute inset-0 h-full w-full object-cover opacity-15"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-end pr-8 text-slate-300">
                  <ImageOff className="h-16 w-16" />
                </div>
              )}
              <div className="relative space-y-6 p-7 md:p-8">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="space-y-2">
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/10">Active Venue</Badge>
                    <h2 className="text-3xl font-bold tracking-tight text-slate-900">{venue.name}</h2>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {venue.city}
                        {venue.area ? ` - ${venue.area}` : ''}
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button asChild variant="secondary" className="gap-2 rounded-xl">
                      <Link to={`/owner/halls/${venue.id}/edit`}>
                        <Edit2 className="h-4 w-4" />
                        Edit Venue
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="gap-2 rounded-xl bg-white/80">
                      <Link to={`/owner/halls/${venue.id}/edit?tab=availability`}>
                        <Calendar className="h-4 w-4" />
                        Availability
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="gap-2 rounded-xl bg-white/80">
                      <Link to={`/owner/halls/${venue.id}/bank-accounts`}>
                        <Landmark className="h-4 w-4" />
                        Bank Accounts
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="gap-2 rounded-xl bg-white/80">
                      <Link to="/owner/bookings">
                        <CalendarRange className="h-4 w-4" />
                        Bookings
                      </Link>
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <Card className="border-white/80 bg-white/90 shadow-none">
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Capacity</p>
                        <p className="text-lg font-bold text-slate-900">{venue.capacity}</p>
                      </div>
                      <Users className="h-5 w-5 text-primary" />
                    </CardContent>
                  </Card>
                  <Card className="border-white/80 bg-white/90 shadow-none">
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Starting From</p>
                        <p className="text-lg font-bold text-slate-900">
                          {venue.startingFrom} <span className="text-sm text-slate-500">{venue.currency}</span>
                        </p>
                      </div>
                      <Clock3 className="h-5 w-5 text-primary" />
                    </CardContent>
                  </Card>
                  <Card className="border-white/80 bg-white/90 shadow-none">
                    <CardContent className="flex items-center justify-between p-4">
                      <div>
                        <p className="text-xs uppercase tracking-[0.12em] text-slate-500">Upcoming Requests</p>
                        <p className="text-lg font-bold text-slate-900">{upcomingCount}</p>
                      </div>
                      <CalendarRange className="h-5 w-5 text-primary" />
                    </CardContent>
                  </Card>
                </div>
              </div>
            </section>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-white/80 bg-white/85 shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription>Total Bookings</CardDescription>
                  <CardTitle className="text-3xl">{venueBookings.length}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-white/80 bg-white/85 shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription>Pending Review</CardDescription>
                  <CardTitle className="text-3xl">{pendingCount}</CardTitle>
                </CardHeader>
              </Card>
              <Card className="border-white/80 bg-white/85 shadow-sm">
                <CardHeader className="pb-2">
                  <CardDescription>Accepted</CardDescription>
                  <CardTitle className="text-3xl">{acceptedCount}</CardTitle>
                </CardHeader>
              </Card>
            </div>

            <Card className="border-destructive/30 bg-white/90 shadow-sm">
              <CardHeader>
                <div className="flex items-center gap-2 text-destructive">
                  <ShieldAlert className="h-4 w-4" />
                  <CardTitle className="text-lg">Danger Zone</CardTitle>
                </div>
                <CardDescription>
                  Deleting this venue is permanent. Deletion is blocked automatically when upcoming pending or accepted bookings exist.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="destructive"
                      className="gap-2 rounded-xl shadow-lg shadow-destructive/20"
                      disabled={deleteHall.isPending}
                    >
                      {deleteHall.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                      Delete Venue
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete this venue?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. If there are upcoming pending or accepted bookings, deletion will be blocked.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteHall.mutate(venue.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardFooter>
            </Card>
          </>
        )}

        {halls.length > 1 && (
          <div className="rounded-2xl border border-amber-400/50 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            <div className="flex items-center gap-2 font-medium">
              <AlertCircle className="h-4 w-4" />
              Multiple venues were detected in data. Only the first venue is shown in this view.
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

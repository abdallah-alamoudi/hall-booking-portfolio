import React from 'react';
import { Link } from 'react-router-dom';
import { useOwnerBookings } from '../hooks/useOwnerBookings';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CalendarRange, Loader2, Eye, CalendarX, Sun, Moon, Clock } from 'lucide-react';
import { format } from 'date-fns';

const DAYTIME_CONFIG = {
  MORNING: { label: 'Morning', icon: Sun, color: 'text-amber-500' },
  EVENING: { label: 'Evening', icon: Moon, color: 'text-indigo-400' },
  FULL_DAY: { label: 'Full Day', icon: Clock, color: 'text-emerald-500' },
};

export function OwnerBookingsPage() {
  const { data: bookings = [], isLoading, error } = useOwnerBookings();

  if (isLoading) {
    return (
      <DashboardLayout title="Bookings">
        <div className="h-[400px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'PENDING_REVIEW': return 'warning';
      case 'ACCEPTED': return 'success';
      case 'REJECTED': return 'destructive';
      case 'CANCELLED': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <DashboardLayout title="Bookings">
      <div className="flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Venue Bookings</h2>
            <p className="text-muted-foreground">Manage reservations for your active venue.</p>
          </div>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
            Error: {error?.message || 'Failed to fetch bookings'}
          </div>
        )}
        
        {bookings.length === 0 ? (
          <Card className="flex flex-col items-center justify-center py-16 px-4 text-center border-dashed bg-muted/20">
            <CalendarX className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <CardTitle className="text-xl mb-2">No bookings found</CardTitle>
            <CardDescription className="max-w-xs mb-6">
              You have not received any bookings for your venue yet.
            </CardDescription>
          </Card>
        ) : (
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle>All Reservations</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Venue</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Date & Slot</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.hall.name}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{booking.customer.fullName}</span>
                          <span className="text-xs text-muted-foreground">{booking.customer.phone}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                         <div className="flex flex-col gap-1">
                           <div className="flex items-center text-sm gap-2">
                             <CalendarRange className="h-4 w-4 text-muted-foreground" />
                             <span>{format(new Date(booking.date), 'MMM dd, yyyy')}</span>
                           </div>
                           {(() => {
                             const cfg = DAYTIME_CONFIG[booking.daytime];
                             const Icon = cfg?.icon || Clock;
                             return (
                               <div className={`flex items-center gap-1 text-xs ${cfg?.color || ''}`}>
                                 <Icon className="h-3.5 w-3.5" />
                                 <span>{cfg?.label || booking.daytime}</span>
                               </div>
                             );
                           })()}
                         </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {booking.totalPrice} <span className="text-xs text-muted-foreground">{booking.currency}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(booking.status)}>
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/owner/bookings/${booking.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

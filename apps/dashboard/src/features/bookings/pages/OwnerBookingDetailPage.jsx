import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOwnerBooking } from '../hooks/useOwnerBooking';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { client } from '@/shared/api/client';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Loader2, CalendarRange, Receipt, AlignLeft, Phone, Mail, CheckCircle2, XCircle, ImageIcon, Sparkles, Sun, Moon, Clock } from 'lucide-react';
import { format } from 'date-fns';

const DAYTIME_CONFIG = {
  MORNING: { label: 'Morning', icon: Sun, color: 'text-amber-500' },
  EVENING: { label: 'Evening', icon: Moon, color: 'text-indigo-400' },
  FULL_DAY: { label: 'Full Day', icon: Clock, color: 'text-emerald-500' },
};

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000/v1';

export function OwnerBookingDetailPage() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { data: booking, isLoading, error } = useOwnerBooking(id);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [actionError, setActionError] = useState('');

  const statusMutation = useMutation({
    mutationFn: async ({ action, reason }) =>
      client.patch(`/owner/bookings/${id}/status`, { action, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner', 'booking', id] });
      queryClient.invalidateQueries({ queryKey: ['owner', 'bookings'] });
      setShowRejectForm(false);
      setRejectReason('');
      setActionError('');
    },
    onError: (err) => setActionError(err?.message || 'Action failed'),
  });

  if (isLoading) {
    return (
      <DashboardLayout title="Booking Details">
        <div className="h-[400px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !booking) {
    return (
      <DashboardLayout title="Booking Details">
        <div className="flex flex-col gap-4">
          <Button variant="ghost" asChild className="w-fit mb-4">
            <Link to="/owner/bookings">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Bookings
            </Link>
          </Button>
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
            {error?.message || 'Booking not found.'}
          </div>
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

  const receipt = booking.receipt;
  const canAct = booking.status === 'PENDING_REVIEW' && receipt?.status === 'UPLOADED';

  return (
    <DashboardLayout title="Booking Details">
      <div className="flex flex-col gap-6 max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-4">
            <Button variant="outline" size="sm" asChild className="w-fit">
              <Link to="/owner/bookings">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Link>
            </Button>
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Reservation #{booking.id.slice(-6).toUpperCase()}</h2>
              <div className="flex items-center gap-2 mt-1">
                <p className="text-muted-foreground">Booked on {format(new Date(booking.createdAt), 'MMM dd, yyyy h:mm a')}</p>
                <Badge variant={getStatusBadgeVariant(booking.status)}>{booking.status}</Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Reservation Details</CardTitle>
                <CardDescription>Event dates and venue information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <CalendarRange className="h-4 w-4" /> Date
                    </span>
                    <p className="text-base font-medium">
                      {format(new Date(booking.date), 'EEEE, MMM dd, yyyy')}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">Time Slot</span>
                    {(() => {
                      const cfg = DAYTIME_CONFIG[booking.daytime];
                      const Icon = cfg?.icon || Clock;
                      return (
                        <div className={`flex items-center gap-2 text-base font-medium ${cfg?.color || ''}`}>
                          <Icon className="h-4 w-4" />
                          <span>{cfg?.label || booking.daytime}</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">Venue</span>
                    <p className="text-base font-medium text-primary hover:underline">
                      <Link to={`/owner/halls/${booking.hall.id}/edit`}>{booking.hall.name}</Link>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Sparkles className="h-4 w-4" /> Purpose
                    </span>
                    <p className="text-base">{booking.purpose || 'Not specified'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <Receipt className="h-4 w-4" /> Total Price
                    </span>
                    <p className="text-base font-bold text-primary">
                      {booking.totalPrice} <span className="text-xs font-normal text-muted-foreground">{booking.currency}</span>
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-sm font-medium text-muted-foreground">Required Deposit</span>
                    <p className="text-base font-bold">
                      {booking.hall?.depositAmount} <span className="text-xs font-normal text-muted-foreground">{booking.currency}</span>
                    </p>
                  </div>
                </div>

                {booking.customerNote && (
                  <div className="pt-4 border-t space-y-2">
                    <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                      <AlignLeft className="h-4 w-4" /> Customer Note
                    </span>
                    <div className="p-3 bg-muted/30 rounded-md text-sm">{booking.customerNote}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Receipt Review Card */}
            <Card className={canAct ? 'border-primary/40 shadow-md' : ''}>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Deposit Receipt
                </CardTitle>
                <CardDescription>
                  {receipt ? `Receipt status: ${receipt.status}` : 'No receipt uploaded yet'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {receipt ? (
                  <>
                    <div className="rounded-xl overflow-hidden border bg-muted/20">
                      <img
                        src={`${API_BASE}${receipt.imageUrl}`}
                        alt="Deposit receipt"
                        className="w-full max-h-96 object-contain"
                      />
                    </div>
                    {receipt.note && booking.status === 'REJECTED' && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                        <strong>Rejection reason:</strong> {receipt.note}
                      </div>
                    )}
                    {canAct && (
                      <div className="pt-2 space-y-3">
                        {actionError && <p className="text-sm text-destructive">{actionError}</p>}
                        {!showRejectForm ? (
                          <div className="flex gap-3">
                            <Button
                              className="bg-green-600 hover:bg-green-700 text-white"
                              onClick={() => statusMutation.mutate({ action: 'accept' })}
                              disabled={statusMutation.isPending}
                            >
                              {statusMutation.isPending
                                ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                : <CheckCircle2 className="w-4 h-4 mr-2" />}
                              Confirm Booking
                            </Button>
                            <Button
                              variant="destructive"
                              onClick={() => setShowRejectForm(true)}
                              disabled={statusMutation.isPending}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-3 p-4 border rounded-xl bg-destructive/5 border-destructive/20">
                            <Label htmlFor="reason" className="text-destructive font-medium">Rejection Reason</Label>
                            <Textarea
                              id="reason"
                              placeholder="Explain why you are rejecting this booking..."
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              rows={3}
                            />
                            <div className="flex gap-3">
                              <Button
                                variant="destructive"
                                onClick={() => statusMutation.mutate({ action: 'reject', reason: rejectReason })}
                                disabled={statusMutation.isPending || !rejectReason.trim()}
                              >
                                {statusMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                Confirm Rejection
                              </Button>
                              <Button variant="outline" onClick={() => setShowRejectForm(false)}>Cancel</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center py-10 text-muted-foreground gap-2">
                    <ImageIcon className="w-10 h-10 opacity-30" />
                    <p className="text-sm">The customer has not uploaded a deposit receipt yet.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Customer Info */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                    {booking.customer.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium leading-none">{booking.customer.fullName}</p>
                    <p className="text-sm text-muted-foreground mt-1">Customer</p>
                  </div>
                </div>
                <div className="pt-4 border-t space-y-3">
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.customer.phone || 'N/A'}</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.customer.email || 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

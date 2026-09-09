import React from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useHall } from '../hooks/useHall';
import { useUpdateHall } from '../hooks/useUpdateHall';
import { useDeleteHall } from '../hooks/useDeleteHall';
import { HallForm } from '../components/HallForm';
import { AvailabilityTab } from '../components/AvailabilityTab';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Trash2, Calendar, Info, ShieldAlert, Landmark, ArrowRight } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";

export function EditHallPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: hall, isLoading, isError, error } = useHall(id);
  const updateHall = useUpdateHall();
  const deleteHall = useDeleteHall();
  const activeTab = searchParams.get('tab') === 'availability' ? 'availability' : 'info';

  const handleTabChange = (value) => {
    const nextParams = new URLSearchParams(searchParams);
    if (value === 'availability') {
      nextParams.set('tab', 'availability');
    } else {
      nextParams.delete('tab');
    }
    setSearchParams(nextParams, { replace: true });
  };

  const handleSubmit = (payload) => {
    updateHall.mutate(
      { id, data: payload },
      {
        onSuccess: () => {
          navigate('/owner/halls');
        },
      }
    );
  };

  if (isLoading) {
    return (
      <DashboardLayout title="Edit Venue">
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (isError) {
    return (
      <DashboardLayout title="Edit Venue">
        <div className="p-4 rounded-lg bg-destructive/10 text-destructive">
          Error loading venue: {error?.message}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Edit Venue">
      <div className="space-y-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="mb-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-slate-700">
                Need to block dates quickly? Open the Availability tab directly.
              </p>
              {activeTab !== 'availability' && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  className="gap-2 rounded-lg"
                  onClick={() => handleTabChange('availability')}
                >
                  Availability
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <TabsList>
              <TabsTrigger value="info" className="gap-2">
                <Info className="h-4 w-4" />
                Basic Info
              </TabsTrigger>
              <TabsTrigger value="availability" className="gap-2">
                <Calendar className="h-4 w-4" />
                Availability
              </TabsTrigger>
            </TabsList>
            <Button
              type="button"
              variant="outline"
              className="gap-2"
              onClick={() => navigate(`/owner/halls/${id}/bank-accounts`)}
            >
              <Landmark className="h-4 w-4" />
              Bank Accounts
            </Button>
          </div>

          <TabsContent value="info" className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
            {/* Error banner for update failure */}
            {updateHall.isError && (
              <div className="max-w-2xl mx-auto p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
                {updateHall.error?.message || 'Failed to update venue'}
              </div>
            )}

            {hall && (
              <>
                <HallForm
                  initialData={hall}
                  onSubmit={handleSubmit}
                  isSubmitting={updateHall.isPending}
                  submitLabel="Update Venue"
                  title="Edit Venue"
                  description="Update your venue information, pricing, and availability."
                />

                <div className="max-w-2xl mx-auto pt-8 border-t">
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-6 transition-all hover:bg-destructive/10">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-destructive">
                          <ShieldAlert className="h-5 w-5" />
                          <h3 className="text-lg font-semibold">Danger Zone</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Once you delete this venue, it will be hidden from search and all related images will be removed.
                        </p>
                      </div>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="destructive"
                            size="lg"
                            className="gap-2 shrink-0 shadow-lg shadow-destructive/20"
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
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will permanently delete your
                              venue and remove all its image data from our servers.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                deleteHall.mutate(id, {
                                  onSuccess: () => navigate('/owner/halls')
                                });
                              }}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="availability" className="animate-in fade-in slide-in-from-right-4 duration-300">
            <AvailabilityTab hallId={id} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}

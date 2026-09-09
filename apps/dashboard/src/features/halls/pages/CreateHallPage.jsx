import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCreateHall } from '../hooks/useCreateHall';
import { useOwnerHalls } from '../hooks/useOwnerHalls';
import { HallForm } from '../components/HallForm';
import { DashboardLayout } from '@/shared/components/DashboardLayout';
import { Loader2 } from 'lucide-react';

export function CreateHallPage() {
  const navigate = useNavigate();
  const createHall = useCreateHall();
  const { data: halls = [], isLoading: isLoadingHalls } = useOwnerHalls();
  const existingHallId = halls[0]?.id;

  useEffect(() => {
    if (!isLoadingHalls && existingHallId) {
      navigate(`/owner/halls/${existingHallId}/edit`, { replace: true });
    }
  }, [isLoadingHalls, existingHallId, navigate]);

  const handleSubmit = (payload) => {
    if (existingHallId) {
      navigate(`/owner/halls/${existingHallId}/edit`, { replace: true });
      return;
    }

    createHall.mutate(payload, {
      onSuccess: (createdHall) => {
        if (createdHall?.id) {
          navigate(`/owner/halls/${createdHall.id}/bank-accounts`);
          return;
        }
        navigate('/owner/halls');
      },
    });
  };

  if (isLoadingHalls) {
    return (
      <DashboardLayout title="Create Venue">
        <div className="h-[400px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 text-primary animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="Create Venue">
      <div className="space-y-6">
        {/* Error banner */}
        {createHall.isError && (
          <div className="max-w-2xl mx-auto p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium">
            {createHall.error?.message || 'Failed to create venue'}
          </div>
        )}

        <HallForm
          onSubmit={handleSubmit}
          isSubmitting={createHall.isPending}
          submitLabel="Create Venue"
          title="Create Your Venue"
          description="Set up your venue profile, pricing, and details. You can refine content anytime."
        />
      </div>
    </DashboardLayout>
  );
}


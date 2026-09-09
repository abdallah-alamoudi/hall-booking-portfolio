import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShieldX } from 'lucide-react';

export function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
      <div className="bg-destructive/5 p-6 rounded-full mb-6 border border-destructive/10">
        <ShieldX className="h-16 w-16 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight mb-2">Access Denied</h1>
      <p className="text-muted-foreground max-w-sm mb-8">
        You don't have the required permissions to view this section of the dashboard.
      </p>
      <div className="flex gap-4">
        <Button asChild variant="outline">
          <Link to="/login">Switch Account</Link>
        </Button>
        <Button asChild>
          <Link to="/">Back to Safety</Link>
        </Button>
      </div>
    </div>
  );
}

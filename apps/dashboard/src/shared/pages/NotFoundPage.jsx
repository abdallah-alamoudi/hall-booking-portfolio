import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { FileQuestion } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
      <div className="bg-primary/5 p-6 rounded-full mb-6">
        <FileQuestion className="h-16 w-16 text-primary" />
      </div>
      <h1 className="text-4xl font-black tracking-tighter mb-2">404</h1>
      <h2 className="text-xl font-semibold mb-6">Page Not Found</h2>
      <p className="text-muted-foreground max-w-xs mb-8">
        We couldn't find the page you're looking for. It might have been moved or deleted.
      </p>
      <Button asChild size="lg" className="rounded-full px-8">
        <Link to="/">Return Dashboard</Link>
      </Button>
    </div>
  );
}

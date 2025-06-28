
'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function ReviewsPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 md:p-6">
      <main className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="icon">
                <Link href="/app" aria-label="Go back to app">
                  <ArrowLeft />
                </Link>
              </Button>
              <div>
                <CardTitle>Reviews</CardTitle>
                <CardDescription>
                  This is the reviews page. It is currently under construction.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground">Check back later for updates!</p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

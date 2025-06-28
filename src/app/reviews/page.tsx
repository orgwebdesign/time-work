'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

export default function ReviewsPage() {
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !description) {
      toast({
        title: 'Missing Information',
        description: 'Please fill out both subject and description.',
        variant: 'destructive',
      });
      return;
    }
    
    // In a real app, you would send this data to a server
    console.log({ subject, description });

    toast({
      title: 'Report Submitted',
      description: "Thank you for your feedback! We'll look into it.",
    });

    setSubject('');
    setDescription('');
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 md:p-6">
      <main className="w-full max-w-2xl">
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="icon">
                  <Link href="/app" aria-label="Go back to app">
                    <ArrowLeft />
                  </Link>
                </Button>
                <div>
                  <CardTitle>Report an Issue</CardTitle>
                  <CardDescription>
                    Experiencing a problem? Let us know and we'll fix it.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-6 pt-6">
              <div className="grid gap-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Unable to add a new task"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Please describe the issue in detail..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={6}
                  required
                />
              </div>
            </CardContent>
            <CardFooter className="border-t p-6 flex justify-end">
                <Button type="submit">
                    <Send className="mr-2 h-4 w-4" />
                    Submit Report
                </Button>
            </CardFooter>
          </Card>
        </form>
      </main>
    </div>
  );
}

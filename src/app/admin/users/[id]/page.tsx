'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import type { User } from '@/lib/types';
import { format } from 'date-fns';

export default function UserReviewPage() {
  const [user, setUser] = useState<User | null>(null);
  const [notes, setNotes] = useState('');
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  useEffect(() => {
    if (!userId) return;
    try {
      const storedUsers = localStorage.getItem('taskmaster-users');
      if (storedUsers) {
        const users: User[] = JSON.parse(storedUsers);
        const targetUser = users.find(u => u.id === userId);
        if (targetUser) {
          setUser(targetUser);
          setNotes(targetUser.adminNotes || '');
        } else {
          // User not found, redirect back
          router.push('/admin');
        }
      }
    } catch (error) {
      console.error("Failed to load user from localStorage", error);
      router.push('/admin');
    }
  }, [userId, router]);

  const handleSaveNotes = () => {
    if (!user) return;

    try {
      const storedUsers = localStorage.getItem('taskmaster-users');
      const users: User[] = storedUsers ? JSON.parse(storedUsers) : [];
      const userIndex = users.findIndex(u => u.id === user.id);
      
      if (userIndex !== -1) {
        users[userIndex].adminNotes = notes;
        localStorage.setItem('taskmaster-users', JSON.stringify(users));
        alert('Notes saved!');
      } else {
        alert('Could not find user to update.');
      }
    } catch (error) {
      console.error("Failed to save notes", error);
      alert('An error occurred while saving notes.');
    }
  };
  
  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p>Loading User Details...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 md:p-6">
      <main className="w-full max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <Button asChild variant="ghost" size="icon">
                <Link href="/admin" aria-label="Go back to admin dashboard">
                  <ArrowLeft />
                </Link>
              </Button>
              <div>
                <CardTitle>User Review</CardTitle>
                <CardDescription>
                  Review user details and add private notes.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                  <AvatarFallback>
                      {user.fullName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
              </Avatar>
              <div>
                  <h3 className="text-xl font-semibold">{user.fullName}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground mt-1">Joined on {format(new Date(user.createdAt), 'PPP')}</p>
              </div>
            </div>
            
            <Separator />

            <div className="space-y-2">
              <Label htmlFor="admin-notes">Admin Notes</Label>
              <Textarea
                id="admin-notes"
                placeholder="Add private notes about this user..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={5}
                className="bg-input/50"
              />
               <p className="text-xs text-muted-foreground">
                These notes are only visible to administrators.
              </p>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t pt-6">
             <Button onClick={handleSaveNotes}>Save Notes</Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}

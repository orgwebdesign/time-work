export const runtime = 'edge';
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../../../app-layout';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User } from '@/lib/types';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardHeader } from '@/components/dashboard-header';

export default function AdminUserReviewPage({
  params,
}: {
  params: { id: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const currentUser: User | null = JSON.parse(localStorage.getItem('taskmaster-currentUser') || 'null');
      if (currentUser?.email !== 'admin@admin.com') {
        router.push('/');
        return;
      }

      const allUsers: User[] = JSON.parse(localStorage.getItem('taskmaster-users') || '[]');
      const foundUser = allUsers.find(u => u.id === params.id);
      if (foundUser) {
        setUser(foundUser);
        setAdminNotes(foundUser.adminNotes || '');
      } else {
        // User not found, maybe redirect
        router.push('/admin');
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      router.push('/login');
    }
  }, [router, params.id]);

  const handleSaveNotes = () => {
    if (!user) return;
    try {
      const allUsers: User[] = JSON.parse(localStorage.getItem('taskmaster-users') || '[]');
      const userIndex = allUsers.findIndex(u => u.id === user.id);
      if (userIndex > -1) {
        allUsers[userIndex].adminNotes = adminNotes;
        localStorage.setItem('taskmaster-users', JSON.stringify(allUsers));
        toast({
          title: "Notes Saved",
          description: `Admin notes for ${user.fullName} have been updated.`,
        });
      }
    } catch(error) {
        console.error('Failed to save notes:', error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not save admin notes.",
        });
    }
  };
  
  const UserDetailsSkeleton = () => (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <Skeleton className="h-9 w-1/2" />
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-4">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-5 w-64" />
                </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
              </div>
              <div className="space-y-2">
                 <Skeleton className="h-4 w-24" />
                 <Skeleton className="h-24 w-full" />
              </div>
              <Skeleton className="h-10 w-32 ml-auto" />
          </CardContent>
        </Card>
      </div>
  )

  if (!isClient || !user) {
    return (
        <AppLayout>
            <UserDetailsSkeleton />
        </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <DashboardHeader title="Admin User Review" />
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                    <AvatarImage
                        src={`https://ui-avatars.com/api/?name=${user.fullName.replace(' ','+')}&background=random&size=128`}
                        alt={user.fullName}
                    />
                    <AvatarFallback className="text-3xl">{user.fullName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                    <CardTitle className="text-4xl">{user.fullName}</CardTitle>
                    <CardDescription className="text-lg">{user.email}</CardDescription>
                </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="grid md:grid-cols-3 gap-6 text-sm">
                <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground">Member Since</p>
                    <p className="font-semibold text-lg">{format(new Date(user.createdAt), 'MMMM d, yyyy')}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground">Last Login</p>
                    <p className="font-semibold text-lg">{user.lastLogin ? format(new Date(user.lastLogin), 'p, MMM d') : 'Never'}</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground">Total Logins</p>
                    <p className="font-semibold text-lg">{user.loginCount || 0}</p>
                </div>
            </div>

            <div className="grid w-full gap-1.5">
                <Label htmlFor="admin-notes" className="text-base">Admin Notes</Label>
                <Textarea
                    id="admin-notes"
                    placeholder="Add private notes about this user..."
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="min-h-32"
                />
            </div>
            
            <div className="flex justify-end">
                <Button onClick={handleSaveNotes}>Save Notes</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

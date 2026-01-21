'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppLayout from '../app-layout';
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
import { Pencil } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { DashboardHeader } from '@/components/dashboard-header';


export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [isClient, setIsClient] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFullName, setEditingFullName] = useState('');

  useEffect(() => {
    setIsClient(true);
    try {
      const currentUser = localStorage.getItem('taskmaster-currentUser');
      if (!currentUser) {
        router.push('/login');
      } else {
        const parsedUser = JSON.parse(currentUser);
        setUser(parsedUser);
        setEditingFullName(parsedUser.fullName);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      router.push('/login');
    }
  }, [router]);
  
  const handleSaveName = () => {
    if(!user || !editingFullName) return;
    try {
        const updatedUser = { ...user, fullName: editingFullName };
        
        // Update current user in local storage
        localStorage.setItem('taskmaster-currentUser', JSON.stringify(updatedUser));
        
        // Update user in the main user list
        const allUsers: User[] = JSON.parse(localStorage.getItem('taskmaster-users') || '[]');
        const userIndex = allUsers.findIndex(u => u.id === user.id);
        if(userIndex > -1) {
            allUsers[userIndex] = updatedUser;
            localStorage.setItem('taskmaster-users', JSON.stringify(allUsers));
        }
        
        setUser(updatedUser);
        setIsEditModalOpen(false);

        toast({
            title: "Profile Updated",
            description: "Your name has been successfully changed.",
        });

    } catch (error) {
        console.error("Failed to update name:", error);
        toast({
            variant: "destructive",
            title: "Error",
            description: "Could not update your name. Please try again."
        });
    }
  };
  
  const ProfileSkeleton = () => (
     <div className="flex-1 space-y-4 p-8 pt-6">
        <Skeleton className="h-9 w-1/3" />
        <Card className="glass-card">
            <CardHeader>
                <Skeleton className="h-8 w-1/2" />
                <Skeleton className="h-5 w-3/4" />
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-6">
                    <Skeleton className="h-24 w-24 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-6 w-48" />
                        <Skeleton className="h-4 w-56" />
                        <Skeleton className="h-4 w-40" />
                    </div>
                </div>
            </CardContent>
        </Card>
    </div>
  )

  if (!isClient || !user) {
    return (
        <AppLayout>
            <ProfileSkeleton />
        </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <DashboardHeader title="User Profile" />
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Profile Details</CardTitle>
            <CardDescription>
              Here is the information from your public profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                    <AvatarImage
                        src={`https://ui-avatars.com/api/?name=${user.fullName.replace(' ','+')}&background=random&size=128`}
                        alt={user.fullName}
                    />
                    <AvatarFallback className="text-3xl">{user.fullName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                    <h3 className="text-2xl font-bold flex items-center gap-2">
                        {user.fullName}
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsEditModalOpen(true)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </h3>
                    <p className="text-muted-foreground">{user.email}</p>
                    <p className="text-sm text-muted-foreground pt-2">
                        Member since {format(new Date(user.createdAt), 'MMMM yyyy')}
                    </p>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>

       <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Your Name</DialogTitle>
                    <DialogDescription>
                        Update your full name below.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-name" className="text-right">
                            Full Name
                        </Label>
                        <Input
                            id="edit-name"
                            value={editingFullName}
                            onChange={(e) => setEditingFullName(e.target.value)}
                            className="col-span-3"
                            placeholder="Your full name"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button type="button" onClick={handleSaveName}>Save changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </AppLayout>
  );
}

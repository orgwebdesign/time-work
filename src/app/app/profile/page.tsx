'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User as UserIcon, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import type { User } from '@/lib/types';

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const router = useRouter();

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('taskmaster-currentUser');
      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        setUser(parsedUser);
        setName(parsedUser.fullName);
      } else {
        router.push('/login');
      }
    } catch (error) {
      console.error("Failed to load user from localStorage", error);
      router.push('/login');
    }
  }, [router]);

  const handleSaveChanges = () => {
    if (user) {
      const updatedUser: User = { ...user, fullName: name, password: user.password };
      let passwordUpdated = false;

      if (currentPassword || newPassword || confirmPassword) {
        if (currentPassword !== user.password) {
          alert("Incorrect current password.");
          return;
        }
        if (!newPassword || newPassword.length < 1) {
          alert("Please enter a new password.");
          return;
        }
        if (newPassword !== confirmPassword) {
          alert("New passwords do not match.");
          return;
        }
        updatedUser.password = newPassword;
        passwordUpdated = true;
      }

      try {
        localStorage.setItem('taskmaster-currentUser', JSON.stringify(updatedUser));
        
        const storedUsers = localStorage.getItem('taskmaster-users');
        const users: User[] = storedUsers ? JSON.parse(storedUsers) : [];
        const userIndex = users.findIndex(u => u.id === user.id);
        
        if (userIndex !== -1) {
          users[userIndex] = updatedUser;
          localStorage.setItem('taskmaster-users', JSON.stringify(users));
        }

        setUser(updatedUser);
        alert('Changes saved!');

        if (passwordUpdated) {
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        }
      } catch (error) {
        console.error("Failed to save changes", error);
        alert('An error occurred while saving your changes.');
      }
    }
  };
  
  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p>Loading Profile...</p>
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
                <Link href="/app" aria-label="Go back to app">
                  <ArrowLeft />
                </Link>
              </Button>
              <div>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Manage your account details and password.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <div className="space-y-4">
                <Label>Profile Picture</Label>
                <div className="flex items-center gap-6">
                    <Avatar className="h-24 w-24">
                        <AvatarFallback>
                            {name ? name.split(' ').map(n => n[0]).join('') : <UserIcon className="h-12 w-12" />}
                        </AvatarFallback>
                    </Avatar>
                    <Button variant="outline">Change Picture</Button>
                </div>
            </div>
            
            <Separator />

            <div className="space-y-4">
              <h4 className="text-lg font-medium">Personal Information</h4>
              <div className="grid gap-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h4 className="text-lg font-medium">Change Password</h4>
              <div className="grid gap-2">
                <Label htmlFor="current-password">Current Password</Label>
                <div className="relative">
                  <Input
                    id="current-password"
                    type={showCurrentPassword ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowCurrentPassword((prev) => !prev)}
                    aria-label={showCurrentPassword ? "Hide password" : "Show password"}
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="new-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowNewPassword((prev) => !prev)}
                    aria-label={showNewPassword ? "Hide password" : "Show password"}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-muted-foreground"
                    onClick={() => setShowConfirmPassword((prev) => !prev)}
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end pt-4">
              <Button onClick={handleSaveChanges}>Save Changes</Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

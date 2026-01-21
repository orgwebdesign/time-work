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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { User } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { DashboardHeader } from '@/components/dashboard-header';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
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

export default function AdminDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isClient, setIsClient] = useState(false);

  // State for modals
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editedFullName, setEditedFullName] = useState('');
  const [editedEmail, setEditedEmail] = useState('');

  const loadUsers = () => {
    try {
      const allUsers: User[] = JSON.parse(
        localStorage.getItem('taskmaster-users') || '[]'
      );
      // Filter out the admin user from the main list
      setUsers(allUsers.filter(u => u.email !== 'admin@admin.com'));
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  useEffect(() => {
    setIsClient(true);
    try {
      const currentUser: User | null = JSON.parse(
        localStorage.getItem('taskmaster-currentUser') || 'null'
      );
      if (currentUser?.email !== 'admin@admin.com') {
        router.push('/');
        return;
      }
      loadUsers();
    } catch (error) {
      console.error('Failed to load user data:', error);
      router.push('/login');
    }
  }, [router]);

  const handleEditClick = (user: User) => {
    setSelectedUser(user);
    setEditedFullName(user.fullName);
    setEditedEmail(user.email);
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteClick = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveChanges = () => {
    if (!selectedUser) return;
    try {
      const allUsers: User[] = JSON.parse(localStorage.getItem('taskmaster-users') || '[]');
      const userIndex = allUsers.findIndex(u => u.id === selectedUser.id);
      
      if (userIndex > -1) {
        allUsers[userIndex] = {
          ...allUsers[userIndex],
          fullName: editedFullName,
          email: editedEmail,
        };
        localStorage.setItem('taskmaster-users', JSON.stringify(allUsers));
        toast({
          title: "User Updated",
          description: "User details have been successfully saved.",
        });
        loadUsers(); // Refresh the user list
        setIsEditDialogOpen(false);
        setSelectedUser(null);
      }
    } catch (error) {
      console.error("Failed to save changes:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not save user changes.",
      });
    }
  };
  
  const handleDeleteConfirm = () => {
    if (!selectedUser) return;
    try {
      // Get a stable list of all keys first to avoid issues with live modification
      const allKeys = Object.keys(localStorage);
      
      // Remove user from the main list
      const currentUsers: User[] = JSON.parse(localStorage.getItem('taskmaster-users') || '[]');
      const updatedUsers = currentUsers.filter(u => u.id !== selectedUser.id);
      localStorage.setItem('taskmaster-users', JSON.stringify(updatedUsers));
      
      // Remove all data associated with the user
      const userPrefixes = [
        `worklog-${selectedUser.id}-`,
        `timerState-${selectedUser.id}-`,
        `goalMet-${selectedUser.id}-`,
        `activitylog-${selectedUser.id}-`,
        `work-holidays-${selectedUser.id}-`,
        `focusMode-${selectedUser.id}`,
        `water-intake-${selectedUser.id}-`,
        `wellness-score-${selectedUser.id}-`
      ];
      
      // Iterate over the stable list of keys and remove matching items
      allKeys.forEach(key => {
        if (userPrefixes.some(prefix => key.startsWith(prefix))) {
          localStorage.removeItem(key);
        }
      });
      
      // Remove the current user if it's the one being deleted (unlikely but safe)
      const currentUser: User | null = JSON.parse(localStorage.getItem('taskmaster-currentUser') || 'null');
      if (currentUser && currentUser.id === selectedUser.id) {
          localStorage.removeItem('taskmaster-currentUser');
      }

      toast({
        title: "User Deleted",
        description: `${selectedUser.fullName} and all their data have been removed.`,
      });

      loadUsers(); // Refresh list
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error) {
       console.error("Failed to delete user:", error);
       toast({
        variant: "destructive",
        title: "Error",
        description: "Could not delete user.",
      });
    }
  };


  if (!isClient) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <DashboardHeader title="Admin Dashboard" />
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>User Management</CardTitle>
            <CardDescription>
              A list of all registered users in the system.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="text-center">Last Login</TableHead>
                  <TableHead className="text-center">Login Count</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage
                              src={`https://ui-avatars.com/api/?name=${user.fullName.replace(' ','+')}&background=random`}
                              alt={user.fullName}
                            />
                            <AvatarFallback>
                              {user.fullName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium">{user.fullName}</span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="text-center">
                        {user.lastLogin
                          ? formatDistanceToNow(new Date(user.lastLogin), {
                              addSuffix: true,
                            })
                          : 'Never'}
                      </TableCell>
                       <TableCell className="text-center">{user.loginCount || 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                            <Link href={`/admin/users/${user.id}`}>
                               <Button variant="outline" size="icon" className="h-8 w-8">
                                    <Eye className="h-4 w-4" />
                                </Button>
                            </Link>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleEditClick(user)}>
                                <Pencil className="h-4 w-4 text-blue-500" />
                            </Button>
                            <Button variant="outline" size="icon" className="h-8 w-8 border-destructive/50 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDeleteClick(user)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground"
                    >
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      
      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit User: {selectedUser?.fullName}</DialogTitle>
                    <DialogDescription>
                        Modify the user's details below.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-name" className="text-right">
                            Full Name
                        </Label>
                        <Input
                            id="edit-name"
                            value={editedFullName}
                            onChange={(e) => setEditedFullName(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-email" className="text-right">
                            Email
                        </Label>
                        <Input
                            id="edit-email"
                            value={editedEmail}
                            onChange={(e) => setEditedEmail(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button type="button" onClick={handleSaveChanges}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        {/* Delete User Alert Dialog */}
         <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the account for 
                        <span className="font-bold"> {selectedUser?.fullName} </span> 
                        and remove all of their data from the application.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setSelectedUser(null)}>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={handleDeleteConfirm}>Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>

    </AppLayout>
  );
}

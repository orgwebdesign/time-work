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
import { Eye } from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [isClient, setIsClient] = useState(false);

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
      const allUsers: User[] = JSON.parse(
        localStorage.getItem('taskmaster-users') || '[]'
      );
      // Filter out the admin user from the main list
      setUsers(allUsers.filter(u => u.email !== 'admin@admin.com'));
    } catch (error) {
      console.error('Failed to load user data:', error);
      router.push('/login');
    }
  }, [router]);

  if (!isClient) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <AppLayout>
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Admin Dashboard</h2>
        </div>
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
                        <Link href={`/admin/users/${user.id}`}>
                           <Button variant="outline" size="sm">
                                <Eye className="mr-2 h-4 w-4" />
                                Review
                            </Button>
                        </Link>
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
    </AppLayout>
  );
}

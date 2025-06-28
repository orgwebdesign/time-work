
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Users, Activity, ListChecks, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import type { User, Task, Report } from '@/lib/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { format, formatDistanceToNow } from 'date-fns';

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [totalTasks, setTotalTasks] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [reports, setReports] = useState<Report[]>([]);
  const [isClient, setIsClient] = useState(false);

  // Effect to run on client mount
  useEffect(() => {
    setIsClient(true);
    try {
      // Load initial data from localStorage
      const storedUsers = localStorage.getItem('taskmaster-users');
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      }
      const storedReports = localStorage.getItem('taskmaster-reports');
      if (storedReports) {
        setReports(JSON.parse(storedReports));
      }
    } catch (error) {
      console.error('Failed to load initial data from localStorage', error);
    }
  }, []);
  
  // Effect to recalculate stats when users list changes
  useEffect(() => {
    if (!isClient) return;

    const clientUsers = users.filter(user => user.email !== 'admin@example.com');
    const sessions = clientUsers.reduce((sum, user) => sum + (user.loginCount || 0), 0);
    setTotalSessions(sessions);

    let allTasksCount = 0;
    users.forEach(user => {
      const userTasksKey = `taskmaster-tasks-${user.id}`;
      const storedTasks = localStorage.getItem(userTasksKey);
      if (storedTasks) {
        try {
          const userTasks: Task[] = JSON.parse(storedTasks);
          allTasksCount += userTasks.length;
        } catch (e) {
          console.error(`Failed to parse tasks for user ${user.id}`, e);
        }
      }
    });
    setTotalTasks(allTasksCount);
  }, [users, isClient]);

  const handleDeleteUser = (userId: string) => {
    if (window.confirm('Are you sure you want to permanently delete this user and all their data? This action cannot be undone.')) {
      try {
        const updatedUsers = users.filter((u) => u.id !== userId);
        setUsers(updatedUsers); // This will trigger the useEffect to recalculate stats
        
        localStorage.setItem('taskmaster-users', JSON.stringify(updatedUsers));
        localStorage.removeItem(`taskmaster-lists-${userId}`);
        localStorage.removeItem(`taskmaster-tasks-${userId}`);
        localStorage.removeItem(`taskmaster-selectedListId-${userId}`);
        
      } catch (error) {
        console.error('Failed to delete user:', error);
        alert('An error occurred while trying to delete the user.');
      }
    }
  };

  const handleDeleteReport = (reportId: string) => {
    if (window.confirm('Are you sure you want to delete this issue report?')) {
      try {
        const updatedReports = reports.filter(r => r.id !== reportId);
        setReports(updatedReports);
        localStorage.setItem('taskmaster-reports', JSON.stringify(updatedReports));
      } catch (error) {
        console.error('Failed to delete report:', error);
        alert('An error occurred while deleting the report.');
      }
    }
  };

  if (!isClient) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <p>Loading Admin Dashboard...</p>
      </div>
    );
  }
  
  const clientUsers = users.filter(user => user.email !== 'admin@example.com');
  const adminUsers = users.filter(user => user.email === 'admin@example.com');

  return (
    <div className="flex min-h-screen w-full flex-col items-center bg-background p-4 md:p-6 gap-6">
      <header className="w-full max-w-7xl">
        <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4">
            <div className="flex items-center gap-4">
                <Button asChild variant="ghost" size="icon">
                  <Link href="/app" aria-label="Go back to app">
                    <ArrowLeft />
                  </Link>
                </Button>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">Admin Dashboard</h1>
                  <p className="text-muted-foreground">
                    Overview of your application's usage and users.
                  </p>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <Button asChild>
                  <Link href="/app">Go to App</Link>
                </Button>
              </div>
        </div>
      </header>

      <main className="w-full max-w-7xl grid gap-6">
        <section>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Client Users</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clientUsers.length}</div>
                <p className="text-xs text-muted-foreground">Excludes administrator account</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalSessions}</div>
                <p className="text-xs text-muted-foreground">Total app loads by clients</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tasks Created</CardTitle>
                <ListChecks className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalTasks}</div>
                <p className="text-xs text-muted-foreground">Total tasks across all lists</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Client Accounts</CardTitle>
            <CardDescription>
              Detailed list of all client user accounts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden md:table-cell">Password</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-center">Sessions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientUsers.length > 0 ? (
                  clientUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {user.fullName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium">{user.fullName}</span>
                            <p className="text-xs text-muted-foreground">Joined {format(new Date(user.createdAt), 'PPP')}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="hidden md:table-cell">{user.password}</TableCell>
                      <TableCell>
                        {user.lastLogin ? `${formatDistanceToNow(new Date(user.lastLogin))} ago` : 'Never'}
                      </TableCell>
                      <TableCell className="text-center">
                        {user.loginCount || 0}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                           <Button asChild variant="outline" size="sm">
                                <Link href={`/admin/users/${user.id}`}>
                                    Review
                                </Link>
                            </Button>
                            <Button variant="destructive" size="icon" onClick={() => handleDeleteUser(user.id)} aria-label={`Delete user ${user.fullName}`}>
                              <Trash2 className="h-4 w-4"/>
                              <span className="sr-only">Delete User</span>
                            </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      No client users have signed up yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Admin Accounts</CardTitle>
            <CardDescription>
              List of administrator accounts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="hidden md:table-cell">Password</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead className="text-center">Sessions</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {adminUsers.length > 0 ? (
                  adminUsers.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarFallback>
                              {user.fullName
                                .split(' ')
                                .map((n) => n[0])
                                .join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="font-medium">{user.fullName}</span>
                            <p className="text-xs text-muted-foreground">Joined {format(new Date(user.createdAt), 'PPP')}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell className="hidden md:table-cell">{user.password}</TableCell>
                      <TableCell>
                        {user.lastLogin ? `${formatDistanceToNow(new Date(user.lastLogin))} ago` : 'Never'}
                      </TableCell>
                      <TableCell className="text-center">
                        {user.loginCount || 0}
                      </TableCell>
                      <TableCell className="text-right">
                         <div className="flex items-center justify-end gap-2">
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/admin/users/${user.id}`}>
                                    Review
                                </Link>
                            </Button>
                            <Button variant="destructive" size="icon" onClick={() => handleDeleteUser(user.id)} aria-label={`Delete user ${user.fullName}`}>
                              <Trash2 className="h-4 w-4"/>
                              <span className="sr-only">Delete User</span>
                            </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      No admin users found. This is unexpected.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Issue Reports</CardTitle>
            <CardDescription>
              User-submitted issue reports and feedback.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Subject & Description</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reports.length > 0 ? (
                  reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>
                        <div className="font-medium">{report.userFullName}</div>
                        <div className="text-xs text-muted-foreground">{report.userEmail}</div>
                      </TableCell>
                      <TableCell>
                         <p className="font-medium">{report.subject}</p>
                         <p className="text-muted-foreground text-xs max-w-sm truncate" title={report.description}>{report.description}</p>
                      </TableCell>
                      <TableCell>
                        {formatDistanceToNow(new Date(report.createdAt), { addSuffix: true })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="destructive" size="icon" onClick={() => handleDeleteReport(report.id)} aria-label={`Delete report from ${report.userFullName}`}>
                          <Trash2 className="h-4 w-4"/>
                          <span className="sr-only">Delete Report</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No issue reports have been submitted.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}

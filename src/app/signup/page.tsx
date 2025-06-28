'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
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
import { Logo } from '@/components/logo';
import type { User } from '@/lib/types';

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !password) {
      alert('Please fill in all fields.');
      return;
    }

    const newUser: User = {
      id: crypto.randomUUID(),
      fullName,
      email,
      createdAt: new Date().toISOString(),
    };

    try {
      const storedUsers = localStorage.getItem('taskmaster-users');
      const users: User[] = storedUsers ? JSON.parse(storedUsers) : [];
      
      if (users.find(u => u.email === email)) {
        alert('An account with this email already exists.');
        return;
      }

      users.push(newUser);
      localStorage.setItem('taskmaster-users', JSON.stringify(users));
      localStorage.setItem('taskmaster-currentUser', JSON.stringify(newUser));

      router.push('/app');
    } catch (error) {
      console.error('Failed to create account:', error);
      alert('An error occurred while creating your account. Please try again.');
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background p-4 md:p-6">
      <Card className="mx-auto max-w-sm">
        <CardHeader>
           <div className="flex justify-center mb-4">
            <Logo />
          </div>
          <CardTitle className="text-2xl text-center">Sign Up</CardTitle>
          <CardDescription className="text-center">
            Enter your information to create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                  <Label htmlFor="full-name">Full name</Label>
                  <Input
                    id="full-name"
                    placeholder="John Doe"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <Button type="submit" className="w-full">
                Create an account
              </Button>
              <Button variant="outline" className="w-full" type="button">
                Sign up with Google
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Already have an account?{' '}
            <Link href="/login" className="underline">
              Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

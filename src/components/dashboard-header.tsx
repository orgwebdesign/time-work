'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Crown, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function DashboardHeader({ title }: { title: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const userString = localStorage.getItem('taskmaster-currentUser');
    if (userString) {
      setUser(JSON.parse(userString));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('taskmaster-currentUser');
    toast({
        title: "Logged Out",
        description: "You have been successfully logged out."
    });
    router.push('/login');
  };

  const greeting = useMemo(() => {
    if (!user) return null;

    if (user.email === 'admin@admin.com') {
      return (
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-primary">Bonjour Skhoun Lktaf, Admin!</h2>
          <Crown className="w-5 h-5 text-yellow-400" />
        </div>
      );
    }
    return (
      <h2 className="text-lg font-semibold text-primary">Bonjour Skhoun Lktaf, {user.fullName}! 👋</h2>
    );
  }, [user]);

  return (
    <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4">
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
      <div className="flex items-center gap-4">
        {greeting}
        <Button onClick={handleLogout} variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from './ui/skeleton';
import type { User, Weather } from '@/lib/types';
import { ReactNode, useMemo } from 'react';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { Crown, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface WeatherDisplayProps {
  user: User | null;
  weather: Weather | null;
  time: Date | null;
  timerControls: React.ReactNode;
  children?: ReactNode;
  isFocusMode?: boolean;
}

export default function WeatherDisplay({ user, weather, time, timerControls, children, isFocusMode }: WeatherDisplayProps) {
  const { toast } = useToast();
  const router = useRouter();
  
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

  if (!time || !weather) {
      return (
          <Card className="glass-card">
            <CardContent className="p-4">
                <div className="flex justify-between items-center">
                    <div>
                        <Skeleton className="h-10 w-24 mb-1" />
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-40 mt-1" />
                    </div>
                    <div className="flex items-center gap-4">
                       <Skeleton className="h-10 w-12" />
                        <div className="text-center">
                            <Skeleton className="size-10 rounded-full mx-auto" />
                            <Skeleton className="h-3 w-10 mt-1 mx-auto" />
                        </div>
                    </div>
                </div>
            </CardContent>
          </Card>
      )
  }

  const WeatherIcon = weather.icon;
  const timeString = time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const timeParts = timeString.split(':');
  const dateString = format(time, 'EEEE, d MMMM yyyy');


  return (
    <Card className="glass-card">
      <CardContent className="p-4 flex flex-col gap-4">
        <div className="flex flex-wrap justify-between items-center gap-x-4 gap-y-2">
            {greeting}
            <Button onClick={handleLogout} variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
                <LogOut className="h-4 w-4" />
            </Button>
        </div>
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-3xl sm:text-4xl font-bold tracking-tighter flex items-baseline">
                <span>{timeParts[0]}</span>
                <span className="relative -top-px mx-px">:</span>
                <span>{timeParts[1]}</span>
              </p>
              <p className="text-muted-foreground">{weather.location}</p>
              <p className="text-sm mt-1">{dateString}</p>
            </div>
            {!isFocusMode && (
                <div className="flex items-center gap-4">
                <p className="text-3xl sm:text-4xl font-bold tracking-tighter">{weather.temperature}°C</p>
                <div className="text-center">
                    <WeatherIcon className="size-8 sm:size-10 text-foreground animate-gentle-float" />
                    <p className="text-xs text-muted-foreground">{weather.condition}</p>
                </div>
                </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div>
             {isFocusMode ? children : timerControls}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

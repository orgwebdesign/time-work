
"use client";

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from './ui/skeleton';
import type { Weather } from '@/lib/types';
import { ReactNode } from 'react';
import { format } from 'date-fns';
import { Button } from './ui/button';
import { LogOut } from 'lucide-react';

interface WeatherDisplayProps {
  weather: Weather | null;
  time: Date | null;
  timerControls: React.ReactNode;
  children?: ReactNode;
  isFocusMode?: boolean;
  onLogout?: () => void;
}

export default function WeatherDisplay({ weather, time, timerControls, children, isFocusMode, onLogout }: WeatherDisplayProps) {
  
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
      <CardContent className="p-4">
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
            {onLogout && (
              <Button onClick={onLogout} variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground">
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

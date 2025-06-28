"use client";

import { useState, useEffect } from 'react';
import { Sun } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from './ui/skeleton';

export default function WeatherDisplay() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timerId = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timerId);
  }, []);

  const weather = {
    location: "Marrakech, Morocco",
    temperature: "28",
    condition: "Sunny",
  };
  
  if (!time) {
      return (
          <Card className="glass-card w-full">
            <CardContent className="p-4">
                <div className="flex justify-between items-center">
                    <div>
                        <Skeleton className="h-10 w-24 mb-1" />
                        <Skeleton className="h-4 w-32" />
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

  return (
    <Card className="glass-card w-full">
      <CardContent className="p-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-4xl font-bold tracking-tighter">
              {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-muted-foreground">{weather.location}</p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-4xl font-bold tracking-tighter">{weather.temperature}°C</p>
            <div className="text-center">
              <Sun className="size-10 text-yellow-400 animate-spin-slow" />
              <p className="text-xs text-muted-foreground">{weather.condition}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

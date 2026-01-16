
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Droplet, Minus, Plus } from 'lucide-react';
import { format } from 'date-fns';

const DAILY_GOAL = 8;

const getTodayKey = () => `water-intake-${format(new Date(), 'yyyy-MM-dd')}`;

export function WaterIntakeTracker() {
  const [count, setCount] = useState(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const storedData = localStorage.getItem(getTodayKey());
      if (storedData) {
        setCount(parseInt(storedData, 10));
      }
    } catch (error) {
      console.error('Failed to load water intake data from localStorage', error);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      try {
        localStorage.setItem(getTodayKey(), count.toString());
      } catch (error) {
        console.error('Failed to save water intake data to localStorage', error);
      }
    }
  }, [count, isClient]);

  const handleIncrement = () => {
    setCount(prev => prev + 1);
  };

  const handleDecrement = () => {
    setCount(prev => (prev > 0 ? prev - 1 : 0));
  };

  const progressPercentage = useMemo(() => {
    if (DAILY_GOAL === 0) return 0;
    return Math.min((count / DAILY_GOAL) * 100, 100);
  }, [count]);

  if (!isClient) {
    return null;
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-sm font-medium uppercase text-muted-foreground flex items-center gap-2">
          <Droplet className="text-blue-400" />
          Water Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center gap-4 text-center cursor-pointer" onClick={handleIncrement}>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-full shrink-0" onClick={(e) => { e.stopPropagation(); handleDecrement(); }}>
                <Minus className="h-4 w-4" />
            </Button>
            <div className="flex items-baseline gap-2">
                <span className="text-4xl font-bold">{count}</span>
                <span className="text-lg text-muted-foreground">/ {DAILY_GOAL} Glasses</span>
            </div>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-full shrink-0" onClick={(e) => { e.stopPropagation(); handleIncrement(); }}>
                <Plus className="h-4 w-4" />
            </Button>
        </div>
         <div className="space-y-2">
             <Progress value={progressPercentage} className="h-2 [&>div]:bg-blue-400" />
             <p className="text-xs text-center text-muted-foreground">
                {count >= DAILY_GOAL ? "Goal achieved! 🎉" : `${DAILY_GOAL - count > 0 ? `${DAILY_GOAL - count} glasses to go.` : "Let's start hydrating!"}`}
            </p>
         </div>
      </CardContent>
    </Card>
  );
}

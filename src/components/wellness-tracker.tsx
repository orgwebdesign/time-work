
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ProgressRing } from '@/components/progress-ring';
import { Bed, Brain, Footprints, Utensils, PersonStanding, Hand } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const wellnessHabits = [
  { id: 'pray', label: 'Pray', Icon: Hand },
  { id: 'eat', label: 'Eat', Icon: Utensils },
  { id: 'rest', label: 'Rest', Icon: Brain },
  { id: 'work', label: 'Work', Icon: PersonStanding },
  { id: 'walk', label: 'Walk', Icon: Footprints },
  { id: 'sleep', label: 'Sleep', Icon: Bed },
];

const getTodayKey = () => `wellness-score-${format(new Date(), 'yyyy-MM-dd')}`;

export default function WellnessTracker() {
  const [checkedHabits, setCheckedHabits] = useState<Record<string, boolean>>({});
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    try {
      const storedData = localStorage.getItem(getTodayKey());
      if (storedData) {
        setCheckedHabits(JSON.parse(storedData));
      }
    } catch (error) {
      console.error('Failed to load wellness data from localStorage', error);
    }
  }, []);

  useEffect(() => {
    if (isClient) {
      try {
        localStorage.setItem(getTodayKey(), JSON.stringify(checkedHabits));
      } catch (error) {
        console.error('Failed to save wellness data to localStorage', error);
      }
    }
  }, [checkedHabits, isClient]);

  const handleCheckedChange = (habitId: string, isChecked: boolean) => {
    setCheckedHabits(prev => ({ ...prev, [habitId]: isChecked }));
  };

  const completionPercentage = useMemo(() => {
    const totalHabits = wellnessHabits.length;
    const completedCount = Object.values(checkedHabits).filter(Boolean).length;
    if (totalHabits === 0) return 0;
    return Math.round((completedCount / totalHabits) * 100);
  }, [checkedHabits]);

  const feedback = useMemo(() => {
    if (completionPercentage === 100) {
      return { message: "Perfect Day! You're on fire!", emoji: '🏆' };
    }
    if (completionPercentage >= 50) {
      return { message: 'Good progress! Keep going.', emoji: '💪' };
    }
    return { message: 'Tomorrow is a new chance to do better.', emoji: '🌙' };
  }, [completionPercentage]);

  if (!isClient) {
    return null; // Or a skeleton loader
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-sm font-medium uppercase text-muted-foreground">
          Daily Wellness Score
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-center gap-8">
            <div className="relative">
                <ProgressRing value={completionPercentage} strokeWidth={8} className="h-28 w-28" />
                <div className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
                    {`${completionPercentage}%`}
                </div>
            </div>
            <div className="space-y-2 flex-1">
                {wellnessHabits.map(({ id, label, Icon }) => (
                    <div key={id} className="flex items-center gap-3">
                        <Checkbox
                            id={`wellness-${id}`}
                            checked={!!checkedHabits[id]}
                            onCheckedChange={(checked) => handleCheckedChange(id, !!checked)}
                        />
                        <Label htmlFor={`wellness-${id}`} className="flex items-center gap-2 text-sm font-medium cursor-pointer">
                            <Icon className="w-4 h-4 text-muted-foreground" />
                            {label}
                        </Label>
                    </div>
                ))}
            </div>
        </div>
        <div className="text-center p-3 bg-muted/50 rounded-lg">
            <span className="text-2xl mr-2">{feedback.emoji}</span>
            <span className="text-sm font-medium text-muted-foreground">{feedback.message}</span>
        </div>
      </CardContent>
    </Card>
  );
}

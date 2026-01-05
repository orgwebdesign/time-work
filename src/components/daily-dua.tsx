
'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import duas from '@/lib/duas.json';
import { getDayOfYear } from 'date-fns';

interface Dua {
  arabic: string;
  transliteration: string;
  translation: string;
}

export function DailyDua() {
  const [dailyDua, setDailyDua] = useState<Dua | null>(null);

  useEffect(() => {
    const dayIndex = getDayOfYear(new Date());
    const duaIndex = dayIndex % duas.length;
    setDailyDua(duas[duaIndex]);
  }, []);

  if (!dailyDua) {
    return null;
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle className="text-sm font-medium uppercase text-muted-foreground flex items-center gap-2">
          <BookOpen />
          Daily Supplication
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p className="text-xl font-bold" dir="rtl">{dailyDua.arabic}</p>
        <p className="text-sm text-muted-foreground italic">{dailyDua.transliteration}</p>
        <p className="text-sm">"{dailyDua.translation}"</p>
      </CardContent>
    </Card>
  );
}

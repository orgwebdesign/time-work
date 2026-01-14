
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sunrise, Sun, Sunset, Moon, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInSeconds, parse } from 'date-fns';

interface PrayerTime {
  name: string;
  time: string;
}

const prayerOrder: { [key: string]: number } = {
  Fajr: 1,
  Dhuhr: 2,
  Asr: 3,
  Maghrib: 4,
  Isha: 5,
};

const prayerIcons: { [key: string]: React.ElementType } = {
  Fajr: Sunrise,
  Dhuhr: Sun,
  Asr: Sunset,
  Maghrib: Moon,
  Isha: Sparkles,
};

export default function PrayerTimes() {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activePrayer, setActivePrayer] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrayerTimes() {
      try {
        const response = await fetch('http://api.aladhan.com/v1/timingsByCity?city=Marrakech&country=Morocco&method=2');
        if (!response.ok) {
          throw new Error('Failed to fetch prayer times');
        }
        const data = await response.json();
        const timings = data.data.timings;
        const relevantPrayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
        const formattedTimes = relevantPrayers
          .map(name => ({
            name,
            time: timings[name].split(' ')[0], // "05:48 (CET)" -> "05:48"
          }))
          .sort((a, b) => prayerOrder[a.name] - prayerOrder[b.name]);
        
        setPrayerTimes(formattedTimes);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchPrayerTimes();
  }, []);

  useEffect(() => {
    if (prayerTimes.length === 0) return;

    const intervalId = setInterval(() => {
      const now = new Date();
      let currentActivePrayer = null;

      prayerTimes.forEach(prayer => {
        const prayerTime = parse(prayer.time, 'HH:mm', new Date());
        const diff = differenceInSeconds(now, prayerTime);
        
        // If the prayer time is within the last 5 minutes
        if (diff >= 0 && diff < 300) { // 5 minutes * 60 seconds
          currentActivePrayer = prayer.name;
        }
      });

      setActivePrayer(currentActivePrayer);
    }, 1000); // Check every second

    return () => clearInterval(intervalId);
  }, [prayerTimes]);

  if (loading) {
    return (
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Prayer Times</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
        <Card className="glass-card">
            <CardHeader>
            <CardTitle>Prayer Times</CardTitle>
            </CardHeader>
            <CardContent>
            <p className="text-destructive text-center">{error}</p>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Prayer Times - Marrakech</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          {prayerTimes.map(prayer => {
            const Icon = prayerIcons[prayer.name];
            const isActive = activePrayer === prayer.name;
            return (
              <div
                key={prayer.name}
                className={cn(
                  "p-4 rounded-lg border border-transparent transition-all",
                  isActive && "animate-alarm-flash border-primary"
                )}
              >
                <Icon className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
                <p className="font-semibold">{prayer.name}</p>
                <p className="text-lg font-bold text-primary">{prayer.time}</p>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

    
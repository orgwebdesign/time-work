
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

// Fallback data in case the API fails
const fallbackPrayerTimes: PrayerTime[] = [
    { name: 'Fajr', time: '05:30' },
    { name: 'Dhuhr', time: '13:30' },
    { name: 'Asr', time: '17:00' },
    { name: 'Maghrib', time: '19:45' },
    { name: 'Isha', time: '21:00' },
];

export default function PrayerTimes() {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePrayer, setActivePrayer] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPrayerTimes() {
      try {
        const response = await fetch('http://api.aladhan.com/v1/timingsByCity?city=Marrakech&country=Morocco&method=2');
        if (!response.ok) {
          throw new Error('Failed to fetch prayer times, using fallback.');
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
        console.warn(err.message);
        setPrayerTimes(fallbackPrayerTimes); // Set fallback data on error
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
      let currentActivePrayer: string | null = null;
      let nextPrayerTime: Date | null = null;

      // Find the next upcoming prayer
      for (const prayer of prayerTimes) {
          const prayerTime = parse(prayer.time, 'HH:mm', now);
          if (prayerTime > now) {
              nextPrayerTime = prayerTime;
              break;
          }
      }
      
      // If no upcoming prayer today, the next one is Fajr tomorrow
      if (!nextPrayerTime) {
          const fajrTomorrow = parse(prayerTimes[0].time, 'HH:mm', new Date(now.getTime() + 24 * 60 * 60 * 1000));
          nextPrayerTime = fajrTomorrow;
      }
      
      // Determine the current prayer based on the time since the last prayer
      let lastPrayerTime: Date | null = null;
      let lastPrayerName: string | null = null;

      [...prayerTimes].reverse().forEach(p => {
          const pTime = parse(p.time, 'HH:mm', now);
          if (pTime <= now && !lastPrayerTime) {
              lastPrayerTime = pTime;
              lastPrayerName = p.name;
          }
      });
      
      // If it's before Fajr
      if (!lastPrayerTime) {
          const ishaYesterday = parse(prayerTimes[4].time, 'HH:mm', new Date(now.getTime() - 24 * 60 * 60 * 1000));
          lastPrayerTime = ishaYesterday;
          lastPrayerName = prayerTimes[4].name;
      }

      if (lastPrayerTime && lastPrayerName) {
        const diff = differenceInSeconds(now, lastPrayerTime);
        // Activate glow for 5 minutes after prayer time starts
        if (diff >= 0 && diff < 300) { // 5 minutes * 60 seconds
          currentActivePrayer = lastPrayerName;
        }
      }

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

  return (
    <Card className="glass-card">
      <CardHeader>
        <CardTitle>Prayer Times - Marrakech</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4 text-center">
          {prayerTimes.map(prayer => {
            const Icon = prayerIcons[prayer.name];
            const isActive = activePrayer === prayer.name;
            return (
              <div
                key={prayer.name}
                className={cn(
                  "p-4 rounded-lg border border-transparent transition-all",
                  isActive && "animate-alarm-flash border-primary bg-primary/10"
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

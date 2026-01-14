
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Sunrise, Sun, Sunset, Moon, Sparkles, MapPin, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { differenceInSeconds, parse, addDays } from 'date-fns';

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

const formatCountdown = (totalSeconds: number) => {
    if (totalSeconds < 0) totalSeconds = 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
};

export default function PrayerTimes() {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [loading, setLoading] = useState(true);
  const [activePrayer, setActivePrayer] = useState<string | null>(null);
  const [locationName, setLocationName] = useState('Marrakech, Morocco');
  const [isLocationEnabled, setIsLocationEnabled] = useState(false);
  const [nextPrayerName, setNextPrayerName] = useState<string | null>(null);
  const [nextPrayerCountdown, setNextPrayerCountdown] = useState<number | null>(null);

  useEffect(() => {
    async function fetchPrayerTimesByCity() {
      await fetchPrayerTimes('https://api.aladhan.com/v1/timingsByCity?city=Marrakech&country=Morocco&method=3');
      setLocationName('Marrakech, Morocco');
      setIsLocationEnabled(false);
    }
    
    async function fetchPrayerTimesByCoords(lat: number, lon: number) {
      await fetchPrayerTimes(`https://api.aladhan.com/v1/timings?latitude=${lat}&longitude=${lon}&method=3`);
      try {
        const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`);
        const data = await response.json();
        setLocationName(data.city || 'Your Location');
        setIsLocationEnabled(true);
      } catch {
        setLocationName('Your Location');
        setIsLocationEnabled(true);
      }
    }

    async function fetchPrayerTimes(url: string) {
      setLoading(true);
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error('Failed to fetch prayer times, using fallback.');
        }
        const data = await response.json();
        const timings = data.data.timings;
        const relevantPrayers = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
        const formattedTimes = relevantPrayers
          .map(name => ({
            name,
            time: timings[name].split(' ')[0],
          }))
          .sort((a, b) => prayerOrder[a.name] - prayerOrder[b.name]);
        
        setPrayerTimes(formattedTimes);
      } catch (err: any) {
        console.warn(err.message);
        setPrayerTimes(fallbackPrayerTimes);
      } finally {
        setLoading(false);
      }
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          fetchPrayerTimesByCoords(position.coords.latitude, position.coords.longitude);
        },
        () => {
          // User denied or error occurred, fetch for default city
          fetchPrayerTimesByCity();
        }
      );
    } else {
      // Geolocation not supported
      fetchPrayerTimesByCity();
    }
    
  }, []);

  useEffect(() => {
    if (prayerTimes.length === 0) return;

    const intervalId = setInterval(() => {
      const now = new Date();
      
      // Find the next prayer
      let nextPrayer = null;
      for (const p of prayerTimes) {
          const pTime = parse(p.time, 'HH:mm', now);
          if (pTime > now) {
              nextPrayer = p;
              break;
          }
      }
      
      // If no prayer is left for today, the next one is Fajr tomorrow
      if (!nextPrayer) {
          nextPrayer = prayerTimes[0]; // Fajr
          const fajrTimeTomorrow = addDays(parse(nextPrayer.time, 'HH:mm', now), 1);
          setNextPrayerCountdown(differenceInSeconds(fajrTimeTomorrow, now));
      } else {
          const nextPrayerTime = parse(nextPrayer.time, 'HH:mm', now);
          setNextPrayerCountdown(differenceInSeconds(nextPrayerTime, now));
      }
      setNextPrayerName(nextPrayer.name);

      // Check for active prayer (within 5 minutes of its time)
      let currentActivePrayer: string | null = null;
      prayerTimes.forEach(p => {
          const pTime = parse(p.time, 'HH:mm', now);
          const diff = differenceInSeconds(now, pTime);
          if (diff >= 0 && diff < 300) { // 5 minutes * 60 seconds
            currentActivePrayer = p.name;
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
           <CardTitle className="flex items-center gap-2">
            Prayer Times - <Skeleton className="h-5 w-32" />
          </CardTitle>
           <Skeleton className="h-4 w-48" />
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
        <CardTitle className="flex items-center gap-2">
            <MapPin className={cn("w-5 h-5 text-muted-foreground", isLocationEnabled && "text-blue-500")} />
            Prayer Times - {locationName}
        </CardTitle>
        {nextPrayerName && nextPrayerCountdown !== null && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
                <Clock className="h-4 w-4" />
                <span>Next: <strong>{nextPrayerName}</strong> in {formatCountdown(nextPrayerCountdown)}</span>
            </div>
        )}
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

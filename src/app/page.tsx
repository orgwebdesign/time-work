
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ArrowUp, BarChart3, Calendar, CheckCircle, Clock, Coffee, Hourglass, Pause, Play, Square, Target } from 'lucide-react';
import { add, format, differenceInSeconds } from 'date-fns';

type TimerStatus = 'stopped' | 'running' | 'paused';

interface DailyLog {
  date: string;
  workedSeconds: number;
  pauseSeconds: number;
}

const REQUIRED_HOURS_PER_DAY = 8.5;

// --- Helper Functions ---
const formatSeconds = (seconds: number, showSign = false): string => {
  if (isNaN(seconds)) seconds = 0;
  const sign = seconds < 0 ? '-' : (showSign ? '+' : '');
  const absSeconds = Math.abs(seconds);
  const h = Math.floor(absSeconds / 3600);
  const m = Math.floor((absSeconds % 3600) / 60);
  return `${sign}${h}h ${m}m`;
};

const getTodayKey = () => format(new Date(), 'yyyy-MM-dd');

export default function WorkHoursTracker() {
  const [isClient, setIsClient] = useState(false);
  const [logSaved, setLogSaved] = useState(false);
  
  // Time tracking state
  const [status, setStatus] = useState<TimerStatus>('stopped');
  const [workedSeconds, setWorkedSeconds] = useState(0);
  const [pauseSeconds, setPauseSeconds] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [pauseTime, setPauseTime] = useState<Date | null>(null);

  // Load data from localStorage
  useEffect(() => {
    setIsClient(true);
    const todayKey = getTodayKey();
    const storedLog = localStorage.getItem(`worklog-${todayKey}`);
    if (storedLog) {
      const data: DailyLog = JSON.parse(storedLog);
      setWorkedSeconds(data.workedSeconds || 0);
      setPauseSeconds(data.pauseSeconds || 0);
    }
  }, []);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (!isClient) return;
    const todayKey = getTodayKey();
    const log: DailyLog = { date: todayKey, workedSeconds, pauseSeconds };
    localStorage.setItem(`worklog-${todayKey}`, JSON.stringify(log));
  }, [workedSeconds, pauseSeconds, isClient]);

  // The main timer loop
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    if (status === 'running') {
      intervalId = setInterval(() => {
        if (startTime) {
          setWorkedSeconds(differenceInSeconds(new Date(), startTime));
        }
      }, 1000);
    } else if (status === 'paused') {
      intervalId = setInterval(() => {
        if (pauseTime) {
          const currentPauseDuration = differenceInSeconds(new Date(), pauseTime);
          // We don't add to pauseSeconds here to avoid feedback loop
        }
      }, 1000);
    }
    
    return () => clearInterval(intervalId);
  }, [status, startTime, pauseTime]);

  const handleStart = () => {
    const now = new Date();
    setStartTime(now);
    setWorkedSeconds(0);
    setPauseSeconds(0);
    setStatus('running');
    setLogSaved(false);
  };
  
  const handlePause = () => {
    if (status !== 'running' || !startTime) return;
    const now = new Date();
    const elapsed = differenceInSeconds(now, startTime);
    setWorkedSeconds(elapsed);
    setPauseTime(now);
    setStatus('paused');
  };

  const handleResume = () => {
    if (status !== 'paused' || !startTime || !pauseTime) return;
    const now = new Date();
    const pauseDuration = differenceInSeconds(now, pauseTime);
    setPauseSeconds(prev => prev + pauseDuration);
    // Adjust start time to account for the pause, so the worked duration calculation remains correct
    setStartTime(prevStartTime => prevStartTime ? add(prevStartTime, { seconds: pauseDuration }) : null);
    setPauseTime(null);
    setStatus('running');
  };

  const handleStop = () => {
    if (status === 'stopped' || !startTime) return;

    if (status === 'running') {
      const now = new Date();
      setWorkedSeconds(differenceInSeconds(now, startTime));
    }
    // If paused, workedSeconds is already up-to-date.
    
    setStatus('stopped');
    setStartTime(null);
    setPauseTime(null);
    setLogSaved(true);
  };
  
  const requiredSecondsToday = REQUIRED_HOURS_PER_DAY * 3600;
  const balanceSecondsToday = workedSeconds - requiredSecondsToday;
  
  const estimatedLeaveTime = useMemo(() => {
    if (status !== 'running' || !startTime) return null;
    const workStartedAt = new Date(startTime); // Start of the entire session
    const totalSecondsNeeded = requiredSecondsToday + pauseSeconds;
    return add(workStartedAt, { seconds: totalSecondsNeeded });
  }, [startTime, pauseSeconds, requiredSecondsToday, status]);

  if (!isClient) {
    return <div className="min-h-screen bg-gray-900" />;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-center">Work Hours</h1>
        </header>

        {logSaved && (
          <Alert className="bg-gray-800 border-gray-700 mb-8">
              <CheckCircle className="h-4 w-4 text-green-400" />
            <AlertTitle className="text-green-400">Log Saved</AlertTitle>
            <AlertDescription>
              Your work session has been successfully recorded.
            </AlertDescription>
          </Alert>
        )}
        
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-around gap-4">
             {status === 'stopped' ? (
                <Button size="lg" className="bg-green-600 hover:bg-green-700 w-full sm:w-auto" onClick={handleStart}>
                    <Play className="mr-2"/>
                    Start Day
                </Button>
            ) : (
                <>
                   {status === 'running' ? (
                        <Button size="lg" variant="outline" className="w-full sm:w-auto text-yellow-400 border-yellow-400 hover:bg-yellow-900/50 hover:text-yellow-300" onClick={handlePause}>
                            <Pause className="mr-2"/>
                            Pause
                        </Button>
                    ) : (
                        <Button size="lg" variant="outline" className="w-full sm:w-auto text-green-400 border-green-400 hover:bg-green-900/50 hover:text-green-300" onClick={handleResume}>
                            <Play className="mr-2"/>
                            Resume
                        </Button>
                    )}
                    <Button size="lg" variant="destructive" className="w-full sm:w-auto" onClick={handleStop}>
                        <Square className="mr-2"/>
                        End Day
                    </Button>
                </>
            )}
          </CardContent>
        </Card>


        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300">Worked Today</span>
              </div>
              <span className={cn('font-semibold')}>{formatSeconds(workedSeconds)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Coffee className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300">Pause of Today</span>
              </div>
              <span className={cn('font-semibold')}>{formatSeconds(pauseSeconds)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300">Required Today</span>
              </div>
              <span className={cn('font-semibold')}>{formatSeconds(requiredSecondsToday)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Hourglass className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300">Balance for Today</span>
              </div>
              <span className={cn('font-semibold', balanceSecondsToday < 0 ? 'text-red-400' : 'text-green-400')}>
                {formatSeconds(balanceSecondsToday, true)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300">Est. Leave Time</span>
              </div>
              <span className={cn('font-semibold', 'text-primary')}>
                {estimatedLeaveTime ? format(estimatedLeaveTime, 'p') : '--:--'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Cumulative Summaries card remains static for now */}
        <Card className="bg-gray-800 border-gray-700 mt-8">
          <CardHeader>
            <div className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-gray-400" />
                <CardTitle>Cumulative Summaries</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between items-baseline">
                <div className="flex items-center gap-2 text-gray-300">
                    <ArrowUp className="w-4 h-4 text-green-400"/>
                    <span>From Past Days (This Month)</span>
                </div>
                <span className="font-bold text-green-400">+4h 32m</span>
              </div>
            </div>
            
            <Separator className="bg-gray-700" />

            <div>
                <div className="flex justify-between items-baseline mb-1">
                    <span className="text-gray-300">Total for Month (To Date)</span>
                    <span className="text-2xl font-bold text-green-400">+3h 39m</span>
                </div>
                <p className="text-xs text-gray-500">
                    (Includes today's balance, past days' balance for this month, and any manual adjustments for this month)
                </p>
            </div>

            <Separator className="bg-gray-700" />

            <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                    <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="w-4 h-4" />
                        <span>This Week</span>
                    </div>
                    <span className="font-semibold text-red-400">15h 25m needed</span>
                </div>
                <div className="flex justify-between items-baseline">
                    <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="w-4 h-4" />
                        <span>This Month</span>
                    </div>
                    <span className="font-semibold text-red-400">37h 51m needed</span>
                </div>
            </div>
          </CardContent>
        </Card>


        <div className="mt-8 flex justify-center">
            <Button asChild variant="outline" className="bg-gray-700 border-gray-600 hover:bg-gray-600">
                <a href="/app">Go to Task Dashboard</a>
            </Button>
        </div>
      </div>
    </div>
  );
}

    
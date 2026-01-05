

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { User, BarChart, Calendar as CalendarIconLucid, CheckCircle, Clock, Coffee, Hourglass, Pause, Play, Square, Target, History, Pencil, PlayCircle, AlarmClock, Award, MoreHorizontal, History as HistoryIcon, Star, CalendarCheck, Utensils, Trash2 } from 'lucide-react';
import { add, format, differenceInSeconds, startOfMonth, eachDayOfInterval, formatISO, parse, getDay, startOfWeek, endOfWeek, startOfDay, endOfDay, isSameDay, isSameMonth, lastDayOfMonth, isWeekend } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ProgressRing } from '@/components/progress-ring';
import Link from 'next/link';
import { DailyDua } from '@/components/daily-dua';
import { ThemeToggle } from '@/components/theme-toggle';

type TimerStatus = 'stopped' | 'running' | 'on_break';

interface DailyLog {
  date: string; // "yyyy-MM-dd" format
  workedSeconds: number;
  pauseSeconds: number;
  startTime?: string; // ISO string
  requiredHours?: number; // Store the required hours for this specific day
}

// --- Helper Functions ---
const formatSeconds = (seconds: number, showSign = false): string => {
  if (isNaN(seconds)) seconds = 0;
  const sign = seconds < 0 ? '-' : (showSign ? '+' : '');
  const absSeconds = Math.abs(seconds);
  const h = Math.floor(absSeconds / 3600);
  const m = Math.floor((absSeconds % 3600) / 60);
  return `${sign}${h.toString().padStart(2, '0')}h ${m.toString().padStart(2, '0')}m`;
};

const getTodayKey = () => format(new Date(), 'yyyy-MM-dd');

const parseTimeToSeconds = (time: string): number => {
    const parts = time.split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return (hours * 3600) + (minutes * 60);
};

const secondsToTime = (seconds: number): string => {
    if (isNaN(seconds) || seconds < 0) seconds = 0;
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

const parseTimeStringToDate = (timeString: string, baseDate: Date = new Date()): Date => {
    if (!timeString || !/^\d{2}:\d{2}$/.test(timeString)) return baseDate;
    const [hours, minutes] = timeString.split(':').map(Number);
    const newDate = new Date(baseDate);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
};

const getDefaultRequiredHours = (date: Date): number => {
  const dayOfWeek = getDay(date); // Sunday is 0, Monday is 1, etc.
  if (dayOfWeek === 5) { // Friday
    return 7.5;
  }
  if (isWeekend(date)) { // Saturday or Sunday
    return 0;
  }
  return 8.5; // Monday - Thursday
};


export default function WorkHoursTracker() {
  const [isClient, setIsClient] = useState(false);
  
  // Time tracking state
  const [status, setStatus] = useState<TimerStatus>('stopped');
  const [workedSeconds, setWorkedSeconds] = useState(0);
  const [pauseSeconds, setPauseSeconds] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [dayStartTime, setDayStartTime] = useState<Date | null>(null);
  const [breakStartTime, setBreakStartTime] = useState<Date | null>(null);
  const [requiredHours, setRequiredHours] = useState(getDefaultRequiredHours(new Date()));
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  // Goal Met Dialog State
  const [isGoalMetDialogOpen, setIsGoalMetDialogOpen] = useState(false);
  const [goalMetToday, setGoalMetToday] = useState(false);

  // History state
  const [history, setHistory] = useState<DailyLog[]>([]);

  // Manual edit state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingField, setEditingField] = useState<'worked' | 'pause' | 'required' | 'start' | null>(null);
  const [editTimeValue, setEditTimeValue] = useState('');

  // History edit state
  const [isHistoryEditModalOpen, setIsHistoryEditModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [editHistoryWorked, setEditHistoryWorked] = useState('');
  const [editHistoryPause, setEditHistoryPause] = useState('');
  const [editHistoryStart, setEditHistoryStart] = useState('');
  
  // Holiday state
  const [holidays, setHolidays] = useState<Date[]>([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());


  const loadAllLogs = useCallback(() => {
    try {
        const allKeys = Object.keys(localStorage).filter(key => key.startsWith('worklog-'));
        const allLogs: DailyLog[] = allKeys.map(key => {
            const logData = localStorage.getItem(key);
            return logData ? JSON.parse(logData) : null;
        }).filter(Boolean);
        setHistory(allLogs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (e) {
        console.error("Failed to load logs from localStorage", e);
    }
  }, []);

  // Load data from localStorage on mount
  useEffect(() => {
    setIsClient(true);
    const todayKey = getTodayKey();
    let todaysRequiredHours = getDefaultRequiredHours(new Date());

    try {
        const storedHolidays = localStorage.getItem('work-holidays');
        if (storedHolidays) {
            setHolidays(JSON.parse(storedHolidays).map((d: string) => new Date(d)));
        }

        const storedLog = localStorage.getItem(`worklog-${todayKey}`);
        
        if (storedLog) {
          const data: DailyLog = JSON.parse(storedLog);
          setWorkedSeconds(data.workedSeconds || 0);
          setPauseSeconds(data.pauseSeconds || 0);
          if (data.startTime) {
            setDayStartTime(new Date(data.startTime));
          }
          if (typeof data.requiredHours === 'number') {
            todaysRequiredHours = data.requiredHours;
          }
        }
        
        const storedGoalMet = localStorage.getItem(`goalMet-${todayKey}`);
        if (storedGoalMet === 'true') {
            setGoalMetToday(true);
        }

    } catch (e) {
        console.error("Failed to parse today's log from localStorage", e);
    }
    setRequiredHours(todaysRequiredHours);

    loadAllLogs();
  }, [loadAllLogs]);
  
  useEffect(() => {
    if (!isClient) return;
    try {
        const isHoliday = holidays.some(h => isSameDay(h, new Date()));
        const isWeekendDay = isWeekend(new Date());

        if (isHoliday || isWeekendDay) {
            setRequiredHours(0);
        } else if (!isHoliday && !isWeekendDay) {
            // If it's not a holiday and not a weekend, set default hours if no custom one is set for the day
            const todayKey = getTodayKey();
            const storedLog = localStorage.getItem(`worklog-${todayKey}`);
            if (storedLog) {
                const data: DailyLog = JSON.parse(storedLog);
                if (typeof data.requiredHours !== 'number') {
                     setRequiredHours(getDefaultRequiredHours(new Date()));
                }
            } else {
                 setRequiredHours(getDefaultRequiredHours(new Date()));
            }
        }
    } catch (e) {
      console.error("Failed to check for holiday/weekend", e);
    }
  }, [holidays, isClient]);


  // Save data to localStorage whenever it changes while stopped
  useEffect(() => {
    if (!isClient || status !== 'stopped') return;

    const todayKey = getTodayKey();
    const log: DailyLog = { 
        date: todayKey, 
        workedSeconds, 
        pauseSeconds,
        startTime: dayStartTime?.toISOString(),
        requiredHours,
    };
    
    try {
        localStorage.setItem(`worklog-${todayKey}`, JSON.stringify(log));

        setHistory(prevHistory => {
            const otherDays = prevHistory.filter(h => h.date !== todayKey);
            return [log, ...otherDays].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });
    } catch(e) {
        console.error("Failed to save log to localStorage", e);
    }
    
  }, [workedSeconds, pauseSeconds, dayStartTime, requiredHours, isClient, status]);

  
  // The main timer loop
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    const updateTimer = () => {
      setCurrentTime(new Date());
    };
    
    updateTimer(); // Initial call to set time immediately
    intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, []);
  
  const currentWorkedSeconds = useMemo(() => {
      if (status === 'running' && sessionStartTime) {
          return workedSeconds + differenceInSeconds(new Date(), sessionStartTime);
      }
      return workedSeconds;
  }, [workedSeconds, sessionStartTime, status, currentTime]);


  const requiredSecondsToday = requiredHours * 3600;

  // Goal Met Check
  useEffect(() => {
      if (currentWorkedSeconds >= requiredSecondsToday && !goalMetToday && requiredSecondsToday > 0) {
        setIsGoalMetDialogOpen(true);
        setGoalMetToday(true);
        const todayKey = getTodayKey();
        localStorage.setItem(`goalMet-${todayKey}`, 'true');
      }
  }, [currentWorkedSeconds, requiredSecondsToday, goalMetToday]);


  const handleStart = () => {
    const now = new Date();
    setSessionStartTime(now);
    if (!dayStartTime) {
      setDayStartTime(now);
    }
    setStatus('running');
  };
  
  const handlePause = () => {
    if (status !== 'running' || !sessionStartTime) return;
    const now = new Date();
    const elapsed = differenceInSeconds(now, sessionStartTime);
    setWorkedSeconds(prev => prev + elapsed);
    setBreakStartTime(now);
    setSessionStartTime(null);
    setStatus('on_break');
  };

  const handleResume = () => {
    if (status !== 'on_break' || !breakStartTime) return;
    const now = new Date();
    const breakDuration = differenceInSeconds(now, breakStartTime);
    setPauseSeconds(prev => prev + breakDuration);
    setSessionStartTime(now);
    setBreakStartTime(null);
    setStatus('running');
  };

  const handleStop = () => {
    if (status === 'stopped') return;

    let finalWorkedSeconds = workedSeconds;
    if (status === 'running' && sessionStartTime) {
      finalWorkedSeconds += differenceInSeconds(new Date(), sessionStartTime);
    }
    setWorkedSeconds(finalWorkedSeconds);
    
    setStatus('stopped');
    setSessionStartTime(null);
    setBreakStartTime(null);
  };

  const handleOpenEditModal = (field: 'worked' | 'pause' | 'required' | 'start') => {
    if (status !== 'stopped') return;
    setEditingField(field);
    if (field === 'required') {
        const hours = Math.floor(requiredHours);
        const minutes = Math.round((requiredHours % 1) * 60);
        setEditTimeValue(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
    } else if (field === 'start') {
        setEditTimeValue(dayStartTime ? format(dayStartTime, 'HH:mm') : '');
    } else if (field === 'worked') {
        setEditTimeValue(secondsToTime(workedSeconds));
    } else if (field === 'pause') {
        setEditTimeValue(secondsToTime(pauseSeconds));
    }
    setIsEditModalOpen(true);
  };
  
  const handleSaveEdit = () => {
    const newSeconds = parseTimeToSeconds(editTimeValue);
    if (editingField === 'worked') {
        setWorkedSeconds(newSeconds);
    } else if (editingField === 'pause') {
        setPauseSeconds(newSeconds);
    } else if (editingField === 'required') {
        const hours = newSeconds / 3600;
        setRequiredHours(hours);
    } else if (editingField === 'start') {
        setDayStartTime(parseTimeStringToDate(editTimeValue, dayStartTime || new Date()));
    }
    setIsEditModalOpen(false);
    setEditingField(null);
  };

  const handleOpenHistoryEditModal = (log: DailyLog) => {
    setEditingLog(log);
    setEditHistoryWorked(secondsToTime(log.workedSeconds));
    setEditHistoryPause(secondsToTime(log.pauseSeconds));
    setEditHistoryStart(log.startTime ? format(new Date(log.startTime), 'HH:mm') : '');
    setIsHistoryEditModalOpen(true);
  };
  
  const handleOpenTodayEditModal = () => {
      const todayLog: DailyLog = {
          date: getTodayKey(),
          workedSeconds,
          pauseSeconds,
          startTime: dayStartTime?.toISOString(),
          requiredHours,
      };
      handleOpenHistoryEditModal(todayLog);
  };

  const handleSaveHistoryEdit = () => {
    if (!editingLog) return;
    
    const updatedLog: DailyLog = {
      ...editingLog,
      workedSeconds: parseTimeToSeconds(editHistoryWorked),
      pauseSeconds: parseTimeToSeconds(editHistoryPause),
      startTime: editHistoryStart ? parseTimeStringToDate(editHistoryStart, new Date(editingLog.date)).toISOString() : undefined,
    };

    localStorage.setItem(`worklog-${editingLog.date}`, JSON.stringify(updatedLog));
    
    const todayKey = getTodayKey();
    if (editingLog.date === todayKey) {
        setWorkedSeconds(updatedLog.workedSeconds);
        setPauseSeconds(updatedLog.pauseSeconds);
        setDayStartTime(updatedLog.startTime ? new Date(updatedLog.startTime) : null);
    }

    loadAllLogs();
    setIsHistoryEditModalOpen(false);
    setEditingLog(null);
  };
  
  const handleDayClick = (day: Date) => {
    if (isWeekend(day)) return; // Prevent clicking on weekends

    const dayKey = format(day, 'yyyy-MM-dd');
    let newHolidays: Date[];
    
    const isAlreadyHoliday = holidays.some(h => isSameDay(h, day));
    
    if (isAlreadyHoliday) {
      newHolidays = holidays.filter(h => !isSameDay(h, day));
    } else {
      newHolidays = [...holidays, day];
    }
    
    setHolidays(newHolidays);
    localStorage.setItem('work-holidays', JSON.stringify(newHolidays.map(d => d.toISOString())));

    // Update or create log for the selected day
    const logKey = `worklog-${dayKey}`;
    const storedLog = localStorage.getItem(logKey);
    const existingLog: DailyLog = storedLog ? JSON.parse(storedLog) : {
      date: dayKey,
      workedSeconds: 0,
      pauseSeconds: 0,
    };

    const updatedLog = {
      ...existingLog,
      requiredHours: isAlreadyHoliday ? getDefaultRequiredHours(day) : 0
    };

    localStorage.setItem(logKey, JSON.stringify(updatedLog));
    
    // If we're modifying today's log, update the state
    if (dayKey === getTodayKey()) {
      setRequiredHours(updatedLog.requiredHours);
    }
    
    loadAllLogs(); // Reload history to reflect change
  };
  
const handleDeleteLog = (logDate: string) => {
    const formattedDate = format(parse(logDate, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy');
    if (window.confirm(`Are you sure you want to delete the log for ${formattedDate}? This action cannot be undone.`)) {
        try {
            // 1. Remove from localStorage
            localStorage.removeItem(`worklog-${logDate}`);
            
            // 2. If it's today's log, reset all of today's state
            if (logDate === getTodayKey()) {
                setWorkedSeconds(0);
                setPauseSeconds(0);
                setDayStartTime(null);
                setRequiredHours(getDefaultRequiredHours(new Date()));
                setGoalMetToday(false);
                localStorage.removeItem(`goalMet-${getTodayKey()}`);
                 // Reset timer status if it's running
                setStatus('stopped');
                setSessionStartTime(null);
                setBreakStartTime(null);
            }
            
            // 3. Directly update the history state to trigger a re-render
            setHistory(prevHistory => prevHistory.filter(h => h.date !== logDate));

        } catch(e) {
            console.error("Failed to delete log", e);
            alert("An error occurred while deleting the log.");
        }
    }
};

  
  const balanceSecondsToday = useMemo(() => currentWorkedSeconds - requiredSecondsToday, [currentWorkedSeconds, requiredSecondsToday]);
  
  const estimatedLeaveTime = useMemo(() => {
    if (!dayStartTime) return null;
    let currentTotalBreak = pauseSeconds;
    if (status === 'on_break' && breakStartTime) {
        currentTotalBreak += differenceInSeconds(new Date(), breakStartTime);
    }
    const totalSecondsNeeded = requiredSecondsToday + currentTotalBreak;
    return add(dayStartTime, { seconds: totalSecondsNeeded });
  }, [dayStartTime, pauseSeconds, requiredSecondsToday, status, breakStartTime, currentTime]);


  const { monthBalance, weekBalance, thisMonthTotal } = useMemo(() => {
    const now = new Date();
    const startOfMonthDate = startOfMonth(now);
    const startOfWeekDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    let monthBalance = 0;
    let weekBalance = 0;
    let thisMonthTotal = 0;

    history.forEach(log => {
      const logDate = new Date(log.date);
      const isThisMonth = logDate >= startOfMonthDate && logDate <= now;

      if(isThisMonth) {
        const isHoliday = holidays.some(h => isSameDay(h, logDate));
        let required;
        if (isHoliday) {
            required = 0;
        } else {
            required = (log.requiredHours !== undefined ? log.requiredHours : getDefaultRequiredHours(logDate)) * 3600;
        }

        const isToday = isSameDay(logDate, now);

        if (isToday) {
            thisMonthTotal += currentWorkedSeconds;
        } else {
            thisMonthTotal += log.workedSeconds;
        }
        
        if (!isToday) {
           monthBalance += (log.workedSeconds - required);
        }

        if(logDate >= startOfWeekDate && logDate <= now && !isToday) {
            weekBalance += (log.workedSeconds - required);
        }
      }
    });
    
    weekBalance += balanceSecondsToday;

    return { monthBalance, weekBalance, thisMonthTotal };
  }, [history, holidays, balanceSecondsToday, currentWorkedSeconds]);
  
  const monthTotalBalance = monthBalance + balanceSecondsToday;

  const currentMonthHistory = useMemo(() => {
      return history.filter(log => isSameMonth(new Date(log.date), currentMonth));
  }, [history, currentMonth]);

  const dailyProgress = requiredSecondsToday > 0 ? Math.min((currentWorkedSeconds / requiredSecondsToday) * 100, 100) : 0;
  
  const daysRemainingInMonth = differenceInSeconds(lastDayOfMonth(new Date()), new Date()) / (60 * 60 * 24);

  if (!isClient) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8 font-body">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Header */}
          <Card className="glass-card">
              <CardContent className="p-6 flex flex-wrap items-center justify-between gap-4">
                  <div className='flex items-center gap-4'>
                    <div className='flex items-baseline gap-2'>
                        <p className="text-xl sm:text-2xl font-semibold">
                        TIME NOW:
                        </p>
                        <p className="text-2xl sm:text-3xl font-bold tracking-tighter">
                        {currentTime ? format(currentTime, 'p') : '--:--'}
                        </p>
                    </div>
                    <ThemeToggle />
                  </div>
                  <div className="flex items-center gap-2">
                     {status === 'stopped' && (
                        <Button size="lg" className="w-full sm:w-auto" onClick={handleStart}>
                            <Play className="mr-2"/>
                            Start Day
                        </Button>
                      )}
                      {(status === 'running') && (
                          <Button size="lg" variant="outline" className="w-full sm:w-auto" onClick={handlePause}>
                              <Pause className="mr-2"/>
                              Take a Break
                          </Button>
                      )}
                      {(status === 'on_break') && (
                          <Button size="lg" variant="outline" className="w-full sm:w-auto" onClick={handleResume}>
                              <Play className="mr-2"/>
                              Resume
                          </Button>
                      )}
                      {status !== 'stopped' && (
                          <Button size="lg" variant="destructive" className="w-full sm:w-auto" onClick={handleStop}>
                              <Square className="mr-2"/>
                              End Day
                          </Button>
                      )}
                  </div>
              </CardContent>
          </Card>
          
          {/* Main Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Start Time</CardTitle>
                 <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:text-muted-foreground/40 disabled:hover:text-muted-foreground/40" onClick={() => handleOpenEditModal('start')} disabled={status !== 'stopped'}><Pencil className="h-4 w-4" /></Button>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{dayStartTime ? format(dayStartTime, 'p') : '--:--'}</p>
              </CardContent>
            </Card>

            <Card className="glass-card lg:col-span-2 row-span-2 flex flex-col items-center justify-center p-6">
              <div className="relative">
                <ProgressRing value={dailyProgress} strokeWidth={6} />
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-4xl font-bold tracking-tighter">{formatSeconds(currentWorkedSeconds)}</span>
                    </div>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-center gap-1">
                <p className="text-sm text-muted-foreground">Worked Today</p>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground/70 hover:text-foreground disabled:text-muted-foreground/40" onClick={() => handleOpenEditModal('worked')} disabled={status !== 'stopped'}><Pencil className="h-3 w-3" /></Button>
              </div>
              {(holidays.some(h => isSameDay(h, new Date())) || isWeekend(new Date())) && <p className="text-primary font-semibold mt-2 text-sm">🇫🇷 JOUR FÉRIÉ / WEEK-END</p>}
            </Card>

             <Card className="glass-card">
                <CardHeader>
                    <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Est. Leave Time</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold text-primary">{estimatedLeaveTime ? format(estimatedLeaveTime, 'p') : '--:--'}</p>
                </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Pause</CardTitle>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:text-muted-foreground/40 disabled:hover:text-muted-foreground/40" onClick={() => handleOpenEditModal('pause')} disabled={status !== 'stopped'}><Pencil className="h-4 w-4" /></Button>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold">{formatSeconds(pauseSeconds)}</p>
              </CardContent>
            </Card>
            
            <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Daily Goal</CardTitle>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:text-muted-foreground/40 disabled:hover:text-muted-foreground/40" onClick={() => handleOpenEditModal('required')} disabled={status !== 'stopped'}><Pencil className="h-4 w-4" /></Button>
                </CardHeader>
                <CardContent>
                    <p className="text-3xl font-bold">{formatSeconds(requiredSecondsToday)}</p>
                </CardContent>
            </Card>
          </div>

          {/* Daily History */}
           <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                  <HistoryIcon className="w-6 h-6 text-muted-foreground" />
                  Daily History ({format(currentMonth, 'MMMM yyyy')})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="max-h-96 overflow-y-auto">
               <Table>
                  <TableHeader className="sticky top-0 bg-card/80 backdrop-blur-sm">
                      <TableRow className="border-border/50 hover:bg-transparent">
                          <TableHead className="text-muted-foreground">Date</TableHead>
                          <TableHead className="text-muted-foreground text-center">Start</TableHead>
                          <TableHead className="text-muted-foreground text-right">Worked</TableHead>
                          <TableHead className="text-muted-foreground text-right">Pause</TableHead>
                          <TableHead className="text-muted-foreground text-right">Balance</TableHead>
                          <TableHead className="text-muted-foreground text-right">Actions</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {currentMonthHistory.length > 0 ? currentMonthHistory.map(log => {
                          const logDate = new Date(log.date);
                          const isHoliday = holidays.some(h => isSameDay(logDate, h));
                          const isWeekendDay = isWeekend(logDate);
                          let dailyRequired;
                          
                          if (isHoliday || isWeekendDay) {
                              dailyRequired = 0;
                          } else {
                              dailyRequired = log.requiredHours !== undefined ? log.requiredHours * 3600 : getDefaultRequiredHours(logDate) * 3600;
                          }

                          const balance = log.workedSeconds - dailyRequired;
                          return (
                              <TableRow key={log.date} className={cn("border-border/50 hover:bg-muted/30", (isHoliday || isWeekendDay) && "bg-primary/10")}>
                                  <TableCell>
                                      <span>{format(parse(log.date, 'yyyy-MM-dd', new Date()), 'EEE, MMM d')}</span>
                                      {(isHoliday || isWeekendDay) && <span className="ml-2 text-xs text-primary font-semibold">(Off)</span>}
                                  </TableCell>
                                  <TableCell className="text-center">{log.startTime ? format(new Date(log.startTime), 'p') : '--:--'}</TableCell>
                                  <TableCell className="text-right">{formatSeconds(log.workedSeconds)}</TableCell>
                                  <TableCell className="text-right">{formatSeconds(log.pauseSeconds)}</TableCell>
                                  <TableCell className={cn("text-right font-medium", balance < 0 ? 'text-destructive' : 'text-green-500')}>
                                      {formatSeconds(balance, true)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => handleOpenHistoryEditModal(log)}>
                                          <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" onClick={() => handleDeleteLog(log.date)}>
                                          <Trash2 className="h-4 w-4" />
                                      </Button>
                                  </TableCell>
                              </TableRow>
                          )
                      }) : (
                          <TableRow className="border-border/50 hover:bg-transparent">
                              <TableCell colSpan={6} className="text-center text-muted-foreground py-8">No history for this month yet.</TableCell>
                          </TableRow>
                      )}
                  </TableBody>
               </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-sm font-medium uppercase text-muted-foreground flex items-center gap-2">
                  <PlayCircle />
                  Check-in / Manual Entry
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-2">
                 <Button onClick={handlePause} disabled={status !== 'running'} size="lg">
                    <Pause className="mr-2" /> Take a Break
                 </Button>
                 <Button onClick={handleStop} disabled={status === 'stopped'} variant="destructive" size="lg">
                    <Square className="mr-2" /> End of Day
                 </Button>
                 <Separator className="my-2" />
                 <Button onClick={handleOpenTodayEditModal} disabled={status !== 'stopped'} variant="outline" size="lg">
                    <Pencil className="mr-2" /> Time Editor
                 </Button>
              </CardContent>
            </Card>

            <DailyDua />

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-sm font-medium uppercase text-muted-foreground flex items-center gap-2">
                  <CalendarCheck />
                  Holidays & Days Off
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                    <Calendar
                        mode="multiple"
                        selected={holidays}
                        onSelect={(days) => {
                            if (days) {
                                // Logic to handle adding/removing multiple days if needed
                                // For simplicity, we assume single day clicks are the primary interaction
                            }
                        }}
                        onDayClick={handleDayClick}
                        locale={fr}
                        month={currentMonth}
                        onMonthChange={setCurrentMonth}
                        className="p-0"
                        classNames={{
                          head_cell: "w-10 text-muted-foreground rounded-md text-[0.8rem]",
                          cell: "h-10 w-10 text-center rounded-full text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-full last:[&:has([aria-selected])]:rounded-r-full focus-within:relative focus-within:z-20",
                          day: "h-10 w-10 p-0 font-normal rounded-full aria-selected:opacity-100",
                          day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                          day_today: "bg-accent text-accent-foreground rounded-full",
                          day_outside: "text-muted-foreground opacity-50",
                          day_disabled: "text-muted-foreground opacity-30",
                        }}
                        modifiers={{
                           weekend: isWeekend
                        }}
                        modifiersClassNames={{
                           weekend: "text-muted-foreground font-light opacity-70"
                        }}
                        disabled={isWeekend}
                    />
                </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between">
                 <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Cumulative Summaries</CardTitle>
                 <BarChart className="w-5 h-5 text-muted-foreground" />
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Balance (This Week)</p>
                    <p className={cn("text-2xl font-bold", weekBalance < 0 ? 'text-destructive' : 'text-green-500')}>
                        {formatSeconds(weekBalance, true)}
                    </p>
                </div>
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Balance (This Month)</p>
                    <p className={cn("text-2xl font-bold", monthTotalBalance < 0 ? 'text-destructive' : 'text-green-500')}>
                        {formatSeconds(monthTotalBalance, true)}
                    </p>
                </div>
                 <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">This Month (Total Worked)</p>
                    <p className="text-2xl font-bold">
                        {formatSeconds(thisMonthTotal)}
                    </p>
                </div>
              </CardContent>
            </Card>
        </div>


        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
            <Card className="glass-card">
                <CardContent className="p-2">
                    <div className="flex items-center gap-2">
                        <Button asChild variant="ghost" size="icon" className="rounded-full h-12 w-12 bg-primary text-primary-foreground shadow-lg">
                           <a href="/app"><User className="w-6 h-6"/></a>
                        </Button>
                        <Button asChild variant="ghost" size="icon" className="rounded-full h-12 w-12">
                           <a href="/app"><CalendarIconLucid className="w-6 h-6"/></a>
                        </Button>
                         <Button asChild variant="ghost" size="icon" className="rounded-full h-12 w-12">
                           <a href="/app"><BarChart className="w-6 h-6"/></a>
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>

        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Time</DialogTitle>
                    <DialogDescription>
                        Manually set the {editingField} time. Use HH:MM format.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-time" className="text-right">
                            Time
                        </Label>
                        <Input
                            id="edit-time"
                            value={editTimeValue}
                            onChange={(e) => setEditTimeValue(e.target.value)}
                            className="col-span-3"
                            placeholder="HH:MM"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary">Cancel</Button>
                    </DialogClose>
                    <Button type="button" onClick={handleSaveEdit}>Save changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={isHistoryEditModalOpen} onOpenChange={setIsHistoryEditModalOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Edit Log for {editingLog ? format(parse(editingLog.date, 'yyyy-MM-dd', new Date()), 'MMM d, yyyy') : ''}</DialogTitle>
                    <DialogDescription>
                        Update the times for this day.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                     <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-history-start" className="text-right">
                            Start
                        </Label>
                        <Input
                            id="edit-history-start"
                            value={editHistoryStart}
                            onChange={(e) => setEditHistoryStart(e.target.value)}
                            className="col-span-3"
                            placeholder="HH:MM"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-history-worked" className="text-right">
                            Worked
                        </Label>
                        <Input
                            id="edit-history-worked"
                            value={editHistoryWorked}
                            onChange={(e) => setEditHistoryWorked(e.target.value)}
                            className="col-span-3"
                            placeholder="HH:MM"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-history-pause" className="text-right">
                            Pause
                        </Label>
                        <Input
                            id="edit-history-pause"
                            value={editHistoryPause}
                            onChange={(e) => setEditHistoryPause(e.target.value)}
                            className="col-span-3"
                            placeholder="HH:MM"
                        />
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" variant="secondary" onClick={() => setIsHistoryEditModalOpen(false)}>Cancel</Button></DialogClose>
                    <Button type="button" onClick={handleSaveHistoryEdit}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
        
        <Dialog open={isGoalMetDialogOpen} onOpenChange={setIsGoalMetDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl">
                        <Award className="text-yellow-400 w-8 h-8" />
                        Congratulations!
                    </DialogTitle>
                    <DialogDescription className="pt-4 text-center text-lg text-foreground/90">
                        Good job, skhoun lktaf! 💪
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 text-center space-y-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Total break time today:</p>
                        <p className="font-bold text-2xl text-primary">{formatSeconds(pauseSeconds)}</p>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" className="w-full">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}

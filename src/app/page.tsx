

"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ArrowUp, BarChart3, Calendar, CheckCircle, Clock, Coffee, Hourglass, Pause, Play, Square, Target, History, Pencil, PlayCircle, AlarmClock } from 'lucide-react';
import { add, format, differenceInSeconds, startOfMonth, eachDayOfInterval, formatISO, parse, getDay, startOfWeek, endOfWeek, startOfDay, endOfDay } from 'date-fns';
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

type TimerStatus = 'stopped' | 'running' | 'paused';

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
  return `${sign}${h}h ${m}m`;
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
  if (dayOfWeek === 6 || dayOfWeek === 0) { // Saturday or Sunday
    return 0;
  }
  return 8.5; // Monday - Thursday
};


export default function WorkHoursTracker() {
  const [isClient, setIsClient] = useState(false);
  const [logSaved, setLogSaved] = useState(false);
  
  // Time tracking state
  const [status, setStatus] = useState<TimerStatus>('stopped');
  const [workedSeconds, setWorkedSeconds] = useState(0);
  const [pauseSeconds, setPauseSeconds] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [dayStartTime, setDayStartTime] = useState<Date | null>(null);
  const [pauseTime, setPauseTime] = useState<Date | null>(null);
  const [requiredHours, setRequiredHours] = useState(getDefaultRequiredHours(new Date()));
  const [liveSeconds, setLiveSeconds] = useState(0);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);


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
    } catch (e) {
        console.error("Failed to parse today's log from localStorage", e);
    }
    setRequiredHours(todaysRequiredHours);

    loadAllLogs();
  }, [loadAllLogs]);

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
      if (status === 'running' && sessionStartTime) {
        setLiveSeconds(differenceInSeconds(new Date(), sessionStartTime));
      } else {
        setLiveSeconds(0);
      }
    };

    updateTimer(); // Initial call to set time immediately
    intervalId = setInterval(updateTimer, 1000);

    return () => clearInterval(intervalId);
  }, [status, sessionStartTime]);

  const handleStart = () => {
    const now = new Date();
    setSessionStartTime(now);
    if (!dayStartTime) {
      setDayStartTime(now);
    }
    setStatus('running');
    setLogSaved(false);
  };
  
  const handlePause = () => {
    if (status !== 'running' || !sessionStartTime) return;
    const now = new Date();
    const elapsed = differenceInSeconds(now, sessionStartTime);
    setWorkedSeconds(prev => prev + elapsed);
    setPauseTime(now);
    setSessionStartTime(null);
    setStatus('paused');
  };

  const handleResume = () => {
    if (status !== 'paused' || !pauseTime) return;
    const now = new Date();
    const pauseDuration = differenceInSeconds(now, pauseTime);
    setPauseSeconds(prev => prev + pauseDuration);
    setSessionStartTime(now);
    setPauseTime(null);
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
    setPauseTime(null);
    setLogSaved(true);
    setLiveSeconds(0);
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
    } else {
        const timeToEdit = field === 'worked' ? workedSeconds : pauseSeconds;
        setEditTimeValue(secondsToTime(timeToEdit));
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

  const handleSaveHistoryEdit = () => {
    if (!editingLog) return;
    
    const baseDate = new Date(editingLog.date);
    
    const updatedLog: DailyLog = {
      ...editingLog,
      workedSeconds: parseTimeToSeconds(editHistoryWorked),
      pauseSeconds: parseTimeToSeconds(editHistoryPause),
      startTime: editingLog.startTime ? parseTimeStringToDate(editHistoryStart, new Date(editingLog.startTime)).toISOString() : undefined,
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
  
  const requiredSecondsToday = requiredHours * 3600;
  
  const currentWorkedSeconds = workedSeconds + (status === 'running' ? liveSeconds : 0);

  const balanceSecondsToday = currentWorkedSeconds - requiredSecondsToday;
  
  const estimatedLeaveTime = useMemo(() => {
    if (!dayStartTime) return null;
    let currentTotalPause = pauseSeconds;
    if(status === 'paused' && pauseTime) {
      currentTotalPause += differenceInSeconds(new Date(), pauseTime);
    }
    const totalSecondsNeeded = requiredSecondsToday + currentTotalPause;
    return add(dayStartTime, { seconds: totalSecondsNeeded });
  }, [dayStartTime, pauseSeconds, requiredSecondsToday, status, pauseTime, currentWorkedSeconds]);

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
        const required = (log.requiredHours !== undefined ? log.requiredHours : getDefaultRequiredHours(logDate)) * 3600;
        thisMonthTotal += log.workedSeconds;
        
        if (log.date !== getTodayKey()) { // Exclude today from past balance
           monthBalance += (log.workedSeconds - required);
        }

        if(logDate >= startOfWeekDate && logDate <= now) {
            weekBalance += (log.workedSeconds - required);
        }
      }
    });

    return { monthBalance, weekBalance, thisMonthTotal };
  }, [history]);
  
  const monthTotalBalance = monthBalance + balanceSecondsToday;

  if (!isClient) {
    return <div className="min-h-screen bg-gray-900" />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-center">Work Hours</h1>
        </header>

        {logSaved && (
          <Alert className="bg-green-600/10 border-green-600/20 text-green-700 dark:text-green-300 mb-8">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertTitle className="text-green-800 dark:text-green-300">Log Saved</AlertTitle>
            <AlertDescription>
              Your work session has been successfully recorded for today.
            </AlertDescription>
          </Alert>
        )}
        
        <Card className="glass-card mb-8">
            <CardContent className="p-6 flex flex-col items-center justify-around gap-4">
               {status === 'stopped' ? (
                <div className="text-center">
                    <Button size="lg" className="w-full sm:w-auto" onClick={handleStart}>
                        <Play className="mr-2"/>
                        Start Day
                    </Button>
                    <p className="text-muted-foreground text-sm mt-2">{format(new Date(), 'PPP')}</p>
                </div>
              ) : (
                  <div className="flex flex-col sm:flex-row items-center justify-around gap-4 w-full">
                     {status === 'running' ? (
                          <Button size="lg" variant="outline" className="w-full sm:w-auto" onClick={handlePause}>
                              <Pause className="mr-2"/>
                              Pause
                          </Button>
                      ) : (
                          <Button size="lg" variant="outline" className="w-full sm:w-auto" onClick={handleResume}>
                              <Play className="mr-2"/>
                              Resume
                          </Button>
                      )}
                      <Button size="lg" variant="destructive" className="w-full sm:w-auto" onClick={handleStop}>
                          <Square className="mr-2"/>
                          End Day
                      </Button>
                  </div>
              )}
            </CardContent>
        </Card>


        <Card className="glass-card">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlarmClock className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground/80">Time Now</span>
              </div>
              <span className={cn('font-semibold')}>{currentTime ? format(currentTime, 'p') : '--:--'}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PlayCircle className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground/80">Start Time</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('font-semibold')}>{dayStartTime ? format(dayStartTime, 'p') : '--:--'}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:text-muted-foreground/50 disabled:bg-transparent" onClick={() => handleOpenEditModal('start')} disabled={status !== 'stopped'}>
                    <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground/80">Worked Today</span>
              </div>
              <div className="flex items-center gap-2">
                <span id="worked-today" className={cn('font-semibold')}>{formatSeconds(currentWorkedSeconds)}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:text-muted-foreground/50 disabled:bg-transparent" onClick={() => handleOpenEditModal('worked')} disabled={status !== 'stopped'}>
                    <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Coffee className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground/80">Pause of Today</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('font-semibold')}>{formatSeconds(pauseSeconds)}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:text-muted-foreground/50 disabled:bg-transparent" onClick={() => handleOpenEditModal('pause')} disabled={status !== 'stopped'}>
                    <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground/80">Required Today</span>
              </div>
               <div className="flex items-center gap-2">
                <span className={cn('font-semibold')}>{formatSeconds(requiredSecondsToday)}</span>
                 <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground disabled:text-muted-foreground/50 disabled:bg-transparent" onClick={() => handleOpenEditModal('required')} disabled={status !== 'stopped'}>
                    <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Hourglass className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground/80">Balance for Today</span>
              </div>
              <span className={cn('font-semibold', balanceSecondsToday < 0 ? 'text-destructive' : 'text-green-600 dark:text-green-400')}>
                {formatSeconds(balanceSecondsToday, true)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <span className="text-foreground/80">Est. Leave Time</span>
              </div>
              <span className={cn('font-semibold', 'text-primary')}>
                {estimatedLeaveTime ? format(estimatedLeaveTime, 'p') : '--:--'}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card mt-8">
          <CardHeader>
            <div className="flex items-center gap-3">
                <History className="w-6 h-6 text-muted-foreground" />
                <CardTitle>Daily History</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
             <Table>
                <TableHeader>
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
                    {history.length > 0 ? history.slice(0, 7).map(log => {
                        const dailyRequired = log.requiredHours !== undefined ? log.requiredHours * 3600 : getDefaultRequiredHours(new Date(log.date)) * 3600;
                        const balance = log.workedSeconds - dailyRequired;
                        return (
                            <TableRow key={log.date} className="border-border/50 hover:bg-muted/30">
                                <TableCell>{format(parse(log.date, 'yyyy-MM-dd', new Date()), 'EEE, MMM d')}</TableCell>
                                <TableCell className="text-center">{log.startTime ? format(new Date(log.startTime), 'p') : '--:--'}</TableCell>
                                <TableCell className="text-right">{formatSeconds(log.workedSeconds)}</TableCell>
                                <TableCell className="text-right">{formatSeconds(log.pauseSeconds)}</TableCell>
                                <TableCell className={cn("text-right", balance < 0 ? 'text-destructive' : 'text-green-600 dark:text-green-400')}>
                                    {formatSeconds(balance, true)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => handleOpenHistoryEditModal(log)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )
                    }) : (
                        <TableRow className="border-border/50 hover:bg-transparent">
                            <TableCell colSpan={6} className="text-center text-muted-foreground py-4">No history yet.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
             </Table>
          </CardContent>
        </Card>

        <Card className="glass-card mt-8">
          <CardHeader>
            <div className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-muted-foreground" />
                <CardTitle>Cumulative Summaries</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <div className="flex justify-between items-baseline">
                <div className="flex items-center gap-2 text-foreground/80">
                    <ArrowUp className="w-4 h-4 text-muted-foreground"/>
                    <span>From Past Days (This Month)</span>
                </div>
                <span className={cn('font-bold', monthBalance < 0 ? 'text-destructive' : 'text-green-600 dark:text-green-400')}>
                  {formatSeconds(monthBalance, true)}
                </span>
              </div>
            </div>
            
            <Separator className="bg-border/50" />

            <div>
                <div className="flex justify-between items-baseline mb-1">
                    <span className="text-foreground/80">Total for Month (To Date)</span>
                    <span className={cn('text-2xl font-bold', monthTotalBalance < 0 ? 'text-destructive' : 'text-green-600 dark:text-green-400')}>
                      {formatSeconds(monthTotalBalance, true)}
                    </span>
                </div>
                <p className="text-xs text-muted-foreground">
                    (Includes today's balance, past days' balance for this month, and any manual adjustments for this month)
                </p>
            </div>

            <Separator className="bg-border/50" />

            <div className="space-y-4">
                <div className="flex justify-between items-baseline">
                    <div className="flex items-center gap-2 text-foreground/80">
                        <Calendar className="w-4 h-4" />
                        <span>This Week</span>
                    </div>
                     <span className={cn('font-semibold', weekBalance < 0 ? 'text-destructive' : 'text-green-600 dark:text-green-400')}>
                        {formatSeconds(weekBalance, true)}
                    </span>
                </div>
                <div className="flex justify-between items-baseline">
                    <div className="flex items-center gap-2 text-foreground/80">
                        <Calendar className="w-4 h-4" />
                        <span>This Month</span>
                    </div>
                    <span className="font-semibold text-muted-foreground">{formatSeconds(thisMonthTotal)}</span>
                </div>
            </div>
          </CardContent>
        </Card>


        <div className="mt-8 flex justify-center">
            <Button asChild variant="outline">
                <a href="/app">Go to Task Dashboard</a>
            </Button>
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
                        Update the worked and pause times for this day.
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
                        <Button type="button" variant="secondary" onClick={() => setIsHistoryEditModalOpen(false)}>Cancel</Button>
                    </DialogClose>
                    <Button type="button" onClick={handleSaveHistoryEdit}>Save Changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}

    

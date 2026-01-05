

"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { ArrowUp, BarChart3, Calendar, CheckCircle, Clock, Coffee, Hourglass, Pause, Play, Square, Target, History, Pencil, PlayCircle } from 'lucide-react';
import { add, format, differenceInSeconds, startOfMonth, eachDayOfInterval, formatISO, parse } from 'date-fns';
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
    const [hours, minutes] = timeString.split(':').map(Number);
    const newDate = new Date(baseDate);
    newDate.setHours(hours, minutes, 0, 0);
    return newDate;
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
  const [requiredHours, setRequiredHours] = useState(8.5);

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
    const allKeys = Object.keys(localStorage).filter(key => key.startsWith('worklog-'));
    const allLogs: DailyLog[] = allKeys.map(key => {
        const logData = localStorage.getItem(key);
        return logData ? JSON.parse(logData) : null;
    }).filter(Boolean);
    setHistory(allLogs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  }, []);

  // Load data from localStorage on mount
  useEffect(() => {
    setIsClient(true);
    const todayKey = getTodayKey();
    const storedLog = localStorage.getItem(`worklog-${todayKey}`);
    if (storedLog) {
      const data: DailyLog = JSON.parse(storedLog);
      setWorkedSeconds(data.workedSeconds || 0);
      setPauseSeconds(data.pauseSeconds || 0);
      if (data.startTime) {
        setDayStartTime(new Date(data.startTime));
      }
    }
    
    const storedRequiredHours = localStorage.getItem('workhours-requiredHours');
    if (storedRequiredHours) {
        setRequiredHours(parseFloat(storedRequiredHours));
    }

    loadAllLogs();
  }, [loadAllLogs]);

  // Save data to localStorage whenever it changes
  useEffect(() => {
    if (!isClient) return;

    if (status === 'stopped') {
        const todayKey = getTodayKey();
        const log: DailyLog = { 
            date: todayKey, 
            workedSeconds, 
            pauseSeconds,
            startTime: dayStartTime?.toISOString()
        };
        localStorage.setItem(`worklog-${todayKey}`, JSON.stringify(log));

        setHistory(prevHistory => {
            const otherDays = prevHistory.filter(h => h.date !== todayKey);
            return [log, ...otherDays].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });
    }

    localStorage.setItem('workhours-requiredHours', requiredHours.toString());
  }, [workedSeconds, pauseSeconds, dayStartTime, requiredHours, isClient, status]);

  // The main timer loop
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    if (status === 'running') {
      intervalId = setInterval(() => {
        if (sessionStartTime) {
          const now = new Date();
          const sessionElapsed = differenceInSeconds(now, sessionStartTime);
          const totalWorked = (workedSeconds || 0) + sessionElapsed;
          
          // This is a bit of a hack to keep workedSeconds up to date without saving it constantly
          const displayElement = document.getElementById('worked-today');
          if(displayElement) displayElement.textContent = formatSeconds(totalWorked);
        }
      }, 1000);
    } 
    
    return () => clearInterval(intervalId);
  }, [status, sessionStartTime, workedSeconds]);

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

    if (status === 'running' && sessionStartTime) {
      const now = new Date();
      setWorkedSeconds(prev => prev + differenceInSeconds(now, sessionStartTime));
    }
    
    setStatus('stopped');
    setSessionStartTime(null);
    setPauseTime(null);
    setLogSaved(true);
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
      startTime: parseTimeStringToDate(editHistoryStart, baseDate).toISOString(),
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

  const currentWorkedSeconds = useMemo(() => {
    if (status === 'running' && sessionStartTime) {
      // This is a snapshot in time for calculation, the display updates via the effect
      return workedSeconds + differenceInSeconds(new Date(), sessionStartTime);
    }
    return workedSeconds;
  }, [workedSeconds, sessionStartTime, status]);

  const balanceSecondsToday = currentWorkedSeconds - requiredSecondsToday;
  
  const estimatedLeaveTime = useMemo(() => {
    if (!dayStartTime) return null;
    const totalSecondsNeeded = requiredSecondsToday + pauseSeconds;
    return add(dayStartTime, { seconds: totalSecondsNeeded });
  }, [dayStartTime, pauseSeconds, requiredSecondsToday]);

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
              Your work session has been successfully recorded for today.
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
                <PlayCircle className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300">Start Time</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('font-semibold')}>{dayStartTime ? format(dayStartTime, 'p') : '--:--'}</span>
                {status === 'stopped' && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white" onClick={() => handleOpenEditModal('start')}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300">Worked Today</span>
              </div>
              <div className="flex items-center gap-2">
                <span id="worked-today" className={cn('font-semibold')}>{formatSeconds(workedSeconds)}</span>
                {status === 'stopped' && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white" onClick={() => handleOpenEditModal('worked')}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Coffee className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300">Pause of Today</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn('font-semibold')}>{formatSeconds(pauseSeconds)}</span>
                {status === 'stopped' && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white" onClick={() => handleOpenEditModal('pause')}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-gray-400" />
                <span className="text-gray-300">Required Today</span>
              </div>
               <div className="flex items-center gap-2">
                <span className={cn('font-semibold')}>{formatSeconds(requiredSecondsToday)}</span>
                 {status === 'stopped' && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-white" onClick={() => handleOpenEditModal('required')}>
                        <Pencil className="h-4 w-4" />
                    </Button>
                )}
              </div>
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

        <Card className="bg-gray-800 border-gray-700 mt-8">
          <CardHeader>
            <div className="flex items-center gap-3">
                <History className="w-6 h-6 text-gray-400" />
                <CardTitle>Daily History</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
             <Table>
                <TableHeader>
                    <TableRow className="border-gray-700 hover:bg-gray-800">
                        <TableHead className="text-gray-400">Date</TableHead>
                        <TableHead className="text-gray-400 text-center">Start</TableHead>
                        <TableHead className="text-gray-400 text-right">Worked</TableHead>
                        <TableHead className="text-gray-400 text-right">Pause</TableHead>
                        <TableHead className="text-gray-400 text-right">Balance</TableHead>
                        <TableHead className="text-gray-400 text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {history.length > 0 ? history.slice(0, 7).map(log => {
                        const balance = log.workedSeconds - requiredSecondsToday;
                        return (
                            <TableRow key={log.date} className="border-gray-700 hover:bg-gray-700/50">
                                <TableCell>{format(parse(log.date, 'yyyy-MM-dd', new Date()), 'EEE, MMM d')}</TableCell>
                                <TableCell className="text-center">{log.startTime ? format(new Date(log.startTime), 'p') : '--:--'}</TableCell>
                                <TableCell className="text-right">{formatSeconds(log.workedSeconds)}</TableCell>
                                <TableCell className="text-right">{formatSeconds(log.pauseSeconds)}</TableCell>
                                <TableCell className={cn("text-right", balance < 0 ? 'text-red-400' : 'text-green-400')}>
                                    {formatSeconds(balance, true)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-gray-400 hover:text-white" onClick={() => handleOpenHistoryEditModal(log)}>
                                        <Pencil className="h-4 w-4" />
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )
                    }) : (
                        <TableRow className="border-gray-700 hover:bg-gray-800">
                            <TableCell colSpan={6} className="text-center text-gray-500 py-4">No history yet.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
             </Table>
          </CardContent>
        </Card>

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
                    <ArrowUp className="w-4 h-4 text-gray-400"/>
                    <span>From Past Days (This Month)</span>
                </div>
                <span className="font-bold text-gray-400">+0h 0m</span>
              </div>
            </div>
            
            <Separator className="bg-gray-700" />

            <div>
                <div className="flex justify-between items-baseline mb-1">
                    <span className="text-gray-300">Total for Month (To Date)</span>
                    <span className="text-2xl font-bold text-gray-400">+0h 0m</span>
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
                    <span className="font-semibold text-gray-400">0h 0m</span>
                </div>
                <div className="flex justify-between items-baseline">
                    <div className="flex items-center gap-2 text-gray-300">
                        <Calendar className="w-4 h-4" />
                        <span>This Month</span>
                    </div>
                    <span className="font-semibold text-gray-400">0h 0m</span>
                </div>
            </div>
          </CardContent>
        </Card>


        <div className="mt-8 flex justify-center">
            <Button asChild variant="outline" className="bg-gray-700 border-gray-600 hover:bg-gray-600">
                <a href="/app">Go to Task Dashboard</a>
            </Button>
        </div>

        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700 text-white">
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
                            className="col-span-3 bg-gray-700 border-gray-600"
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
            <DialogContent className="sm:max-w-[425px] bg-gray-800 border-gray-700 text-white">
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
                            className="col-span-3 bg-gray-700 border-gray-600"
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
                            className="col-span-3 bg-gray-700 border-gray-600"
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
                            className="col-span-3 bg-gray-700 border-gray-600"
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



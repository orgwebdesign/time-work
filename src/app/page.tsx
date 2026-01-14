
'use client';

import AppLayout from './app-layout';
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { User, BarChart, Calendar as CalendarIconLucid, Award, History as HistoryIcon, Trash2, Pencil, Play, Pause, Coffee, Square, Clock, ListCollapse, BrainCircuit, CupSoda, TimerReset, AlarmClock, Sun, Cloud, CloudRain, Moon, CloudSun } from 'lucide-react';
import { add, format, differenceInSeconds, startOfMonth, isSameDay, isSameMonth, lastDayOfMonth, isWeekend, parse, parseISO, differenceInMilliseconds, startOfWeek, set } from 'date-fns';
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
import Link from 'next/link';
import { DailyDua } from '@/components/daily-dua';
import { getTaskAlarm } from '@/lib/actions';
import type { ActivityEvent, Weather } from '@/lib/types';
import WellnessTracker from '@/components/wellness-tracker';
import WeatherDisplay from '@/components/weather-display';
import { QuickTimeSelector } from '@/components/quick-time-selector';
import PrayerTimes from '@/components/prayer-times';


type TimerStatus = 'stopped' | 'running' | 'on_break';
type PomodoroStatus = 'stopped' | 'working' | 'break_time' | 'paused';


interface DailyLog {
  date: string; // "yyyy-MM-dd" format
  workedSeconds: number;
  pauseSeconds: number;
  startTime?: string; // ISO string
  requiredHours?: number; // Store the required hours for this specific day
}

interface TimerState {
    status: TimerStatus;
    sessionStartTime: string | null;
    breakStartTime: string | null;
}


// --- Helper Functions ---
const formatSeconds = (seconds: number, showSign = false): {h: string, m: string, s: string, sign: string} => {
  if (isNaN(seconds)) seconds = 0;
  const sign = seconds < 0 ? '-' : (showSign ? '+' : '');
  const absSeconds = Math.abs(seconds);
  const h = Math.floor(absSeconds / 3600);
  const m = Math.floor((absSeconds % 3600) / 60);
  const s = Math.floor(absSeconds % 60);
  return {
    h: h.toString().padStart(2, '0'),
    m: m.toString().padStart(2, '0'),
    s: s.toString().padStart(2, '0'),
    sign: sign,
  };
};

const formatSecondsToString = (seconds: number, showSign = false): string => {
    const { h, m, sign } = formatSeconds(seconds, showSign);
    return `${sign}${h}h ${m}m`;
}

const formatPomodoroTime = (seconds: number): string => {
    if (isNaN(seconds)) seconds = 0;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

const getTodayKey = () => format(new Date(), 'yyyy-MM-dd');

const parseTimeToSeconds = (time: string): number => {
    if (!time || !/^\d{1,2}:\d{2}$/.test(time)) return 0;
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
  const dayOfWeek = date.getDay(); // Sunday is 0, Monday is 1, etc.
  if (dayOfWeek === 5) { // Friday
    return 7.5;
  }
  if (isWeekend(date)) { // Saturday or Sunday
    return 0;
  }
  return 8.5; // Monday - Thursday
};


function WorkHoursTrackerPage() {
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
  const [weather, setWeather] = useState<Weather | null>(null);

  // Goal Met Dialog State
  const [isGoalMetDialogOpen, setIsGoalMetDialogOpen] = useState(false);
  const [goalMetToday, setGoalMetToday] = useState(false);
  const [goalMetMessage, setGoalMetMessage] = useState("Good job, skhoun lktaf! 💪");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Celebration state
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [celebrationStyle, setCelebrationStyle] = useState<React.CSSProperties>({});

  // History state
  const [history, setHistory] = useState<DailyLog[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityEvent[]>([]);

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

  // Pomodoro state
  const [pomodoroStatus, setPomodoroStatus] = useState<PomodoroStatus>('stopped');
  const [pomodoroSecondsLeft, setPomodoroSecondsLeft] = useState(25 * 60);
  const [pomodoroIntervalId, setPomodoroIntervalId] = useState<NodeJS.Timeout | null>(null);
  const [prePauseStatus, setPrePauseStatus] = useState<PomodoroStatus>('working');

  // Mood Widget State
  const [showRecoveryAlert, setShowRecoveryAlert] = useState(false);

  // Activity Log Edit State
  const [isActivityEditOpen, setIsActivityEditOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityEvent | null>(null);
  const [editingActivityTime, setEditingActivityTime] = useState('');
  const [editingActivityIndex, setEditingActivityIndex] = useState<number | null>(null);


  useEffect(() => {
    if (pomodoroStatus === 'working' || pomodoroStatus === 'break_time') {
      const interval = setInterval(() => {
        setPomodoroSecondsLeft(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            setPomodoroStatus('stopped');
            // Optionally, play a sound or show a notification
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setPomodoroIntervalId(interval);
    } else {
      if (pomodoroIntervalId) {
        clearInterval(pomodoroIntervalId);
        setPomodoroIntervalId(null);
      }
    }
    return () => {
      if (pomodoroIntervalId) clearInterval(pomodoroIntervalId);
    };
  }, [pomodoroStatus]);

  const handleStartPomodoro = () => {
    setPomodoroStatus('working');
    setPomodoroSecondsLeft(25 * 60);
  };
  
  const handleStartBreak = () => {
    setPomodoroStatus('break_time');
    setPomodoroSecondsLeft(5 * 60);
  };

  const handlePauseResumePomodoro = () => {
    if (pomodoroStatus === 'working' || pomodoroStatus === 'break_time') {
      setPrePauseStatus(pomodoroStatus);
      setPomodoroStatus('paused');
    } else if (pomodoroStatus === 'paused') {
        setPomodoroStatus(prePauseStatus);
    }
  };

  const handleResetPomodoro = () => {
    setPomodoroStatus('stopped');
    setPomodoroSecondsLeft(25 * 60);
  };


  const loadAllLogs = useCallback(() => {
    try {
        const allKeys = Object.keys(localStorage).filter(key => key.startsWith('worklog-'));
        const allLogs: DailyLog[] = allKeys.map(key => {
            const logData = localStorage.getItem(key);
            return logData ? JSON.parse(logData) : null;
        }).filter((log): log is DailyLog => log !== null);
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
      let currentWorked = 0;
      let currentPause = 0;
      let loadedDayStartTime = null;

      if (storedLog) {
        const data: DailyLog = JSON.parse(storedLog);
        currentWorked = data.workedSeconds || 0;
        currentPause = data.pauseSeconds || 0;
        if (data.startTime) {
          loadedDayStartTime = new Date(data.startTime);
          setDayStartTime(loadedDayStartTime);
        }
        if (typeof data.requiredHours === 'number') {
          todaysRequiredHours = data.requiredHours;
        }
      }

      // Restore timer state
      const storedTimerState = localStorage.getItem(`timerState-${todayKey}`);
      if (storedTimerState) {
          const timerState: TimerState = JSON.parse(storedTimerState);
          const now = new Date();
          let restoredStatus = timerState.status;

          // If app was closed while timer was running, calculate elapsed time
          if (restoredStatus === 'running' && timerState.sessionStartTime) {
              const elapsed = differenceInSeconds(now, new Date(timerState.sessionStartTime));
              currentWorked += elapsed;
              setSessionStartTime(now); 
          } else if (restoredStatus === 'on_break' && timerState.breakStartTime) {
              const elapsed = differenceInSeconds(now, new Date(timerState.breakStartTime));
              currentPause += elapsed;
              setBreakStartTime(now);
          } else {
             // If status was running but no session start time, something is off. Reset.
             if (restoredStatus !== 'stopped') {
                 restoredStatus = 'stopped';
             }
          }
          setStatus(restoredStatus);
      }
      
      setWorkedSeconds(currentWorked);
      setPauseSeconds(currentPause);

      const storedGoalMet = localStorage.getItem(`goalMet-${todayKey}`);
      if (storedGoalMet === 'true') {
        setGoalMetToday(true);
      }

      const storedActivityLog = localStorage.getItem(`activitylog-${todayKey}`);
      if (storedActivityLog) {
        setActivityLog(JSON.parse(storedActivityLog));
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

  const saveData = useCallback(() => {
    if (!isClient) return;
    const todayKey = getTodayKey();
    
    const log: DailyLog = { 
        date: todayKey, 
        workedSeconds: workedSeconds, 
        pauseSeconds: pauseSeconds,
        startTime: dayStartTime?.toISOString(),
        requiredHours,
    };
    
    const timerState: TimerState = {
        status,
        sessionStartTime: sessionStartTime?.toISOString() || null,
        breakStartTime: breakStartTime?.toISOString() || null,
    };

    try {
        localStorage.setItem(`worklog-${todayKey}`, JSON.stringify(log));
        localStorage.setItem(`activitylog-${todayKey}`, JSON.stringify(activityLog));
        localStorage.setItem(`timerState-${todayKey}`, JSON.stringify(timerState));
        
        // Update history in state as well for reactivity
        setHistory(prevHistory => {
            const otherDays = prevHistory.filter(h => h.date !== todayKey);
            return [log, ...otherDays].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        });
    } catch(e) {
        console.error("Failed to save log to localStorage", e);
    }
  }, [isClient, workedSeconds, pauseSeconds, dayStartTime, requiredHours, status, sessionStartTime, breakStartTime, activityLog]);


  // Autosave every 10 seconds while timer is active
  useEffect(() => {
    if (status === 'stopped' || !isClient) return;

    const intervalId = setInterval(() => {
      saveData();
    }, 10000); // 10 seconds

    return () => clearInterval(intervalId);
  }, [status, saveData, isClient]);
  
  // The main timer loop that updates seconds state
  useEffect(() => {
    const timerIntervalId = setInterval(() => {
      setCurrentTime(new Date());
      if (status === 'running') {
          setWorkedSeconds(prev => prev + 1);
      } else if (status === 'on_break') {
          setPauseSeconds(prev => prev + 1);
      }
    }, 1000);

    return () => {
        clearInterval(timerIntervalId);
    };
  }, [status]);

  // Final save when stopping the timer or when critical states change while stopped
  useEffect(() => {
    if (!isClient) return;
    
    // Save data whenever a critical state changes
    saveData();
    
  }, [requiredHours, isClient, status, activityLog, saveData, dayStartTime]);

  
  // The secondary effects loop for weather etc.
  useEffect(() => {
    const fetchWeather = () => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();

      const isDay = hour >= 6 && hour < 19;
      
      let condition: Weather['condition'];
      let icon: React.ElementType;
      let temperature: number;

      // Simulate changing weather conditions
      const conditionSeed = minute % 4;

      if (isDay) {
          if (conditionSeed === 0) {
              condition = 'Sunny'; icon = Sun; temperature = 28;
          } else if (conditionSeed === 1) {
              condition = 'Partly Cloudy'; icon = CloudSun; temperature = 24;
          } else if (conditionSeed === 2) {
              condition = 'Cloudy'; icon = Cloud; temperature = 22;
          } else {
              condition = 'Rainy'; icon = CloudRain; temperature = 19;
          }
      } else { // Night
           if (conditionSeed === 0) {
              condition = 'Clear'; icon = Moon; temperature = 18;
          } else if (conditionSeed === 1 || conditionSeed === 2) {
              condition = 'Partly Cloudy'; icon = Cloud; temperature = 16;
          } else {
              condition = 'Rainy'; icon = CloudRain; temperature = 14;
          }
      }

      setWeather({
          location: "Marrakech, Morocco",
          temperature,
          condition,
          icon,
          isDay,
      });
    };

    fetchWeather();
    const weatherIntervalId = setInterval(fetchWeather, 60000); // Update weather every minute

    return () => {
        clearInterval(weatherIntervalId);
    };
  }, []);
  
  const currentWorkedSeconds = workedSeconds;


  const requiredSecondsToday = requiredHours * 3600;

  // Goal Met Check
  useEffect(() => {
    const checkGoal = async () => {
      if (currentWorkedSeconds >= requiredSecondsToday && !goalMetToday && requiredSecondsToday > 0) {
        setIsCelebrating(true); // Start animation
        setIsGoalMetDialogOpen(true);
        setGoalMetToday(true);
        const todayKey = getTodayKey();
        localStorage.setItem(`goalMet-${todayKey}`, 'true');

        try {
            const alarmData = await getTaskAlarm(`Goal Met: ${formatSecondsToString(requiredSecondsToday)}`);
            if(alarmData) {
                setGoalMetMessage(alarmData.message);
                if (audioRef.current) {
                    audioRef.current.src = alarmData.audioDataUri;
                    audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
                } else {
                    audioRef.current = new Audio(alarmData.audioDataUri);
                    audioRef.current.play().catch(e => console.error("Audio playback failed:", e));
                }
            }
        } catch (e) {
            console.error("Failed to get goal met alarm", e);
        }
      }
    }
    checkGoal();
  }, [currentWorkedSeconds, requiredSecondsToday, goalMetToday]);

  // Celebration animation effect
  useEffect(() => {
    let intervalId: NodeJS.Timeout | undefined;

    if (isCelebrating) {
      intervalId = setInterval(() => {
        const hue = Math.floor(Math.random() * 360);
        setCelebrationStyle({
          backgroundColor: `hsl(${hue}, 80%, 60%)`,
          transition: 'background-color 1s ease-in-out',
        });
      }, 1000);
    } else {
      setCelebrationStyle({});
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isCelebrating]);

  const addActivity = (action: ActivityEvent['action']) => {
    const newActivity: ActivityEvent = {
        action,
        timestamp: new Date().toISOString(),
    };
    setActivityLog(prev => [...prev.filter(a => a.action !== action), newActivity].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()));
  };

  const handleStart = () => {
    const now = new Date();
    setSessionStartTime(now);
    if (!dayStartTime) {
      setDayStartTime(now);
      addActivity('Start Day');
    }
    setStatus('running');
    setBreakStartTime(null);
  };
  
  const handlePause = () => {
    if (status !== 'running') return;
    const now = new Date();
    setBreakStartTime(now);
    setStatus('on_break');
    setSessionStartTime(null);
    addActivity('Take a Break');
  };

  const handleResume = () => {
    if (status !== 'on_break') return;
    const now = new Date();
    setSessionStartTime(now);
    setStatus('running');
    setBreakStartTime(null);
    addActivity('Resume Work');
  };

  const handleStop = () => {
    if (status === 'stopped') return;
    
    addActivity('End Day');
    setStatus('stopped');
    setSessionStartTime(null);
    setBreakStartTime(null);
    saveData(); // Final save on stop
  };

  const handleOpenEditModal = (field: 'worked' | 'pause' | 'required' | 'start') => {
    if (status !== 'stopped') {
        alert("Please stop the timer before making manual edits.");
        return;
    }
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
    const now = new Date();
    
    if (editingField === 'worked') {
      setWorkedSeconds(newSeconds);
    } else if (editingField === 'pause') {
      const newPauseSeconds = newSeconds;
      setPauseSeconds(newPauseSeconds);
      // Recalculate worked seconds based on new pause time
      if (dayStartTime) {
        const totalElapsed = differenceInSeconds(now, dayStartTime);
        const newWorkedSeconds = totalElapsed - newPauseSeconds;
        setWorkedSeconds(newWorkedSeconds > 0 ? newWorkedSeconds : 0);
      }
    } else if (editingField === 'required') {
      const hours = newSeconds / 3600;
      setRequiredHours(hours);
    } else if (editingField === 'start') {
      const newStartTime = parseTimeStringToDate(editTimeValue, dayStartTime || now);
      setDayStartTime(newStartTime);
      
      // Recalculate worked seconds from new start time until now, accounting for existing pause.
      const totalElapsed = differenceInSeconds(now, newStartTime);
      const newWorkedSeconds = totalElapsed - pauseSeconds;
      setWorkedSeconds(newWorkedSeconds > 0 ? newWorkedSeconds : 0);
    }

    setIsEditModalOpen(false);
    setEditingField(null);
    // saveData() is called via useEffect on state change
  };

  const handleOpenHistoryEditModal = (log: DailyLog) => {
    if (status !== 'stopped' && log.date === getTodayKey()) {
        alert("Please stop the timer before editing today's log.");
        return;
    }
    setEditingLog(log);
    setEditHistoryWorked(secondsToTime(log.workedSeconds));
    setEditHistoryPause(secondsToTime(log.pauseSeconds));
    setEditHistoryStart(log.startTime ? format(new Date(log.startTime), 'HH:mm') : '');
    setIsHistoryEditModalOpen(true);
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
  
  const handleDeleteLog = (logToDelete: DailyLog) => {
    if (!window.confirm(`Are you sure you want to delete the log for ${format(new Date(logToDelete.date), 'MMM d, yyyy')}? This action cannot be undone.`)) {
      return;
    }
    try {
      localStorage.removeItem(`worklog-${logToDelete.date}`);
      localStorage.removeItem(`timerState-${logToDelete.date}`);
      
      const todayKey = getTodayKey();
      if (logToDelete.date === todayKey) {
          setWorkedSeconds(0);
          setPauseSeconds(0);
          setDayStartTime(null);
          setRequiredHours(getDefaultRequiredHours(new Date()));
          setStatus('stopped');
          setSessionStartTime(null);
          setBreakStartTime(null);
      }
      
      if(logToDelete.date === getTodayKey()){
        setActivityLog([]);
        localStorage.removeItem(`activitylog-${todayKey}`);
      }

      loadAllLogs();
    } catch (e) {
      console.error("Failed to delete log", e);
      alert("An error occurred while deleting the log.");
    }
  };

  const handleHistoryStartTimeChange = (newStartTimeString: string) => {
    if (!editingLog || !editingLog.startTime) return;

    setEditHistoryStart(newStartTimeString);

    const oldStartDate = parseTimeStringToDate(format(parseISO(editingLog.startTime), 'HH:mm'), new Date(editingLog.date));
    const newStartDate = parseTimeStringToDate(newStartTimeString, new Date(editingLog.date));
    
    const diffMs = differenceInMilliseconds(oldStartDate, newStartDate);
    const diffSeconds = Math.round(diffMs / 1000);

    const originalWorkedSeconds = editingLog.workedSeconds;
    const newWorkedSeconds = Math.max(0, originalWorkedSeconds + diffSeconds);

    setEditHistoryWorked(secondsToTime(newWorkedSeconds));
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
  
  const recalculateDurationsFromLog = useCallback((log: ActivityEvent[]) => {
    let totalWork = 0;
    let totalPause = 0;
    let lastWorkStart: Date | null = null;
    let lastBreakStart: Date | null = null;
    
    const sortedLog = [...log].sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

    sortedLog.forEach(event => {
      const eventTime = new Date(event.timestamp);
      
      switch(event.action) {
        case 'Start Day':
        case 'Resume Work':
          if (lastBreakStart) {
            totalPause += differenceInSeconds(eventTime, lastBreakStart);
            lastBreakStart = null;
          }
          lastWorkStart = eventTime;
          break;
        case 'Take a Break':
          if (lastWorkStart) {
            totalWork += differenceInSeconds(eventTime, lastWorkStart);
            lastWorkStart = null;
          }
          lastBreakStart = eventTime;
          break;
        case 'End Day':
          if (lastWorkStart) {
            totalWork += differenceInSeconds(eventTime, lastWorkStart);
            lastWorkStart = null;
          }
          if (lastBreakStart) {
            // This assumes ending the day from a break should not count the break time till the end.
            lastBreakStart = null;
          }
          break;
      }
    });

    return { workedSeconds: totalWork, pauseSeconds: totalPause };
  }, []);

  const handleOpenActivityEdit = (activity: ActivityEvent, index: number) => {
    if (status !== 'stopped') {
      alert("Please stop the timer before editing activities.");
      return;
    }
    setEditingActivity(activity);
    setEditingActivityIndex(index);
    setEditingActivityTime(format(new Date(activity.timestamp), 'HH:mm'));
    setIsActivityEditOpen(true);
  };

  const handleSaveActivityEdit = () => {
    if (editingActivityIndex === null) return;
    
    const baseDate = new Date(activityLog[editingActivityIndex].timestamp);
    const newTimestamp = set(baseDate, {
      hours: parseInt(editingActivityTime.split(':')[0]),
      minutes: parseInt(editingActivityTime.split(':')[1]),
      seconds: 0,
      milliseconds: 0,
    }).toISOString();

    const updatedActivityLog = [...activityLog];
    updatedActivityLog[editingActivityIndex] = {
      ...updatedActivityLog[editingActivityIndex],
      timestamp: newTimestamp,
    };
    
    // Sort log again in case the time change affects order
    const sortedLog = updatedActivityLog.sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    setActivityLog(sortedLog);

    // Recalculate totals
    const { workedSeconds, pauseSeconds } = recalculateDurationsFromLog(sortedLog);
    setWorkedSeconds(workedSeconds);
    setPauseSeconds(pauseSeconds);
    
    // Update day start time if the first event was edited
    const startDayEvent = sortedLog.find(a => a.action === 'Start Day');
    setDayStartTime(startDayEvent ? new Date(startDayEvent.timestamp) : null);

    setIsActivityEditOpen(false);
    setEditingActivity(null);
    setEditingActivityIndex(null);
  };

  
  const balanceSecondsToday = useMemo(() => currentWorkedSeconds - requiredSecondsToday, [currentWorkedSeconds, requiredSecondsToday]);
  
  const estimatedLeaveTime = useMemo(() => {
    if (!dayStartTime) return null;
    const totalSecondsNeeded = requiredSecondsToday + pauseSeconds;
    return add(dayStartTime, { seconds: totalSecondsNeeded });
  }, [dayStartTime, pauseSeconds, requiredSecondsToday, currentTime]);


  const { monthBalance, weekBalance } = useMemo(() => {
    const now = new Date();
    const startOfMonthDate = startOfMonth(now);
    const startOfWeekDate = startOfWeek(now, { weekStartsOn: 1 }); // Monday
    let monthBalance = 0;
    let weekBalance = 0;

    history.forEach(log => {
      const logDate = parseISO(log.date);
      const isThisMonth = isSameMonth(logDate, now);

      if(isThisMonth) {
        const isHoliday = holidays.some(h => isSameDay(h, logDate));
        let required;
        if (isHoliday) {
            required = 0;
        } else {
            required = (log.requiredHours !== undefined ? log.requiredHours : getDefaultRequiredHours(logDate)) * 3600;
        }

        const worked = log.workedSeconds;
        
        monthBalance += (worked - required);
        
        if(logDate >= startOfWeekDate && logDate <= now) {
            weekBalance += (worked - required);
        }
      }
    });
    
    return { monthBalance, weekBalance };
  }, [history, holidays]);
  
  const monthTotalBalance = monthBalance;
  const carryOverBalance = monthBalance - balanceSecondsToday;

  // Recovery Mode Alert Logic
  useEffect(() => {
    const today = new Date();
    const dayOfMonth = today.getDate();
    const isRecoveryTime = dayOfMonth >= 20;

    if (isRecoveryTime && monthTotalBalance < 0) {
      setShowRecoveryAlert(true);
    } else {
      setShowRecoveryAlert(false);
    }
  }, [monthTotalBalance, currentTime]);


  const currentMonthHistory = useMemo(() => {
      return history.filter(log => isSameMonth(new Date(log.date), currentMonth));
  }, [history, currentMonth]);

  const daysRemainingInMonth = differenceInSeconds(lastDayOfMonth(new Date()), new Date()) / (60 * 60 * 24);

  const getActivityIcon = (action: ActivityEvent['action']) => {
    switch(action) {
      case 'Start Day': return <Play className="h-4 w-4 text-green-500" />;
      case 'Take a Break': return <Pause className="h-4 w-4 text-amber-500" />;
      case 'Resume Work': return <Coffee className="h-4 w-4 text-blue-500" />;
      case 'End Day': return <Square className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  }

  const timerControls = (
    <div className="flex items-center gap-2">
      {status === 'stopped' && (
        <Button onClick={handleStart} className="bg-green-500/20 hover:bg-green-500/30 text-green-500 border border-green-500/30">
          <Play className="mr-2" /> Start Day
        </Button>
      )}
      {status === 'running' && (
        <Button onClick={handlePause} variant="outline" className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-500 border-amber-500/30">
          <Pause className="mr-2" /> Take a Break
        </Button>
      )}
      {status === 'on_break' && (
        <Button onClick={handleResume} className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-500 border-blue-500/30">
          <Coffee className="mr-2" /> Resume Work
        </Button>
      )}
      {(status === 'running' || status === 'on_break') && (
        <Button onClick={handleStop} variant="destructive">
          <Square className="mr-2" /> End Day
        </Button>
      )}
    </div>
  );
  
  const { h, m, s } = formatSeconds(currentWorkedSeconds);
  const isGoalMet = requiredSecondsToday > 0 && currentWorkedSeconds >= requiredSecondsToday;

  if (!isClient) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div
      className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-8 font-body transition-colors duration-1000"
      style={celebrationStyle}
      onClick={() => {
        if (isCelebrating) setIsCelebrating(false);
      }}
    >
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Header */}
          <WeatherDisplay weather={weather} time={currentTime} timerControls={timerControls} />
          
          {/* Main Dashboard Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Start Time</CardTitle>
                 <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:text-muted-foreground/40 disabled:hover:text-muted-foreground/40" onClick={() => handleOpenEditModal('start')} disabled={status !== 'stopped'}><Pencil className="h-4 w-4" /></Button>
              </CardHeader>
              <CardContent>
                <p className="text-2xl sm:text-3xl font-bold">{dayStartTime ? format(dayStartTime, 'p') : '--:--'}</p>
              </CardContent>
            </Card>

            <Card className="glass-card lg:col-span-2 row-span-2 flex flex-col items-center justify-center p-6">
                <div className={cn(
                    "relative w-full max-w-sm rounded-lg p-1",
                    isGoalMet ? "bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 animate-border-spin" : "bg-border/30"
                  )}>
                  <div className="bg-card rounded-md p-4">
                    <div className="flex items-baseline justify-center">
                        <span className="text-4xl sm:text-6xl font-bold tracking-tighter">{h}</span>
                        <span className="text-2xl sm:text-4xl font-medium text-muted-foreground mx-1">:</span>
                        <span className="text-4xl sm:text-6xl font-bold tracking-tighter">{m}</span>
                        <span className="text-2xl sm:text-4xl font-medium text-muted-foreground mx-1">:</span>
                        <span className="text-4xl sm:text-6xl font-bold tracking-tighter w-[3.5rem] sm:w-[5.5rem]">{s}</span>
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
                    <p className="text-2xl sm:text-3xl font-bold text-primary">{estimatedLeaveTime ? format(estimatedLeaveTime, 'p') : '--:--'}</p>
                </CardContent>
            </Card>

            <Card className="glass-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Pause</CardTitle>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:text-muted-foreground/40 disabled:hover:text-muted-foreground/40" onClick={() => handleOpenEditModal('pause')} disabled={status !== 'stopped'}><Pencil className="h-4 w-4" /></Button>
              </CardHeader>
              <CardContent>
                <p className="text-2xl sm:text-3xl font-bold">{formatSecondsToString(pauseSeconds)}</p>
              </CardContent>
            </Card>
            
            <Card className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-medium uppercase text-muted-foreground">Daily Goal</CardTitle>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:text-muted-foreground/40 disabled:hover:text-muted-foreground/40" onClick={() => handleOpenEditModal('required')} disabled={status !== 'stopped'}><Pencil className="h-4 w-4" /></Button>
                </CardHeader>
                <CardContent>
                    <p className="text-2xl sm:text-3xl font-bold">{formatSecondsToString(requiredSecondsToday)}</p>
                </CardContent>
            </Card>
          </div>

          {/* Prayer Times */}
          <PrayerTimes />

          {/* Daily History */}
           <Card className="glass-card">
            <CardHeader className="flex flex-wrap items-center justify-between gap-y-2 gap-x-4">
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
                          const logDate = parseISO(log.date);
                          const isHoliday = holidays.some(h => isSameDay(h, logDate));
                          const isWeekendDay = isWeekend(logDate);
                          let dailyRequired;
                          
                          if (isHoliday || isWeekendDay) {
                              dailyRequired = 0;
                          } else {
                              dailyRequired = log.requiredHours !== undefined ? log.requiredHours * 3600 : getDefaultRequiredHours(logDate) * 3600;
                          }

                          const balance = log.workedSeconds - dailyRequired;
                          
                          const logForModal = {
                              ...log,
                          };

                          return (
                              <TableRow key={log.date} className={cn("border-border/50 hover:bg-muted/30", (isHoliday || isWeekendDay) && "bg-primary/10")}>
                                  <TableCell>
                                      <span>{format(parse(log.date, 'yyyy-MM-dd', new Date()), 'EEE, MMM d')}</span>
                                      {(isHoliday || isWeekendDay) && <span className="ml-2 text-xs text-primary font-semibold">(Off)</span>}
                                  </TableCell>
                                  <TableCell className="text-center">{log.startTime ? format(parseISO(log.startTime), 'p') : '--:--'}</TableCell>
                                  <TableCell className="text-right">{formatSecondsToString(log.workedSeconds)}</TableCell>
                                  <TableCell className="text-right">{formatSecondsToString(log.pauseSeconds)}</TableCell>
                                  <TableCell className={cn("text-right font-medium", balance < 0 ? 'text-destructive' : 'text-green-500')}>
                                      {formatSecondsToString(balance, true)}
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => handleOpenHistoryEditModal(logForModal)}>
                                          <Pencil className="h-4 w-4" />
                                      </Button>
                                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/70 hover:text-destructive" onClick={() => handleDeleteLog(log)}>
                                          <Trash2 className="h-4 w-4" />
                                      </Button>
                                    </div>
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
          
           {/* Activity Log */}
           <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-3">
                    <ListCollapse className="w-6 h-6 text-muted-foreground" />
                    Today's Activity Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-60 overflow-y-auto pr-2">
                  {activityLog.length > 0 ? (
                    <div className="space-y-4">
                      {activityLog.map((activity, index) => (
                        <div key={index} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4">
                            {getActivityIcon(activity.action)}
                            <div>
                              <p className="font-medium">{activity.action}</p>
                              <p className="text-sm text-muted-foreground">{format(new Date(activity.timestamp), 'p')}</p>
                            </div>
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-muted-foreground hover:text-foreground disabled:text-muted-foreground/40"
                            onClick={() => handleOpenActivityEdit(activity, index)}
                            disabled={status !== 'stopped'}
                          >
                              <Pencil className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-4">No activity recorded for today yet. Press "Start Day" to begin.</p>
                  )}
                </div>
              </CardContent>
            </Card>

        </div>

        {/* Right Column */}
        <div className="space-y-8">
            <Card className={cn(
                "glass-card transition-all",
                monthTotalBalance >= 0 ? "shadow-green-500/20" : "shadow-destructive/20"
            )}>
              <CardHeader>
                <CardTitle className="text-sm font-medium uppercase text-muted-foreground flex items-center gap-2">
                  Monthly Mood
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                {monthTotalBalance >= 0 ? (
                  <div>
                    <span className="text-5xl">🌟</span>
                    <p className="mt-2 text-lg font-semibold text-green-500">
                      Great job! You have {formatSecondsToString(monthTotalBalance, true)} extra this month.
                    </p>
                  </div>
                ) : (
                  <div>
                    <span className="text-5xl">😟</span>
                    <p className="mt-2 text-lg font-semibold text-destructive">
                      You're behind by {formatSecondsToString(monthTotalBalance, true)}. Let's catch up!
                    </p>
                  </div>
                )}
                {showRecoveryAlert && (
                  <Alert variant="destructive" className="mt-4 text-left animate-pulse">
                    <AlarmClock className="h-4 w-4" />
                    <AlertTitle>Recovery Mode</AlertTitle>
                    <AlertDescription>
                      Only {Math.ceil(daysRemainingInMonth)} days left to balance your hours!
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            <WellnessTracker />

            <Card className="glass-card">
              <CardHeader>
                  <CardTitle className="text-sm font-medium uppercase text-muted-foreground flex items-center gap-2">
                      <BrainCircuit />
                      Pomodoro Timer
                  </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center space-y-4">
                  <p className="text-6xl font-bold tracking-tighter font-mono">
                      {formatPomodoroTime(pomodoroSecondsLeft)}
                  </p>
                  <div className="text-sm font-medium uppercase text-muted-foreground">
                    {pomodoroStatus === 'working' && 'Work Session'}
                    {pomodoroStatus === 'break_time' && 'Break Time'}
                    {pomodoroStatus === 'paused' && 'Paused'}
                    {pomodoroStatus === 'stopped' && 'Ready?'}
                  </div>
                  <div className="grid grid-cols-2 gap-2 w-full">
                       {(pomodoroStatus === 'paused' || pomodoroStatus === 'stopped') ? (
                           <Button onClick={handlePauseResumePomodoro} disabled={pomodoroStatus === 'stopped'}><Play className="mr-2" />Resume</Button>
                       ) : (
                           <Button onClick={handlePauseResumePomodoro} variant="outline" disabled={pomodoroStatus === 'stopped'}><Pause className="mr-2" />Pause</Button>
                       )}
                      
                      {(pomodoroStatus === 'stopped' || pomodoroStatus === 'paused') ? (
                          <Button onClick={handleStartPomodoro}><BrainCircuit className="mr-2" />Start Work</Button>
                      ) : (
                          <Button onClick={handleResetPomodoro} variant="destructive"><TimerReset className="mr-2" />Reset</Button>
                      )}
                  </div>
                   <div className="grid grid-cols-1 gap-2 w-full pt-2">
                     <Button onClick={handleStartBreak} disabled={pomodoroStatus === 'break_time' || pomodoroStatus === 'working'} variant="secondary"><CupSoda className="mr-2" />Start Break</Button>
                   </div>
              </CardContent>
            </Card>

            <DailyDua />

            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="text-sm font-medium uppercase text-muted-foreground flex items-center gap-2">
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
                    <p className={cn("text-2xl sm:text-3xl font-bold", weekBalance < 0 ? 'text-destructive' : 'text-green-500')}>
                        {formatSecondsToString(weekBalance, true)}
                    </p>
                </div>
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Balance (This Month)</p>
                    <p className={cn("text-2xl sm:text-3xl font-bold", monthTotalBalance < 0 ? 'text-destructive' : 'text-green-500')}>
                        {formatSecondsToString(monthTotalBalance, true)}
                    </p>
                </div>
                 <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Carryover (Until Yesterday)</p>
                    <p className={cn("text-xl font-bold", carryOverBalance < 0 ? 'text-destructive' : 'text-green-500')}>
                        {formatSecondsToString(carryOverBalance, true)}
                    </p>
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
                            onChange={(e) => handleHistoryStartTimeChange(e.target.value)}
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
                        {goalMetMessage}
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 text-center space-y-4">
                    <div>
                        <p className="text-sm text-muted-foreground">Total break time today:</p>
                        <p className="font-bold text-2xl text-primary">{formatSecondsToString(pauseSeconds)}</p>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button type="button" className="w-full">Close</Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>

        <Dialog open={isActivityEditOpen} onOpenChange={setIsActivityEditOpen}>
          <DialogContent>
              <DialogHeader>
                  <DialogTitle>Edit Activity Time</DialogTitle>
                  <DialogDescription>
                      Update the time for: "{editingActivity?.action}". This will recalculate all durations for today.
                  </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <QuickTimeSelector value={editingActivityTime} onChange={setEditingActivityTime} />
              </div>
              <DialogFooter>
                  <DialogClose asChild>
                      <Button type="button" variant="secondary" onClick={() => setIsActivityEditOpen(false)}>Cancel</Button>
                  </DialogClose>
                  <Button type="button" onClick={handleSaveActivityEdit}>Save Changes</Button>
              </DialogFooter>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}


export default function WorkHoursTracker() {
  return (
    <AppLayout>
      <WorkHoursTrackerPage />
    </AppLayout>
  );
}

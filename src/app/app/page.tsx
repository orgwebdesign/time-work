"use client";

import { useState, useEffect, useMemo } from 'react';
import type { List, Task, Weather, User } from '@/lib/types';
import AppSidebar from '@/components/app-sidebar';
import TaskListView from '@/components/task-list-view';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import WeatherDisplay from '@/components/weather-display';
import { Sun, Cloud, CloudRain, Moon, CloudSun, User as UserIcon, LogOut } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [isClient, setIsClient] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lists, setLists] = useState<List[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [lastAddedTask, setLastAddedTask] = useState<Task | null>(null);
  
  const [isCelebrating, setIsCelebrating] = useState(false);
  const [celebrationStyle, setCelebrationStyle] = useState<React.CSSProperties>({});
  
  const [weather, setWeather] = useState<Weather | null>(null);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);

  const router = useRouter();

  const initialLists: List[] = useMemo(() => [
    { id: '1', name: 'My Day' },
    { id: '2', name: 'Projects' },
    { id: '3', name: 'Groceries' },
    { id: '4', name: 'Freelance' },
  ], []);

  const initialTasks: Task[] = useMemo(() => {
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const twoDaysFromNow = new Date();
    twoDaysFromNow.setDate(now.getDate() + 2);
  
    return [
      { id: '1', listId: '1', text: 'Plan my day', completed: false, createdAt: yesterday.toISOString(), dueDate: new Date().toISOString(), alarmEnabled: true },
      { id: '2', listId: '1', text: 'Check emails and messages', completed: false, createdAt: new Date().toISOString() },
      { id: '3', listId: '1', text: '30-minute workout', completed: true, createdAt: new Date().toISOString() },
      { id: '4', listId: '2', text: 'Design new logo for TaskFlow', completed: false, createdAt: new Date().toISOString(), dueDate: twoDaysFromNow.toISOString(), alarmEnabled: true },
      { id: '5', listId: '2', text: 'Develop the new feature', completed: false, createdAt: new Date().toISOString() },
      { id: '6', listId: '3', text: 'Milk', completed: false, createdAt: new Date().toISOString() },
      { id: '7', listId: '3', text: 'Bread', completed: true, createdAt: new Date().toISOString() },
      { id: '8', listId: '3', text: 'Cheese', completed: false, createdAt: new Date().toISOString() },
      { id: '9', listId: '4', text: 'Send invoice to client', completed: false, createdAt: new Date().toISOString() },
      { id: '10', listId: '4', text: 'Follow up with leads', completed: false, createdAt: new Date().toISOString() },
    ];
  }, []);

  useEffect(() => {
    setIsClient(true);
    setCurrentTime(new Date());

    const timerId = setInterval(() => setCurrentTime(new Date()), 1000);

    try {
      const storedUser = localStorage.getItem('taskmaster-currentUser');
      if (storedUser) {
        const parsedUser: User = JSON.parse(storedUser);
        setCurrentUser(parsedUser);

        // Update login stats on each app load
        const allUsersData = localStorage.getItem('taskmaster-users');
        if (allUsersData) {
            let allUsers: User[] = JSON.parse(allUsersData);
            const userIndex = allUsers.findIndex(u => u.id === parsedUser.id);
            if (userIndex !== -1) {
                const now = new Date();
                const lastLogin = allUsers[userIndex].lastLogin ? new Date(allUsers[userIndex].lastLogin!) : new Date(0);
                // Only count as new session if it's been more than 10 seconds to avoid dev hot-reloads counting as sessions
                if (now.getTime() - lastLogin.getTime() > 10000) {
                    allUsers[userIndex].loginCount = (allUsers[userIndex].loginCount || 0) + 1;
                    allUsers[userIndex].lastLogin = now.toISOString();
                    localStorage.setItem('taskmaster-users', JSON.stringify(allUsers));
                }
            }
        }
      } else {
        router.push('/login');
        return;
      }

      const storedLists = localStorage.getItem('taskmaster-lists');
      const storedTasks = localStorage.getItem('taskmaster-tasks');
      const storedSelectedListId = localStorage.getItem('taskmaster-selectedListId');

      const loadedLists = storedLists ? JSON.parse(storedLists) : initialLists;
      setLists(loadedLists);

      const nowISO = new Date().toISOString();
      const loadedTasks: Task[] = storedTasks ? JSON.parse(storedTasks) : initialTasks;
      const migratedTasks = loadedTasks.map((task: any) => ({
        ...task,
        createdAt: task.createdAt || nowISO,
      }));
      setTasks(migratedTasks);
      
      const loadedSelectedId = storedSelectedListId ? JSON.parse(storedSelectedListId) : (loadedLists[0]?.id || null);
      setSelectedListId(loadedSelectedId);

    } catch (error) {
      console.error("Failed to parse from localStorage", error);
      setLists(initialLists);
      setTasks(initialTasks);
      setSelectedListId(initialLists[0]?.id || null);
    }
    return () => clearInterval(timerId);
  }, [initialLists, initialTasks, router]);

  useEffect(() => {
    if (isClient) {
      localStorage.setItem('taskmaster-lists', JSON.stringify(lists));
      localStorage.setItem('taskmaster-tasks', JSON.stringify(tasks));
      if(selectedListId) {
        localStorage.setItem('taskmaster-selectedListId', JSON.stringify(selectedListId));
      }
    }
  }, [lists, tasks, selectedListId, isClient]);
  
  useEffect(() => {
    if (isClient && !selectedListId && lists.length > 0) {
        setSelectedListId(lists[0].id);
    }
  }, [lists, selectedListId, isClient]);
  
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
    const intervalId = setInterval(fetchWeather, 60000); // Update weather every minute

    return () => clearInterval(intervalId);
  }, []);

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

  const handleAddList = (name: string) => {
    const newList: List = { id: crypto.randomUUID(), name };
    setLists([...lists, newList]);
    setSelectedListId(newList.id);
  };
  
  const handleDeleteList = (id: string) => {
    if (lists.length <= 1) {
      alert("You must have at least one list.");
      return;
    }
    setLists(lists.filter(list => list.id !== id));
    setTasks(tasks.filter(task => task.listId !== id));
    if (selectedListId === id) {
      const newSelectedList = lists.find(l => l.id !== id);
      setSelectedListId(newSelectedList?.id || null);
    }
  };

  const handleAddTask = (text: string, dueDate?: Date, alarmEnabled?: boolean) => {
    if (!selectedListId) return;
    const newTask: Task = {
      id: crypto.randomUUID(),
      listId: selectedListId,
      text,
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate: dueDate?.toISOString(),
      alarmEnabled: dueDate ? alarmEnabled : false,
    };
    setTasks([...tasks, newTask]);
    setLastAddedTask(newTask);
  };
  
  const handleToggleTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    if (task && !task.completed) {
      // Defer celebration start to avoid the same click stopping it
      setTimeout(() => setIsCelebrating(true), 0);
    }
    setTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
    setLastAddedTask(null);
  };
  
  const handleDeleteTask = (id: string) => {
    setTasks(tasks.filter(task => task.id !== id));
    setLastAddedTask(null);
  };
  
  const handleUpdateTask = (id: string, newValues: Partial<Omit<Task, 'id' | 'listId' | 'completed' | 'createdAt'>>) => {
    setTasks(tasks.map(task => {
      if (task.id === id) {
        const updatedTask = { ...task, ...newValues };
        if (!updatedTask.dueDate) {
          updatedTask.alarmEnabled = false;
        }
        return updatedTask;
      }
      return task;
    }));
    setLastAddedTask(null);
  };
  
  const handleLogout = () => {
    localStorage.removeItem('taskmaster-currentUser');
    router.push('/');
  };

  const activeList = useMemo(() => lists.find(l => l.id === selectedListId), [lists, selectedListId]);
  
  const filteredTasks = useMemo(() => tasks.filter(t => t.listId === selectedListId), [tasks, selectedListId]);

  const activeTasksCount = useMemo(() => filteredTasks.filter(task => !task.completed).length, [filteredTasks]);

  const completionPercentage = useMemo(() => {
    const totalTasks = filteredTasks.length;
    if (totalTasks === 0) return 0;
    const completedTasks = totalTasks - activeTasksCount;
    return Math.round((completedTasks / totalTasks) * 100);
  }, [filteredTasks, activeTasksCount]);

  const getBackgroundClass = (weather: Weather | null): string => {
    if (!weather) return "bg-background";
    
    const { condition, isDay } = weather;
    let bgClass = '';

    if (isDay) {
        if (condition === 'Sunny') bgClass = 'bg-sunny-day';
        else if (condition === 'Partly Cloudy') bgClass = 'bg-partly-cloudy-day';
        else if (condition === 'Cloudy') bgClass = 'bg-cloudy-day';
        else if (condition === 'Rainy') bgClass = 'bg-rainy-day';
    } else {
        if (condition === 'Clear') bgClass = 'bg-clear-night';
        else if (condition === 'Partly Cloudy' || condition === 'Cloudy') bgClass = 'bg-partly-cloudy-night';
        else if (condition === 'Rainy') bgClass = 'bg-rainy-day';
    }
    
    if (!bgClass) {
        bgClass = isDay ? 'bg-sunny-day' : 'bg-clear-night';
    }

    return `${bgClass} bg-cover bg-[50%] animate-gradient-pan`;
  };

  if (!isClient || !currentUser) {
    return <div className="flex h-screen w-full items-center justify-center bg-background"><p>Loading TaskFlow...</p></div>;
  }

  return (
    <SidebarProvider>
      <div
        className={cn(
          "flex h-screen w-full transition-all duration-1000",
          getBackgroundClass(weather)
        )}
        style={isCelebrating ? celebrationStyle : {}}
        onClick={() => {
          if (isCelebrating) setIsCelebrating(false);
        }}
      >
        <AppSidebar
          lists={lists}
          selectedListId={selectedListId}
          onSelectList={setSelectedListId}
          onAddList={handleAddList}
          onDeleteList={handleDeleteList}
        />
        <main className="flex-1 flex flex-col h-screen overflow-y-auto p-4 md:p-6 lg:p-8">
          <header className="flex items-center justify-between pb-6">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              {activeList ? (
                <div>
                  <h2 className="text-4xl font-bold tracking-tight font-headline">{activeList.name}</h2>
                  <p className="text-muted-foreground">{activeTasksCount} {activeTasksCount === 1 ? 'task' : 'tasks'} remaining</p>
                </div>
              ) : <div />}
            </div>
            <div className="flex items-center gap-4">
                <ThemeToggle />
                <Link href="/app/profile" aria-label="Go to profile page">
                  <Avatar>
                    <AvatarFallback>
                      {currentUser.fullName.split(' ').map((n) => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleLogout} aria-label="Log out">
                  <LogOut className="h-5 w-5" />
                </Button>
            </div>
          </header>

          <section className="mb-6">
            <h3 className="text-xl font-semibold mb-2 text-foreground/90">Personal</h3>
            <WeatherDisplay weather={weather} time={currentTime} />
          </section>

          {activeList ? (
            <TaskListView
              key={activeList.id}
              tasks={filteredTasks}
              onAddTask={handleAddTask}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
              onUpdateTask={handleUpdateTask}
              lastAddedTask={lastAddedTask}
              onClearLastAddedTask={() => setLastAddedTask(null)}
              completionPercentage={completionPercentage}
            />
          ) : (
             <div className="flex-1 flex items-center justify-center">
                <p className="text-muted-foreground">Select a list or create a new one to get started.</p>
             </div>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}
